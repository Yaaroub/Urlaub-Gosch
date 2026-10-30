import prisma from "@/lib/db";
import { ADMIN_PERMISSIONS, requireAdminPermission } from "@/lib/admin-permissions";
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
        const auth = await requireAdminPermission(ADMIN_PERMISSIONS.IMAGES_EDIT, request);
        if (!auth.ok) throw Object.assign(new Error(auth.error), { status: auth.status });
        const payload = JSON.parse(clientPayload || "{}");
        const propertyId = String(payload.propertyId || "");

        if (!/^[1-9]\d*$/.test(propertyId) || !Number.isSafeInteger(Number(propertyId))) {
          throw new Error("propertyId fehlt");
        }

        if (!pathname.startsWith(`objects/property-${propertyId}/`) || pathname.includes("..") || pathname.includes("\\")) {
          throw new Error("Ungültiger Upload-Pfad");
        }
        const property = await prisma.property.findUnique({ where: { id: Number(propertyId) }, select: { id: true } });
        if (!property) throw new Error("Objekt nicht gefunden");
        return {
          allowOverwrite: false,
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
      },
      { status: [401, 403].includes(e?.status) ? e.status : 400 }
    );
  }
}