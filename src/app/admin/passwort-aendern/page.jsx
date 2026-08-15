import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/admin-auth";

import ForcedPasswordChangeForm from "./ForcedPasswordChangeForm";

export const dynamic =
  "force-dynamic";

export default async function PasswordChangePage() {
  const user =
    await getAdminUser();

  if (!user) {
    redirect(
      "/admin/login"
    );
  }

  if (!user.mustChangePassword) {
    redirect(
      "/admin"
    );
  }

  return (
    <ForcedPasswordChangeForm
      email={user.email}
    />
  );
}