"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminNavbar } from "./AdminNavbar";

interface AdminShellProps {
  children: React.ReactNode;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  onSearch?: (query: string) => void;
}

export function AdminShell({
  children,
  dateRange,
  onDateRangeChange,
  onSearch,
}: AdminShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#123b30] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#557e62] uppercase tracking-wider">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen bg-[#f8faf5] text-[#183c31]">
      <AdminSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminNavbar
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          onSearch={onSearch}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}