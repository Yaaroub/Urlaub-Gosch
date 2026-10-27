import prisma from "@/lib/db";

export async function getKuschelwochenPeriods() {
  return prisma.kuschelwochenPeriod.findMany({ orderBy: { startDate: "asc" } });
}

export function formatKuschelwochenPeriod(period) {
  const format = (date) => new Intl.DateTimeFormat("de-DE", { timeZone: "UTC" }).format(new Date(date));
  return `${format(period.startDate)} – ${format(period.endDate)}`;
}
