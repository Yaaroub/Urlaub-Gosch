import bcrypt from "bcrypt";

import prisma from "@/lib/db";

import {
  createSession,
  sessionCookie,
} from "@/lib/auth";

const STAFF_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

export async function POST(req) {
  try {
    const body =
      await req.json();

    const email =
      String(
        body?.email || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body?.password || ""
      );

    if (
      !email ||
      !password
    ) {
      return Response.json(
        {
          error:
            "E-Mail und Passwort sind erforderlich.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          email: true,
          name: true,
          password: true,

          role: true,
          isActive: true,

          sessionVersion: true,
          sessionTimeoutMinutes: true,
          mustChangePassword: true,
        },
      });

    if (
      !user ||
      !STAFF_ROLES.includes(
        user.role
      )
    ) {
      return Response.json(
        {
          error:
            "E-Mail oder Passwort ist falsch.",
        },
        {
          status: 401,
        }
      );
    }

    if (!user.isActive) {
      return Response.json(
        {
          error:
            "Dieses Mitarbeiterkonto ist gesperrt.",
        },
        {
          status: 403,
        }
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return Response.json(
        {
          error:
            "E-Mail oder Passwort ist falsch.",
        },
        {
          status: 401,
        }
      );
    }

    const updated =
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          lastLoginAt:
            new Date(),
        },

        select: {
          id: true,
          email: true,
          name: true,

          role: true,
          isActive: true,

          sessionVersion: true,
          sessionTimeoutMinutes: true,
          mustChangePassword: true,
        },
      });

    const token =
      await createSession(
        updated
      );

    return Response.json(
      {
        ok: true,

        user: {
          id:
            updated.id,

          email:
            updated.email,

          name:
            updated.name,

          role:
            updated.role,
        },

        mustChangePassword:
          updated.mustChangePassword,

        sessionTimeoutMinutes:
          updated.sessionTimeoutMinutes,
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
      "POST /api/admin/login failed:",
      error
    );

    return Response.json(
      {
        error:
          "Anmeldung konnte nicht durchgeführt werden.",
      },
      {
        status: 500,
      }
    );
  }
}