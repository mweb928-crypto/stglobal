import { trpc } from "@/lib/trpc";

function formatPrice(p: number) {
  return p >= 1000
    ? p.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : p >= 1 ? p.toFixed(2) : p.toFixed(4);
}

export function TickerStrip() {
  const market = trpc.market.snapshot.useQuery(undefined, { refetchInterval: 3000 });
  const items = market.data ? [...market.data.hot, ...market.data.crypto.slice(0, 5), ...market.data.metals, ...market.data.forex] : [];
  const doubled = [...items, ...items];

  if (items.length === 0) return (
    <div className="border-y border-white/5 bg-black/30 py-2.5 text-xs text-center text-muted-foreground font-mono-custom animate-pulse">
      Loading live markets…
    </div>
  );

  return (
    <div className="border-y border-white/5 bg-black/30 backdrop-blur overflow-hidden">
      <div className="flex gap-8 py-2.5 animate-ticker whitespace-nowrap text-xs font-mono-custom">
        {doubled.map((t, i) => {
          const up = !t.change.startsWith("-");
          return (
            <span key={i} className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground">{t.symbol.replace("USDT","").replace("USD","")}</span>
              <span className="font-semibold text-foreground">{formatPrice(Number(t.price))}</span>
              <span className={up ? "text-gain" : "text-loss"}>
                {up ? "▲" : "▼"} {t.change.replace("+","").replace("-","")}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
