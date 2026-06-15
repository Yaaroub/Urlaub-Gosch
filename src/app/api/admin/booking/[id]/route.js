import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req, context) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!id) {
      return NextResponse.json(
        { error: "Ungültige Buchungs-ID." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Startdatum und Enddatum sind erforderlich." },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Das Enddatum muss nach dem Startdatum liegen." },
        { status: 400 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        startDate,
        endDate,
        guestName: body.guestName?.trim() || "(Admin)",
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        guestName: true,
        propertyId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/booking/[id]", error);

    return NextResponse.json(
      { error: "Buchung konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, context) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (!id) {
      return NextResponse.json(
        { error: "Ungültige Buchungs-ID." },
        { status: 400 }
      );
    }

    await prisma.booking.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/booking/[id]", error);

    return NextResponse.json(
      { error: "Buchung konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}