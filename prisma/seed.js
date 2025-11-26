// prisma/seed.js  (CommonJS)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const amenityNames = [
    "WLAN","Sauna","Kamin","Meerblick","Waschmaschine","Eingezäunt","Eingezäuntes Grundstück"
  ];
  const amenities = await Promise.all(
    amenityNames.map((name) =>
      prisma.amenity.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  await prisma.property.upsert({
    where: { id: 1 },
    update: {},
    create: {
        slug: "meerblick",
 
      title: "Wohnung Meerblick",
      description: "Helle Ferienwohnung mit Meerblick – 200m zum Strand.",
      location: "Holm",
      maxPersons: 4,
      dogsAllowed: true,
      amenities: { connect: amenities.filter(a => ["WLAN","Sauna","Meerblick"].includes(a.name)).map(a=>({id:a.id})) },
      pricePeriods: {
        create: [
          { startDate: new Date("2025-10-01"), endDate: new Date("2025-10-31"), pricePerNight: 120 },
          { startDate: new Date("2025-11-01"), endDate: new Date("2025-12-20"), pricePerNight: 95 }
        ]
      },
      bookings: {
        create: [
          { startDate: new Date("2025-10-10"), endDate: new Date("2025-10-15"), guestName: "Familie Müller" }
        ]
      }
    }
  });

  console.log("✅ Seed ok");
}

main().catch(console.error).finally(() => prisma.$disconnect());
