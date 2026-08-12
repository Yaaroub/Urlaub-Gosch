// src/lib/consent.js

export const CONSENT_STORAGE_KEY = "urlaub-gosch-consent-v1";

export const CONSENT_CHANGED_EVENT =
  "urlaub-gosch:consent-changed";

export const CONSENT_OPEN_EVENT =
  "urlaub-gosch:open-consent";

export const DEFAULT_CONSENT = {
  necessary: true,
  externalMedia: false,
  statistics: false,
};

export function readConsent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(
      CONSENT_STORAGE_KEY
    );

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    return {
      necessary: true,
      externalMedia:
        parsed?.externalMedia === true,
      statistics:
        parsed?.statistics === true,
      updatedAt:
        parsed?.updatedAt || null,
    };
  } catch (error) {
    console.error(
      "Cookie-Einstellungen konnten nicht gelesen werden:",
      error
    );

    return null;
  }
}

export function saveConsent(consent = {}) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = {
    necessary: true,
    externalMedia:
      consent.externalMedia === true,
    statistics:
      consent.statistics === true,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(value)
    );

    window.dispatchEvent(
      new CustomEvent(CONSENT_CHANGED_EVENT, {
        detail: value,
      })
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

export function openConsentSettings() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(CONSENT_OPEN_EVENT)
  );
}

export function hasConsent(category) {
  if (category === "necessary") {
    return true;
  }

  const consent = readConsent();

  if (!consent) {
    return false;
  }

  return consent[category] === true;
}