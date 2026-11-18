import prisma from "@/lib/db";

import {
  clearSessionCookie,
} from "@/lib/auth";

import {
  getSuperAdmin,
  STAFF_ROLES,
} from "@/lib/admin-auth";

export async function POST(
  request,
  context
) {
  const currentUser =
    await getSuperAdmin(
      request
    );

  if (!currentUser) {
    return Response.json(
      {
        error:
          "Keine Berechtigung.",
      },
      {
        status: 403,
      }
    );
  }

  const params =
    await context.params;

  const id =
    Number(params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json(
      {
        error:
          "Ungültige Benutzer-ID.",
      },
      {
        status: 400,
      }
    );
  }

  const updated = await prisma.user.updateMany({
    where: { id, role: { in: STAFF_ROLES } },
    data: { sessionVersion: { increment: 1 } },
  });
  if (updated.count !== 1) {
    return Response.json(
      {
        error:
          "Mitarbeiter wurde nicht gefunden.",
      },
      {
        status: 404,
      }
    );
  }

  const isSelf =
    id === currentUser.id;

  if (isSelf) {
    return Response.json(
      {
        success: true,
        loggedOut: true,
      },
      {
        headers: {
          "Set-Cookie":
            clearSessionCookie(),

          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  return Response.json({
    success: true,
    loggedOut: false,
  });
}
