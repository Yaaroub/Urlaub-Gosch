import prisma from "@/lib/db";

import {
  createSession,
  sessionCookie,
} from "@/lib/auth";

import {
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

async function getId(
  context
) {
  const params =
    await context.params;

  return Number(
    params.id
  );
}

async function superAdminCount() {
  return prisma.user.count({
    where: {
      role: "SUPERADMIN",
      isActive: true,
    },
  });
}

export async function PATCH(
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
          "Nur ein Superadmin darf Zugangsdaten bearbeiten.",
      },
      {
        status: 403,
      }
    );
  }

  const id =
    await getId(context);

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

      include: {
        adminPermissions:
          true,
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

  const isSelf =
    id === currentUser.id;

  const data = {};

  // ------------------------------------------------------------
  // Name
  // ------------------------------------------------------------

  if (
    body.name !==
    undefined
  ) {
    const name =
      String(
        body.name || ""
      ).trim();

    if (!name) {
      return Response.json(
        {
          error:
            "Der Name darf nicht leer sein.",
        },
        {
          status: 400,
        }
      );
    }

    data.name = name;
  }

  // ------------------------------------------------------------
  // E-Mail
  // ------------------------------------------------------------

  let emailChanged =
    false;

  if (
    body.email !==
    undefined
  ) {
    const email =
      normalizeEmail(
        body.email
      );

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

    const existing =
      await prisma.user.findFirst({
        where: {
          email,

          NOT: {
            id,
          },
        },

        select: {
          id: true,
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

    if (
      email !==
      target.email
    ) {
      data.email =
        email;

      emailChanged =
        true;
    }
  }

  // ------------------------------------------------------------
  // Rolle
  // ------------------------------------------------------------

  let role =
    target.role;

  let roleChanged =
    false;

  if (
    body.role !==
    undefined
  ) {
    role =
      String(
        body.role
      ).toUpperCase();

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

    // Eigenen Superadmin-Status nicht entfernen.
    if (
      isSelf &&
      target.role ===
        "SUPERADMIN" &&
      role !==
        "SUPERADMIN"
    ) {
      return Response.json(
        {
          error:
            "Du kannst deinem eigenen Konto die Superadmin-Rolle nicht entziehen.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      target.role ===
        "SUPERADMIN" &&
      role !==
        "SUPERADMIN"
    ) {
      const count =
        await superAdminCount();

      if (count <= 1) {
        return Response.json(
          {
            error:
              "Der letzte aktive Superadmin kann nicht heruntergestuft werden.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      role !==
      target.role
    ) {
      data.role =
        role;

      roleChanged =
        true;
    }
  }

  // ------------------------------------------------------------
  // Aktiv / gesperrt
  // ------------------------------------------------------------

  let statusChanged =
    false;

  if (
    typeof body.isActive ===
    "boolean"
  ) {
    if (
      isSelf &&
      body.isActive ===
        false
    ) {
      return Response.json(
        {
          error:
            "Du kannst dein eigenes Superadmin-Konto nicht sperren.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      target.role ===
        "SUPERADMIN" &&
      body.isActive ===
        false &&
      target.isActive
    ) {
      const count =
        await superAdminCount();

      if (count <= 1) {
        return Response.json(
          {
            error:
              "Der letzte aktive Superadmin kann nicht gesperrt werden.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      body.isActive !==
      target.isActive
    ) {
      data.isActive =
        body.isActive;

      statusChanged =
        true;
    }
  }

  // ------------------------------------------------------------
  // Timeout
  // ------------------------------------------------------------

  if (
    body.sessionTimeoutMinutes !==
    undefined
  ) {
    const timeout =
      Number(
        body.sessionTimeoutMinutes
      );

    if (
      !ALLOWED_TIMEOUTS.includes(
        timeout
      )
    ) {
      return Response.json(
        {
          error:
            "Ungültiger Session-Timeout.",
        },
        {
          status: 400,
        }
      );
    }

    data.sessionTimeoutMinutes =
      timeout;
  }

  // ------------------------------------------------------------
  // Passwortwechsel erzwingen
  // ------------------------------------------------------------

  if (
    typeof body.mustChangePassword ===
    "boolean"
  ) {
    data.mustChangePassword =
      body.mustChangePassword;
  }

  // ------------------------------------------------------------
  // Rechte
  // ------------------------------------------------------------

  let permissionsChanged =
    false;

  let permissions =
    null;

  if (
    Array.isArray(
      body.permissions
    )
  ) {
    permissions =
      sanitizePermissions(
        body.permissions
      );

    if (
      role ===
      "SUPERADMIN"
    ) {
      permissions = [];
    }

    const oldPermissions =
      target.adminPermissions
        .map(
          (item) =>
            item.permission
        )
        .sort();

    const newPermissions =
      [...permissions].sort();

    permissionsChanged =
      JSON.stringify(
        oldPermissions
      ) !==
      JSON.stringify(
        newPermissions
      );
  }

  // ------------------------------------------------------------
  // Session invalidieren bei sicherheitsrelevanten Änderungen
  // ------------------------------------------------------------

  const invalidateSessions =
    emailChanged ||
    roleChanged ||
    statusChanged ||
    permissionsChanged;

  if (invalidateSessions) {
    data.sessionVersion = {
      increment: 1,
    };
  }

  const updated =
    await prisma.$transaction(
      async (tx) => {
        if (
          permissions !==
          null
        ) {
          await tx.userAdminPermission.deleteMany(
            {
              where: {
                userId: id,
              },
            }
          );

          if (
            role !==
              "SUPERADMIN" &&
            permissions.length
          ) {
            await tx.userAdminPermission.createMany(
              {
                data:
                  permissions.map(
                    (
                      permission
                    ) => ({
                      userId:
                        id,

                      permission,
                    })
                  ),
              }
            );
          }
        } else if (
          role ===
            "SUPERADMIN" &&
          target.role !==
            "SUPERADMIN"
        ) {
          // Superadmin braucht keine Einzelrechte.
          await tx.userAdminPermission.deleteMany(
            {
              where: {
                userId:
                  id,
              },
            }
          );
        }

        return tx.user.update({
          where: {
            id,
          },

          data,

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

            lastLoginAt:
              true,

            passwordChangedAt:
              true,

            createdAt: true,
            updatedAt: true,

            adminPermissions: {
              select: {
                permission:
                  true,
              },
            },
          },
        });
      }
    );

  const responseBody = {
    success: true,

    employee: {
      ...updated,

      permissions:
        updated.role ===
        "SUPERADMIN"
          ? []
          : updated.adminPermissions.map(
              (item) =>
                item.permission
            ),

      adminPermissions:
        undefined,
    },
  };

  /*
   * Wurde das eigene Konto geändert und
   * sessionVersion erhöht, bekommt genau
   * dieser Browser direkt eine neue Session.
   * Andere alte Sessions werden ungültig.
   */
  if (
    isSelf &&
    invalidateSessions &&
    updated.isActive
  ) {
    const token =
      await createSession(
        updated
      );

    return Response.json(
      responseBody,
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
    responseBody,
    {
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}


// ============================================================================
// LÖSCHEN
// ============================================================================

export async function DELETE(
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
          "Nur ein Superadmin darf Mitarbeiter entfernen.",
      },
      {
        status: 403,
      }
    );
  }

  const id =
    await getId(context);

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

  if (
    id ===
    currentUser.id
  ) {
    return Response.json(
      {
        error:
          "Du kannst dein eigenes Konto nicht löschen.",
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
        role: true,
        isActive: true,
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

  if (
    target.role ===
      "SUPERADMIN" &&
    target.isActive
  ) {
    const count =
      await superAdminCount();

    if (count <= 1) {
      return Response.json(
        {
          error:
            "Der letzte aktive Superadmin kann nicht gelöscht werden.",
        },
        {
          status: 400,
        }
      );
    }
  }

  await prisma.user.delete({
    where: {
      id,
    },
  });

  return Response.json({
    success: true,
  });
}