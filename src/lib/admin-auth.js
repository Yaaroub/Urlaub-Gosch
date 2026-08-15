import { getCurrentUser } from "@/lib/auth";

export const STAFF_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPERADMIN",
];

/**
 * Liefert Benutzer nur zurück,
 * wenn er Mitarbeiter/Admin ist.
 */
export async function getAdminUser(req = null) {
  const user = await getCurrentUser(req);

  if (!user) {
    return null;
  }

  if (!STAFF_ROLES.includes(user.role)) {
    return null;
  }

  return user;
}

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
export async function getSuperAdmin(req = null) {
  const user = await getCurrentUser(req);

  if (!user) {
    return null;
  }

  if (user.role !== "SUPERADMIN") {
    return null;
  }

  return user;
}

export async function requireSuperAdmin(req = null) {
  const user = await getSuperAdmin(req);

  if (!user) {
    throw new Error("FORBIDDEN");
  }

  return user;
}