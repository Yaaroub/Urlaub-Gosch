const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name) {
    throw new Error("ADMIN_NAME fehlt.");
  }

  if (!email) {
    throw new Error("ADMIN_EMAIL fehlt.");
  }

  if (!password || password.length < 10) {
    throw new Error(
      "ADMIN_PASSWORD fehlt oder hat weniger als 10 Zeichen."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  let user;

  if (existing) {
    user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        name,
        password: passwordHash,
        role: "SUPERADMIN",
        isActive: true,

        // Alte Sessions dieses Kontos ungültig machen
        sessionVersion: {
          increment: 1,
        },
      },
    });

    console.log("");
    console.log("✅ Bestehendes Konto wurde zum SUPERADMIN.");
  } else {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: "SUPERADMIN",
        isActive: true,
        sessionVersion: 0,
      },
    });

    console.log("");
    console.log("✅ Neuer SUPERADMIN wurde angelegt.");
  }

  console.log("");
  console.log("ID:", user.id);
  console.log("Name:", user.name);
  console.log("E-Mail:", user.email);
  console.log("Rolle:", user.role);
  console.log("Aktiv:", user.isActive);
  console.log("");
  console.log("Du kannst dich jetzt unter /admin/login anmelden.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Fehler:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });