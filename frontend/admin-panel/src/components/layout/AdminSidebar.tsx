"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  Briefcase,
  Users,
  Wrench,
  Compass,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

// Exactly 8 main sections as requested:
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Service Requests", href: "/requests", icon: ClipboardList },
  { name: "Worker Applications", href: "/applications", icon: FileCheck },
  { name: "Workers", href: "/workers", icon: Briefcase },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Services", href: "/services", icon: Wrench },
  { name: "Assignments", href: "/assignments", icon: Compass },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop & Slide-out Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onMobileClose}
            aria-label="Close navigation"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-[#0c2b22] text-[#d1e0d7] flex flex-col h-full shadow-2xl z-10 transition-transform duration-300 animate-in slide-in-from-left">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#153f33]">
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="logo-icon shrink-0">
                  <Wrench size={16} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-lg tracking-tight font-['Manrope']">
                    homi<span className="text-[#a1c347]">.</span>
                  </span>
                  <span className="text-[10px] font-extrabold bg-[#d9ed89] text-[#123b30] px-1.5 py-0.5 rounded tracking-wider uppercase">
                    Admin
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={onMobileClose}
                className="text-[#88a897] hover:text-white p-2 rounded-lg hover:bg-[#153f33] transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-[#153f33]">
              <p className="px-3 text-[10px] font-extrabold text-[#749c87] uppercase tracking-wider mb-2">
                Platform Menu
              </p>

              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-bold transition-all min-h-[44px]",
                      isActive
                        ? "bg-[#184e40] text-[#d9ed89] shadow-xs"
                        : "text-[#a3c2b2] hover:text-white hover:bg-[#133d31]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-transform",
                        isActive ? "text-[#d9ed89]" : "text-[#7ea592]"
                      )}
                    />
                    <span className="flex-1 truncate tracking-tight">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile User Profile & Sign Out */}
            <div className="p-3 border-t border-[#153f33] bg-[#09221b]">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0c2b22] border border-[#153f33]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#184e40] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                    {user?.fullName?.charAt(0) || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.fullName || "Administrator"}
                    </p>
                    <p className="text-[10px] text-[#749c87] truncate">
                      {user?.email || "admin@homi.local"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleLinkClick();
                    logout();
                  }}
                  title="Sign Out"
                  className="p-2 text-[#88a897] hover:text-rose-400 hover:bg-[#153f33] rounded-md transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar (Hidden on Mobile) */}
      <aside
        className={cn(
          "bg-[#0c2b22] text-[#d1e0d7] hidden md:flex flex-col shrink-0 border-r border-[#153f33] transition-all duration-300 relative select-none h-screen sticky top-0 z-30",
          collapsed ? "w-18" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#153f33]">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="logo-icon shrink-0">
              <Wrench size={16} />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight font-['Manrope']">
                  homi<span className="text-[#a1c347]">.</span>
                </span>
                <span className="text-[10px] font-extrabold bg-[#d9ed89] text-[#123b30] px-1.5 py-0.5 rounded tracking-wider uppercase">
                  Admin
                </span>
              </div>
            )}
          </Link>

          {/* Collapse toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#88a897] hover:text-white p-1 rounded-md hover:bg-[#153f33] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links - Clean single list of 8 items */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-[#153f33]">
          {!collapsed && (
            <p className="px-3 text-[10px] font-extrabold text-[#749c87] uppercase tracking-wider mb-2">
              Platform Menu
            </p>
          )}

          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all group",
                  isActive
                    ? "bg-[#184e40] text-[#d9ed89] shadow-xs"
                    : "text-[#a3c2b2] hover:text-white hover:bg-[#133d31]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                    isActive ? "text-[#d9ed89]" : "text-[#7ea592] group-hover:text-white"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate tracking-tight">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom User & Logout Profile */}
        <div className="p-3 border-t border-[#153f33] bg-[#09221b]">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0c2b22] border border-[#153f33]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#184e40] text-[#d9ed89] font-extrabold text-xs flex items-center justify-center shrink-0">
                  {user?.fullName?.charAt(0) || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.fullName || "Administrator"}
                  </p>
                  <p className="text-[10px] text-[#749c87] truncate">
                    {user?.email || "admin@homi.local"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 text-[#88a897] hover:text-rose-400 hover:bg-[#153f33] rounded-md transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="w-full flex justify-center p-2 text-[#88a897] hover:text-rose-400 hover:bg-[#153f33] rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}