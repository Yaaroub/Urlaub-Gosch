"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  Mail,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { splitRequestMessage } from "@/lib/booking-requests-admin";

const TABS = [
  ["ALL", "Alle"],
  ["PENDING", "Offen"],
  ["APPROVED", "Angenommen"],
  ["DECLINED", "Abgelehnt"],
];

const STATUS_LABEL = { PENDING: "Offen", APPROVED: "Angenommen", DECLINED: "Abgelehnt" };
const STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  DECLINED: "bg-slate-100 text-slate-600 ring-slate-200",
};

const dateTime = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" });
const dateOnly = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export default function AdminRequestsPage() {
  const [status, setStatus] = useState("PENDING");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [message, setMessage] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        // Search term goes in the body, never in the URL (keeps guest names out of access logs).
        const response = await fetch("/api/admin/anfragen", {
          method: "POST",
          cache: "no-store",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, page, q: appliedQuery }),
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!response.ok) throw new Error(result.error || "Anfragen konnten nicht geladen werden.");
        setData(result);
        setSelected(new Set());
      } catch (error) {
        if (!signal?.aborted) setMessage({ error: true, text: error.message });
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [status, page, appliedQuery]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const canEdit = Boolean(data?.canEdit);
  const items = useMemo(() => data?.items || [], [data]);
  const allOnPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));

  async function run(request, successText) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await request();
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Aktion fehlgeschlagen.");
      setMessage({ text: typeof successText === "function" ? successText(result) : successText });
      await load();
    } catch (error) {
      setMessage({ error: true, text: error.message });
    } finally {
      setBusy(false);
    }
  }

  function setRequestStatus(id, next) {
    run(
      () =>
        fetch(`/api/admin/anfragen/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }),
      `Status auf „${STATUS_LABEL[next]}“ gesetzt.`
    );
  }

  function deleteOne(item) {
    if (!window.confirm(`Anfrage von ${item.guestName || "unbekannt"} endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    run(() => fetch(`/api/admin/anfragen/${item.id}`, { method: "DELETE" }), "Anfrage gelöscht.");
  }

  function deleteSelected() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!window.confirm(`${ids.length} ${ids.length === 1 ? "Anfrage" : "Anfragen"} endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    run(
      () =>
        fetch("/api/admin/anfragen", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        }),
      (result) => `${result.deleted} ${result.deleted === 1 ? "Anfrage" : "Anfragen"} gelöscht.`
    );
  }

  function deleteOld() {
    const months = data?.retention?.months || 12;
    const count = data?.retention?.olderCount || 0;
    if (!count) return;
    if (!window.confirm(`Alle ${count} Anfragen, die älter als ${months} Monate sind, endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    run(
      () =>
        fetch("/api/admin/anfragen", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ olderThanMonths: months }),
        }),
      (result) => `${result.deleted} alte ${result.deleted === 1 ? "Anfrage" : "Anfragen"} gelöscht.`
    );
  }

  function toggle(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allOnPageSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Admin-Übersicht
      </Link>

      <header className="mb-6 mt-3 border-b border-slate-200 pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950">
          <Inbox className="h-6 w-6 text-teal-800" aria-hidden="true" /> Buchungsanfragen
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Unverbindliche Anfragen aus dem Formular der Objektseiten. Die Daten enthalten Namen, E-Mail-Adressen und Nachrichten
          von Gästen. Bitte nur so lange aufbewahren wie nötig und auf Wunsch des Gastes löschen.
        </p>
      </header>

      {data?.retention?.olderCount > 0 && canEdit ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            <strong>{data.retention.olderCount}</strong> {data.retention.olderCount === 1 ? "Anfrage ist" : "Anfragen sind"} älter als{" "}
            {data.retention.months} Monate und {data.retention.olderCount === 1 ? "sollte" : "sollten"} gelöscht werden.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={deleteOld}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-800 px-4 font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Alte Anfragen löschen
          </button>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Status">
        {TABS.map(([value, label]) => {
          const count = value === "ALL"
            ? Object.values(data?.counts || {}).reduce((a, b) => a + b, 0)
            : data?.counts?.[value] ?? 0;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={[
                "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition",
                status === value ? "bg-teal-800 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-teal-700",
              ].join(" ")}
            >
              {label}
              <span className="rounded bg-black/10 px-1.5 text-xs tabular-nums">{count}</span>
            </button>
          );
        })}

        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedQuery(query.trim());
            setPage(1);
          }}
        >
          <label className="relative">
            <span className="sr-only">Anfragen durchsuchen</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              maxLength={100}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, E-Mail, Objekt …"
              className="min-h-10 w-56 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
          <button type="submit" className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-teal-700">
            Suchen
          </button>
        </form>
      </div>

      {message ? (
        <p role="status" className={`mb-4 rounded-lg p-3 text-sm ${message.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>
          {message.text}
        </p>
      ) : null}

      {canEdit && items.length > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} className="h-4 w-4 rounded border-slate-300" />
            Alle auf dieser Seite auswählen
          </label>
          {selected.size > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={deleteSelected}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> {selected.size} ausgewählte löschen
            </button>
          ) : null}
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-slate-500">Lädt …</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Keine Anfragen in dieser Ansicht.
        </p>
      ) : (
        <ul className="space-y-3" aria-busy={loading}>
          {items.map((item) => (
            <RequestItem
              key={item.id}
              item={item}
              canEdit={canEdit}
              busy={busy}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
              onStatus={(next) => setRequestStatus(item.id, next)}
              onDelete={() => deleteOne(item)}
            />
          ))}
        </ul>
      )}

      {data && totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Seiten">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Zurück
          </button>
          <span className="tabular-nums text-slate-600">
            Seite {page} von {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 disabled:opacity-40"
          >
            Weiter <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function RequestItem({ item, canEdit, busy, selected, onToggle, onStatus, onDelete }) {
  const { phone, details, text } = splitRequestMessage(item.message);
  const nights = Math.round((new Date(item.endDate) - new Date(item.startDate)) / 86400000);

  return (
    <li className={`rounded-xl border bg-white p-5 ${selected ? "border-teal-600 ring-1 ring-teal-600" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start gap-4">
        {canEdit ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Anfrage von ${item.guestName || "unbekannt"} auswählen`}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-950">{item.guestName || "Ohne Namen"}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
            <span className="text-xs text-slate-500">eingegangen {dateTime.format(new Date(item.createdAt))}</span>
          </div>

          <p className="mt-1 text-sm text-slate-700">
            {item.property ? (
              <a href={`/properties/${item.property.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-800 hover:underline">
                {item.property.title} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              "Objekt gelöscht"
            )}
            {" · "}
            {dateOnly.format(new Date(item.startDate))} – {dateOnly.format(new Date(item.endDate))} ({nights} {nights === 1 ? "Nacht" : "Nächte"})
          </p>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {item.guestEmail ? (
              <a href={`mailto:${item.guestEmail}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-teal-800">
                <Mail className="h-4 w-4" aria-hidden="true" /> {item.guestEmail}
              </a>
            ) : null}
            {phone ? (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-teal-800">
                <Phone className="h-4 w-4" aria-hidden="true" /> {phone}
              </a>
            ) : null}
          </div>

          {details.length ? (
            <dl className="mt-3 grid gap-x-5 gap-y-1 text-sm sm:grid-cols-2">
              {details.map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-slate-500">{label}:</dt>
                  <dd className="text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {text ? <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{text}</p> : null}
        </div>
      </div>

      {canEdit ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {item.status !== "APPROVED" ? (
            <button type="button" disabled={busy} onClick={() => onStatus("APPROVED")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-teal-800 px-3 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50">
              <Check className="h-4 w-4" aria-hidden="true" /> Angenommen
            </button>
          ) : null}
          {item.status !== "DECLINED" ? (
            <button type="button" disabled={busy} onClick={() => onStatus("DECLINED")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50">
              <X className="h-4 w-4" aria-hidden="true" /> Abgelehnt
            </button>
          ) : null}
          {item.status !== "PENDING" ? (
            <button type="button" disabled={busy} onClick={() => onStatus("PENDING")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Wieder offen
            </button>
          ) : null}
          <button type="button" disabled={busy} onClick={onDelete}
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Löschen
          </button>
        </div>
      ) : null}
    </li>
  );
}
