export default function LastMinuteBadge({ discount }) {
  if (!discount && discount !== 0) return null;

  return (
    <div className="absolute left-3 top-3 z-10">
      <span className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg border border-red-300/20 bg-[rgba(6,20,35,0.72)] px-3 py-1 text-[12px] font-semibold tracking-[0.16em] text-white shadow-[0_10px_26px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.12)]" />
        <span className="text-white/95">-{discount}%</span>
        <span className="text-white/75">LAST MINUTE</span>

        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/18 to-transparent animate-lmSheen" />
        </span>
      </span>
    </div>
  );
}
