import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { TickerStrip } from "@/components/TickerStrip";
import { HoloGlobe } from "@/components/HoloGlobe";
import { Sparkline } from "@/components/Sparkline";
import {
  ArrowDown, ArrowUp, BarChart3, Building2, Coins, Moon, Sun,
  TrendingUp, TrendingDown, UserRound, Wallet, Eye, EyeOff,
  Lock, Mail, LogOut, CreditCard, History, Activity, Zap,
  ShieldCheck, Globe2, Award, ArrowRight, CheckCircle2, XCircle,
  Clock, RefreshCw, Search, Megaphone, ZapIcon, Landmark, Share2, HelpCircle
} from "lucide-react";
import { toast } from "sonner";

type SymbolCode =
  | "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT" | "XRPUSDT"
  | "ADAUSDT" | "DOGEUSDT" | "DOTUSDT" | "MATICUSDT" | "LINKUSDT"
  | "UNIUSDT" | "LTCUSDT" | "BCHUSDT" | "TRXUSDT" | "AVAXUSDT"
  | "XAUUSD" | "XAGUSD" | "EURUSD" | "GBPUSD";

const CRYPTO_SYMBOLS: SymbolCode[] = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","DOTUSDT","MATICUSDT","LINKUSDT","UNIUSDT","LTCUSDT","BCHUSDT","TRXUSDT","AVAXUSDT"];
const OTHER_SYMBOLS: SymbolCode[] = ["XAUUSD","XAGUSD","EURUSD","GBPUSD"];
const ALL_SYMBOLS = [...CRYPTO_SYMBOLS, ...OTHER_SYMBOLS];

function formatPrice(p: number) {
  return p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : p >= 1 ? p.toFixed(4) : p.toFixed(6);
}

const nav = [
  ["/", "Home"],
  ["/spot", "Markets"],
  ["/contracts", "Trade"],
  ["/assets", "Assets"],
  ["/profile", "Profile"],
  ["/about", "About"],
] as const;

function useTokenState() {
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("stglobal_token") ?? ""
  );
  const saveToken = (t: string) => { setToken(t); localStorage.setItem("stglobal_token", t); };
  const clearToken = () => { setToken(""); localStorage.removeItem("stglobal_token"); };
  return { token, saveToken, clearToken };
}

function NavIcon({ label }: { label: string }) {
  if (label === "Home") return <BarChart3 className="size-5" />;
  if (label === "Markets") return <Coins className="size-5" />;
  if (label === "Trade") return <Activity className="size-5" />;
  if (label === "Assets") return <Wallet className="size-5" />;
  if (label === "Profile") return <UserRound className="size-5" />;
  return <Building2 className="size-5" />;
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const me = trpc.auth.me.useQuery();
  const { clearToken } = useTokenState();
  const utils = trpc.useUtils();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { clearToken(); utils.auth.me.invalidate(); toast.success("Signed out"); },
  });

  return (
    <div className="min-h-screen text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative grid size-9 place-items-center rounded-xl bg-gain text-primary-foreground glow-lime transition-transform group-hover:scale-105">
              <Zap className="size-5 fill-current" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-extrabold tracking-tight font-display">STGLOBAL</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Multi-Asset Terminal</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {nav.map(([href, label]) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  location === href
                    ? "text-foreground bg-white/10 text-gain"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {me.data ? (
              <>
                <div className="hidden md:block text-right mr-1">
                  <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">{me.data.email}</div>
                  <div className="text-[10px] text-gain font-bold uppercase tracking-widest">{me.data.vipLevel}</div>
                </div>
                <Button onClick={() => logout.mutate()} size="sm" variant="ghost"
                  className="text-muted-foreground hover:text-foreground">
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/"><Button size="sm" variant="ghost" className="text-muted-foreground">Sign in</Button></Link>
                <Link href="/"><Button size="sm" className="bg-gain text-primary-foreground hover:opacity-90 font-semibold glow-lime">Open Account</Button></Link>
              </>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <TickerStrip />

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:pb-10">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 lg:hidden">
        <div className="flex justify-around items-center">
          {nav.map(([href, label]) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 py-3 px-2 transition ${
                location === href ? "text-gain" : "text-muted-foreground"
              }`}>
              <NavIcon label={label} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function HomePage() {
  const me = trpc.auth.me.useQuery();
  if (!me.data) return <LandingPage />;
  return <DashboardHome />;
}

function LandingPage() {
  return (
    <div className="space-y-20 animate-fade-up">
      {/* Hero */}
      <section className="grid lg:grid-cols-2 gap-10 items-center pt-4 pb-8">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground mb-5">
            <span className="size-1.5 rounded-full bg-gain animate-pulse" />
            Live · 48+ countries · 0% fees for new users
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] font-display">
            Trade the entire <span className="text-gain">world</span><br />from one terminal.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Crypto, gold, indices and forex — institutional liquidity, ultra-low latency, cold-storage insurance. STGLOBAL is the multi-asset terminal of 2026.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/"><Button size="lg" className="bg-gain text-primary-foreground hover:opacity-90 font-semibold glow-lime h-12 px-6">
              Open Free Account <ArrowRight className="ml-2 size-4" />
            </Button></Link>
            <Link href="/spot"><Button size="lg" variant="outline" className="glass border-white/10 h-12 px-6">View Markets</Button></Link>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[["10+","Years online"],["48+","Countries"],["$2.4B","Daily volume"]].map(([k,v]) => (
              <div key={v} className="glass rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gain font-display">{k}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{v}</div>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <HoloGlobe />
        </div>
      </section>

      {/* Asset categories */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { Icon: Coins, title: "Blockchain Engine", desc: "Spot trade BTC, ETH, SOL, AVAX, LINK with live prices.", color: "var(--gain)" },
            { Icon: Activity, title: "Futures & Commodities", desc: "Leverage XAUUSD, XAGUSD, Crude Oil with risk gauge.", color: "oklch(0.78 0.21 245)" },
            { Icon: TrendingUp, title: "Short Contracts", desc: "UP / FALL contracts — 30s to 300s durations.", color: "oklch(0.85 0.20 60)" },
            { Icon: Building2, title: "Forex Terminal", desc: "EUR/USD, GBP/USD — institutional spreads.", color: "oklch(0.75 0.20 320)" },
          ].map(({ Icon, title, desc, color }) => (
            <div key={title} className="group glass rounded-2xl p-5 hover:-translate-y-1 transition-all cursor-pointer">
              <div className="size-11 rounded-xl grid place-items-center mb-4 transition-transform group-hover:rotate-6"
                style={{ background: `linear-gradient(135deg, ${color}, transparent)`, boxShadow: `0 10px 30px ${color}40` }}>
                <Icon className="size-5 text-foreground" />
              </div>
              <div className="font-bold tracking-tight">{title}</div>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Market Wall Preview */}
      <section>
        <MarketWallPreview />
      </section>

      {/* Trust */}
      <section>
        <div className="glass-strong rounded-3xl p-6 sm:p-10 grid lg:grid-cols-3 gap-6">
          {[
            { Icon: ShieldCheck, title: "Negative Balance Protection", desc: "You can never lose more than you deposit." },
            { Icon: Zap, title: "Cold Storage Insurance", desc: "98% of assets held offline, fully insured." },
            { Icon: Globe2, title: "Tier-1 Liquidity", desc: "Visa · Mastercard · SWIFT settlement." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="size-12 shrink-0 rounded-xl bg-gain/10 grid place-items-center text-gain">
                <Icon className="size-6" />
              </div>
              <div>
                <div className="font-bold">{title}</div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zero fees promo */}
      <section>
        <div className="relative overflow-hidden rounded-3xl glass-strong p-8 sm:p-12">
          <div className="absolute -top-20 -right-20 size-72 rounded-full pointer-events-none"
            style={{ background: "var(--gradient-lime)", filter: "blur(80px)", opacity: 0.35 }} />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gain/10 text-gain text-xs font-semibold border border-gain/20">
                <Zap className="size-3" /> Limited promotion
              </span>
              <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight font-display">
                <span className="text-gain">0%</span> trading fees<br />for new users.
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md">
                Sign up today, get 100,000 USDT in demo balance, and trade every supported market with zero commission for the first 90 days.
              </p>
              <Link href="/" className="inline-block mt-6">
                <Button size="lg" className="bg-gain text-primary-foreground glow-lime font-semibold">Claim 0% fees</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                [Award, "10+ years professional online services"],
                [Globe2, "Available in 48+ countries"],
                [ShieldCheck, "Bank-grade 2FA protection"],
                [Activity, "Ultra-low-latency execution"],
              ].map(([Icon, t], i) => (
                <div key={i} className="glass rounded-xl p-4 flex items-start gap-3">
                  {React.createElement(Icon as any, { className: "size-5 text-gain shrink-0 mt-0.5" })}
                  <span className="text-muted-foreground">{t as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} STGLOBAL · Trading carries risk. Past performance is not indicative of future results.
      </footer>
    </div>
  );
}

function DashboardHome() {
  const me = trpc.auth.me.useQuery();
  const balances = trpc.wallet.balances.useQuery(undefined, { enabled: !!me.data });
  const [showBalance, setShowBalance] = useState(true);
  const market = trpc.market.snapshot.useQuery(undefined, { refetchInterval: 3000 });

  const usdtWallet = balances.data?.find(w => w.asset === "USDT");
  const demoBalance = usdtWallet ? Number(usdtWallet.demoBalance) : 0;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Balance Card */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 size-64 rounded-full pointer-events-none"
          style={{ background: "var(--gradient-lime)", filter: "blur(80px)", opacity: 0.2 }} />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">{me.data?.email}</span>
              <div className="flex items-center gap-1 bg-gain/10 text-gain px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-gain/20">
                <ShieldCheck className="size-3" /> Verified
              </div>
              <div className="bg-gain/10 text-gain px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-gain/20">
                {me.data?.vipLevel}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Demo Balance</span>
              <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground hover:text-foreground transition">
                {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              </button>
            </div>
            <div className="text-5xl font-extrabold text-gain tracking-tight font-display">
              {showBalance ? `$${demoBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">USDT · Demo Account</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gain text-primary-foreground hover:opacity-90 font-semibold gap-2">
              <CreditCard className="size-4" /> Deposit
            </Button>
            <Button variant="outline" className="glass border-white/10 gap-2">
              <Wallet className="size-4" /> Withdraw
            </Button>
            <Link href="/contracts">
              <Button variant="outline" className="glass border-white/10 gap-2">
                <Activity className="size-4" /> Trade Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Promo Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "VIP Rewards", desc: "Unlock exclusive trading benefits & higher profit rates", color: "from-blue-600/80 to-blue-900/80", emoji: "🏆" },
          { title: "Referral Program", desc: "Earn 20% commission on every friend you invite", color: "from-gain/60 to-emerald-700/80", emoji: "🤝" },
          { title: "New Listings", desc: "Trade the latest tokens with high profit potential", color: "from-purple-600/80 to-purple-900/80", emoji: "🚀" },
        ].map((b, i) => (
          <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${b.color} relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all glass`}>
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="size-24 text-white" />
            </div>
            <div className="text-3xl mb-2">{b.emoji}</div>
            <h3 className="text-lg font-bold text-white tracking-tight">{b.title}</h3>
            <p className="text-white/80 text-sm mt-1">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Announcement */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between gap-4 border-l-4 border-gain">
        <div className="flex items-center gap-3">
          <div className="bg-gain/10 p-2 rounded-lg text-gain"><Megaphone className="size-5" /></div>
          <div className="text-sm font-semibold">🎉 STGLOBAL Pro Exchange — Live & Ready for Trading</div>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground shrink-0">Dismiss</Button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Invite Friends", Icon: Share2, color: "text-blue-400 bg-blue-400/10", href: "/about" },
          { label: "Crypto Loan", Icon: Landmark, color: "text-purple-400 bg-purple-400/10", href: "/about" },
          { label: "Learn Trading", Icon: HelpCircle, color: "text-green-400 bg-green-400/10", href: "/about" },
          { label: "Quick Trade", Icon: Zap, color: "text-gain bg-gain/10", href: "/contracts" },
        ].map((s, i) => (
          <Link key={i} href={s.href}>
            <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3 hover:-translate-y-1 transition-all cursor-pointer group">
              <div className={`p-3 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.Icon className="size-6" />
              </div>
              <span className="text-sm font-bold text-center">{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Market Wall */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="size-6 text-gain" />
          <h2 className="text-2xl font-extrabold tracking-tight font-display">Market Trends</h2>
        </div>
        <MarketWallPreview />
      </div>
    </div>
  );
}

// ── Market Wall ───────────────────────────────────────────────────────────────
const COIN_ICONS: Record<string, string> = {
  BTC:"https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH:"https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB:"https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  SOL:"https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP:"https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA:"https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE:"https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  DOT:"https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  MATIC:"https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  LINK:"https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI:"https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  LTC:"https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  BCH:"https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
  TRX:"https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  AVAX:"https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
};

function getCoinIcon(symbol: string) {
  if (symbol === "XAUUSD") return "https://ui-avatars.com/api/?name=AU&background=f0b90b&color=000&bold=true&size=64";
  if (symbol === "XAGUSD") return "https://ui-avatars.com/api/?name=AG&background=c0c0c0&color=000&bold=true&size=64";
  if (symbol === "EURUSD") return "https://ui-avatars.com/api/?name=EU&background=003399&color=fff&bold=true&size=64";
  if (symbol === "GBPUSD") return "https://ui-avatars.com/api/?name=GB&background=012169&color=fff&bold=true&size=64";
  const coin = symbol.replace("USDT","");
  return COIN_ICONS[coin] || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin.toLowerCase()}.png`;
}

function CoinImg({ symbol }: { symbol: string }) {
  const [src, setSrc] = useState(() => getCoinIcon(symbol));
  const coin = symbol.replace("USDT","").toLowerCase();
  return (
    <img src={src} alt={symbol} loading="lazy"
      className="size-9 rounded-full object-cover bg-white/5 border border-white/10"
      onError={() => setSrc(`https://ui-avatars.com/api/?name=${symbol.slice(0,2)}&background=39FF14&color=000&bold=true&size=64`)} />
  );
}

const DISPLAY: Record<string, { base: string; quote: string; full: string }> = {
  BTCUSDT:{base:"BTC",quote:"USDT",full:"Bitcoin"},ETHUSDT:{base:"ETH",quote:"USDT",full:"Ethereum"},
  BNBUSDT:{base:"BNB",quote:"USDT",full:"BNB Chain"},SOLUSDT:{base:"SOL",quote:"USDT",full:"Solana"},
  XRPUSDT:{base:"XRP",quote:"USDT",full:"Ripple"},ADAUSDT:{base:"ADA",quote:"USDT",full:"Cardano"},
  DOGEUSDT:{base:"DOGE",quote:"USDT",full:"Dogecoin"},DOTUSDT:{base:"DOT",quote:"USDT",full:"Polkadot"},
  MATICUSDT:{base:"MATIC",quote:"USDT",full:"Polygon"},LINKUSDT:{base:"LINK",quote:"USDT",full:"Chainlink"},
  UNIUSDT:{base:"UNI",quote:"USDT",full:"Uniswap"},LTCUSDT:{base:"LTC",quote:"USDT",full:"Litecoin"},
  BCHUSDT:{base:"BCH",quote:"USDT",full:"Bitcoin Cash"},TRXUSDT:{base:"TRX",quote:"USDT",full:"TRON"},
  AVAXUSDT:{base:"AVAX",quote:"USDT",full:"Avalanche"},
  XAUUSD:{base:"XAU",quote:"USD",full:"Gold"},XAGUSD:{base:"XAG",quote:"USD",full:"Silver"},
  EURUSD:{base:"EUR",quote:"USD",full:"Euro / Dollar"},GBPUSD:{base:"GBP",quote:"USD",full:"Pound / Dollar"},
};

function MarketWallPreview() {
  const market = trpc.market.snapshot.useQuery(undefined, { refetchInterval: 3000 });
  const [tab, setTab] = useState<"all"|"crypto"|"metals"|"forex">("all");
  const [search, setSearch] = useState("");

  const allItems = market.data
    ? [...market.data.hot, ...market.data.crypto.filter(c => !market.data!.hot.find(h => h.symbol === c.symbol)), ...market.data.metals, ...market.data.forex]
    : [];

  const filtered = useMemo(() => {
    let items = tab === "all" ? allItems
      : tab === "crypto" ? (market.data?.crypto || [])
      : tab === "metals" ? (market.data?.metals || [])
      : (market.data?.forex || []);
    if (search) items = items.filter(i =>
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (DISPLAY[i.symbol]?.full || "").toLowerCase().includes(search.toLowerCase())
    );
    return items;
  }, [tab, search, allItems, market.data]);

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight font-display">Market Watch</h3>
          <p className="text-xs text-muted-foreground">Live prices · Binance feed · Updates every 3s</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(["all","crypto","metals","forex"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs rounded-lg transition font-medium capitalize ${
                  tab === t ? "bg-gain text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "all" ? "All" : t === "crypto" ? "Crypto" : t === "metals" ? "Metals" : "Forex"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs w-36 focus:outline-none focus:border-gain/50 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[580px]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 py-2">Asset</th>
              <th className="text-right font-medium px-4 py-2">Price</th>
              <th className="text-right font-medium px-4 py-2">24h Change</th>
              <th className="text-right font-medium px-4 py-2 hidden sm:table-cell">Volume</th>
              <th className="text-right font-medium px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {market.isLoading ? Array.from({length:6}).map((_,i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="px-4 py-3"><div className="h-9 bg-white/5 rounded animate-pulse w-40" /></td>
                <td className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse w-24 ml-auto" /></td>
                <td className="px-4 py-3"><div className="h-5 bg-white/5 rounded animate-pulse w-16 ml-auto" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 bg-white/5 rounded animate-pulse w-20 ml-auto" /></td>
                <td className="px-4 py-3"><div className="h-8 bg-white/5 rounded animate-pulse w-16 ml-auto" /></td>
              </tr>
            )) : filtered.map(row => {
              const up = !row.change.startsWith("-");
              const d = DISPLAY[row.symbol];
              const p = Number(row.price);
              return (
                <tr key={row.symbol} className="border-t border-white/5 hover:bg-white/[0.03] transition group cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CoinImg symbol={row.symbol} />
                      <div>
                        <div className="font-semibold">{d?.base}/{d?.quote || "USD"}</div>
                        <div className="text-xs text-muted-foreground">{d?.full || row.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-custom font-semibold tabular-nums">
                    ${p >= 1000 ? p.toLocaleString("en-US",{maximumFractionDigits:2}) : p >= 1 ? p.toFixed(4) : p.toFixed(6)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono-custom text-sm px-2 py-0.5 rounded-md ${
                      up ? "text-gain bg-gain/10" : "text-loss bg-loss/10"
                    }`}>
                      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {row.change}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono-custom hidden sm:table-cell text-xs">
                    {row.volume || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/contracts">
                      <Button size="sm" className="glass border-white/10 text-foreground hover:bg-gain/20 hover:text-gain hover:border-gain/30 transition-all text-xs font-semibold">
                        Trade
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!market.isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                <Search className="size-8 mx-auto mb-3 opacity-30" />
                No pairs found for "{search}"
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Auth Panel ─────────────────────────────────────────────────────────────────
function AuthPanel() {
  const utils = trpc.useUtils();
  const { saveToken } = useTokenState();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email, setEmail] = useState("demo@stglobal.app");
  const [password, setPassword] = useState("Password123");
  const [showPw, setShowPw] = useState(false);

  const login = trpc.auth.login.useMutation({
    onSuccess: d => { saveToken(d.token); utils.auth.me.invalidate(); toast.success("Welcome back to STGLOBAL"); },
    onError: e => toast.error(e.message),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: d => { saveToken(d.token); utils.auth.me.invalidate(); toast.success("Account created! 100,000 USDT demo balance added."); },
    onError: e => toast.error(e.message),
  });

  const submit = () => mode === "signin" ? login.mutate({ email, password }) : register.mutate({ email, password });
  const busy = login.isPending || register.isPending;

  return (
    <div className="grid place-items-center min-h-[70vh]">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="size-9 rounded-xl bg-gain grid place-items-center glow-lime">
            <Zap className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-display">STGLOBAL</span>
        </div>

        <div className="glass-strong rounded-3xl p-8">
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
            {(["signin","signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm rounded-lg font-semibold transition ${
                  mode === m ? "bg-gain text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="you@stglobal.com"
                  className="pl-9 bg-white/5 border-white/10 h-11 focus:border-gain/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  placeholder="••••••••"
                  className="pl-9 pr-10 bg-white/5 border-white/10 h-11 focus:border-gain/50" />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button onClick={submit} disabled={busy}
              className="w-full h-11 bg-gain text-primary-foreground font-semibold glow-lime hover:opacity-90">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create account"}
            </Button>
          </div>

          <p className="mt-5 text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
            <ShieldCheck className="size-3.5 text-gain" />
            Bank-grade encryption · 2FA ready · Cold-storage insured
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Contracts / Trade Page ────────────────────────────────────────────────────
function ContractsPage() {
  const me = trpc.auth.me.useQuery();
  const [symbol, setSymbol] = useState<SymbolCode>("BTCUSDT");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [amount, setAmount] = useState("1000");
  const rules = trpc.trading.rules.useQuery();
  const price = trpc.market.price.useQuery({ symbol }, { refetchInterval: 2000 });
  const utils = trpc.useUtils();

  const placeContract = trpc.trading.placeContract.useMutation({
    onSuccess: () => { toast.success("Contract placed! Settle when ready."); utils.trading.history.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const currentRule = rules.data?.find(r => r.durationSeconds === selectedDuration);
  const profitRate = currentRule ? Number(currentRule.profitRate) : 0.10;
  const amountNum = parseFloat(amount) || 0;
  const minAmount = currentRule?.minAmount ? Number(currentRule.minAmount) : 0;
  const isValid = !!currentRule && amountNum >= minAmount;
  const estimatedRevenue = amountNum * (1 + profitRate);
  const tvSymbol = symbol === "XAUUSD" ? "OANDA:XAUUSD" : symbol === "XAGUSD" ? "OANDA:XAGUSD"
    : symbol === "EURUSD" ? "FX:EURUSD" : symbol === "GBPUSD" ? "FX:GBPUSD" : `BINANCE:${symbol}`;

  if (!me.data) return <AuthPanel />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
      {/* Trading Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="glass-strong rounded-3xl p-6 space-y-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Short-Term Contracts</div>
            <div className="text-xl font-bold font-display">Trade Up / Fall</div>
            <div className="text-xs text-muted-foreground">Demo Mode · Virtual funds</div>
          </div>

          {/* Symbol */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Trading Pair</Label>
            <Select value={symbol} onValueChange={v => setSymbol(v as SymbolCode)}>
              <SelectTrigger className="glass border-white/10 text-foreground font-semibold h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[oklch(0.18_0.04_260)] border-white/10 text-foreground max-h-60">
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Crypto</div>
                {CRYPTO_SYMBOLS.map(s => <SelectItem key={s} value={s} className="font-semibold">{s}</SelectItem>)}
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Metals & Forex</div>
                {OTHER_SYMBOLS.map(s => <SelectItem key={s} value={s} className="font-semibold">{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex justify-between items-end p-4 rounded-2xl glass">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Current Price</div>
                <div className="text-2xl font-bold font-mono-custom">
                  ${Number(price.data?.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
                <div className={`text-xs font-mono-custom mt-0.5 ${(price.data?.change||"").startsWith("+") ? "text-gain" : "text-loss"}`}>
                  {price.data?.change || "—"}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gain animate-pulse" />
                <span className="text-[10px] font-bold text-gain uppercase">Live</span>
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration</Label>
            <div className="grid grid-cols-3 gap-2">
              {rules.data?.map(rule => (
                <button key={rule.durationSeconds} onClick={() => setSelectedDuration(rule.durationSeconds)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    selectedDuration === rule.durationSeconds
                      ? "border-gain bg-gain/10 text-gain"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                  }`}>
                  <div className="text-sm font-bold">{rule.durationSeconds}s</div>
                  <div className="text-[10px] font-bold text-gain">+{(Number(rule.profitRate)*100).toFixed(0)}%</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount (USDT)</Label>
            <div className="relative">
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder={`Min. ${currentRule?.minAmount || 100}`}
                className={`h-12 bg-white/5 font-bold text-lg ${
                  !isValid && amount ? "border-loss focus:border-loss" : "border-white/10 focus:border-gain/50"
                }`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USDT</div>
            </div>
            {!isValid && amount && <div className="text-xs text-loss">Min. {currentRule?.minAmount || 100} USDT</div>}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Est. Revenue</span>
              <span className="text-xs font-bold text-gain font-mono-custom">{estimatedRevenue.toFixed(2)} USDT</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-1.5">
            {[1000,5000,30000,100000,300000,500000,1000000,5000000].map(q => (
              <button key={q} onClick={() => setAmount(q.toString())}
                className={`h-8 rounded-lg text-[10px] font-bold border transition-all ${
                  Number(amount) === q ? "border-gain text-gain bg-gain/10" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground bg-white/5"
                }`}>
                {q >= 1000000 ? `${q/1000000}M` : q >= 1000 ? `${q/1000}K` : q}
              </button>
            ))}
          </div>

          {/* Trade Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button onClick={() => placeContract.mutate({ symbol, direction:"UP", durationSeconds:selectedDuration, amount })}
              disabled={!isValid || placeContract.isPending}
              className="h-14 bg-gain text-primary-foreground font-bold text-lg glow-lime hover:opacity-90 gap-2 transition-all hover:scale-[1.02]">
              <TrendingUp className="size-5" /> UP
            </Button>
            <Button onClick={() => placeContract.mutate({ symbol, direction:"FALL", durationSeconds:selectedDuration, amount })}
              disabled={!isValid || placeContract.isPending}
              className="h-14 bg-loss text-white font-bold text-lg gap-2 transition-all hover:scale-[1.02] hover:opacity-90">
              <TrendingDown className="size-5" /> FALL
            </Button>
          </div>
        </div>
      </div>

      {/* Chart + History */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden" style={{ height: 460 }}>
          <TradingChart tvSymbol={tvSymbol} symbol={symbol} />
        </div>
        <TradeHistory />
      </div>
    </div>
  );
}

function TradingChart({ tvSymbol, symbol }: { tvSymbol: string; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: tvSymbol, interval: "1",
      timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en",
      enable_publishing: false, hide_side_toolbar: false,
      allow_symbol_change: false, save_image: false, calendar: false,
      backgroundColor: "rgba(10, 14, 23, 1)",
      gridColor: "rgba(255,255,255,0.04)",
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
    return () => { if (el) el.innerHTML = ""; };
  }, [tvSymbol]);
  return <div ref={containerRef} className="w-full h-full" />;
}

function TradeHistory() {
  const history = trpc.trading.history.useQuery(undefined, { refetchInterval: 5000 });
  const utils = trpc.useUtils();
  const settle = trpc.trading.settleContract.useMutation({
    onSuccess: data => {
      utils.trading.history.invalidate();
      utils.wallet.balances.invalidate();
      const emoji = data.status === "won" ? "🎉" : data.status === "lost" ? "😞" : "🤝";
      toast.success(`${emoji} ${data.status.toUpperCase()} · Payout: ${data.payout} USDT`);
    },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 font-bold">
          <History className="size-4 text-gain" /> Recent Trades
        </div>
        <button onClick={() => utils.trading.history.invalidate()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
          <RefreshCw className="size-4" />
        </button>
      </div>

      {history.isLoading ? (
        <div className="flex justify-center py-8">
          <div className="size-8 border-2 border-gain border-t-transparent rounded-full animate-spin" />
        </div>
      ) : history.data && history.data.length > 0 ? (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {history.data.map(trade => {
            const isOpen = trade.status === "open";
            const isWon = trade.status === "won";
            const isLost = trade.status === "lost";
            return (
              <div key={trade.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${trade.direction === "UP" ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
                    {trade.direction === "UP" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{trade.symbol}</div>
                    <div className="text-[11px] text-muted-foreground font-mono-custom">
                      {Number(trade.amount).toLocaleString()} USDT · {trade.durationSeconds}s · ${Number(trade.entryPrice).toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isOpen ? (
                    <Button size="sm" onClick={() => settle.mutate({ tradeId: trade.id, symbol: trade.symbol })}
                      disabled={settle.isPending}
                      className="bg-gain text-primary-foreground font-bold text-[10px] h-8 px-3 hover:opacity-90">
                      <Clock className="size-3 mr-1" /> SETTLE
                    </Button>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className={`flex items-center gap-1 text-xs font-bold uppercase ${isWon ? "text-gain" : isLost ? "text-loss" : "text-muted-foreground"}`}>
                        {isWon ? <CheckCircle2 className="size-3" /> : isLost ? <XCircle className="size-3" /> : null}
                        {trade.status}
                      </div>
                      {isWon && (
                        <div className="text-[10px] text-gain font-mono-custom">
                          +{(Number(trade.amount) * Number(trade.profitRate)).toFixed(2)} USDT
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
            <Activity className="size-6 text-muted-foreground opacity-50" />
          </div>
          <div className="text-muted-foreground text-sm font-semibold">No trades yet</div>
          <div className="text-muted-foreground/50 text-xs mt-1">Place your first contract above</div>
        </div>
      )}
    </div>
  );
}

// ── Spot / Markets Page ───────────────────────────────────────────────────────
function SpotPage() {
  const me = trpc.auth.me.useQuery();
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight font-display">Live Markets</h2>
          <p className="text-sm text-muted-foreground">Real-time prices from Binance · {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="size-1.5 rounded-full bg-gain animate-pulse" /> Live
        </div>
      </div>
      <MarketWallPreview />
      {!me.data && (
        <div className="glass-strong rounded-3xl p-8 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-xl font-bold font-display mb-2">Start Trading Now</h3>
          <p className="text-muted-foreground text-sm mb-6">Create a free account and get 100,000 USDT demo balance instantly.</p>
          <Link href="/"><Button className="bg-gain text-primary-foreground glow-lime font-semibold px-8">Open Free Account</Button></Link>
        </div>
      )}
    </div>
  );
}

// ── Assets Page ───────────────────────────────────────────────────────────────
function AssetsPage() {
  const me = trpc.auth.me.useQuery();
  const balances = trpc.wallet.balances.useQuery(undefined, { enabled: !!me.data });
  if (!me.data) return <AuthPanel />;

  const totalUsdt = balances.data?.reduce((s,w) => s + Number(w.demoBalance || w.balance), 0) || 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight font-display">My Assets</h2>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest glass px-3 py-1.5 rounded-full">Demo Account</div>
      </div>

      <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-48 rounded-full pointer-events-none"
          style={{ background: "var(--gradient-lime)", filter: "blur(60px)", opacity: 0.2 }} />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Demo Balance</div>
          <div className="text-5xl font-extrabold text-gain tracking-tight font-display">
            ${totalUsdt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="bg-gain text-primary-foreground hover:opacity-90 font-semibold gap-2">
              <CreditCard className="size-4" /> Deposit
            </Button>
            <Button variant="outline" className="glass border-white/10 gap-2">
              <Wallet className="size-4" /> Withdraw
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balances.data?.map(w => (
          <div key={w.id} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-gain/10 flex items-center justify-center">
                <span className="text-xs font-bold text-gain">{w.asset}</span>
              </div>
              <div>
                <div className="font-bold">{w.asset}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase">Spot Wallet</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Demo Balance</div>
              <div className="text-2xl font-bold text-gain font-mono-custom">{Number(w.demoBalance||0).toFixed(2)}</div>
            </div>
            <div className="mt-2">
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Real Balance</div>
              <div className="text-lg font-bold text-muted-foreground font-mono-custom">{Number(w.balance).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage() {
  const me = trpc.auth.me.useQuery();
  const history = trpc.trading.history.useQuery();
  if (!me.data) return <AuthPanel />;

  const total = history.data?.length || 0;
  const won = history.data?.filter(t => t.status === "won").length || 0;
  const winRate = total > 0 ? ((won/total)*100).toFixed(1) : "—";
  const totalProfit = history.data?.filter(t => t.status === "won").reduce((s,t) => s + Number(t.amount)*Number(t.profitRate), 0) || 0;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-up">
      <div className="glass-strong rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-48 rounded-full pointer-events-none"
          style={{ background: "var(--gradient-lime)", filter: "blur(60px)", opacity: 0.2 }} />
        <div className="relative">
          <div className="size-20 rounded-full bg-gain grid place-items-center mx-auto mb-4 font-extrabold text-2xl text-primary-foreground glow-lime font-display">
            {(me.data.email?.[0] || "?").toUpperCase()}
          </div>
          <div className="text-xl font-bold">{me.data.email}</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="bg-gain/10 text-gain px-3 py-1 rounded-full text-xs font-bold uppercase border border-gain/20">{me.data.vipLevel}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase border border-white/10">{me.data.role}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[["Total Trades", total.toString()],["Won", won.toString()],["Win Rate", `${winRate}%`]].map(([l,v]) => (
          <div key={l} className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-gain font-display">{v}</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{l}</div>
          </div>
        ))}
      </div>

      {totalProfit > 0 && (
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-semibold">Total Profit Earned</span>
          <span className="text-gain font-bold font-mono-custom">+{totalProfit.toFixed(2)} USDT</span>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        {[["Account Mode","Demo Trading"],["Security","Password Auth"],["Notifications","Enabled"],["Language","English"]].map(([l,v],i) => (
          <div key={i} className={`flex justify-between items-center px-5 py-4 ${i < 3 ? "border-b border-white/5" : ""}`}>
            <span className="text-sm text-muted-foreground font-semibold">{l}</span>
            <span className="text-sm font-bold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── About Page ────────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10 py-6 animate-fade-up">
      <div className="text-center">
        <div className="size-20 rounded-2xl bg-gain grid place-items-center mx-auto mb-6 glow-lime">
          <Zap className="size-12 fill-current text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight font-display">About STGLOBAL</h1>
        <p className="text-muted-foreground mt-4 leading-relaxed">
          STGLOBAL is a leading professional multi-asset exchange providing institutional-grade trading tools and deep liquidity for global traders since 2014.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[["🔒","Secure","Bank-level security with multi-factor authentication and cold storage"],
          ["⚡","Fast","Ultra-low latency order execution under 10ms"],
          ["🌍","Global","Available in 150+ countries worldwide"]].map(([e,t,d]) => (
          <div key={t} className="glass rounded-2xl p-6 text-center hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-3">{e}</div>
            <div className="font-bold mb-2">{t}</div>
            <div className="text-sm text-muted-foreground">{d}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-lg font-display">Contact & Support</h3>
        {[["Email","support@stglobal.app"],["Telegram","@stglobal_support"],["24/7 Live Chat","Available in app"]].map(([l,v]) => (
          <div key={l} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
            <span className="text-muted-foreground text-sm font-semibold">{l}</span>
            <span className="text-gain text-sm font-bold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [location] = useLocation();
  return (
    <Shell>
      {location === "/" && <HomePage />}
      {location === "/spot" && <SpotPage />}
      {location === "/contracts" && <ContractsPage />}
      {location === "/assets" && <AssetsPage />}
      {location === "/profile" && <ProfilePage />}
      {location === "/about" && <AboutPage />}
    </Shell>
  );
}
