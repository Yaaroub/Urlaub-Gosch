import bcrypt from "bcrypt";

import prisma from "@/lib/db";

import {
  createSession,
  sessionCookie,
} from "@/lib/auth";

import {
  getAdminUser,
} from "@/lib/admin-auth";

export async function POST(req) {
  try {
    const currentUser =
      await getAdminUser(
        req
      );

    if (!currentUser) {
      return Response.json(
        {
          error:
            "Nicht angemeldet.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      !currentUser.mustChangePassword
    ) {
      return Response.json(
        {
          error:
            "Für dieses Konto ist aktuell kein Passwortwechsel erforderlich.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json();

    const password =
      String(
        body?.password || ""
      );

    if (
      password.length < 10
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

    const user =
      await prisma.user.findUnique({
        where: {
          id:
            currentUser.id,
        },

        select: {
          id: true,
          email: true,
          password: true,
          sessionVersion: true,
        },
      });

    if (!user) {
      return Response.json(
        {
          error:
            "Benutzer wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    // Neues Passwort darf nicht
    // identisch zum bisherigen sein.
    const samePassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (samePassword) {
      return Response.json(
        {
          error:
            "Das neue Passwort darf nicht mit dem bisherigen Passwort identisch sein.",
        },
        {
          status: 400,
        }
      );
    }

    const hash =
      await bcrypt.hash(
        password,
        12
      );

    /*
     * sessionVersion + 1:
     * Alle bisherigen Sessions dieses
     * Kontos werden ungültig.
     */
    const updated =
      await prisma.user.update({
        where: {
          id:
            currentUser.id,
        },

        data: {
          password:
            hash,

          mustChangePassword:
            false,

          passwordChangedAt:
            new Date(),

          sessionVersion: {
            increment: 1,
          },
        },

        select: {
          id: true,
          email: true,

          sessionVersion: true,
        },
      });

    /*
     * Weil sessionVersion erhöht wurde,
     * braucht DIESE aktuelle Sitzung
     * sofort ein neues Token.
     */
    const token =
      await createSession(
        updated
      );

    return Response.json(
      {
        ok: true,
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
  } catch (error) {
    console.error(
      "POST /api/admin/passwort-aendern failed:",
      error
    );

    return Response.json(
      {
        error:
          "Passwort konnte nicht geändert werden.",
      },
      {
        status: 500,
      }
    );
  }
}