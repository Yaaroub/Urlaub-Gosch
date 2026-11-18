import bcrypt from "bcrypt";

import prisma from "@/lib/db";
import { createSession, getCurrentSessionAndUser, isStaffRole, sessionCookie } from "@/lib/auth";
import {
  checkLoginLimit,
  passwordProblem,
  recordLoginFailure,
  recordLoginSuccess,
  verifyPasswordConstantTime,
} from "@/lib/rate-limit";
import { logError } from "@/lib/safe-log";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/mein-passwort  { currentPassword, newPassword }
 * Staff change their own password. Requires the current password, signs out
 * all other devices and keeps this browser signed in.
 */
export async function POST(req) {
  const current = await getCurrentSessionAndUser(req);
  if (!current || !isStaffRole(current.user.role)) {
    return Response.json({ error: "Nicht angemeldet." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const body = await req.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = body?.newPassword;

  if (!currentPassword || typeof newPassword !== "string") {
    return Response.json({ error: "Bitte aktuelles und neues Passwort angeben." }, { status: 400 });
  }
  const problem = passwordProblem(newPassword);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  if (newPassword === currentPassword) {
    return Response.json({ error: "Das neue Passwort muss sich vom bisherigen unterscheiden." }, { status: 400 });
  }

  const limitKey = `staff-pw:${current.user.id}`;
  const limited = checkLoginLimit(req, "staff-password", limitKey);
  if (limited) return limited;

  try {
    const where = {
      id: current.user.id,
      role: current.user.role,
      isActive: true,
      sessionVersion: current.session.sessionVersion,
    };
    const row = await prisma.user.findUnique({
      where,
      select: { password: true },
    });
    if (!row || !(await verifyPasswordConstantTime(currentPassword, row.password))) {
      recordLoginFailure("staff-password", limitKey);
      return Response.json({ error: "Das aktuelle Passwort ist falsch." }, { status: 401 });
    }
    recordLoginSuccess("staff-password", limitKey);

    const updated = await prisma.user.update({
      where,
      data: {
        password: await bcrypt.hash(newPassword, 12),
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        // Invalidates every other session of this account.
        sessionVersion: { increment: 1 },
      },
      select: { id: true, role: true, sessionVersion: true, sessionTimeoutMinutes: true },
    });

    const token = await createSession(updated, { authTime: current.session.authTime });
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error?.code === "P2025") return Response.json({ error: "Bitte erneut anmelden." }, { status: 401 });
    logError("POST /api/admin/mein-passwort failed:", error);
    return Response.json({ error: "Passwort konnte nicht geändert werden." }, { status: 500 });
  }
}
