// src/app/api/price/route.js
import prisma from "@/lib/db";
import { eachDayOfInterval, addDays, formatISO } from "date-fns";

export const dynamic = "force-dynamic";

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getOfferSaving(offer, basePrice) {
  const base = Math.max(0, Number(basePrice) || 0);
  const type = offer.discountType === "FIXED" ? "FIXED" : "PERCENT";

  if (type === "FIXED") {
    const fixedAmount = Math.max(0, Number(offer.discountAmount) || 0);

    return {
      type: "FIXED",
      value: round2(fixedAmount),
      saving: round2(Math.min(base, fixedAmount)),
    };
  }

  const percent = Math.min(100, Math.max(0, Number(offer.discount) || 0));

  return {
    type: "PERCENT",
    value: percent,
    saving: round2(base * (percent / 100)),
  };
}

function formatDiscountDetail(detail) {
  if (detail.type === "FIXED") {
    return `−${Number(detail.value).toFixed(2)} € pro Nacht für ${detail.nights} Nacht${
      detail.nights === 1 ? "" : "e"
    }`;
  }

  return `−${detail.value}% für ${detail.nights} Nacht${
    detail.nights === 1 ? "" : "e"
  }`;
}

export async function POST(req) {
  try {
    const { propertyId, arrival, departure } = await req.json();

    if (!propertyId || !arrival || !departure) {
      return Response.json(
        {
          error:
            "propertyId, arrival und departure sind erforderlich.",
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: Number(propertyId) },
      include: { pricePeriods: true },
    });

    if (!property) {
      return Response.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const start = new Date(arrival);
    const end = new Date(departure);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return Response.json(
        { error: "Ungültiger Zeitraum." },
        { status: 400 }
      );
    }

    // Nächte [start, end)
    const nights = eachDayOfInterval({
      start,
      end: addDays(end, -1),
    });

    // Basispreise pro Nacht aus den normalen Preisperioden.
    const breakdown = nights.map((night) => {
      const pricePeriod = property.pricePeriods.find(
        (period) =>
          night >= period.startDate &&
          night < period.endDate
      );

      const base = pricePeriod
        ? Number(pricePeriod.pricePerNight)
        : 0;

      return {
        date: formatISO(night, { representation: "date" }),
        base: round2(base),

        // Rückwärtskompatibel: bei Prozent steht hier weiterhin der Prozentwert.
        discount: 0,

        // Neue Felder für beide Rabattarten.
        discountType: null,
        discountValue: 0,
        discountAmount: 0,

        price: round2(base),
      };
    });

    // Alle Last-Minute-Angebote, die den Reisezeitraum berühren.
    const offers = await prisma.lastMinuteOffer.findMany({
      where: {
        propertyId: property.id,
        NOT: [
          { endDate: { lte: start } },
          { startDate: { gte: end } },
        ],
      },
    });

    // Pro Nacht gilt bei mehreren Angeboten immer die größte EURO-Ersparnis.
    if (offers.length > 0) {
      for (const row of breakdown) {
        const date = new Date(row.date);

        const applicableOffers = offers.filter(
          (offer) =>
            date >= offer.startDate &&
            date < offer.endDate
        );

        let best = null;

        for (const offer of applicableOffers) {
          const candidate = getOfferSaving(
            offer,
            row.base
          );

          if (
            !best ||
            candidate.saving > best.saving
          ) {
            best = candidate;
          }
        }

        if (best && best.saving > 0) {
          row.discountType = best.type;
          row.discountValue = best.value;
          row.discountAmount = best.saving;

          // Bestehende Verbraucher können Prozent weiterhin lesen.
          row.discount =
            best.type === "PERCENT" ? best.value : 0;

          row.price = round2(
            Math.max(0, row.base - best.saving)
          );
        }
      }
    }

    // Nebenkosten
    const extraRows = await prisma.extraCost.findMany({
      where: { propertyId: property.id },
    });

    let extras = 0;
    const extraLines = [];

    for (const extra of extraRows) {
      const unitEur = Number(extra.amount) / 100;
      const lineTotal = extra.isDaily
        ? unitEur * nights.length
        : unitEur;

      extras += lineTotal;

      extraLines.push({
        type: "extra",
        title: extra.title,
        quantity: extra.isDaily
          ? nights.length
          : 1,
        unit: extra.isDaily ? "Nacht" : "Pauschal",
        unitPrice: round2(unitEur),
        lineTotal: round2(lineTotal),
      });
    }

    extras = round2(extras);

    const baseNightsTotal = round2(
      breakdown.reduce(
        (sum, row) => sum + row.base,
        0
      )
    );

    const subtotal = round2(
      breakdown.reduce(
        (sum, row) => sum + row.price,
        0
      )
    );

    // Gesamte Ersparnis in Euro.
    const discountAmount = round2(
      baseNightsTotal - subtotal
    );

    const total = round2(subtotal + extras);

    // Rabattdetails nach Typ + Wert gruppieren.
    const discountDetailsMap = new Map();

    for (const row of breakdown) {
      if (
        !row.discountType ||
        row.discountAmount <= 0
      ) {
        continue;
      }

      const key = `${row.discountType}:${row.discountValue}`;

      const previous =
        discountDetailsMap.get(key) || {
          type: row.discountType,
          value: row.discountValue,
          percent:
            row.discountType === "PERCENT"
              ? row.discountValue
              : null,
          fixedAmount:
            row.discountType === "FIXED"
              ? row.discountValue
              : null,
          nights: 0,
          amount: 0,
        };

      previous.nights += 1;
      previous.amount = round2(
        previous.amount + row.discountAmount
      );

      discountDetailsMap.set(key, previous);
    }

    const discountDetails = Array.from(
      discountDetailsMap.values()
    ).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }

      return Number(b.value) - Number(a.value);
    });

    const invoiceLines = [
      {
        type: "lodging",
        title: "Übernachtungen",
        quantity: nights.length,
        unit: "Nacht",
        unitPrice:
          nights.length > 0
            ? round2(
                baseNightsTotal /
                  nights.length
              )
            : 0,
        baseTotal: baseNightsTotal,
        lineTotal: subtotal,
      },

      ...(discountAmount > 0
        ? [
            {
              type: "discount",
              title: "Last-Minute-Rabatt",
              details: discountDetails,
              amount: -discountAmount,
            },
          ]
        : []),

      ...extraLines,
    ];

    const invoiceNote =
      discountAmount > 0
        ? `Enthält Last-Minute-Rabatt in Höhe von ${discountAmount.toFixed(
            2
          )} € (${discountDetails
            .map(formatDiscountDetail)
            .join(", ")}).`
        : "Kein Last-Minute-Rabatt angewendet.";

    return Response.json({
      nights: nights.length,
      breakdown,

      // Gesamt-Ersparnis in Euro, unabhängig von der Rabattart.
      discountAmount,

      // Unterstützt jetzt Prozent UND festen Betrag.
      discountDetails,

      extras,
      subtotal,
      total,
      invoiceLines,
      invoiceNote,
    });
  } catch (error) {
    console.error(
      "POST /api/price failed:",
      error
    );

    return Response.json(
      { error: "Preisberechnung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
