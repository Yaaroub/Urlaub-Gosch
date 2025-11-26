// src/app/api/admin/properties/[id]/images/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const file = form.get("file") as File;

  // In Produktion: z.B. S3 oder Cloudinary hochladen
  const url = `/uploads/${file.name}`;

  const img = await prisma.propertyImage.create({
    data: { propertyId: params.id, url },
  });

  return NextResponse.json(img);
}
