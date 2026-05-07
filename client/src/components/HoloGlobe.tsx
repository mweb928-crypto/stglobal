export function HoloGlobe() {
  // Pure-CSS/SVG 3D-feel holographic globe with orbit rings + pulsing trade nodes.
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto">
      <div className="absolute inset-0 holo-grid opacity-60" />
      <div className="absolute inset-6 rounded-full border border-white/10 animate-spin-slow"
           style={{ background: "conic-gradient(from 0deg, transparent, oklch(0.78 0.21 245 / 0.25), transparent 40%)" }} />
      <div className="absolute inset-12 rounded-full border border-white/10 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "45s" }} />
      <div className="absolute inset-20 rounded-full glass-strong overflow-hidden animate-float">
        <svg viewBox="0 0 200 200" className="size-full">
          <defs>
            <radialGradient id="globe" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="oklch(0.78 0.21 245)" stopOpacity="0.9" />
              <stop offset="55%" stopColor="oklch(0.32 0.10 260)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="oklch(0.13 0.04 260)" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="meridian" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.92 0.28 142)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.92 0.28 142)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="oklch(0.92 0.28 142)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="92" fill="url(#globe)" />
          {[20, 40, 60, 80].map((r) => (
            <ellipse key={r} cx="100" cy="100" rx="92" ry={r} fill="none" stroke="url(#meridian)" strokeWidth="0.6" />
          ))}
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <ellipse key={deg} cx="100" cy="100" rx="14" ry="92" fill="none" stroke="oklch(1 0 0 / 0.10)" strokeWidth="0.5"
              transform={`rotate(${deg} 100 100)`} />
          ))}
          {[
            [60, 70], [140, 80], [70, 130], [150, 140], [110, 50], [40, 110], [165, 110]
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="2.5" fill="oklch(0.92 0.28 142)">
                <animate attributeName="r" values="2;5;2" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
      </div>
      <div className="absolute -inset-4 rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, oklch(0.78 0.21 245 / 0.25), transparent 60%)" }} />
    </div>
  );
}