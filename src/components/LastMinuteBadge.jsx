"use client";

function formatEuro(value) {
  return new Intl.NumberFormat(
    "de-DE",
    {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value) || 0,
  );
}

export default function LastMinuteBadge({
  discountType = "PERCENT",
  discount = 0,
  discountAmount = 0,
}) {
  const type =
    discountType === "FIXED"
      ? "FIXED"
      : "PERCENT";

  const percent =
    Number(discount) || 0;

  const fixedAmount =
    Number(
      discountAmount,
    ) || 0;

  const hasDiscount =
    type === "FIXED"
      ? fixedAmount > 0
      : percent > 0;

  if (!hasDiscount) {
    return null;
  }

  const valueLabel =
    type === "FIXED"
      ? `−${formatEuro(
          fixedAmount,
        )}`
      : `−${percent}%`;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-10">
      <div className="group relative overflow-hidden rounded-full bg-rose-600 px-3 py-1.5 text-[11px] font-bold shadow-lg shadow-rose-950/20 ring-1 ring-white/30">
        <span className="relative z-10 flex items-center gap-2">
          <span className="text-white/95">
            {valueLabel}
          </span>

          <span className="text-white/75">
            LAST MINUTE
          </span>
        </span>

        <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/18 to-transparent animate-lmSheen" />
        </span>
      </div>
    </div>
  );
}