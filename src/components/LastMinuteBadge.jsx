export default function LastMinuteBadge({ discount }) {
    if (!discount && discount !== 0) return null;
    return (
      <div className="absolute left-2 top-2 z-10 rounded-lg bg-rose-600/90 px-2 py-1 text-[12px] font-semibold text-white shadow">
        −{discount}% Last-Minute
      </div>
    );
  }
  