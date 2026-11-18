import prisma from "@/lib/db";
import { clearSessionCookie, getCurrentUser, isTrustedRequestOrigin } from "@/lib/auth";
import { logError } from "@/lib/safe-log";

export async function POST(req) {
  if (!isTrustedRequestOrigin(req)) {
    return Response.json({ error: "Anfrage von fremder Website abgelehnt." }, { status: 403 });
  }
  // Invalidate the token server-side, so a copied cookie stops working after logout.
  try {
    const user = await getCurrentUser(req);
    if (user) {
      await prisma.user.updateMany({
        where: { id: user.id, sessionVersion: user.sessionVersion },
        data: { sessionVersion: { increment: 1 } },
      });
    }
  } catch (error) {
    logError("POST /api/auth/logout: session revoke failed:", error);
  }

  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
        "Cache-Control": "no-store",
      },
    }
  );
}
