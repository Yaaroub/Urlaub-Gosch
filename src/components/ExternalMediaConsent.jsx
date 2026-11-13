"use client";

import { useEffect, useState } from "react";
import { CONSENT_CHANGED_EVENT, hasExternalMediaConsent, openConsentSettings } from "@/lib/consent";

export default function ExternalMediaConsent({ children, provider = "externe Inhalte" }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => setAllowed(hasExternalMediaConsent());
    update();
    window.addEventListener(CONSENT_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  if (allowed) return children;
  return <div className="grid min-h-48 h-full place-content-center gap-3 rounded-xl bg-slate-100 p-6 text-center text-sm text-slate-700">
    <p>{provider} wird erst nach Ihrer Zustimmung geladen. Dabei wird Ihre IP-Adresse an den Anbieter übermittelt.</p>
    <button type="button" onClick={openConsentSettings} className="mx-auto rounded-full bg-slate-950 px-5 py-3 font-semibold text-white">Cookie-Einstellungen öffnen</button>
  </div>;
}
