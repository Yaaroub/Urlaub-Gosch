import prisma from "@/lib/db";
import { overlapWhere, withPropertyBookingLock } from "@/lib/booking-lock";
import { NextResponse } from "next/server";

import {
  ADMIN_PERMISSIONS,
  requireAdminPermission,
} from "@/lib/admin-permissions";
import { logError } from "@/lib/safe-log";

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

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error: "Ungültige Anfrage.",
        },
        {
          status: 400,
        }
      );
    }

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
          propertyId: true,
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

    // Moving a booking must not create an overlap with another one
    // (previously unchecked). Runs under the per-property lock.
    const result =
      await withPropertyBookingLock(
        existing.propertyId,
        async (tx) => {
          const conflict =
            await tx.booking.findFirst({
              where: overlapWhere(
                existing.propertyId,
                startDate,
                endDate,
                id
              ),

              select: {
                id: true,
                startDate: true,
                endDate: true,
              },
            });

          if (conflict) {
            return { conflict };
          }

          const updated =
            await tx.booking.update({
              where: {
                id,
              },

              data: {
                startDate,
                endDate,

                guestName:
                  (typeof body.guestName === "string"
                    ? body.guestName.trim().slice(0, 200)
                    : "") ||
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

          return { updated };
        }
      );

    if (result.conflict) {
      return NextResponse.json(
        {
          error:
            "Der Zeitraum überschneidet sich mit einer bestehenden Belegung.",

          conflict:
            result.conflict,
        },
        {
          status: 409,
        }
      );
    }

    const { updated } =
      result;

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
    logError("PUT /api/admin/booking/[id]", error);

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
    logError("DELETE /api/admin/booking/[id]", error);

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