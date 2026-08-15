import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import { getAdminUser } from "@/lib/admin-auth";

import AdminLogoutButton from "./AdminLogoutButton";
import AdminIdleTimeout from "./AdminIdleTimeout";

export const dynamic = "force-dynamic";

const ROLE_LABELS = {
  EDITOR: "Editor",
  ADMIN: "Administrator",
  SUPERADMIN: "Superadmin",
};

export default async function ProtectedAdminLayout({
  children,
}) {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  const displayName =
    user.name?.trim() ||
    user.email?.split("@")?.[0] ||
    "Mitarbeiter";

  const roleLabel =
    ROLE_LABELS[user.role] ||
    user.role;

  return (
    <>
      <div className="relative min-h-screen bg-[#f7f9fc] pb-28">
        {children}
      </div>

      {/* Admin-Dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] px-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-0">
        <div
          className="
            pointer-events-auto
            mx-auto flex w-full max-w-2xl
            items-center gap-2
            rounded-[20px]
            border border-slate-200/80
            bg-white/95
            p-2
            shadow-[0_20px_60px_rgba(15,23,42,0.16)]
            backdrop-blur-xl
            sm:w-auto
          "
        >
          {/* Dashboard */}
          <Link
            href="/admin"
            title="Admin Dashboard"
            className="
              flex h-11 w-11 shrink-0
              items-center justify-center
              rounded-xl
              bg-sky-600
              text-white
              shadow-sm
              transition
              hover:bg-sky-700
            "
          >
            <LayoutDashboard className="h-5 w-5" />
          </Link>

          {/* Benutzer */}
          <div className="flex min-w-0 flex-1 items-center gap-3 px-2 sm:min-w-[230px]">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 sm:flex">
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-slate-900">
                  {displayName}
                </p>

                <span className="hidden rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-sky-700 sm:inline-flex">
                  {roleLabel}
                </span>
              </div>

              <p className="max-w-[210px] truncate text-[11px] text-slate-500">
                {user.email}
              </p>
            </div>
          </div>

          {/* Trennlinie */}
          <div className="hidden h-8 w-px bg-slate-200 sm:block" />

          {/* Sitzung */}
          <AdminIdleTimeout />

          {/* Trennlinie */}
          <div className="h-8 w-px bg-slate-200" />

          {/* Logout */}
          <AdminLogoutButton />
        </div>
      </div>
    </>
  );
}