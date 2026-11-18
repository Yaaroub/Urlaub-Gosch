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
  retentionCutoff,
} from "@/lib/booking-requests-admin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function deny(auth) {
  return Response.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
}

/**
 * GET /api/admin/anfragen?status=PENDING&q=&page=1
 * Booking requests incl. contact data. Requires AVAILABILITY_VIEW (the same
 * right that shows guest names in the occupancy calendar).
 */
export async function GET(req) {
  const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_VIEW, req);
  if (!auth.ok) return deny(auth);

  try {
    const query = parseListQuery(new URL(req.url).searchParams);
    const where = buildListWhere(query);
    const cutoff = retentionCutoff(DEFAULT_RETENTION_MONTHS);

    const [items, total, grouped, olderThanRetention] = await Promise.all([
      prisma.bookingRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          guestName: true,
          guestEmail: true,
          message: true,
          status: true,
          property: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.bookingRequest.count({ where }),
      prisma.bookingRequest.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.bookingRequest.count({ where: { createdAt: { lt: cutoff } } }),
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
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    logError("GET /api/admin/anfragen failed:", error);
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
    const result = await prisma.bookingRequest.deleteMany({ where });
    return Response.json({ ok: true, deleted: result.count }, { headers: NO_STORE });
  } catch (error) {
    logError("DELETE /api/admin/anfragen failed:", error);
    return Response.json({ error: "Anfragen konnten nicht gelöscht werden." }, { status: 500, headers: NO_STORE });
  }
}
