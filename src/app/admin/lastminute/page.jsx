"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Euro,
  PencilLine,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";

function toISO(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 10);
}

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value) || 0);
}

function getDiscountType(offer) {
  return offer?.discountType === "FIXED"
    ? "FIXED"
    : "PERCENT";
}

function getDiscountLabel(offer) {
  if (getDiscountType(offer) === "FIXED") {
    return `${formatEuro(offer?.discountAmount)} / Nacht`;
  }

  return `-${Number(offer?.discount) || 0} %`;
}

const inputClass =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

export default function AdminLastMinutePage() {
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [items, setItems] = useState([]);

  const [loadingProperties, setLoadingProperties] =
    useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState(null);
  const [pendingDelete, setPendingDelete] =
    useState(null);

  const [form, setForm] = useState({
    id: null,
    startDate: "",
    endDate: "",
    discountType: "PERCENT",
    discount: "",
    discountAmount: "",
    note: "",
  });

  const editing = useMemo(
    () => form.id !== null,
    [form.id]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(
      window.location.search
    );

    const propertyIdFromUrl =
      searchParams.get("propertyId");

    if (propertyIdFromUrl) {
      setPropertyId(propertyIdFromUrl);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setLoadingProperties(true);

      try {
        const response = await fetch(
          "/api/admin/properties",
          { cache: "no-store" }
        );

        if (response.status === 401) {
          window.location.href = "/admin";
          return;
        }

        const data = await response
          .json()
          .catch(() => []);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Unterkünfte konnten nicht geladen werden."
          );
        }

        if (!cancelled) {
          const sorted = Array.isArray(data)
            ? [...data].sort((a, b) =>
                String(a.title || "").localeCompare(
                  String(b.title || ""),
                  "de",
                  { sensitivity: "base" }
                )
              )
            : [];

          setProperties(sorted);
        }
      } catch (error) {
        if (!cancelled) {
          setProperties([]);
          setMsg({
            t: "error",
            m:
              error?.message ||
              "Unterkünfte konnten nicht geladen werden.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingProperties(false);
        }
      }
    }

    loadProperties();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    resetForm();
    setPendingDelete(null);

    if (!propertyId) {
      setItems([]);
      setMsg(null);
      return;
    }

    loadList(propertyId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  async function loadList(pid = propertyId) {
    if (!pid) return;

    setLoading(true);
    setMsg(null);

    try {
      const response = await fetch(
        `/api/admin/lastminute?propertyId=${encodeURIComponent(
          pid
        )}`,
        { cache: "no-store" }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response
        .json()
        .catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Angebotsliste konnte nicht geladen werden."
        );
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setItems([]);

      setMsg({
        t: "error",
        m:
          error?.message ||
          "Angebotsliste konnte nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      id: null,
      startDate: "",
      endDate: "",
      discountType: "PERCENT",
      discount: "",
      discountAmount: "",
      note: "",
    });
  }

  function handlePropertyChange(event) {
    const nextPropertyId = event.target.value;

    setPropertyId(nextPropertyId);
    setItems([]);
    resetForm();
    setPendingDelete(null);
    setMsg(null);

    const url = new URL(window.location.href);

    if (nextPropertyId) {
      url.searchParams.set(
        "propertyId",
        nextPropertyId
      );
    } else {
      url.searchParams.delete("propertyId");
    }

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }

  function changeDiscountType(discountType) {
    setForm((current) => ({
      ...current,
      discountType,
      discount:
        discountType === "PERCENT"
          ? current.discount
          : "",
      discountAmount:
        discountType === "FIXED"
          ? current.discountAmount
          : "",
    }));
  }

  function editRow(offer) {
    const discountType = getDiscountType(offer);

    setForm({
      id: offer.id,
      startDate: toISO(offer.startDate),
      endDate: toISO(offer.endDate),
      discountType,
      discount:
        discountType === "PERCENT"
          ? String(offer.discount ?? "")
          : "",
      discountAmount:
        discountType === "FIXED"
          ? String(offer.discountAmount ?? "")
          : "",
      note: offer.note || "",
    });

    setMsg(null);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

    if (!form.startDate || !form.endDate) {
      setMsg({
        t: "error",
        m: "Start- und Enddatum sind erforderlich.",
      });
      return;
    }

    if (form.endDate <= form.startDate) {
      setMsg({
        t: "error",
        m: "Ende muss nach Start liegen.",
      });
      return;
    }

    const payload = {
      propertyId: Number(propertyId),
      startDate: form.startDate,
      endDate: form.endDate,
      discountType: form.discountType,
      note: form.note.trim() || undefined,
      ...(editing ? { id: form.id } : {}),
    };

    if (form.discountType === "PERCENT") {
      const discount = Number(form.discount);

      if (
        !Number.isFinite(discount) ||
        !Number.isInteger(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        setMsg({
          t: "error",
          m:
            "Der Prozent-Rabatt muss eine ganze Zahl zwischen 0 und 100 sein.",
        });
        return;
      }

      payload.discount = discount;
    } else {
      const discountAmount = Number(
        form.discountAmount
      );

      if (
        !Number.isFinite(discountAmount) ||
        discountAmount < 0
      ) {
        setMsg({
          t: "error",
          m:
            "Bitte einen gültigen festen Rabattbetrag eingeben.",
        });
        return;
      }

      payload.discountAmount =
        Math.round(discountAmount * 100) / 100;
    }

    setBusy(true);

    try {
      const response = await fetch(
        "/api/admin/lastminute",
        {
          method: editing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            "Angebot konnte nicht gespeichert werden.",
        });
        return;
      }

      const wasEditing = editing;

      setItems(
        Array.isArray(data) ? data : []
      );

      resetForm();

      setMsg({
        t: "ok",
        m: wasEditing
          ? "Last-Minute-Angebot wurde aktualisiert."
          : "Last-Minute-Angebot wurde angelegt.",
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

  function askRemove(offer) {
    setMsg(null);
    setPendingDelete(offer);
  }

  async function confirmRemove() {
    if (!pendingDelete) return;

    setBusy(true);

    try {
      const response = await fetch(
        `/api/admin/lastminute/${encodeURIComponent(
          pendingDelete.id
        )}`,
        { method: "DELETE" }
      );

      if (response.status === 401) {
        window.location.href = "/admin";
        return;
      }

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setMsg({
          t: "error",
          m:
            data?.error ||
            "Löschen fehlgeschlagen.",
        });
        return;
      }

      setItems(
        Array.isArray(data) ? data : []
      );

      setPendingDelete(null);

      setMsg({
        t: "ok",
        m: "Last-Minute-Angebot wurde gelöscht.",
      });
    } catch {
      setMsg({
        t: "error",
        m: "Netzwerkfehler beim Löschen.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4 py-8 md:py-10">
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

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Admin · Last Minute
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Last-Minute-Angebote
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Reduziere den hinterlegten Originalpreis wahlweise
            prozentual oder um einen festen Euro-Betrag pro Nacht.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700">
            Objekt wählen
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className={inputClass}
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
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                loadList(propertyId)
              }
              disabled={
                !propertyId || loading
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Neu laden
            </button>
          </div>
        </div>
      </div>

      <form
        onSubmit={save}
        className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6"
      >
        <div className="mb-5">
          <span className="text-xs font-semibold text-slate-700">
            Art der Preisreduzierung
          </span>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                changeDiscountType(
                  "PERCENT"
                )
              }
              className={[
                "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                form.discountType ===
                "PERCENT"
                  ? "border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <BadgePercent className="h-5 w-5 shrink-0" />

              <span>
                <strong className="block text-sm">
                  Prozent-Rabatt
                </strong>
                <span className="text-xs opacity-70">
                  z. B. 20 % vom Originalpreis
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                changeDiscountType("FIXED")
              }
              className={[
                "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                form.discountType ===
                "FIXED"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <Euro className="h-5 w-5 shrink-0" />

              <span>
                <strong className="block text-sm">
                  Fester Betrag
                </strong>
                <span className="text-xs opacity-70">
                  z. B. 25 € weniger pro Nacht
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1">
            <span className="text-xs text-slate-500">
              Start *
            </span>
            <input
              type="date"
              className={inputClass}
              value={form.startDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate:
                    event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">
              Ende (exkl.) *
            </span>
            <input
              type="date"
              min={
                form.startDate ||
                undefined
              }
              className={inputClass}
              value={form.endDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate:
                    event.target.value,
                }))
              }
              required
            />
          </label>

          {form.discountType ===
          "PERCENT" ? (
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">
                Rabatt in % *
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  className={`${inputClass} w-full pr-10`}
                  value={form.discount}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        discount:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="20"
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  %
                </span>
              </div>
            </label>
          ) : (
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">
                Abzug pro Nacht *
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={`${inputClass} w-full pr-10`}
                  value={
                    form.discountAmount
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        discountAmount:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="25,00"
                  required
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  €
                </span>
              </div>
            </label>
          )}

          <label className="grid gap-1">
            <span className="text-xs text-slate-500">
              Hinweis (optional)
            </span>
            <input
              type="text"
              className={inputClass}
              placeholder="z. B. Nur noch wenige Tage!"
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={
              busy || !propertyId
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {editing
              ? "Änderungen speichern"
              : "Angebot anlegen"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="min-h-11 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Abbrechen
            </button>
          )}

          <p className="text-xs leading-5 text-slate-500">
            Enddatum ist exklusiv. Bei einem
            festen Betrag wird der normale
            Übernachtungspreis jeder
            betroffenen Nacht reduziert; der
            Preis fällt dabei nie unter 0 €.
          </p>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Last-Minute-Angebote
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Prozent- und Euro-Rabatte können
              gemeinsam verwaltet werden.
            </p>
          </div>

          {propertyId && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {items.length} Angebot
              {items.length === 1
                ? ""
                : "e"}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">
            Lade…
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Keine Last-Minute-Angebote
            vorhanden.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">
                    Start
                  </th>
                  <th className="font-medium">
                    Ende (exkl.)
                  </th>
                  <th className="font-medium">
                    Art
                  </th>
                  <th className="font-medium">
                    Reduzierung
                  </th>
                  <th className="font-medium">
                    Hinweis
                  </th>
                  <th className="w-48 text-right font-medium">
                    Aktionen
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((offer) => {
                  const type =
                    getDiscountType(
                      offer
                    );

                  return (
                    <tr
                      key={offer.id}
                      className="border-t border-slate-100"
                    >
                      <td className="py-3">
                        {toISO(
                          offer.startDate
                        )}
                      </td>

                      <td>
                        {toISO(
                          offer.endDate
                        )}
                      </td>

                      <td>
                        <span
                          className={[
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            type === "FIXED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-sky-50 text-sky-700",
                          ].join(" ")}
                        >
                          {type === "FIXED"
                            ? "Betrag"
                            : "Prozent"}
                        </span>
                      </td>

                      <td className="font-semibold text-slate-900">
                        {getDiscountLabel(
                          offer
                        )}
                      </td>

                      <td
                        className="max-w-[280px] truncate text-slate-600"
                        title={
                          offer.note || ""
                        }
                      >
                        {offer.note ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap text-right">
                        <button
                          type="button"
                          className="mr-2 inline-flex min-h-9 items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800 transition hover:bg-slate-200"
                          onClick={() =>
                            editRow(
                              offer
                            )
                          }
                        >
                          <PencilLine className="h-4 w-4" />
                          Bearbeiten
                        </button>

                        <button
                          type="button"
                          className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
                          onClick={() =>
                            askRemove(
                              offer
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          Löschen
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-900">
              Last-Minute-Angebot löschen?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Möchtest du dieses Angebot
              wirklich löschen? Die Aktion kann
              nicht rückgängig gemacht werden.
            </p>

            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <div>
                {toISO(
                  pendingDelete.startDate
                )}{" "}
                →{" "}
                {toISO(
                  pendingDelete.endDate
                )}
              </div>

              <div className="font-semibold text-slate-900">
                {getDiscountLabel(
                  pendingDelete
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setPendingDelete(null)
                }
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                disabled={busy}
                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}