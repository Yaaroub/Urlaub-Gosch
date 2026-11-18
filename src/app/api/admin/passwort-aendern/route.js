import bcrypt from "bcrypt";

import prisma from "@/lib/db";

import {
  createSession,
  getCurrentSessionAndUser,
  isStaffRole,
  sessionCookie,
} from "@/lib/auth";

import { logError } from "@/lib/safe-log";

export async function POST(req) {
  try {
    const current = await getCurrentSessionAndUser(req);
    const currentUser = current?.user;

    if (!currentUser || !isStaffRole(currentUser.role)) {
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

    const body = await req.json().catch(() => null);

    const password = typeof body?.password === "string" ? body.password : "";

    if (
      password.length < 10 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return Response.json(
        {
          error:
            "Das neue Passwort muss mindestens 10 und höchstens 72 Zeichen lang sein.",
        },
        {
          status: 400,
        }
      );
    }

    const where = {
      id: currentUser.id,
      role: currentUser.role,
      isActive: true,
      sessionVersion: current.session.sessionVersion,
      mustChangePassword: true,
    };

    const user =
      await prisma.user.findUnique({
        where,
        select: {
          password: true,
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
        where,

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
          role: true,
          sessionVersion: true,
          sessionTimeoutMinutes: true,
        },
      });

    /*
     * Weil sessionVersion erhöht wurde,
     * braucht DIESE aktuelle Sitzung
     * sofort ein neues Token.
     */
    const token =
      await createSession(
        updated, { authTime: current.session.authTime }
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
    if (error?.code === "P2025") return Response.json({ error: "Bitte erneut anmelden." }, { status: 401 });
    logError("POST /api/admin/passwort-aendern failed:", error);

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
