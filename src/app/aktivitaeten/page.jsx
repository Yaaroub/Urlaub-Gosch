import { activities } from "@/lib/activities";
import ActivitiesExploreClient from "@/components/ActivitiesExploreClient";

export const metadata = {
  title: "Aktivitäten & Ausflugsziele an Nord- und Ostsee | Urlaub GOSCH",
  description:
    "Entdecke Ausflugsziele, Familienaktivitäten, Natur, Restaurants, Sport und Kultur rund um unsere Ferienunterkünfte an Nord- und Ostsee.",
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 3600;

export default function ActivitiesPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e5]/35 px-4 pb-24 pt-32 text-[#0f172a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ActivitiesExploreClient
          activities={activities}
          defaultRadiusKm={25}
        />
      </div>
    </main>
  );
}