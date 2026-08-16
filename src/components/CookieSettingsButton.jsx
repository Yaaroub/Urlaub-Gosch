"use client";

import { Cookie } from "lucide-react";
import { openConsentSettings } from "@/lib/consent";

export default function CookieSettingsButton({
  className = "",
  showIcon = false,
}) {
  return (
    <button
      type="button"
      onClick={openConsentSettings}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {showIcon && (
        <Cookie
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
        />
      )}

      <span>Cookie-Einstellungen</span>
    </button>
  );
}