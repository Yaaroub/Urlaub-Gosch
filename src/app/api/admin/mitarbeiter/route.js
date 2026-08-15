import bcrypt from "bcrypt";
import crypto from "crypto";

import prisma from "@/lib/db";
import { getSuperAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];

function generatePassword() {
  return crypto.randomBytes(12).toString("base64url");
}

export async function GET(request) {
  const admin = await getSuperAdmin(request);

  if (!admin) {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const employees = await prisma.user.findMany({
    where: {
      role: {
        in: ["EDITOR", "ADMIN", "SUPERADMIN"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [
      {
        role: "desc",
      },
      {
        name: "asc",
      },
    ],
  });

  return Response.json(
    { employees },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request) {
  const admin = await getSuperAdmin(request);

  if (!admin) {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const name = String(body?.name || "").trim();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const role = String(body?.role || "EDITOR");

    let password = String(body?.password || "");

    if (!name) {
      return Response.json(
        { error: "Bitte einen Namen eingeben." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return Response.json(
        { error: "Bitte eine gültige E-Mail-Adresse eingeben." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return Response.json(
        { error: "Ungültige Mitarbeiterrolle." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existing) {
      return Response.json(
        {
          error: "Für diese E-Mail-Adresse existiert bereits ein Benutzerkonto.",
        },
        { status: 409 }
      );
    }

    let generatedPassword = null;

    if (!password) {
      password = generatePassword();
      generatedPassword = password;
    }

    if (password.length < 10) {
      return Response.json(
        {
          error: "Das Passwort muss mindestens 10 Zeichen lang sein.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        employee,
        generatedPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error);

    return Response.json(
      {
        error: "Mitarbeiter konnte nicht angelegt werden.",
      },
      { status: 500 }
    );
  }
}