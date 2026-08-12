// src/components/CookieSettingsButton.jsx

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
      className={className}
    >
      {showIcon ? (
        <Cookie className="h-4 w-4" />
      ) : null}

      Cookie-Einstellungen
    </button>
  );
}