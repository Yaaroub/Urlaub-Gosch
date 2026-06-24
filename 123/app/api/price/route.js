// src/app/api/price/route.js
import prisma from "@/lib/db";
import { eachDayOfInterval, addDays, formatISO } from "date-fns";

export const dynamic = "force-dynamic";

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

export async function POST(req) {
  try {
    const { propertyId, arrival, departure } = await req.json();
    if (!propertyId || !arrival || !departure) {
      return Response.json({ error: "propertyId, arrival und departure sind erforderlich." }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: Number(propertyId) },
      include: { pricePeriods: true },
    });
    if (!property) return Response.json({ error: "Property not found" }, { status: 404 });

    const start = new Date(arrival);
    const end   = new Date(departure);
    if (!(start instanceof Date && !isNaN(+start)) || !(end instanceof Date && !isNaN(+end)) || end <= start) {
      return Response.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
    }

    // Nächte [start, end)
    const nights = eachDayOfInterval({ start, end: addDays(end, -1) });

    // Basispreise pro Nacht aus Preisperioden
// Basispreise pro Nacht aus Preisperioden
const breakdown = nights.map((night) => {
    const pp = property.pricePeriods.find(
      (p) => night >= p.startDate && night < p.endDate
    );
    const base = pp ? Number(pp.pricePerNight) : 0; // <- pp statt p
    return {
      date: formatISO(night, { representation: "date" }),
      base: round2(base),
      discount: 0,
      price: round2(base),
    };
  });
  

    // Last-Minute-Angebote anwenden (max. Rabatt pro Nacht)
    const offers = await prisma.lastMinuteOffer.findMany({
      where: {
        propertyId: property.id,
        NOT: [{ endDate: { lte: start } }, { startDate: { gte: end } }],
      },
    });

    if (offers.length) {
      for (const row of breakdown) {
        const d = new Date(row.date);
        const discs = offers.filter(o => d >= o.startDate && d < o.endDate).map(o => o.discount);
        const maxDisc = discs.length ? Math.max(...discs) : 0;
        row.discount = maxDisc;
        row.price    = maxDisc > 0 ? round2(row.base * (100 - maxDisc) / 100) : row.base;
      }
    }

    // Nebenkosten (ExtraCost): amount in Cent, isDaily = pro Nacht
    const extraRows = await prisma.extraCost.findMany({ where: { propertyId: property.id } });

    let extras = 0;              // EUR
    const extraLines = [];       // für Rechnung
    for (const e of extraRows) {
      const unitEur = Number(e.amount) / 100; // Cent -> EUR
      const lineTotal = e.isDaily ? unitEur * nights.length : unitEur;
      extras += lineTotal;
      extraLines.push({
        type: "extra",
        title: e.title,
        quantity: e.isDaily ? nights.length : 1,
        unit: e.isDaily ? "Nacht" : "Pauschal",
        unitPrice: round2(unitEur),
        lineTotal: round2(lineTotal),
      });
    }
    extras = round2(extras);

    const baseNightsTotal = round2(breakdown.reduce((s, r) => s + r.base, 0));
    const subtotal        = round2(breakdown.reduce((s, r) => s + r.price, 0));
    const discountAmount  = round2(baseNightsTotal - subtotal); // positiver EUR-Betrag = Ersparnis
    const total           = round2(subtotal + extras);

    // Rabatt-Details (gruppiert nach Prozent)
    const discountDetailsMap = new Map();
    for (const r of breakdown) {
      if (r.discount > 0) {
        const key = r.discount;
        const prev = discountDetailsMap.get(key) || { percent: key, nights: 0, amount: 0 };
        prev.nights += 1;
        prev.amount  = round2(prev.amount + (r.base - r.price));
        discountDetailsMap.set(key, prev);
      }
    }
    const discountDetails = Array.from(discountDetailsMap.values()).sort((a,b)=>b.percent-a.percent);

    // Rechnungs-Positionen aufbauen
    const invoiceLines = [
      {
        type: "lodging",
        title: `Übernachtungen`,
        quantity: nights.length,
        unit: "Nacht",
        unitPrice: nights.length ? round2(baseNightsTotal / nights.length) : 0, // Durchschnitt als Richtwert
        baseTotal: baseNightsTotal,
        lineTotal: subtotal, // nach Rabatt
      },
      ...(discountAmount > 0 ? [{
        type: "discount",
        title: `Last-Minute-Rabatt`,
        details: discountDetails, // [{percent, nights, amount}]
        amount: -discountAmount,  // negative Position für Rechnung
      }] : []),
      ...extraLines, // einzelne Nebenkosten
    ];

    // Deutlicher Hinweistext für Rechnung/Bestätigung
    const invoiceNote = discountAmount > 0
      ? `Enthält Last-Minute-Rabatt in Höhe von ${discountAmount.toFixed(2)} € (${discountDetails.map(d => `−${d.percent}% für ${d.nights} Nacht${d.nights>1?"e":""}`).join(", ")}).`
      : `Kein Last-Minute-Rabatt angewendet.`;

    return Response.json({
      nights: nights.length,
      breakdown,        // [{ date, base, discount, price }]
      discountAmount,   // € (positiver Betrag = Ersparnis)
      discountDetails,  // Gruppierung nach % (für transparente Anzeige)
      extras,           // € Summe Nebenkosten
      subtotal,         // € Übernachtungen nach Rabatt
      total,            // € Endsumme (Übernachtungen nach Rabatt + Nebenkosten)
      invoiceLines,     // Positionen für PDF/E-Mail
      invoiceNote,      // verständlicher Textbaustein
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Preisberechnung fehlgeschlagen." }, { status: 500 });
  }
}
