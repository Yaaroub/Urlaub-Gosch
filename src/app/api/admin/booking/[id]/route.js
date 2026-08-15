import prisma from "@/lib/db";
import { NextResponse } from "next/server";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";

function deny(auth) {
  return NextResponse.json(
    {
      error: auth.error,
    },
    {
      status: auth.status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// ============================================================
// BUCHUNG BEARBEITEN
// benötigt: AVAILABILITY_EDIT
// ============================================================

export async function PUT(req, context) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.AVAILABILITY_EDIT,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const { id: rawId } = await context.params;

    const id = Number(rawId);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          error: "Ungültige Buchungs-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await req.json();

    const startDate = body.startDate
      ? new Date(body.startDate)
      : null;

    const endDate = body.endDate
      ? new Date(body.endDate)
      : null;

    if (
      !startDate ||
      !endDate ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return NextResponse.json(
        {
          error:
            "Startdatum und Enddatum sind erforderlich.",
        },
        {
          status: 400,
        }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        {
          error:
            "Das Enddatum muss nach dem Startdatum liegen.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Buchung wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    const updated =
      await prisma.booking.update({
        where: {
          id,
        },

        data: {
          startDate,
          endDate,

          guestName:
            body.guestName?.trim() ||
            "(Admin)",
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

    return NextResponse.json(
      updated,
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/admin/booking/[id]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Buchung konnte nicht aktualisiert werden.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// BUCHUNG LÖSCHEN
// benötigt: AVAILABILITY_EDIT
// ============================================================

export async function DELETE(req, context) {
  try {
    const auth = await requireAdminPermission(
      ADMIN_PERMISSIONS.AVAILABILITY_EDIT,
      req
    );

    if (!auth.ok) {
      return deny(auth);
    }

    const { id: rawId } = await context.params;

    const id = Number(rawId);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          error:
            "Ungültige Buchungs-ID.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.booking.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Buchung wurde nicht gefunden.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.booking.delete({
      where: {
        id,
      },
    });

    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control":
          "no-store",
      },
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/booking/[id]",
      error
    );

    return NextResponse.json(
      {
        error:
          "Buchung konnte nicht gelöscht werden.",
      },
      {
        status: 500,
      }
    );
  }
}