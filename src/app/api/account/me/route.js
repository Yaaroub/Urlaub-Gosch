import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const session = await getSession(req);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return Response.json(user);
}
