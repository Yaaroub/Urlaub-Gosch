import {
  SignJWT,
  jwtVerify,
} from "jose";

import { cookies } from "next/headers";

import prisma from "@/lib/db";

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

export async function createSession(
  user
) {
  return new SignJWT({
    sub: String(user.id),
    email: user.email,
    sv:
      user.sessionVersion ??
      0,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime(
      `${MAX_AGE}s`
    )
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
        getSecret()
      );

    const userId =
      Number(payload.sub);

    if (
      !userId ||
      Number.isNaN(userId)
    ) {
      return null;
    }

    return {
      userId,

      email:
        payload.email ??
        null,

      sessionVersion:
        Number(
          payload.sv ?? 0
        ),
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

export async function getCurrentUser(
  request = null
) {
  const session =
    await getSession(request);

  if (!session?.userId) {
    return null;
  }

  const user =
    await prisma.user.findUnique({
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
    });

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

  return user;
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