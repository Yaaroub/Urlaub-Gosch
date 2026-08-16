// src/lib/consent.js

/**
 * Zentrale Consent-Verwaltung für Urlaub-GOSCH.
 *
 * Kategorien:
 *
 * necessary
 *   Technisch notwendige Funktionen.
 *   Immer aktiv und nicht deaktivierbar.
 *
 * externalMedia
 *   Externe Inhalte wie z. B. Karten, Videos,
 *   Webcams oder andere Drittanbieter-Inhalte.
 *
 * statistics
 *   Statistik-/Analyse-Dienste wie später z. B. Matomo.
 *
 * WICHTIG:
 * Ein gespeicherter Consent bedeutet nur,
 * dass eine Kategorie erlaubt wurde.
 *
 * Die jeweiligen Komponenten müssen selbst prüfen,
 * ob die entsprechende Kategorie freigegeben wurde.
 */


/* =========================================================
   STORAGE / EVENTS
========================================================= */

export const CONSENT_STORAGE_KEY =
  "urlaub-gosch-consent-v1";

export const CONSENT_CHANGED_EVENT =
  "urlaub-gosch:consent-changed";

export const CONSENT_OPEN_EVENT =
  "urlaub-gosch:open-consent";


/* =========================================================
   VERSION

   Damit können wir später erkennen, wenn sich unsere
   Consent-Struktur wesentlich verändert.
========================================================= */

export const CONSENT_VERSION = 1;


/* =========================================================
   STANDARDWERTE
========================================================= */

export const DEFAULT_CONSENT = {
  necessary: true,
  externalMedia: false,
  statistics: false,
};


/* =========================================================
   CONSENT NORMALISIEREN

   Verhindert manipulierte oder ungültige Werte aus
   localStorage.

   Nur echtes Boolean "true" aktiviert optionale Kategorien.
========================================================= */

export function normalizeConsent(consent = {}) {
  return {
    necessary: true,

    externalMedia:
      consent?.externalMedia === true,

    statistics:
      consent?.statistics === true,
  };
}


/* =========================================================
   CONSENT LESEN

   Rückgabe:

   null
   → Nutzer hat noch keine Entscheidung getroffen.

   Objekt
   → gespeicherte Auswahl vorhanden.
========================================================= */

export function readConsent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored =
      window.localStorage.getItem(
        CONSENT_STORAGE_KEY
      );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return {
      ...normalizeConsent(parsed),

      version:
        Number.isFinite(parsed?.version)
          ? parsed.version
          : CONSENT_VERSION,

      updatedAt:
        typeof parsed?.updatedAt === "string"
          ? parsed.updatedAt
          : null,
    };
  } catch (error) {
    console.error(
      "Cookie-Einstellungen konnten nicht gelesen werden:",
      error
    );

    return null;
  }
}


/* =========================================================
   CONSENT SPEICHERN
========================================================= */

export function saveConsent(consent = {}) {
  if (typeof window === "undefined") {
    return null;
  }

  const normalized =
    normalizeConsent(consent);

  const value = {
    ...normalized,

    version: CONSENT_VERSION,

    updatedAt:
      new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(value)
    );

    /**
     * Andere Komponenten informieren:
     *
     * z. B.
     * - externe Medien
     * - Matomo
     * - Maps
     * - Webcams
     */
    window.dispatchEvent(
      new CustomEvent(
        CONSENT_CHANGED_EVENT,
        {
          detail: value,
        }
      )
    );

    return value;
  } catch (error) {
    console.error(
      "Cookie-Einstellungen konnten nicht gespeichert werden:",
      error
    );

    return null;
  }
}


/* =========================================================
   NUR NOTWENDIGE AKZEPTIEREN
========================================================= */

export function acceptNecessaryConsent() {
  return saveConsent({
    necessary: true,
    externalMedia: false,
    statistics: false,
  });
}


/* =========================================================
   ALLE AKZEPTIEREN
========================================================= */

export function acceptAllConsent() {
  return saveConsent({
    necessary: true,
    externalMedia: true,
    statistics: true,
  });
}


/* =========================================================
   INDIVIDUELLE AUSWAHL SPEICHERN
========================================================= */

export function saveCustomConsent({
  externalMedia = false,
  statistics = false,
} = {}) {
  return saveConsent({
    necessary: true,

    externalMedia:
      externalMedia === true,

    statistics:
      statistics === true,
  });
}


/* =========================================================
   PRÜFEN, OB BEREITS EINE ENTSCHEIDUNG GETROFFEN WURDE
========================================================= */

export function hasConsentDecision() {
  return readConsent() !== null;
}


/* =========================================================
   EINZELNE KATEGORIE PRÜFEN
========================================================= */

export function hasConsent(category) {
  /**
   * Notwendige Funktionen dürfen immer laufen.
   */
  if (category === "necessary") {
    return true;
  }

  /**
   * Nur bekannte Kategorien akzeptieren.
   */
  if (
    category !== "externalMedia" &&
    category !== "statistics"
  ) {
    return false;
  }

  const consent = readConsent();

  if (!consent) {
    return false;
  }

  return consent[category] === true;
}


/* =========================================================
   EXTERNE MEDIEN
========================================================= */

export function hasExternalMediaConsent() {
  return hasConsent("externalMedia");
}


/* =========================================================
   STATISTIK
========================================================= */

export function hasStatisticsConsent() {
  return hasConsent("statistics");
}


/* =========================================================
   COOKIE-EINSTELLUNGEN ÖFFNEN

   Wird z. B. vom Footer-Button ausgelöst.
========================================================= */

export function openConsentSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(
      CONSENT_OPEN_EVENT
    )
  );
}


/* =========================================================
   CONSENT ZURÜCKSETZEN

   Praktisch für:
   - Entwicklung
   - Tests
   - Debugging

   Kann später auch verwendet werden,
   wenn wir eine Consent-Version vollständig zurücksetzen
   müssen.
========================================================= */

export function resetConsent() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      CONSENT_STORAGE_KEY
    );

    window.dispatchEvent(
      new CustomEvent(
        CONSENT_CHANGED_EVENT,
        {
          detail: null,
        }
      )
    );
  } catch (error) {
    console.error(
      "Cookie-Einstellungen konnten nicht zurückgesetzt werden:",
      error
    );
  }
}


/* =========================================================
   AKTUELLEN CONSENT ALS DEFAULT ZURÜCKGEBEN

   Anders als readConsent():

   readConsent()
   → null, wenn noch keine Entscheidung getroffen wurde.

   getConsentOrDefault()
   → gibt dann DEFAULT_CONSENT zurück.

   Nützlich für Komponenten, die immer ein Objekt erwarten.
========================================================= */

export function getConsentOrDefault() {
  const consent = readConsent();

  if (!consent) {
    return {
      ...DEFAULT_CONSENT,
    };
  }

  return {
    necessary: true,

    externalMedia:
      consent.externalMedia === true,

    statistics:
      consent.statistics === true,
  };
}