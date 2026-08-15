import bcrypt from "bcrypt";
import crypto from "crypto";

import prisma from "@/lib/db";
import { getSuperAdmin } from "@/lib/admin-auth";

function generatePassword() {
  return crypto.randomBytes(12).toString("base64url");
}

export async function POST(request, context) {
  const admin = await getSuperAdmin(request);

  if (!admin) {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const params = await context.params;
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return Response.json(
      { error: "Ungültige Benutzer-ID." },
      { status: 400 }
    );
  }

  if (id === admin.id) {
    return Response.json(
      {
        error: "Dein eigenes Passwort änderst du über dein Konto.",
      },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
  });

  if (!target) {
    return Response.json(
      { error: "Mitarbeiter wurde nicht gefunden." },
      { status: 404 }
    );
  }

  if (target.role === "SUPERADMIN") {
    return Response.json(
      {
        error: "Das Passwort eines anderen Superadmins kann hier nicht geändert werden.",
      },
      { status: 403 }
    );
  }

  const password = generatePassword();

  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  await prisma.user.update({
    where: { id },

    data: {
      password: passwordHash,

      sessionVersion: {
        increment: 1,
      },
    },
  });

  return Response.json({
    success: true,
    password,
  });
}