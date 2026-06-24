import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function listAmenities() {
  noStore();
  return prisma.amenity.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}
