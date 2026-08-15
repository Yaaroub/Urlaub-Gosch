import prisma from "@/lib/db";

import {
  clearSessionCookie,
} from "@/lib/auth";

import {
  getSuperAdmin,
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

  if (
    !id ||
    Number.isNaN(id)
  ) {
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

  const target =
    await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!target) {
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

  await prisma.user.update({
    where: {
      id,
    },

    data: {
      sessionVersion: {
        increment: 1,
      },
    },
  });

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