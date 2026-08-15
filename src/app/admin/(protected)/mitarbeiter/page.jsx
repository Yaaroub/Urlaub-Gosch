import { redirect } from "next/navigation";
import { getSuperAdmin } from "@/lib/admin-auth";
import MitarbeiterClient from "./MitarbeiterClient";

export const dynamic = "force-dynamic";

export default async function MitarbeiterPage() {
  const user = await getSuperAdmin();

  if (!user) {
    redirect("/admin");
  }

  return <MitarbeiterClient currentUserId={user.id} />;
}