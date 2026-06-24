import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();

    const jsonResponse = await handleUpload({
      request,
      body,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || "{}");
        const propertyId = String(payload.propertyId || "");

        if (!propertyId) {
          throw new Error("propertyId fehlt");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif",
            "image/gif",
          ],
          maximumSizeInBytes: 30 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ propertyId }),
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log("BLOB UPLOAD OK:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    console.error("BLOB CLIENT UPLOAD ERROR:", e);

    return NextResponse.json(
      {
        error: "Upload fehlgeschlagen",
        details: e?.message || String(e),
      },
      { status: 400 }
    );
  }
}