import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = await getCurrentUser(request);

  if (!user) {
    return Response.json(
      {
        user: null,
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return Response.json(
    {
      user,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}