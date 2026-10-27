import { PrismaClient } from "@prisma/client";

// Neon can take a few seconds to wake up after inactivity.
// Preserve explicit connection settings supplied by the environment.
const databaseUrl = process.env.DATABASE_URL;
const connectionUrl = databaseUrl ? new URL(databaseUrl) : null;
if (connectionUrl?.hostname.endsWith(".neon.tech")) {
  if (!connectionUrl.searchParams.has("connect_timeout")) {
    connectionUrl.searchParams.set("connect_timeout", "15");
  }
}

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient(
  connectionUrl ? { datasourceUrl: connectionUrl.toString() } : undefined
);
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
