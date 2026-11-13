import prisma from "@/lib/db";

// Arbitrary namespace so these advisory locks never collide with other lock users.
const BOOKING_LOCK_NAMESPACE = 41_207;

/**
 * Runs `fn(tx)` in a transaction that holds a per-property PostgreSQL
 * advisory lock. Concurrent booking writes for the same property are
 * serialised, so "check for overlap, then create/update" cannot race.
 * The lock is released automatically at commit/rollback. No schema change.
 */
export async function withPropertyBookingLock(propertyId, fn) {
  const pid = Number(propertyId);
  if (!Number.isSafeInteger(pid) || pid <= 0 || pid > 2147483647) {
    throw new Error("INVALID_PROPERTY_ID");
  }
  return prisma.$transaction(
    async (tx) => {
      // $executeRaw (not $queryRaw): pg_advisory_xact_lock returns void.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_NAMESPACE}::int, ${pid}::int)`;
      return fn(tx);
    },
    { maxWait: 10_000, timeout: 15_000 }
  );
}

/** Overlap rule: end date is exclusive (05.08 departure + 05.08 arrival is allowed). */
export function overlapWhere(propertyId, startDate, endDate, excludeId = null) {
  return {
    propertyId: Number(propertyId),
    startDate: { lt: endDate },
    endDate: { gt: startDate },
    ...(excludeId ? { NOT: { id: Number(excludeId) } } : {}),
  };
}
