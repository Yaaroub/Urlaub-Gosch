import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET fehlt. Bitte AUTH_SECRET in der .env setzen."
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Erstellt eine neue Session.
 */
export async function createSession(user) {
  return new SignJWT({
    sub: String(user.id),
    email: user.email,
    sv: user.sessionVersion ?? 0,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * JWT prüfen.
 */
export async function verifySessionToken(token) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    const userId = Number(payload.sub);

    if (!userId || Number.isNaN(userId)) {
      return null;
    }

    return {
      userId,
      email: payload.email ?? null,
      sessionVersion: Number(payload.sv ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Session auslesen.
 *
 * Unterstützt:
 *
 * getSession()
 * -> Server Component / Layout
 *
 * getSession(req)
 * -> bestehende Route Handler
 */
export async function getSession(req = null) {
  let token = null;

  // Bestehende API-Routen können weiterhin req übergeben.
  if (req) {
    try {
      token = req.cookies?.get?.(COOKIE)?.value ?? null;
    } catch {
      token = null;
    }

    // Fallback für normalen Request
    if (!token) {
      const cookieHeader = req.headers?.get?.("cookie") || "";

      const match = cookieHeader.match(
        new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`)
      );

      token = match?.[1] ?? null;
    }
  } else {
    // Next.js Server Component / Layout
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE)?.value ?? null;
  }

  return verifySessionToken(token);
}

/**
 * Gibt immer den AKTUELLEN Benutzer aus der DB zurück.
 *
 * Wichtig für:
 * - Rollenänderungen
 * - Sperrungen
 * - Session-Version
 */
export async function getCurrentUser(req = null) {
  const session = await getSession(req);

  if (!session?.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      sessionVersion: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return null;
  }

  // Gesperrtes Konto
  if (!user.isActive) {
    return null;
  }

  // Session wurde zwischenzeitlich ungültig gemacht
  if (user.sessionVersion !== session.sessionVersion) {
    return null;
  }

  return user;
}

/**
 * Set-Cookie String
 */
export function sessionCookie(token) {
  const isProd = process.env.NODE_ENV === "production";

  return [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE}`,
    isProd ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Session löschen
 */
export function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production";

  return [
    `${COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProd ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}