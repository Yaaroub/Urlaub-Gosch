import {
  SignJWT,
  jwtVerify,
} from "jose";

import { cookies } from "next/headers";

import prisma from "@/lib/db";
import { retryDatabaseRead } from "@/lib/database-availability";
import { isTrustedRequestOrigin } from "./request-origin.js";

export { isTrustedRequestOrigin };

const COOKIE = "session";

const MAX_AGE =
  60 * 60 * 24 * 7;

function getSecret() {
  const secret =
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET fehlt. Bitte AUTH_SECRET in der .env setzen."
    );
  }

  return new TextEncoder().encode(
    secret
  );
}

const STAFF_ROLES = ["EDITOR", "ADMIN", "SUPERADMIN"];

// Staff sessions: the token itself expires after the configured inactivity
// timeout and is renewed by /api/admin/session while the user is active.
// Independent of activity, a staff login is valid for at most 12 hours.
export const STAFF_SESSION_MAX_SECONDS = 12 * 60 * 60;

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function staffIdleSeconds(minutes) {
  const value = Number(minutes);
  const safe = Number.isFinite(value) ? Math.min(240, Math.max(5, value)) : 30;
  return Math.round(safe * 60);
}

export async function createSession(
  user,
  { authTime } = {}
) {
  let role = user.role;
  let timeoutMinutes = user.sessionTimeoutMinutes;

  if (role === undefined || (isStaffRole(role) && timeoutMinutes === undefined)) {
    const row = await prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: { role: true, sessionTimeoutMinutes: true },
    });
    role = row?.role;
    timeoutMinutes = row?.sessionTimeoutMinutes;
  }

  const now = Math.floor(Date.now() / 1000);
  const staff = isStaffRole(role);
  const aat = staff ? Number(authTime) || now : undefined;
  const exp = staff
    ? Math.min(now + staffIdleSeconds(timeoutMinutes), aat + STAFF_SESSION_MAX_SECONDS)
    : now + MAX_AGE;

  return new SignJWT({
    sub: String(user.id),
    sv:
      user.sessionVersion ??
      0,
    ...(staff ? { stf: 1, aat } : {}),
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySessionToken(
  token
) {
  if (!token) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        getSecret(),
        { algorithms: ["HS256"] }
      );

    const userId =
      Number(payload.sub);

    const sessionVersion = Number(payload.sv ?? 0);
    if (!Number.isSafeInteger(userId) || userId <= 0 ||
        !Number.isSafeInteger(sessionVersion) || sessionVersion < 0) {
      return null;
    }

    return {
      userId,
      sessionVersion,
      staffToken: payload.stf === 1,

      authTime: Number(payload.aat) || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(
  request = null
) {
  let token = null;

  if (request) {
    if (!isTrustedRequestOrigin(request)) return null;
    try {
      token =
        request.cookies
          ?.get?.(COOKIE)
          ?.value ??
        null;
    } catch {
      token = null;
    }

    if (!token) {
      const cookieHeader =
        request.headers?.get?.(
          "cookie"
        ) || "";

      const match =
        cookieHeader.match(
          new RegExp(
            `(?:^|;\\s*)${COOKIE}=([^;]+)`
          )
        );

      token =
        match?.[1] ??
        null;
    }
  } else {
    const cookieStore =
      await cookies();

    token =
      cookieStore
        .get(COOKIE)
        ?.value ??
      null;
  }

  return verifySessionToken(
    token
  );
}

async function getUserForSession(session) {
  if (!session?.userId) {
    return null;
  }

  const user =
    await retryDatabaseRead(() => prisma.user.findUnique({
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
        sessionTimeoutMinutes: true,

        mustChangePassword: true,

        lastLoginAt: true,
        passwordChangedAt: true,

        createdAt: true,
        updatedAt: true,
      },
    }));

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    return null;
  }

  if (
    user.sessionVersion !==
    session.sessionVersion
  ) {
    return null;
  }

  // There are no customer accounts: only staff can hold a session.
  if (!isStaffRole(user.role)) {
    return null;
  }

  // Staff accounts only accept short-lived staff tokens (older 7-day tokens
  // issued before this rule are rejected) and never beyond the absolute limit.
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    !session.staffToken ||
    !session.authTime ||
    nowSeconds - session.authTime > STAFF_SESSION_MAX_SECONDS
  ) {
    return null;
  }

  return user;
}

export async function getCurrentUser(request = null) {
  return getUserForSession(await getSession(request));
}

/** Session claims plus the verified user, for renewing staff tokens. */
export async function getCurrentSessionAndUser(request = null) {
  const session = await getSession(request);
  const user = await getUserForSession(session);
  return user ? { session, user } : null;
}

export function sessionCookie(
  token
) {
  const isProd =
    process.env.NODE_ENV ===
    "production";

  return [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE}`,
    isProd
      ? "Secure"
      : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie() {
  const isProd =
    process.env.NODE_ENV ===
    "production";

  return [
    `${COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProd
      ? "Secure"
      : null,
  ]
    .filter(Boolean)
    .join("; ");
}
