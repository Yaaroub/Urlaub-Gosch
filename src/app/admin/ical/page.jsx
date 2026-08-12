"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  Link2,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function copyWithFallback(text) {
  const textArea = document.createElement("textarea");

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";

  document.body.appendChild(textArea);
  textArea.select();

  const successful = document.execCommand("copy");

  document.body.removeChild(textArea);

  if (!successful) {
    throw new Error("Kopieren fehlgeschlagen.");
  }
}

export default function AdminIcalPage() {
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  const [prop, setProp] = useState(null);
  const [icalUrl, setIcalUrl] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");

  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState(null);

  /*
   * Beim ersten Laden:
   * 1. Domain für die eigene Export-URL ermitteln.
   * 2. propertyId aus der URL übernehmen.
   *
   * Beispiel:
   * /admin/ical?propertyId=21
   */
  useEffect(() => {
    setSiteOrigin(window.location.origin);

    const searchParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = searchParams.get("propertyId");

    if (propertyIdFromUrl) {
      setSelectedId(propertyIdFromUrl);
    }
  }, []);

  /*
   * Alle Objekte für das Dropdown laden.
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadProperties() {
      setLoadingProperties(true);

      try {
        const response = await fetch("/api/admin/properties", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.error || "Objekte konnten nicht geladen werden."
          );
        }

        const sortedProperties = Array.isArray(data)
          ? [...data].sort((a, b) =>
              String(a.title || "").localeCompare(
                String(b.title || ""),
                "de",
                {
                  sensitivity: "base",
                }
              )
            )
          : [];

        setProperties(sortedProperties);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setProperties([]);

        setMsg({
          t: "error",
          m: error?.message || "Objekte konnten nicht geladen werden.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      controller.abort();
    };
  }, []);

  /*
   * Einzelnes Objekt laden.
   */
  const fetchPropertyDetails = useCallback(async (propertyId, signal) => {
    const response = await fetch(
      `/api/admin/properties/${encodeURIComponent(propertyId)}`,
      {
        cache: "no-store",
        signal,
      }
    );

    if (response.status === 401) {
      window.location.href = "/admin";
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      throw new Error(
        data?.error || "Objektdetails konnten nicht geladen werden."
      );
    }

    return data;
  }, []);

  /*
   * Wenn selectedId gesetzt oder geändert wird,
   * automatisch das entsprechende Objekt laden.
   */
  useEffect(() => {
    if (!selectedId) {
      setProp(null);
      setIcalUrl("");
      return;
    }

    const controller = new AbortController();

    async function loadSelectedProperty() {
      setLoadingDetails(true);
      setProp(null);
      setIcalUrl("");
      setMsg(null);

      try {
        const data = await fetchPropertyDetails(
          selectedId,
          controller.signal
        );

        if (!data) return;

        setProp(data);
        setIcalUrl(data.icalUrl || "");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setProp(null);
        setIcalUrl("");

        setMsg({
          t: "error",
          m:
            error?.message ||
            "Objektdetails konnten nicht geladen werden.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDetails(false);
        }
      }
    }

    loadSelectedProperty();

    return () => {
      controller.abort();
    };
  }, [selectedId, fetchPropertyDetails]);

  /*
   * Eigene iCal-Export-URL des Objekts.
   *
   * Beispiel:
   * https://urlaub-gosch.de/api/ical/alte-liebe
   */
  const ownIcalExportUrl = useMemo(() => {
    if (!siteOrigin || !prop?.slug) {
      return "";
    }

    return `${siteOrigin}/api/ical/${encodeURIComponent(prop.slug)}`;
  }, [siteOrigin, prop?.slug]);

  const selectedPropertyTitle = useMemo(() => {
    return (
      properties.find(
        (property) => String(property.id) === String(selectedId)
      )?.title || ""
    );
  }, [properties, selectedId]);

  /*
   * Auswahl ändern und propertyId in der URL aktualisieren.
   */
  function handlePropertyChange(event) {
    const nextId = event.target.value;

    setSelectedId(nextId);
    setProp(null);
    setIcalUrl("");
    setMsg(null);

    const url = new URL(window.location.href);

    if (nextId) {
      url.searchParams.set("propertyId", nextId);
    } else {
      url.searchParams.delete("propertyId");
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  /*
   * Objektdaten nach Speichern oder Sync aktualisieren.
   */
  async function refreshSelectedProperty() {
    if (!selectedId) return null;

    try {
      const data = await fetchPropertyDetails(selectedId);

      if (!data) return null;

      setProp(data);
      setIcalUrl(data.icalUrl || "");

      return data;
    } catch {
      return null;
    }
  }

  /*
   * Externe iCal-Import-URL speichern.
   */
  async function saveUrl(event) {
    event.preventDefault();
    setMsg(null);

    if (!selectedId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst ein Objekt wählen.",
      });
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/properties/${encodeURIComponent(selectedId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            icalUrl: icalUrl.trim() || null,
          }),
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Speichern fehlgeschlagen.",
        });
        return;
      }

      await refreshSelectedProperty();

      setMsg({
        t: "ok",
        m: "Die externe iCal-URL wurde gespeichert.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  /*
   * Externe iCal-URL jetzt synchronisieren.
   */
  async function syncNow() {
    setMsg(null);

    if (!selectedId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst ein Objekt wählen.",
      });
      return;
    }

    if (!icalUrl.trim()) {
      setMsg({
        t: "error",
        m: "Bitte zuerst eine externe iCal-URL hinterlegen.",
      });
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/admin/ical/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: Number(selectedId),
        }),
      });

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Synchronisation fehlgeschlagen.",
        });
        return;
      }

      await refreshSelectedProperty();

      setMsg({
        t: "ok",
        m: `Sync erfolgreich. Neu angelegt: ${
          data?.created ?? 0
        } · Events gesamt: ${data?.total ?? 0}`,
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Synchronisieren.",
      });
    } finally {
      setBusy(false);
    }
  }

  /*
   * Manuelle ICS-Datei importieren.
   */
  async function handleImport(event) {
    event.preventDefault();
    setMsg(null);

    if (!selectedId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst ein Objekt wählen.",
      });
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setMsg({
        t: "error",
        m: "Bitte zuerst eine ICS-Datei auswählen.",
      });
      return;
    }

    formData.append("propertyId", String(selectedId));

    setBusy(true);

    try {
      const response = await fetch("/api/admin/ical/import", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Upload-Import fehlgeschlagen.",
        });
        return;
      }

      await refreshSelectedProperty();
      formElement.reset();

      setMsg({
        t: "ok",
        m: `Import erfolgreich. Neu angelegt: ${
          data?.created ?? 0
        } · Events gesamt: ${data?.total ?? 0}`,
      });
    } catch {
      setMsg({
        t: "error",
        m: "Upload-Import fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }

  /*
   * Eigene iCal-Export-URL kopieren.
   */
  async function copyExportUrl() {
    setMsg(null);

    if (!ownIcalExportUrl) {
      setMsg({
        t: "error",
        m: "Für dieses Objekt konnte keine Export-URL erstellt werden.",
      });
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ownIcalExportUrl);
      } else {
        copyWithFallback(ownIcalExportUrl);
      }

      setMsg({
        t: "ok",
        m: "iCal-Export-URL wurde kopiert.",
      });
    } catch {
      try {
        copyWithFallback(ownIcalExportUrl);

        setMsg({
          t: "ok",
          m: "iCal-Export-URL wurde kopiert.",
        });
      } catch {
        setMsg({
          t: "error",
          m: "Die URL konnte nicht automatisch kopiert werden.",
        });
      }
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-5xl px-4 py-8 md:py-10">
      {/* Meldungen */}
      <div className="mb-4 space-y-2">
        {msg?.t === "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{msg.m}</span>

            <button
              type="button"
              className="shrink-0 text-xs font-medium text-rose-600"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}

        {msg?.t === "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{msg.m}</span>

            <button
              type="button"
              className="shrink-0 text-xs font-medium text-emerald-600"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · iCal
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            iCal Import, Export & Sync
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Externe Kalender importieren und den Urlaub-GOSCH-Kalender
            über eine eigene URL in anderen Portalen einbinden.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>

          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40"
            value={selectedId}
            onChange={handlePropertyChange}
            disabled={loadingProperties}
          >
            <option value="">
              {loadingProperties
                ? "Objekte werden geladen …"
                : "— Objekt wählen —"}
            </option>

            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>

          {selectedPropertyTitle && (
            <p className="mt-1 text-right text-[11px] text-slate-500">
              {selectedPropertyTitle}
            </p>
          )}
        </div>
      </div>

      {loadingDetails && (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Objektdaten werden geladen …
        </div>
      )}

      {!selectedId && !loadingDetails && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Kein Objekt ausgewählt
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Wähle oben ein Objekt aus, um dessen iCal-Einstellungen zu
            verwalten.
          </p>
        </div>
      )}

      {prop && !loadingDetails && (
        <div className="space-y-6">
          {/* Objektinformationen */}
          <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Ausgewähltes Objekt
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {prop.title}
            </h2>

            <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <p>
                <span className="font-medium text-white">
                  Letzter Sync:
                </span>{" "}
                {formatDateTime(prop.icalLastRunAt)}
              </p>

              <p>
                <span className="font-medium text-white">
                  Letzte Übernahme:
                </span>{" "}
                {formatDateTime(prop.icalUpdatedAt)}
              </p>
            </div>
          </div>

          {/* Eigene Export-URL */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                <Link2 className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Eigene iCal-Export-URL
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Diese URL kannst du in Airbnb, Booking, FeWo-direkt
                  oder anderen Portalen als externen Kalender eintragen.
                </p>
              </div>
            </div>

            {ownIcalExportUrl ? (
              <>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Urlaub-GOSCH Kalender-URL
                  </span>

                  <input
                    readOnly
                    value={ownIcalExportUrl}
                    onFocus={(event) => event.target.select()}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyExportUrl}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    URL kopieren
                  </button>

                  <a
                    href={ownIcalExportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <ExternalLink
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Kalender öffnen
                  </a>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Änderungen an den Belegungen werden über dieselbe URL
                  bereitgestellt. Das andere Portal bestimmt, wie oft der
                  Kalender neu synchronisiert wird.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Für dieses Objekt ist kein Slug vorhanden. Vergib zuerst
                einen Slug in den Grunddaten, damit eine Export-URL
                erstellt werden kann.
              </div>
            )}
          </div>

          {/* Externe iCal-URL */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Externen Kalender importieren
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Hinterlege hier die iCal-Adresse eines anderen Portals,
                um dortige Belegungen in Urlaub-GOSCH zu übernehmen.
              </p>
            </div>

            <form onSubmit={saveUrl} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Externe iCal-URL
                </span>

                <input
                  type="url"
                  className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40"
                  placeholder="https://…/calendar.ics"
                  value={icalUrl}
                  onChange={(event) => setIcalUrl(event.target.value)}
                />

                <span className="text-[11px] leading-5 text-slate-500">
                  Unterstützt werden HTTPS-Adressen. Eine
                  webcal://-Adresse kann ebenfalls gespeichert werden,
                  sofern deine API sie verarbeitet.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  URL speichern
                </button>

                <button
                  type="button"
                  disabled={busy || !icalUrl.trim()}
                  onClick={syncNow}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      busy ? "animate-spin" : ""
                    }`}
                    aria-hidden="true"
                  />
                  Jetzt synchronisieren
                </button>
              </div>
            </form>
          </div>

          {/* Dateiimport */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                ICS-Datei importieren
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Alternativ kannst du eine heruntergeladene
                Kalenderdatei manuell importieren.
              </p>
            </div>

            <form className="grid gap-4" onSubmit={handleImport}>
              <input
                required
                type="file"
                name="file"
                accept=".ics,text/calendar"
                className="block rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
              />

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Datei importieren
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}