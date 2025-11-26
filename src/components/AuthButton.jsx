"use client";
import { LogOut, User } from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function AuthButton() {
  const { ready, user, logout } = useAuth();

  if (!ready) return null;

  return user ? (
    <button
      onClick={logout}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
      title="Logout"
    >
      <LogOut className="h-5 w-5" />
    </button>
  ) : (
    <a
      href="/login"
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
      title="Login"
    >
      <User className="h-5 w-5" />
    </a>
  );
}
