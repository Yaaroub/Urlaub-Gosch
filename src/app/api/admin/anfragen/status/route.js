import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import prisma from "@/lib/db";
import { logError } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

async function getSummary(model) {
  const [pendingCount, latest] = await Promise.all([
    model.count({ where: { status: "PENDING" } }),
    model.findFirst({ orderBy: { id: "desc" }, select: { id: true } }),
  ]);
  return { pendingCount, latestId: latest?.id ?? 0 };
}

export async function GET(request) {
  try {
    const access = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_VIEW, request);
    if (!access.ok) return Response.json({ error: access.error }, { status: access.status, headers });

    const [booking, contact] = await Promise.all([
      getSummary(prisma.bookingRequest),
      access.user.role === "SUPERADMIN" ? getSummary(prisma.contactRequest) : null,
    ]);
    return Response.json(contact ? { booking, contact } : { booking }, { headers });
  } catch (error) {
    logError("Admin inquiry status", error);
    return Response.json({ error: "Der Anfragestatus ist gerade nicht verfügbar." }, { status: 503, headers });
  }
}
