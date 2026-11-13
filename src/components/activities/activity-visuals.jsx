import {
  Compass,
  FerrisWheel,
  Landmark,
  LifeBuoy,
  Sailboat,
  Trees,
  UtensilsCrossed,
} from "lucide-react";

/** One visual identity per activity group (icon, colours), shared by cards, chips and hero. */
export const GROUP_VISUALS = {
  Alle: {
    icon: Compass,
    label: "Alle Ziele",
    gradient: "from-[#07131f] via-[#10283b] to-[#1d3d56]",
    accent: "text-[#f4d59d]",
    soft: "bg-slate-100 text-slate-700",
  },
  Familie: {
    icon: FerrisWheel,
    label: "Familie",
    gradient: "from-[#7a4f12] via-[#b88327] to-[#e2b95c]",
    accent: "text-[#fff3d6]",
    soft: "bg-[#fbf3e2] text-[#7a5b18]",
  },
  Natur: {
    icon: Trees,
    label: "Natur",
    gradient: "from-[#063b2c] via-[#0f6b4f] to-[#3f9b77]",
    accent: "text-[#d8f5e8]",
    soft: "bg-[#e6f5ee] text-[#0f5a43]",
  },
  Sport: {
    icon: Sailboat,
    label: "Sport & Wasser",
    gradient: "from-[#05324f] via-[#0068a0] to-[#2a9fd6]",
    accent: "text-[#dff3ff]",
    soft: "bg-[#e3f2fb] text-[#075985]",
  },
  Restaurant: {
    icon: UtensilsCrossed,
    label: "Genuss & Einkauf",
    gradient: "from-[#4a1f12] via-[#8a3b1f] to-[#c66a3d]",
    accent: "text-[#ffe6d8]",
    soft: "bg-[#fbebe3] text-[#8a3b1f]",
  },
  Kultur: {
    icon: Landmark,
    label: "Kultur",
    gradient: "from-[#25213f] via-[#463d72] to-[#7466a6]",
    accent: "text-[#ebe7ff]",
    soft: "bg-[#eeebf8] text-[#463d72]",
  },
  Service: {
    icon: LifeBuoy,
    label: "Service & Alltag",
    gradient: "from-[#1e293b] via-[#475569] to-[#7c8ba1]",
    accent: "text-[#e2e8f0]",
    soft: "bg-slate-100 text-slate-700",
  },
};

/** Groups in display order (without "Alle"). */
export const VISIBLE_GROUPS = ["Familie", "Natur", "Sport", "Restaurant", "Kultur", "Service"];

export function getGroupVisual(group) {
  return GROUP_VISUALS[group] || GROUP_VISUALS.Alle;
}

/** Decorative tile: gradient + large icon + subtle wave pattern (pure CSS/SVG, no image request). */
export function GroupArtwork({ group, className = "", iconClassName = "h-10 w-10", children }) {
  const visual = getGroupVisual(group);
  const Icon = visual.icon;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${visual.gradient} ${className}`}>
      <svg
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 w-full text-white/10"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
      >
        <path fill="currentColor" d="M0 60 C 80 30 140 90 220 60 S 340 30 400 55 V100 H0 Z" />
        <path fill="currentColor" d="M0 80 C 90 55 160 105 250 78 S 360 60 400 75 V100 H0 Z" />
      </svg>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <Icon aria-hidden="true" className={`absolute right-5 top-5 ${visual.accent} opacity-90 ${iconClassName}`} strokeWidth={1.5} />
      {children}
    </div>
  );
}
