import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
import { isTrustedRequestOrigin } from "@/lib/auth";
import { readInquiryJson } from "@/lib/public-inquiry";
import { validateCalendarUrl } from "@/lib/safe-calendar-fetch";
import { logError } from "@/lib/safe-log";

const NO_STORE = { "Cache-Control": "private, no-store" };

function reply(data, status = 200) {
  return Response.json(data, { status, headers: NO_STORE });
}

async function propertyId(params) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.ICAL_VIEW, request);
    if (!auth.ok) return reply({ error: auth.error }, auth.status);
    const id = await propertyId(params);
    if (!id) return reply({ error: "Ungültige Objekt-ID." }, 400);
    const canEdit = auth.user.role === "SUPERADMIN" || auth.user.permissions.includes(ADMIN_PERMISSIONS.ICAL_EDIT);
    const property = await prisma.property.findUnique({
      where: { id },
      select: { slug: true, title: true, icalUpdatedAt: true, icalLastRunAt: true, icalUrl: canEdit },
    });
    if (!property) return reply({ error: "Objekt wurde nicht gefunden." }, 404);
    const { icalUrl, ...details } = property;
    return reply({ ...details, canEdit, ...(canEdit && { icalUrl }) });
  } catch (error) {
    logError("iCal-Quelle konnte nicht geladen werden", error);
    return reply({ error: "Kalendereinstellungen konnten nicht geladen werden." }, 500);
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isTrustedRequestOrigin(request)) return reply({ error: "Ungültige Anfrage." }, 403);
    const auth = await requireAdminPermission(ADMIN_PERMISSIONS.ICAL_EDIT, request);
    if (!auth.ok) return reply({ error: auth.error }, auth.status);
    const id = await propertyId(params);
    if (!id) return reply({ error: "Ungültige Objekt-ID." }, 400);
    let icalUrl;
    try {
      const body = await readInquiryJson(request);
      if (body?.icalUrl === null) icalUrl = null;
      else if (typeof body?.icalUrl === "string" && body.icalUrl.length <= 4096) {
        icalUrl = validateCalendarUrl(body.icalUrl.trim()).href;
      } else {
        return reply({ error: "Ungültige Kalenderadresse." }, 400);
      }
    } catch {
      return reply({ error: "Bitte eine gültige öffentliche HTTPS-Kalenderadresse eintragen." }, 400);
    }

    const result = await prisma.property.updateMany({ where: { id }, data: { icalUrl } });
    if (!result.count) return reply({ error: "Objekt wurde nicht gefunden." }, 404);
    return reply({ ok: true });
  } catch (error) {
    logError("iCal-Quelle konnte nicht gespeichert werden", error);
    return reply({ error: "Kalenderadresse konnte nicht gespeichert werden." }, 500);
  }
}
