export default function GoogleMapEmbed({ query, title = "Karte", height = 320 }) {
    const q = String(query || "").trim();
    if (!q) return null;
  
    const src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  
    return (
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 bg-white">
        <div className="px-6 pt-6">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{q}</p>
        </div>
  
        <div className="px-6 pb-6 pt-4">
          <iframe
            title={title}
            src={src}
            width="100%"
            height={height}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full rounded-xl border border-slate-200"
            allowFullScreen
          />
        </div>
      </div>
    );
  }
  