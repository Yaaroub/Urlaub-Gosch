import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import { getKuschelwochenPeriods } from "@/lib/kuschelwochen-periods";
import { validateKuschelwochenPeriods } from "@/lib/kuschelwochen";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.PRICES_VIEW, request);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
    const periods = await getKuschelwochenPeriods();
    const canEdit = auth.user.role === "SUPERADMIN" || auth.user.permissions.includes(ADMIN_PERMISSIONS.PRICES_EDIT);
    return Response.json({ periods, canEdit }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Aktionszeiträume konnten nicht geladen werden. Bitte die Datenbankverbindung und die eingerichtete Kuschelwochen-Tabelle prüfen." }, { status: 503 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.PRICES_EDIT, request);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
    let periods;
    try {
      const body = await request.json();
      periods = validateKuschelwochenPeriods(body.periods);
    } catch (error) {
      return Response.json({ error: error.message || "Ungültige Aktionszeiträume." }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      await tx.kuschelwochenPeriod.deleteMany();
      if (periods.length) await tx.kuschelwochenPeriod.createMany({ data: periods });
    });
    revalidatePath("/properties/[slug]", "page");
    revalidatePath("/");
    return Response.json({ periods }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Die Zeiträume konnten nicht gespeichert werden. Bitte erneut versuchen." }, { status: 503 });
  }
}
