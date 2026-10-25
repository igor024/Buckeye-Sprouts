"use client";

import { LogIn, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function AuthButton() {
  const { user, profile, signOut, openModal, isLoading } = useAuth();

  if (isLoading) {
    return (
      <span className="text-xs text-stone-400 py-1.5 px-3">
        Connecting…
      </span>
    );
  }

  if (user && profile) {
    const initials = profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-full border border-stone-200 transition">
          <span className="w-5 h-5 rounded-full bg-red-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
            {initials}
          </span>
          <span className="text-xs font-semibold text-stone-800 max-w-[110px] truncate">
            {profile.name}
          </span>
          <span
            className="w-2 h-2 rounded-full bg-scarlet shrink-0"
            title="Live Supabase Database Connected"
          />
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-stone-500 hover:text-red-800 p-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
          title="Sign out of Supabase"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openModal}
      className="inline-flex items-center gap-1.5 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-xs transition"
    >
      <LogIn size={13} />
      <span>Sign In</span>
    </button>
  );
}
