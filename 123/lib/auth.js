import { SignJWT, jwtVerify } from "jose";

const COOKIE = "session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
const maxAge = 60 * 60 * 24 * 7; // 7d

export async function createSession(user) {
  const token = await new SignJWT({ sub: String(user.id), email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret);
  return token;
}

export async function getSession(req) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    const { payload } = await jwtVerify(m[1], secret);
    return { userId: Number(payload.sub), email: payload.email };
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  const isProd = process.env.NODE_ENV === "production";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${
    isProd ? "Secure;" : ""
  }`;
}

export function clearSessionCookie() {
  const isProd = process.env.NODE_ENV === "production";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${isProd ? "Secure;" : ""}`;
}
