import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const ADMIN_PERMISSIONS = {
  PROPERTIES_VIEW: "PROPERTIES_VIEW",
  PROPERTIES_EDIT: "PROPERTIES_EDIT",
  PROPERTIES_DELETE: "PROPERTIES_DELETE",

  PRICES_VIEW: "PRICES_VIEW",
  PRICES_EDIT: "PRICES_EDIT",

  FEES_VIEW: "FEES_VIEW",
  FEES_EDIT: "FEES_EDIT",

  IMAGES_VIEW: "IMAGES_VIEW",
  IMAGES_EDIT: "IMAGES_EDIT",
  IMAGES_DELETE: "IMAGES_DELETE",

  AVAILABILITY_VIEW: "AVAILABILITY_VIEW",
  AVAILABILITY_EDIT: "AVAILABILITY_EDIT",

  ICAL_VIEW: "ICAL_VIEW",
  ICAL_EDIT: "ICAL_EDIT",

  LASTMINUTE_VIEW: "LASTMINUTE_VIEW",
  LASTMINUTE_EDIT: "LASTMINUTE_EDIT",
  LASTMINUTE_DELETE: "LASTMINUTE_DELETE",

  STAFF_VIEW: "STAFF_VIEW",
  STAFF_CREATE: "STAFF_CREATE",
  STAFF_EDIT: "STAFF_EDIT",
  STAFF_LOCK: "STAFF_LOCK",
  STAFF_PASSWORD_RESET: "STAFF_PASSWORD_RESET",
  STAFF_PERMISSIONS_EDIT: "STAFF_PERMISSIONS_EDIT",
  STAFF_DELETE: "STAFF_DELETE",
};

export const ALL_ADMIN_PERMISSIONS = Object.values(
  ADMIN_PERMISSIONS
);

export const DEFAULT_EDITOR_PERMISSIONS = [
  ADMIN_PERMISSIONS.PROPERTIES_VIEW,
  ADMIN_PERMISSIONS.PROPERTIES_EDIT,

  ADMIN_PERMISSIONS.PRICES_VIEW,
  ADMIN_PERMISSIONS.PRICES_EDIT,

  ADMIN_PERMISSIONS.FEES_VIEW,
  ADMIN_PERMISSIONS.FEES_EDIT,

  ADMIN_PERMISSIONS.IMAGES_VIEW,
  ADMIN_PERMISSIONS.IMAGES_EDIT,

  ADMIN_PERMISSIONS.AVAILABILITY_VIEW,
  ADMIN_PERMISSIONS.AVAILABILITY_EDIT,

  ADMIN_PERMISSIONS.ICAL_VIEW,
  ADMIN_PERMISSIONS.ICAL_EDIT,

  ADMIN_PERMISSIONS.LASTMINUTE_VIEW,
  ADMIN_PERMISSIONS.LASTMINUTE_EDIT,
];

export const DEFAULT_ADMIN_PERMISSIONS = [
  ADMIN_PERMISSIONS.PROPERTIES_VIEW,
  ADMIN_PERMISSIONS.PROPERTIES_EDIT,
  ADMIN_PERMISSIONS.PROPERTIES_DELETE,

  ADMIN_PERMISSIONS.PRICES_VIEW,
  ADMIN_PERMISSIONS.PRICES_EDIT,

  ADMIN_PERMISSIONS.FEES_VIEW,
  ADMIN_PERMISSIONS.FEES_EDIT,

  ADMIN_PERMISSIONS.IMAGES_VIEW,
  ADMIN_PERMISSIONS.IMAGES_EDIT,
  ADMIN_PERMISSIONS.IMAGES_DELETE,

  ADMIN_PERMISSIONS.AVAILABILITY_VIEW,
  ADMIN_PERMISSIONS.AVAILABILITY_EDIT,

  ADMIN_PERMISSIONS.ICAL_VIEW,
  ADMIN_PERMISSIONS.ICAL_EDIT,

  ADMIN_PERMISSIONS.LASTMINUTE_VIEW,
  ADMIN_PERMISSIONS.LASTMINUTE_EDIT,
  ADMIN_PERMISSIONS.LASTMINUTE_DELETE,
];

export function getDefaultPermissionsForRole(role) {
  if (role === "ADMIN") {
    return [...DEFAULT_ADMIN_PERMISSIONS];
  }

  if (role === "EDITOR") {
    return [...DEFAULT_EDITOR_PERMISSIONS];
  }

  return [];
}

export function sanitizePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [
    ...new Set(
      permissions.filter((permission) =>
        ALL_ADMIN_PERMISSIONS.includes(permission)
      )
    ),
  ];
}

export async function getAdminUserWithPermissions(
  request = null
) {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return null;
  }

  if (
    currentUser.role !== "EDITOR" &&
    currentUser.role !== "ADMIN" &&
    currentUser.role !== "SUPERADMIN"
  ) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: currentUser.id,
    },

    select: {
      id: true,
      name: true,
      email: true,

      role: true,
      isActive: true,

      sessionVersion: true,
      sessionTimeoutMinutes: true,
      mustChangePassword: true,

      lastLoginAt: true,
      passwordChangedAt: true,

      createdAt: true,
      updatedAt: true,

      adminPermissions: {
        select: {
          permission: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    ...user,

    permissions:
      user.role === "SUPERADMIN"
        ? [...ALL_ADMIN_PERMISSIONS]
        : user.adminPermissions.map(
            (item) => item.permission
          ),
  };
}

export async function hasAdminPermission(
  permission,
  request = null
) {
  const user =
    await getAdminUserWithPermissions(request);

  if (!user) {
    return false;
  }

  if (user.role === "SUPERADMIN") {
    return true;
  }

  return user.permissions.includes(permission);
}

export async function requireAdminPermission(
  permission,
  request = null
) {
  const user =
    await getAdminUserWithPermissions(request);

  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Nicht angemeldet.",
      user: null,
    };
  }

  if (
    user.role !== "SUPERADMIN" &&
    !user.permissions.includes(permission)
  ) {
    return {
      ok: false,
      status: 403,
      error:
        "Für diese Aktion fehlt die erforderliche Berechtigung.",
      user,
    };
  }

  return {
    ok: true,
    status: 200,
    error: null,
    user,
  };
}