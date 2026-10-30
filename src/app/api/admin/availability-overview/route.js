import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import { getOverviewWindow } from "@/lib/availability-overview";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.AVAILABILITY_VIEW, request);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status, headers });
    const params = new URL(request.url).searchParams;
    const window = getOverviewWindow(params.get("arrival"), params.get("departure"));
    if (!window) return Response.json({ error: "Bitte einen gültigen Aufenthalt mit höchstens 90 Nächten wählen." }, { status: 400, headers });
    const properties = await prisma.property.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true, slug: true, title: true, location: true, maxPersons: true, dogsAllowed: true,
        bookings: {
          where: { startDate: { lte: window.to }, endDate: { gte: window.from } },
          select: { startDate: true, endDate: true },
        },
      },
    });
    return Response.json({ properties }, { headers });
  } catch (error) {
    console.error("Availability overview failed", error);
    return Response.json({ error: "Verfügbarkeiten konnten nicht geladen werden. Bitte erneut versuchen." }, { status: 503, headers });
  }
}
