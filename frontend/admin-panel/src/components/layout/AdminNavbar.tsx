"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  ExternalLink,
  Menu,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface AdminNavbarProps {
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  onSearch?: (query: string) => void;
  onToggleMobileNav?: () => void;
}

export function AdminNavbar({
  onSearch,
  onToggleMobileNav,
}: AdminNavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchVal, setSearchVal] = useState("");

  const getBreadcrumbTitle = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0 || parts[0] === "dashboard") return "Dashboard";
    const segment = parts[0].replace("-", " ");
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="h-16 bg-white border-b border-[#e5ebe4] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileNav && (
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="p-2 -ml-1 text-[#123b30] hover:bg-[#f0f4ee] rounded-lg md:hidden transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#123b30]" />
          </button>
        )}

        <h1 className="text-sm sm:text-base font-extrabold text-[#123b30] tracking-tight">
          {getBreadcrumbTitle()}
        </h1>
        <span className="text-xs text-[#a0ada1] hidden xs:inline">/</span>
        <span className="text-xs font-semibold text-[#557e62] hidden md:inline">
          homi Platform Operations
        </span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Global Quick Search */}
        {onSearch && (
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-[#718078] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                onSearch(e.target.value);
              }}
              className="pl-8 pr-3 py-1.5 bg-[#f8faf5] border border-[#e5ebe4] rounded-lg text-xs text-[#183c31] placeholder-[#718078] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123b30]/20 w-32 md:w-52 transition-all font-medium"
            />
          </div>
        )}

        {/* Customer App Link */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          title="Open Customer App (Port 3000)"
          className="p-2 sm:px-2.5 sm:py-1.5 text-[#41534a] hover:text-[#123b30] hover:bg-[#f0f4ee] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-[#e5ebe4] min-h-[36px]"
        >
          <span className="hidden lg:inline text-[11px]">Customer App</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#718078]" />
        </a>

        {/* Worker Portal Link */}
        <a
          href="http://localhost:3000/worker"
          target="_blank"
          rel="noreferrer"
          title="Open Worker View (Port 3000/worker)"
          className="p-2 sm:px-2.5 sm:py-1.5 text-[#41534a] hover:text-[#123b30] hover:bg-[#f0f4ee] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-[#e5ebe4] min-h-[36px]"
        >
          <span className="hidden lg:inline text-[11px]">Worker View</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#718078]" />
        </a>

        {/* Notifications Shortcut */}
        <Link
          href="/notifications"
          className="relative p-2 text-[#41534a] hover:text-[#123b30] hover:bg-[#f0f4ee] rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#dc2626] rounded-full ring-2 ring-white" />
        </Link>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-[#e5ebe4]">
          <div className="w-7 h-7 rounded-full bg-[#123b30] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {user?.fullName?.charAt(0) || "A"}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-[#123b30] leading-tight">
              {user?.fullName || "Admin"}
            </p>
            <p className="text-[10px] text-[#718078] leading-tight">Operations</p>
          </div>
        </div>
      </div>
    </header>
  );
}