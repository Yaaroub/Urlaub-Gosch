import { Suspense } from "react";
import AvailabilityOverview from "./AvailabilityOverview";

export default function Page() {
  return <Suspense fallback={<p className="p-8">Verfügbarkeitsübersicht wird geladen …</p>}><AvailabilityOverview /></Suspense>;
}
