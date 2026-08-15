import prisma from "@/lib/db";
import { getSuperAdmin } from "@/lib/admin-auth";

const ALLOWED_ROLES = ["EDITOR", "ADMIN"];

async function getId(context) {
  const params = await context.params;
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(request, context) {
  const admin = await getSuperAdmin(request);

  if (!admin) {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const id = await getId(context);

  if (!id) {
    return Response.json(
      { error: "Ungültige Benutzer-ID." },
      { status: 400 }
    );
  }

  if (id === admin.id) {
    return Response.json(
      {
        error: "Du kannst deinen eigenen Superadmin-Zugang hier nicht verändern.",
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
        error: "Andere Superadmin-Konten können hier nicht verändert werden.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const data = {};

  if (body.role !== undefined) {
    if (!ALLOWED_ROLES.includes(body.role)) {
      return Response.json(
        { error: "Ungültige Rolle." },
        { status: 400 }
      );
    }

    data.role = body.role;

    // Bei Rollenänderung bestehende Sessions beenden.
    data.sessionVersion = {
      increment: 1,
    };
  }

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);

    // Sperren/Aktivieren macht bestehende Session ungültig.
    data.sessionVersion = {
      increment: 1,
    };
  }

  const employee = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });

  return Response.json({ employee });
}

export async function DELETE(request, context) {
  const admin = await getSuperAdmin(request);

  if (!admin) {
    return Response.json(
      { error: "Keine Berechtigung." },
      { status: 403 }
    );
  }

  const id = await getId(context);

  if (!id) {
    return Response.json(
      { error: "Ungültige Benutzer-ID." },
      { status: 400 }
    );
  }

  if (id === admin.id) {
    return Response.json(
      {
        error: "Du kannst dein eigenes Superadmin-Konto nicht löschen.",
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
        error: "Superadmin-Konten können hier nicht gelöscht werden.",
      },
      { status: 403 }
    );
  }

  await prisma.user.delete({
    where: { id },
  });

  return Response.json({
    success: true,
  });
}