import prisma from "@/lib/db";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";

export async function POST(req) {
  // Invalidate the token server-side, so a copied cookie stops working after logout.
  try {
    const user = await getCurrentUser(req);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionVersion: { increment: 1 } },
        select: { id: true },
      });
    }
  } catch (error) {
    console.error("POST /api/auth/logout: session revoke failed:", error);
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
