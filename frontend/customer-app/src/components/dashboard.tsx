"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { LanguagePicker, useAppCopy, useLanguage } from "@/components/language";
import { Notifications } from "@/components/notifications";
import { Logo, useCurrentUser } from "@/components/site";
import type { User } from "@/components/site";
import { supabase, syncSessionCookie } from "@/lib/supabase";

export function DashboardShell({
  user,
  role = "customer",
  children,
}: {
  user: User;
  role?: "customer" | "worker";
  children: React.ReactNode;
}) {
  const path = usePathname();
  const { language, t } = useLanguage();
  const { a } = useAppCopy();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  async function logout() {
    try {
      await supabase.auth.signOut().catch(() => null);
      syncSessionCookie(null);
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      window.location.assign("/auth?mode=login");
    }
  }

  return (
    <div className="dashboard-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="dash-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop sticky + Mobile slide-out drawer) */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? "drawer-open" : ""}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo">
            <Logo />
          </div>
          <button
            type="button"
            className="dash-drawer-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-caption">
          {language === "hi" ? "ग्राहक मेनू" : "Customer Menu"}
        </div>

        <nav className="dash-nav">
          <Link
            href="/customer"
            onClick={() => setMobileMenuOpen(false)}
            className={
              path === "/customer" || path.startsWith("/requests")
                ? "active"
                : ""
            }
          >
            <LayoutDashboard size={19} />
            <span>{t("myRequests")}</span>
          </Link>
          <Link
            href="/book"
            onClick={() => setMobileMenuOpen(false)}
            className={path === "/book" ? "active" : ""}
          >
            <Plus size={19} />
            <span>{t("sendRequest")}</span>
          </Link>
          <Link
            href="/workers"
            onClick={() => setMobileMenuOpen(false)}
            className={path === "/workers" ? "active" : ""}
          >
            <UsersRound size={19} />
            <span>{language === "hi" ? "स्थानीय कारीगर खोजें" : "Find Local Workers"}</span>
          </Link>
          <Link
            href="/overview"
            onClick={() => setMobileMenuOpen(false)}
            className={path === "/overview" ? "active" : ""}
          >
            <Wallet size={19} />
            <span>{language === "hi" ? "सेवा इतिहास व रसीदें" : "Service History & Records"}</span>
          </Link>
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={path === "/settings" ? "active" : ""}
          >
            <Settings size={19} />
            <span>{language === "hi" ? "मेरी प्रोफाइल" : "My Profile"}</span>
          </Link>
        </nav>

        <div className="dash-sidebar-footer">
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="dash-sidebar-user"
          >
            <span className="dash-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "A"}
            </span>
            <div className="dash-sidebar-user-info">
              <span className="dash-sidebar-user-name">{user.name}</span>
              <span className="dash-sidebar-user-email">{user.email}</span>
            </div>
          </Link>
          <button className="dash-logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="dash-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo shown on mobile only, outside breadcrumb */}
            <Logo className="dash-mobile-logo" showText={false} />

            <div className="dash-breadcrumb">
              <span className="breadcrumb-brand">homi</span>
              <span className="breadcrumb-divider">/</span>
              <strong className="breadcrumb-current">
                {path === "/settings"
                  ? a("profile")
                  : path === "/overview"
                  ? "Service Records"
                  : path.startsWith("/requests")
                  ? a("requestDetails")
                  : t("myRequests")}
              </strong>
            </div>
          </div>

          <div className="dash-top-actions">
            <LanguagePicker />
            <Notifications />
            <Link href="/" className="dash-home-link" title={t("backHome")}>
              <ArrowLeft size={16} />
              <span>{t("backHome")}</span>
            </Link>
            <Link
              href="/settings"
              className="dash-user-chip"
              title={user.email}
              aria-label={a("profile")}
            >
              <span className="dash-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </span>
              <span className="dash-user-name">{user.name.split(" ")[0]}</span>
            </Link>
          </div>
        </header>

        <main className="dash-body">{children}</main>

        <nav className="mobile-dash-nav" aria-label="Mobile navigation">
          <Link
            href="/customer"
            className={path === "/customer" ? "active" : ""}
          >
            <LayoutDashboard size={20} />
            <span>{t("myRequests")}</span>
          </Link>
          <Link
            href="/book"
            className={path === "/book" ? "active" : ""}
          >
            <Plus size={20} />
            <span>{t("sendRequest")}</span>
          </Link>
          <Link
            href="/overview"
            className={path === "/overview" ? "active" : ""}
            aria-label="Records"
          >
            <Wallet size={20} />
            <span>{a("payment")}</span>
          </Link>
          <Link
            href="/settings"
            className={path === "/settings" ? "active" : ""}
          >
            <Settings size={20} />
            <span>{a("account")}</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function DashboardGuard({ role = "customer" }: { role?: "customer" | "worker" }) {
  const { t } = useLanguage();
  return (
    <div className="guard-page">
      <div className="guard-page-top">
        <Logo />
        <LanguagePicker />
      </div>
      <div className="guard-box">
        <span className="guard-icon">
          <CalendarDays size={27} />
        </span>
        <h1>{t("guardTitle")}</h1>
        <p>{t("guardDetail")}</p>
        <Link href="/book" className="btn btn-dark">
          {t("sendRequest")}
        </Link>
        <Link href="/auth?mode=login" className="guard-back">
          Sign In
        </Link>
        <Link href="/" className="guard-back">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
