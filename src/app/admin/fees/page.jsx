"use client";

import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  id: null,
  name: "",
  kind: "FIXED",
  amount: "",
};

function toCents(eurString) {
  const normalized = String(eurString ?? "").replace(",", ".").trim();
  const value = Number(normalized);

  return Number.isFinite(value) ? Math.round(value * 100) : NaN;
}

function fromCents(cents) {
  const value = Number(cents);
  return Number.isFinite(value) ? value / 100 : 0;
}

function formatEuroFromCents(cents) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(fromCents(cents));
}

export default function FeesPage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingFees, setLoadingFees] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const selectedProperty = useMemo(
    () =>
      properties.find(
        (property) => String(property.id) === String(propertyId)
      ) ?? null,
    [properties, propertyId]
  );

  // propertyId aus der URL übernehmen.
  // Beispiel: /admin/fees?propertyId=21
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const propertyIdFromUrl = searchParams.get("propertyId");

    if (propertyIdFromUrl) {
      setPropertyId(propertyIdFromUrl);
    }
  }, []);

  // Objekte für die Auswahl laden.
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
                { sensitivity: "base" }
              )
            )
          : [];

        setProperties(sortedProperties);
      } catch (error) {
        if (error?.name === "AbortError") return;

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

    return () => controller.abort();
  }, []);

  // Nebenkosten des gewählten Objekts laden.
  useEffect(() => {
    if (!propertyId) {
      setItems([]);
      setForm(EMPTY_FORM);
      return;
    }

    const controller = new AbortController();

    async function loadSelectedFees() {
      setLoadingFees(true);
      setMsg(null);

      try {
        const response = await fetch(
          `/api/admin/fees?propertyId=${encodeURIComponent(propertyId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.error || "Nebenkosten konnten nicht geladen werden."
          );
        }

        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error?.name === "AbortError") return;

        setItems([]);
        setMsg({
          t: "error",
          m: error?.message || "Nebenkosten konnten nicht geladen werden.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoadingFees(false);
        }
      }
    }

    loadSelectedFees();

    return () => controller.abort();
  }, [propertyId]);

  async function loadFees(pid = propertyId) {
    if (!pid) {
      setItems([]);
      return;
    }

    const response = await fetch(
      `/api/admin/fees?propertyId=${encodeURIComponent(pid)}`,
      { cache: "no-store" }
    );

    if (response.status === 401) {
      window.location.href = "/admin";
      return;
    }

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(
        data?.error || "Nebenkosten konnten nicht geladen werden."
      );
    }

    setItems(Array.isArray(data) ? data : []);
  }

  function handlePropertyChange(event) {
    const nextPropertyId = event.target.value;

    setPropertyId(nextPropertyId);
    setForm(EMPTY_FORM);
    setPendingDelete(null);
    setMsg(null);

    const url = new URL(window.location.href);

    if (nextPropertyId) {
      url.searchParams.set("propertyId", nextPropertyId);
    } else {
      url.searchParams.delete("propertyId");
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function save(event) {
    event.preventDefault();
    setMsg(null);

    if (!propertyId) {
      setMsg({
        t: "error",
        m: "Bitte zuerst eine Unterkunft wählen.",
      });
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setMsg({
        t: "error",
        m: "Bitte eine Bezeichnung für die Nebenkosten eingeben.",
      });
      return;
    }

    const cents = toCents(form.amount);

    if (!Number.isFinite(cents) || cents < 0) {
      setMsg({
        t: "error",
        m: "Bitte einen gültigen, nicht negativen Betrag eingeben.",
      });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      name,
      kind: form.kind,
      amount: cents,
    };

    const url = form.id
      ? `/api/admin/fees/${encodeURIComponent(form.id)}`
      : "/api/admin/fees";

    setBusy(true);

    try {
      const response = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            (form.id
              ? "Nebenkosten konnten nicht aktualisiert werden."
              : "Nebenkosten konnten nicht angelegt werden."),
        });
        return;
      }

      const wasEditing = Boolean(form.id);

      resetForm();
      await loadFees(propertyId);

      setMsg({
        t: "ok",
        m: wasEditing
          ? "Nebenkosten wurden aktualisiert."
          : "Nebenkosten wurden hinzugefügt.",
      });
    } catch (error) {
      setMsg({
        t: "error",
        m: error?.message || "Netzwerkfehler beim Speichern.",
      });
    } finally {
      setBusy(false);
    }
  }

  function editItem(item) {
    setMsg(null);
    setForm({
      id: item.id,
      name: item.name || "",
      kind: item.kind || "FIXED",
      amount: fromCents(item.amount).toFixed(2),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function askDelete(item) {
    setMsg(null);
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    const itemToDelete = pendingDelete;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/fees/${encodeURIComponent(itemToDelete.id)}`,
        { method: "DELETE" }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMsg({
          t: "error",
          m: data?.error || "Löschen fehlgeschlagen.",
        });
        return;
      }

      setItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemToDelete.id)
      );

      if (form.id === itemToDelete.id) {
        resetForm();
      }

      setMsg({
        t: "ok",
        m: "Nebenkosten-Eintrag wurde gelöscht.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Löschen.",
      });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  }

  return (
    <section className="relative mx-auto mt-24 max-w-5xl px-4 py-8 md:py-10">
      {/* Meldungen */}
      <div className="mb-4 space-y-2">
        {msg?.t === "error" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-rose-500"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}

        {msg?.t === "ok" && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <span>{msg.m}</span>
            <button
              type="button"
              className="text-xs text-emerald-600"
              onClick={() => setMsg(null)}
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Nebenkosten
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Nebenkosten verwalten
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Endreinigung, Kurtaxe und weitere Zusatzkosten für das ausgewählte
            Objekt pflegen.
          </p>
        </div>

        <div className="w-full sm:w-80">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:opacity-60"
            value={propertyId}
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

          {selectedProperty && (
            <p className="mt-1 text-right text-[11px] text-slate-500">
              {selectedProperty.title}
            </p>
          )}
        </div>
      </div>

      {/* Formular */}
      <form
        onSubmit={save}
        className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:grid-cols-4"
      >
        <input
          required
          disabled={!propertyId || busy}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:bg-slate-50 disabled:opacity-60 md:col-span-2"
          placeholder="Name, z. B. Endreinigung"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
        />

        <select
          disabled={!propertyId || busy}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:bg-slate-50 disabled:opacity-60"
          value={form.kind}
          onChange={(event) =>
            setForm((current) => ({ ...current, kind: event.target.value }))
          }
        >
          <option value="FIXED">Einmalig</option>
          <option value="PER_NIGHT">Pro Nacht</option>
        </select>

        <input
          required
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          disabled={!propertyId || busy}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60 disabled:bg-slate-50 disabled:opacity-60"
          placeholder="Betrag in €"
          value={form.amount}
          onChange={(event) =>
            setForm((current) => ({ ...current, amount: event.target.value }))
          }
        />

        <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              Abbrechen
            </button>
          )}

          <button
            type="submit"
            disabled={busy || !propertyId}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 disabled:opacity-60"
          >
            {busy
              ? "Wird gespeichert …"
              : form.id
                ? "Aktualisieren"
                : "Hinzufügen"}
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        {!propertyId ? (
          <p className="text-sm text-slate-500">
            Bitte zuerst oben ein Objekt auswählen.
          </p>
        ) : loadingFees ? (
          <p className="text-sm text-slate-500">
            Nebenkosten werden geladen …
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Für dieses Objekt sind noch keine Nebenkosten hinterlegt.
          </p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 text-left">Name</th>
                <th className="text-left">Art</th>
                <th className="text-left">Betrag</th>
                <th className="w-40 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td>
                    {item.kind === "FIXED" ? "Einmalig" : "Pro Nacht"}
                  </td>
                  <td>{formatEuroFromCents(item.amount)}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 text-xs font-semibold text-sky-700 hover:text-sky-800"
                      onClick={() => editItem(item)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      onClick={() => askDelete(item)}
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Löschdialog */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-900">
              Nebenkosten-Eintrag löschen?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Eintrag: <span className="font-medium">{pendingDelete.name}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Betrag: {formatEuroFromCents(pendingDelete.amount)} · {" "}
              {pendingDelete.kind === "FIXED" ? "einmalig" : "pro Nacht"}
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {busy ? "Wird gelöscht …" : "Ja, löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}