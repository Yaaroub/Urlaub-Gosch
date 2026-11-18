import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import { logError } from "@/lib/safe-log";
import {
  DEFAULT_RETENTION_MONTHS,
  PAGE_SIZE,
  REQUEST_STATUSES,
  buildListWhere,
  parseIds,
  parseListQuery,
  requestKind,
  retentionCutoff,
} from "@/lib/booking-requests-admin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function deny(auth) {
  return Response.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
}

/**
 * POST /api/admin/anfragen  { status: "PENDING", q: "", page: 1 }
 * Booking requests incl. contact data. Requires AVAILABILITY_VIEW (the same
 * right that shows guest names in the occupancy calendar).
 *
 * POST on purpose: the search term (often a guest's name or e-mail) travels in
 * the request body and therefore never appears in URLs or access logs.
 */
export async function POST(req) {
  const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_VIEW, req);
  if (!auth.ok) return deny(auth);
  const kind = requestKind(req.url);
  if (!kind) return deny({ status: 400, error: "Ungültige Anfrageart." });
  const canViewContact = auth.user.role === "SUPERADMIN";
  if (kind === "contact" && !canViewContact) {
    return deny({ status: 403, error: "Kontaktanfragen sind nur für Superadmins sichtbar." });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const params = new URLSearchParams();
    for (const key of ["status", "q", "page"]) {
      if (body && (typeof body[key] === "string" || typeof body[key] === "number")) params.set(key, String(body[key]));
    }
    const query = parseListQuery(params);
    const where = buildListWhere(query, kind);
    const cutoff = retentionCutoff(DEFAULT_RETENTION_MONTHS);
    const model = kind === "contact" ? prisma.contactRequest : prisma.bookingRequest;
    const details = kind === "contact"
      ? { phone: true, subject: true, isLandlordProspect: true }
      : { startDate: true, endDate: true, property: { select: { id: true, title: true, slug: true } } };

    const [items, total, grouped, olderThanRetention] = await Promise.all([
      model.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          createdAt: true,
          guestName: true,
          guestEmail: true,
          message: true,
          status: true,
          ...details,
        },
      }),
      model.count({ where }),
      model.groupBy({ by: ["status"], _count: { _all: true } }),
      model.count({ where: { createdAt: { lt: cutoff } } }),
    ]);

    const counts = Object.fromEntries(REQUEST_STATUSES.map((s) => [s, 0]));
    for (const row of grouped) counts[row.status] = row._count._all;

    const canEdit =
      auth.user.role === "SUPERADMIN" ||
      auth.user.permissions.includes(ADMIN_PERMISSIONS.AVAILABILITY_EDIT);

    return Response.json(
      {
        items,
        total,
        page: query.page,
        pageSize: PAGE_SIZE,
        counts,
        retention: { months: DEFAULT_RETENTION_MONTHS, olderCount: olderThanRetention },
        canEdit,
        canViewContact,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    logError("POST /api/admin/anfragen failed:", error);
    return Response.json({ error: "Anfragen konnten nicht geladen werden." }, { status: 500, headers: NO_STORE });
  }
}

/**
 * DELETE /api/admin/anfragen
 * Body { ids: [1, 2] }  -> deletes these requests
 * Body { olderThanMonths: 12 } -> deletes all requests created before the cut-off (min. 6 months)
 * Requires AVAILABILITY_EDIT. Deletion is permanent.
 */
export async function DELETE(req) {
  const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_EDIT, req);
  if (!auth.ok) return deny(auth);
  const kind = requestKind(req.url);
  if (!kind) return deny({ status: 400, error: "Ungültige Anfrageart." });
  if (kind === "contact" && auth.user.role !== "SUPERADMIN") {
    return deny({ status: 403, error: "Kontaktanfragen sind nur für Superadmins sichtbar." });
  }

  const body = await req.json().catch(() => null);
  let where = null;

  if (body && body.ids !== undefined) {
    const ids = parseIds(body.ids);
    if (!ids) return Response.json({ error: "Ungültige Auswahl." }, { status: 400, headers: NO_STORE });
    where = { id: { in: ids } };
  } else if (body && body.olderThanMonths !== undefined) {
    const cutoff = retentionCutoff(body.olderThanMonths);
    if (!cutoff) {
      return Response.json(
        { error: "Ungültige Frist. Erlaubt sind 6 bis 120 Monate." },
        { status: 400, headers: NO_STORE }
      );
    }
    where = { createdAt: { lt: cutoff } };
  } else {
    return Response.json({ error: "Keine Auswahl angegeben." }, { status: 400, headers: NO_STORE });
  }

  try {
    const model = kind === "contact" ? prisma.contactRequest : prisma.bookingRequest;
    const result = await model.deleteMany({ where });
    return Response.json({ ok: true, deleted: result.count }, { headers: NO_STORE });
  } catch (error) {
    logError("DELETE /api/admin/anfragen failed:", error);
    return Response.json({ error: "Anfragen konnten nicht gelöscht werden." }, { status: 500, headers: NO_STORE });
  }
}
