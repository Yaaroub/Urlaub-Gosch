import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import { logError } from "@/lib/safe-log";
import { REQUEST_STATUSES } from "@/lib/booking-requests-admin";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function guard(req, context) {
  const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_EDIT, req);
  if (!auth.ok) return { response: Response.json({ error: auth.error }, { status: auth.status, headers: NO_STORE }) };
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { response: Response.json({ error: "Ungültige ID." }, { status: 400, headers: NO_STORE }) };
  }
  return { id };
}

/** PATCH { status: "PENDING" | "APPROVED" | "DECLINED" } */
export async function PATCH(req, context) {
  const { id, response } = await guard(req, context);
  if (response) return response;

  const body = await req.json().catch(() => null);
  if (!REQUEST_STATUSES.includes(body?.status)) {
    return Response.json({ error: "Ungültiger Status." }, { status: 400, headers: NO_STORE });
  }

  try {
    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, status: true },
    });
    return Response.json(updated, { headers: NO_STORE });
  } catch (error) {
    if (error?.code === "P2025") return Response.json({ error: "Anfrage nicht gefunden." }, { status: 404, headers: NO_STORE });
    logError("PATCH /api/admin/anfragen/[id] failed:", error);
    return Response.json({ error: "Status konnte nicht gespeichert werden." }, { status: 500, headers: NO_STORE });
  }
}

/** DELETE – removes one request permanently (e.g. on the guest's request, Art. 17 GDPR). */
export async function DELETE(req, context) {
  const { id, response } = await guard(req, context);
  if (response) return response;

  try {
    await prisma.bookingRequest.delete({ where: { id } });
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    if (error?.code === "P2025") return Response.json({ error: "Anfrage nicht gefunden." }, { status: 404, headers: NO_STORE });
    logError("DELETE /api/admin/anfragen/[id] failed:", error);
    return Response.json({ error: "Anfrage konnte nicht gelöscht werden." }, { status: 500, headers: NO_STORE });
  }
}
