import bcrypt from "bcrypt";
import prisma from "@/lib/db";

import {
  createSession,
  sessionCookie,
} from "@/lib/auth";

const ADMIN_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(body?.password || "");

    if (!email || !password) {
      return Response.json(
        {
          error: "Bitte E-Mail und Passwort eingeben.",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // Gleiche Fehlermeldung, damit nicht verraten wird,
    // ob eine E-Mail existiert.
    if (!user) {
      return Response.json(
        {
          error: "E-Mail oder Passwort ist nicht korrekt.",
        },
        {
          status: 401,
        }
      );
    }

    if (!user.isActive) {
      return Response.json(
        {
          error: "Dieses Konto ist gesperrt.",
        },
        {
          status: 403,
        }
      );
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      return Response.json(
        {
          error: "Für dieses Konto besteht kein Admin-Zugriff.",
        },
        {
          status: 403,
        }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return Response.json(
        {
          error: "E-Mail oder Passwort ist nicht korrekt.",
        },
        {
          status: 401,
        }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = await createSession(updatedUser);

    return Response.json(
      {
        success: true,

        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      },
      {
        headers: {
          "Set-Cookie": sessionCookie(token),
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return Response.json(
      {
        error: "Anmeldung konnte nicht durchgeführt werden.",
      },
      {
        status: 500,
      }
    );
  }
}