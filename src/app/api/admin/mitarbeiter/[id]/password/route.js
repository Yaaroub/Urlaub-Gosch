import bcrypt from "bcrypt";
import crypto from "crypto";

import prisma from "@/lib/db";

import {
  createSession,
  sessionCookie,
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

  let body = {};

  try {
    body =
      await request.json();
  } catch {
    body = {};
  }

  const isSelf =
    id === currentUser.id;

  let newPassword =
    String(
      body?.newPassword || ""
    );

  let generatedPassword =
    null;

  // ------------------------------------------------------------
  // Eigenes Passwort:
  // aktuelles Passwort erforderlich
  // ------------------------------------------------------------

  if (isSelf) {
    const currentPassword =
      String(
        body?.currentPassword ||
          ""
      );

    if (!currentPassword) {
      return Response.json(
        {
          error:
            "Bitte dein aktuelles Passwort eingeben.",
        },
        {
          status: 400,
        }
      );
    }

    const valid =
      await bcrypt.compare(
        currentPassword,
        target.password
      );

    if (!valid) {
      return Response.json(
        {
          error:
            "Das aktuelle Passwort ist nicht korrekt.",
        },
        {
          status: 400,
        }
      );
    }

    if (!newPassword) {
      return Response.json(
        {
          error:
            "Bitte ein neues Passwort eingeben.",
        },
        {
          status: 400,
        }
      );
    }
  }

  // ------------------------------------------------------------
  // Fremdes Konto:
  // Passwort kann automatisch generiert werden.
  // ------------------------------------------------------------

  if (
    !isSelf &&
    !newPassword
  ) {
    generatedPassword =
      crypto
        .randomBytes(15)
        .toString(
          "base64url"
        );

    newPassword =
      generatedPassword;
  }

  if (
    newPassword.length < 10
  ) {
    return Response.json(
      {
        error:
          "Das neue Passwort muss mindestens 10 Zeichen lang sein.",
      },
      {
        status: 400,
      }
    );
  }

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    );

  const updated =
    await prisma.user.update({
      where: {
        id,
      },

      data: {
        password:
          passwordHash,

        passwordChangedAt:
          new Date(),

        mustChangePassword:
          isSelf
            ? false
            : body?.mustChangePassword ??
              true,

        sessionVersion: {
          increment: 1,
        },
      },

      select: {
        id: true,
        name: true,
        email: true,

        role: true,
        isActive: true,

        sessionVersion:
          true,

        sessionTimeoutMinutes:
          true,

        mustChangePassword:
          true,

        passwordChangedAt:
          true,
      },
    });

  // Eigenes Passwort:
  // aktuellen Browser wieder anmelden,
  // andere Sessions bleiben ungültig.
  if (isSelf) {
    const token =
      await createSession(
        updated
      );

    return Response.json(
      {
        success: true,
        self: true,
      },
      {
        headers: {
          "Set-Cookie":
            sessionCookie(
              token
            ),

          "Cache-Control":
            "no-store",
        },
      }
    );
  }

  return Response.json(
    {
      success: true,

      generatedPassword,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}