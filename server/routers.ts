import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import { db } from "./db";
import { users, trades, wallets, tradeRules } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

const JWT_SECRET = ENV.cookieSecret || "stglobal-development-secret";
const jwtSecret = new TextEncoder().encode(JWT_SECRET);

// Price cache
type PriceEntry = { price: string; change: string; volume: string; ts: number };
const priceCache = new Map<string, PriceEntry>();

const CRYPTO_SYMBOLS = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT",
  "DOTUSDT","MATICUSDT","LINKUSDT","UNIUSDT","LTCUSDT","BCHUSDT","TRXUSDT","AVAXUSDT",
];
const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, "XAUUSD","XAGUSD","EURUSD","GBPUSD"];

async function fetchBinanceTicker(symbol: string): Promise<PriceEntry> {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.ts < 4000) return cached;

  try {
    if (!symbol.endsWith("USDT")) {
      const defaults: Record<string, { price: number; change: string }> = {
        XAUUSD: { price: 2326.45, change: "+0.82%" },
        XAGUSD: { price: 27.34, change: "-0.31%" },
        EURUSD: { price: 1.0847, change: "+0.12%" },
        GBPUSD: { price: 1.2703, change: "-0.08%" },
      };
      const def = defaults[symbol] || { price: 1.00, change: "0.00%" };
      const noise = def.price * (Math.random() * 0.001 - 0.0005);
      const entry: PriceEntry = {
        price: (def.price + noise).toFixed(symbol === "XAUUSD" ? 2 : 4),
        change: def.change,
        volume: (Math.random() * 500 + 100).toFixed(2) + "M",
        ts: Date.now(),
      };
      priceCache.set(symbol, entry);
      return entry;
    }

    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) throw new Error("Binance error");
    const data = await res.json();
    const lastPrice = parseFloat(data.lastPrice);
    const entry: PriceEntry = {
      price: lastPrice.toFixed(lastPrice < 1 ? 6 : lastPrice < 100 ? 4 : 2),
      change: `${parseFloat(data.priceChangePercent) >= 0 ? "+" : ""}${parseFloat(data.priceChangePercent).toFixed(2)}%`,
      volume: `${(parseFloat(data.quoteVolume) / 1_000_000).toFixed(2)}M`,
      ts: Date.now(),
    };
    priceCache.set(symbol, entry);
    return entry;
  } catch {
    const fallback = priceCache.get(symbol);
    if (fallback) return { ...fallback, ts: Date.now() };
    return { price: "0.00", change: "0.00%", volume: "0M", ts: Date.now() };
  }
}

const authRouter = router({
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await db.insert(users).values({
        email: input.email, passwordHash, openId,
        name: input.email.split("@")[0], role: "user", vipLevel: "VIP 0",
      });
      const [newUser] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (newUser) {
        await db.insert(wallets).values({
          userId: newUser.id, asset: "USDT",
          balance: "10000.00", demoBalance: "100000.00",
        });
      }
      const token = await new SignJWT({ id: newUser?.id, role: "user" })
        .setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(jwtSecret);
      return { token };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      const token = await new SignJWT({ id: user.id, role: user.role })
        .setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(jwtSecret);
      return { token };
    }),

  logout: protectedProcedure.mutation(async () => ({ success: true })),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return { id: user.id, email: user.email, name: user.name, role: user.role, vipLevel: user.vipLevel, demoMode: user.demoMode };
  }),
});

const marketRouter = router({
  price: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const entry = await fetchBinanceTicker(input.symbol);
      return { price: entry.price, change: entry.change };
    }),

  snapshot: publicProcedure.query(async () => {
    const allData = await Promise.all(
      ALL_SYMBOLS.map(async (sym) => {
        const entry = await fetchBinanceTicker(sym);
        return { symbol: sym, price: entry.price, change: entry.change, volume: entry.volume };
      })
    );
    const hotSymbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","DOGEUSDT"];
    return {
      hot: allData.filter(d => hotSymbols.includes(d.symbol)),
      crypto: allData.filter(d => d.symbol.endsWith("USDT")),
      metals: allData.filter(d => ["XAUUSD","XAGUSD"].includes(d.symbol)),
      forex: allData.filter(d => ["EURUSD","GBPUSD"].includes(d.symbol)),
    };
  }),
});

const walletRouter = router({
  balances: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id));
  }),
});

const tradingRouter = router({
  rules: publicProcedure.query(async () => {
    const rules = await db.select().from(tradeRules).where(eq(tradeRules.isActive, true));
    if (rules.length === 0) {
      return [
        { id: 1, durationSeconds: 30, minAmount: "100", profitRate: "0.10", label: "30s", isActive: true },
        { id: 2, durationSeconds: 60, minAmount: "5000", profitRate: "0.15", label: "60s", isActive: true },
        { id: 3, durationSeconds: 90, minAmount: "30000", profitRate: "0.20", label: "90s", isActive: true },
        { id: 4, durationSeconds: 120, minAmount: "100000", profitRate: "0.25", label: "120s", isActive: true },
        { id: 5, durationSeconds: 180, minAmount: "300000", profitRate: "0.30", label: "180s", isActive: true },
        { id: 6, durationSeconds: 300, minAmount: "500000", profitRate: "0.40", label: "300s", isActive: true },
      ];
    }
    return rules;
  }),

  placeContract: protectedProcedure
    .input(z.object({
      symbol: z.string(),
      direction: z.enum(["UP", "FALL"]),
      durationSeconds: z.number(),
      amount: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount);
      if (!isFinite(amount) || amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid amount" });

      const [wallet] = await db.select().from(wallets)
        .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, "USDT")));
      if (!wallet) throw new TRPCError({ code: "BAD_REQUEST", message: "No USDT wallet found" });

      const balance = parseFloat(String(wallet.demoBalance || wallet.balance));
      if (balance < amount) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });

      const priceEntry = await fetchBinanceTicker(input.symbol);
      const entryPrice = parseFloat(priceEntry.price);

      const [rule] = await db.select().from(tradeRules)
        .where(eq(tradeRules.durationSeconds, input.durationSeconds));
      const profitRate = rule ? parseFloat(String(rule.profitRate)) : 0.10;
      const settlesAt = new Date(Date.now() + input.durationSeconds * 1000);

      await db.insert(trades).values({
        userId: ctx.user.id, symbol: input.symbol,
        direction: input.direction, durationSeconds: input.durationSeconds,
        amount: input.amount, profitRate: profitRate.toFixed(4),
        entryPrice: entryPrice.toFixed(8), status: "open",
        isDemo: true, settlesAt,
      });

      await db.update(wallets).set({ demoBalance: (balance - amount).toFixed(8) })
        .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, "USDT")));

      return { success: true };
    }),

  settleContract: protectedProcedure
    .input(z.object({ tradeId: z.number(), symbol: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [trade] = await db.select().from(trades)
        .where(and(eq(trades.id, input.tradeId), eq(trades.userId, ctx.user.id)));

      if (!trade) throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found" });
      if (trade.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Trade already settled" });

      const priceEntry = await fetchBinanceTicker(input.symbol);
      const closingPrice = parseFloat(priceEntry.price);
      const entryPrice = parseFloat(String(trade.entryPrice));
      const amount = parseFloat(String(trade.amount));
      const profitRate = parseFloat(String(trade.profitRate));

      let status: "won" | "lost" | "draw";
      if (Math.abs(closingPrice - entryPrice) < 0.000001) status = "draw";
      else if (trade.direction === "UP") status = closingPrice > entryPrice ? "won" : "lost";
      else status = closingPrice < entryPrice ? "won" : "lost";

      const payout = status === "won" ? amount * (1 + profitRate) : status === "draw" ? amount : 0;

      await db.update(trades).set({
        status, closingPrice: closingPrice.toFixed(8), settledAt: new Date(),
      }).where(eq(trades.id, input.tradeId));

      if (payout > 0) {
        const [wallet] = await db.select().from(wallets)
          .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, "USDT")));
        if (wallet) {
          const current = parseFloat(String(wallet.demoBalance || wallet.balance));
          await db.update(wallets).set({ demoBalance: (current + payout).toFixed(8) })
            .where(and(eq(wallets.userId, ctx.user.id), eq(wallets.asset, "USDT")));
        }
      }

      return { status, payout: payout.toFixed(2) };
    }),

  history: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.select().from(trades)
      .where(eq(trades.userId, ctx.user.id))
      .orderBy(desc(trades.openedAt)).limit(20);
    return rows.map(t => ({
      id: t.id, symbol: t.symbol, direction: t.direction,
      amount: t.amount, durationSeconds: t.durationSeconds,
      entryPrice: t.entryPrice, closingPrice: t.closingPrice,
      status: t.status, profitRate: t.profitRate,
      openedAt: t.openedAt, settlesAt: t.settlesAt,
    }));
  }),
});

const adminRouter = router({
  users: adminProcedure.query(async () => {
    return await db.select({
      id: users.id, email: users.email, name: users.name,
      role: users.role, vipLevel: users.vipLevel,
      isFrozen: users.isFrozen, createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }),
  trades: adminProcedure.query(async () => {
    return await db.select().from(trades).orderBy(desc(trades.openedAt)).limit(100);
  }),
});

export const appRouter = router({
  auth: authRouter,
  market: marketRouter,
  wallet: walletRouter,
  trading: tradingRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
