import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

// Comprehensive crypto icon mapping
const COIN_ICONS: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  DOT: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  BCH: "https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
  TRX: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
};

// Fallback: spothq cryptocurrency-icons
function getCryptoIcon(symbol: string): string {
  const s = symbol.toUpperCase();

  // Metals & Forex — use emoji-based avatars
  if (s === "XAUUSD") return "https://ui-avatars.com/api/?name=AU&background=f0b90b&color=000&bold=true&size=64";
  if (s === "XAGUSD") return "https://ui-avatars.com/api/?name=AG&background=c0c0c0&color=000&bold=true&size=64";
  if (s === "EURUSD") return "https://ui-avatars.com/api/?name=EU&background=003399&color=fff&bold=true&size=64";
  if (s === "GBPUSD") return "https://ui-avatars.com/api/?name=GB&background=012169&color=fff&bold=true&size=64";

  // Crypto — try CoinGecko first, fallback to spothq
  if (s.endsWith("USDT")) {
    const coin = s.replace("USDT", "");
    if (COIN_ICONS[coin]) return COIN_ICONS[coin];
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin.toLowerCase()}.png`;
  }

  return `https://ui-avatars.com/api/?name=${s.slice(0,2)}&background=f0b90b&color=000&bold=true&size=64`;
}

function CoinIcon({ symbol }: { symbol: string }) {
  const [src, setSrc] = useState(() => getCryptoIcon(symbol));
  const [errCount, setErrCount] = useState(0);

  const coin = symbol.replace("USDT","").toLowerCase();

  const handleError = () => {
    if (errCount === 0) {
      // Try spothq as second source
      setSrc(`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coin}.png`);
    } else if (errCount === 1) {
      // Try CryptoIcons
      setSrc(`https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/16/${coin}.png`);
    } else {
      // Final fallback
      setSrc(`https://ui-avatars.com/api/?name=${symbol.slice(0,2)}&background=f0b90b&color=000&bold=true&size=64`);
    }
    setErrCount(e => e + 1);
  };

  return (
    <img src={src} alt={symbol} onError={handleError}
      className="w-9 h-9 rounded-full object-cover bg-[#0b0e11] border border-slate-800"
      loading="lazy" />
  );
}

// Pretty symbol display
function getDisplayName(symbol: string) {
  const names: Record<string, { base: string; quote: string; full: string }> = {
    BTCUSDT:  { base: "BTC",  quote: "USDT", full: "Bitcoin" },
    ETHUSDT:  { base: "ETH",  quote: "USDT", full: "Ethereum" },
    BNBUSDT:  { base: "BNB",  quote: "USDT", full: "BNB Chain" },
    SOLUSDT:  { base: "SOL",  quote: "USDT", full: "Solana" },
    XRPUSDT:  { base: "XRP",  quote: "USDT", full: "Ripple" },
    ADAUSDT:  { base: "ADA",  quote: "USDT", full: "Cardano" },
    DOGEUSDT: { base: "DOGE", quote: "USDT", full: "Dogecoin" },
    DOTUSDT:  { base: "DOT",  quote: "USDT", full: "Polkadot" },
    MATICUSDT:{ base: "MATIC",quote: "USDT", full: "Polygon" },
    LINKUSDT: { base: "LINK", quote: "USDT", full: "Chainlink" },
    UNIUSDT:  { base: "UNI",  quote: "USDT", full: "Uniswap" },
    LTCUSDT:  { base: "LTC",  quote: "USDT", full: "Litecoin" },
    BCHUSDT:  { base: "BCH",  quote: "USDT", full: "Bitcoin Cash" },
    TRXUSDT:  { base: "TRX",  quote: "USDT", full: "TRON" },
    AVAXUSDT: { base: "AVAX", quote: "USDT", full: "Avalanche" },
    XAUUSD:   { base: "XAU",  quote: "USD",  full: "Gold" },
    XAGUSD:   { base: "XAG",  quote: "USD",  full: "Silver" },
    EURUSD:   { base: "EUR",  quote: "USD",  full: "Euro / Dollar" },
    GBPUSD:   { base: "GBP",  quote: "USD",  full: "Pound / Dollar" },
  };
  return names[symbol] || { base: symbol, quote: "", full: symbol };
}

export function MarketTable() {
  const [activeTab, setActiveTab] = useState<"Hot" | "Crypto" | "Metals" | "Forex">("Hot");
  const [search, setSearch] = useState("");
  const market = trpc.market.snapshot.useQuery(undefined, { refetchInterval: 3000 });

  const data = market.data ? (
    activeTab === "Hot" ? market.data.hot :
    activeTab === "Crypto" ? market.data.crypto :
    activeTab === "Metals" ? market.data.metals :
    market.data.forex
  ) : [];

  const filteredData = useMemo(() =>
    data.filter(item =>
      item.symbol.toLowerCase().includes(search.toLowerCase()) ||
      getDisplayName(item.symbol).full.toLowerCase().includes(search.toLowerCase())
    ),
    [data, search]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-[#1e2329] border border-slate-800 p-1">
            {["Hot","Crypto","Metals","Forex"].map(tab => (
              <TabsTrigger key={tab} value={tab}
                className="data-[state=active]:bg-[#0b0e11] data-[state=active]:text-[#f0b90b] font-bold text-slate-400">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input placeholder="Search pairs…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1e2329] border-slate-800 text-white focus:border-[#f0b90b]" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#1e2329] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent bg-[#0b0e11]">
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-widest w-[220px]">Pair</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-widest text-right">Price (USD)</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-widest text-right">24h Change</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-widest text-right hidden md:table-cell">Volume</TableHead>
              <TableHead className="text-slate-400 font-bold uppercase text-[11px] tracking-widest text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {market.isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-slate-800">
                  <TableCell><div className="h-9 bg-slate-800 rounded animate-pulse w-32"></div></TableCell>
                  <TableCell><div className="h-5 bg-slate-800 rounded animate-pulse w-24 ml-auto"></div></TableCell>
                  <TableCell><div className="h-5 bg-slate-800 rounded animate-pulse w-16 ml-auto"></div></TableCell>
                  <TableCell className="hidden md:table-cell"><div className="h-5 bg-slate-800 rounded animate-pulse w-20 ml-auto"></div></TableCell>
                  <TableCell><div className="h-8 bg-slate-800 rounded animate-pulse w-16 ml-auto"></div></TableCell>
                </TableRow>
              ))
            ) : filteredData.map((row) => {
              const isPositive = !row.change.startsWith("-");
              const displayName = getDisplayName(row.symbol);
              const priceNum = Number(row.price);
              const priceStr = priceNum >= 10000
                ? priceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : priceNum >= 1
                ? priceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                : priceNum.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });

              return (
                <TableRow key={row.symbol} className="border-slate-800 hover:bg-[#0b0e11]/70 transition-colors cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CoinIcon symbol={row.symbol} />
                      <div>
                        <div className="font-black text-white text-sm">{displayName.base}/{displayName.quote}</div>
                        <div className="text-[11px] text-slate-500 font-bold">{displayName.full}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-black text-white">${priceStr}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`inline-flex items-center justify-end gap-1 font-black text-sm px-2 py-0.5 rounded-md ${
                      isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                    }`}>
                      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {isPositive ? "+" : ""}{row.change}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-400 font-bold text-sm hidden md:table-cell">
                    {row.volume || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href="/contracts">
                      <Button size="sm" className="bg-slate-800 text-white hover:bg-[#f0b90b] hover:text-black font-black transition-all text-xs">
                        Trade
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}

            {!market.isLoading && filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-bold">
                  <Search className="size-8 mx-auto mb-3 text-slate-700" />
                  No pairs found for "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-[11px] text-slate-600 text-center font-bold">
        Live prices from Binance API · Updates every 3 seconds · {filteredData.length} pairs shown
      </div>
    </div>
  );
}
