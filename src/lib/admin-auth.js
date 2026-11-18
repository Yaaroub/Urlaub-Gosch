import { cache } from "react";
import { getCurrentSessionAndUser, getCurrentUser } from "@/lib/auth";

export const STAFF_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

/**
 * Liefert Benutzer nur zurück,
 * wenn er Mitarbeiter/Admin ist.
 */
export const getAdminUser = cache(async function getAdminUser(req = null) {
  const user = await getCurrentUser(req);

  if (!user) {
    return null;
  }

  if (!STAFF_ROLES.includes(user.role)) {
    return null;
  }

  return user;
});

/**
 * Geschützter Admin-Zugriff.
 */
export async function requireAdmin(req = null) {
  const user = await getAdminUser(req);

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

/**
 * Nur SUPERADMIN.
 */
export async function getSuperAdminSession(req = null) {
  const current = await getCurrentSessionAndUser(req);
  // Same rule as requireAdminPermission: no admin actions before the
  // mandatory password change has been completed.
  if (current?.user.role !== "SUPERADMIN" || current.user.mustChangePassword) return null;
  return current;
}

export async function getSuperAdmin(req = null) {
  return (await getSuperAdminSession(req))?.user ?? null;
}

export async function requireSuperAdmin(req = null) {
  const user = await getSuperAdmin(req);

  if (!user) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
