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
        // 200 on purpose: "not signed in" is the normal case for visitors and
        // must not show up as an error in every visitor's browser console.
        status: 200,
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