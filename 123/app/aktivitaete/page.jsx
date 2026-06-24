import ActivitiesExploreClient from "@/components/ActivitiesExploreClient";
import { activities } from "@/lib/activities";

export default function ActivitiesPage() {
  return (
    <main className="mx-auto pt-34 max-w-6xl px-4 py-10">
      <ActivitiesExploreClient activities={activities} defaultRadiusKm={25} />
    </main>
  );
}
