import bcrypt from "bcrypt";
import crypto from "crypto";

import prisma from "@/lib/db";

import {
  getDefaultPermissionsForRole,
  sanitizePermissions,
} from "@/lib/admin-permissions";

import {
  getSuperAdmin,
} from "@/lib/admin-auth";

const ALLOWED_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

const ALLOWED_TIMEOUTS = [
  15,
  30,
  45,
  60,
  120,
];

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

export async function GET(
  request
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

  const users =
    await prisma.user.findMany({
      where: {
        role: {
          in: [
            "EDITOR",
            "ADMIN",
            "SUPERADMIN",
          ],
        },
      },

      select: {
        id: true,
        name: true,
        email: true,

        role: true,
        isActive: true,

        sessionTimeoutMinutes:
          true,

        mustChangePassword:
          true,

        lastLoginAt: true,
        passwordChangedAt:
          true,

        createdAt: true,
        updatedAt: true,

        adminPermissions: {
          select: {
            permission: true,
          },
        },
      },

      orderBy: [
        {
          createdAt: "asc",
        },
      ],
    });

  const employees =
    users.map(
      (user) => ({
        ...user,

        permissions:
          user.role ===
          "SUPERADMIN"
            ? []
            : user.adminPermissions.map(
                (item) =>
                  item.permission
              ),

        adminPermissions:
          undefined,
      })
    );

  return Response.json(
    {
      employees,
      currentUserId:
        currentUser.id,
    },
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

export async function POST(
  request
) {
  const currentUser =
    await getSuperAdmin(
      request
    );

  if (!currentUser) {
    return Response.json(
      {
        error:
          "Nur ein Superadmin darf Mitarbeiter anlegen.",
      },
      {
        status: 403,
      }
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return Response.json(
      {
        error:
          "Ungültige Anfrage.",
      },
      {
        status: 400,
      }
    );
  }

  const name =
    String(
      body?.name || ""
    ).trim();

  const email =
    normalizeEmail(
      body?.email
    );

  const role =
    String(
      body?.role ||
        "EDITOR"
    ).toUpperCase();

  if (!name) {
    return Response.json(
      {
        error:
          "Bitte einen Namen eingeben.",
      },
      {
        status: 400,
      }
    );
  }

  if (!validEmail(email)) {
    return Response.json(
      {
        error:
          "Bitte eine gültige E-Mail-Adresse eingeben.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !ALLOWED_ROLES.includes(
      role
    )
  ) {
    return Response.json(
      {
        error:
          "Ungültige Rolle.",
      },
      {
        status: 400,
      }
    );
  }

  let timeout =
    Number(
      body?.sessionTimeoutMinutes ??
        30
    );

  if (
    !ALLOWED_TIMEOUTS.includes(
      timeout
    )
  ) {
    timeout = 30;
  }

  let password =
    String(
      body?.password || ""
    );

  let generatedPassword =
    null;

  if (!password) {
    generatedPassword =
      crypto
        .randomBytes(15)
        .toString(
          "base64url"
        );

    password =
      generatedPassword;
  }

  if (
    password.length < 10
  ) {
    return Response.json(
      {
        error:
          "Das Passwort muss mindestens 10 Zeichen lang sein.",
      },
      {
        status: 400,
      }
    );
  }

  const existing =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existing) {
    return Response.json(
      {
        error:
          "Diese E-Mail-Adresse wird bereits verwendet.",
      },
      {
        status: 409,
      }
    );
  }

  let permissions =
    Array.isArray(
      body?.permissions
    )
      ? sanitizePermissions(
          body.permissions
        )
      : getDefaultPermissionsForRole(
          role
        );

  if (
    role ===
    "SUPERADMIN"
  ) {
    permissions = [];
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );

  const employee =
    await prisma.user.create({
      data: {
        name,
        email,
        password:
          passwordHash,

        role,
        isActive: true,

        sessionTimeoutMinutes:
          timeout,

        mustChangePassword:
          body?.mustChangePassword ??
          Boolean(
            generatedPassword
          ),

        passwordChangedAt:
          new Date(),

        adminPermissions:
          permissions.length
            ? {
                create:
                  permissions.map(
                    (
                      permission
                    ) => ({
                      permission,
                    })
                  ),
              }
            : undefined,
      },

      select: {
        id: true,
        name: true,
        email: true,

        role: true,
        isActive: true,

        sessionTimeoutMinutes:
          true,

        mustChangePassword:
          true,

        lastLoginAt: true,
        passwordChangedAt:
          true,

        createdAt: true,

        adminPermissions: {
          select: {
            permission: true,
          },
        },
      },
    });

  return Response.json(
    {
      success: true,

      employee: {
        ...employee,

        permissions:
          employee.adminPermissions.map(
            (item) =>
              item.permission
          ),

        adminPermissions:
          undefined,
      },

      generatedPassword,
    },
    {
      status: 201,
    }
  );
}