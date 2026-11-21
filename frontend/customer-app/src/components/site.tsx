"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Armchair, Droplets, Fan, Hammer, House, Menu, PaintRoller, PlugZap, Sparkles, Wrench, X, Users, Briefcase, FileText, User, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LanguagePicker, useAppCopy, useLanguage } from "@/components/language";
import { useReportCopy } from "@/components/report-language";
import type { Language } from "@/lib/locales";
import { supabase, syncSessionCookie } from "@/lib/supabase";
export type CustomerQuotation = {
  id: number;
  requestId: number;
  customerId?: number;
  selectedWorkerId?: number | null;
  selectedWorkerName: string;
  selectedWorkerPhone?: string;
  workDescription: string;
  labourCharges: number;
  materialCharges: number;
  inspectionCharges: number;
  additionalCharges: number;
  discount: number;
  finalTotal: number;
  estimatedDuration: string;
  proposedVisitDate: string;
  proposedVisitTime: string;
  notes: string;
  status: string;
  declineReason?: string | null;
  sentAt: string;
  decidedAt?: string | null;
};

export type User = { id: number; name: string; email: string; phone: string; role: string; city: string | null; specialty: string | null; bio: string | null; spokenLanguages: string; experienceYears: number; visitFee: number; available: boolean; address: string | null; latitude: number | null; longitude: number | null; locationLabel: string | null; locationSource: string | null; locationAccuracy: number | null; locationUpdatedAt: string | null; serviceRadiusKm: number };
export type ServiceRequest = {
  id: number;
  customerId: number;
  category: string;
  title: string;
  description: string;
  address: string;
  city: string;
  preferredDate: string;
  preferredTime: string;
  preferredLanguage: string;
  isDemo: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  contactName?: string | null;
  contactPhone?: string | null;
  customerEmail: string;
  workerName: string | null;
  workerPhone: string | null;
  workerId: number | null;
  requestedWorkerId: number | null;
  requestedWorkerName: string | null;
  workerSpecialty: string | null;
  quotedAmount: number | null;
  quoteNote: string | null;
  quoteStatus: string;
  whatsappSharedAt?: string | null;
  selectedWorkerId?: number | null;
  selectedWorkerName?: string | null;
  selectedWorkerPhone?: string | null;
  quoteLabourCharges?: number | null;
  quoteMaterialCharges?: number | null;
  quoteInspectionCharges?: number | null;
  quoteAdditionalCharges?: number | null;
  quoteDiscount?: number | null;
  quoteFinalTotal?: number | null;
  quoteWorkDescription?: string | null;
  quoteEstimatedDuration?: string | null;
  quoteProposedVisitDate?: string | null;
  quoteProposedVisitTime?: string | null;
  quoteNotes?: string | null;
  quoteSentAt?: string | null;
  customerApprovedAt?: string | null;
  customerDeclinedAt?: string | null;
  customerDeclineReason?: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  reviewRating: number | null;
  reviewComment: string | null;
  quotation?: CustomerQuotation | null;
  customerQuotations?: CustomerQuotation[];
  photoCount: number;
  visitStartsAt: string | null;
  proposedVisitAt: string | null;
  visitProposalBy: number | null;
  visitVersion: number;
  visitStatus: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  locationSource: string | null;
  locationAccuracy: number | null;
  distanceKm: number | null;
  hasLocation: boolean;
};
export type WorkerProfile = { id: number; name: string; city: string | null; specialty: string | null; bio: string | null; spokenLanguages: string; experienceYears: number; visitFee: number; available: boolean; rating: number | null; reviewCount: number; serviceRadiusKm: number; distanceKm: number | null; hasLocation: boolean; inRange?: boolean | null };
export const services: { name: string; subtitle: string; icon: LucideIcon; color: string }[] = [
  { name: "Plumbing", subtitle: "Taps, pipes & leaks", icon: Droplets, color: "#dfeefd" },
  { name: "Electrical", subtitle: "Fans, lights & switches", icon: PlugZap, color: "#fff0d8" },
  { name: "Carpentry", subtitle: "Doors & woodwork", icon: Hammer, color: "#f7e8d8" },
  { name: "Cleaning", subtitle: "Kitchen & home", icon: Sparkles, color: "#e9e4fa" },
  { name: "Painting", subtitle: "Walls & touch-ups", icon: PaintRoller, color: "#fce4e4" },
  { name: "Appliance repair", subtitle: "AC, fridge & washing machine", icon: Fan, color: "#e2f2e8" },
  { name: "Furniture repair", subtitle: "Sofas, chairs & beds", icon: Armchair, color: "#f4e9d9" },
  { name: "General handyman", subtitle: "Not sure? Start here", icon: Wrench, color: "#e5edee" },
];
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const headers: Record<string, string> = {};
        const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (sessionData?.session?.access_token) {
          headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
          syncSessionCookie(sessionData.session.access_token);
        }

        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "same-origin",
          headers,
        });
        const data = await response.json();
        if (mounted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        syncSessionCookie(session.access_token);
      } else {
        syncSessionCookie(null);
      }
      void load();
    });

    window.addEventListener("homi-account-updated", load);
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener("homi-account-updated", load);
    };
  }, []);

  return { user, loading };
}
export function Logo() { return <Link href="/" className="logo-mark" aria-label="homi home"><span className="logo-icon"><House size={21} strokeWidth={2.7}/></span><span>homi<span className="logo-dot">.</span></span></Link>; }
export function Header() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="header-nav hidden lg:flex" aria-label="Main navigation">
            <Link href="/#services">Services</Link>
            <Link href="/workers">Find Local Workers</Link>
            <Link href="/become-a-worker">I Am a Worker</Link>
            <Link href="/guide">Start Here</Link>
          </nav>

          <div className="header-actions">
            <div className="hidden sm:inline-flex">
              <LanguagePicker />
            </div>
            <Link
              href={user ? "/customer" : "/login"}
              className="header-account hidden sm:inline-flex"
            >
              {user ? (user.name ? user.name.split(" ")[0] : "Dashboard") : "Sign In"}
            </Link>
            <Link href="/book" className="btn btn-dark header-cta hidden sm:inline-flex">
              {t("sendRequest")} <ArrowRight size={16} />
            </Link>
            
            {/* Mobile Hamburger Toggle */}
            <button
              className="menu-button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              style={{
                width: 44,
                height: 44,
                display: "inline-grid",
                placeItems: "center",
                background: "transparent",
                border: 0,
                color: "#123b30",
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white text-[#183c31] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          paddingTop: "max(16px, env(safe-area-inset-top))",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
        aria-modal="true"
        role="dialog"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5ebe4]">
          <Logo />
          <button
            onClick={closeMenu}
            className="p-2 -mr-2 text-[#718078] hover:text-[#123b30] rounded-lg transition-colors"
            aria-label="Close menu"
            style={{ width: 44, height: 44, display: "grid", placeItems: "center" }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <Link
            onClick={closeMenu}
            href="/#services"
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-[#183c31] hover:bg-[#f0f4ee] transition-colors min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <Wrench size={18} className="text-[#557e62]" />
              <span>Services</span>
            </div>
            <ChevronRight size={16} className="text-[#a0b0a4]" />
          </Link>
          
          <Link
            onClick={closeMenu}
            href="/workers"
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-[#183c31] hover:bg-[#f0f4ee] transition-colors min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-[#557e62]" />
              <span>Find Local Workers</span>
            </div>
            <ChevronRight size={16} className="text-[#a0b0a4]" />
          </Link>

          <Link
            onClick={closeMenu}
            href="/become-a-worker"
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-[#183c31] hover:bg-[#f0f4ee] transition-colors min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <Briefcase size={18} className="text-[#557e62]" />
              <span>I Am a Worker</span>
            </div>
            <ChevronRight size={16} className="text-[#a0b0a4]" />
          </Link>

          <Link
            onClick={closeMenu}
            href="/guide"
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-[#183c31] hover:bg-[#f0f4ee] transition-colors min-h-[48px]"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-[#557e62]" />
              <span>Start Here</span>
            </div>
            <ChevronRight size={16} className="text-[#a0b0a4]" />
          </Link>

          <div className="pt-3 border-t border-[#e5ebe4]">
            {user ? (
              <Link
                onClick={closeMenu}
                href="/customer"
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold text-[#123b30] bg-[#f0f4ee] transition-colors min-h-[48px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#123b30] text-[#d9ed89] text-[11px] flex items-center justify-center font-bold">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span>Customer Dashboard</span>
                </div>
                <ChevronRight size={16} className="text-[#557e62]" />
              </Link>
            ) : (
              <Link
                onClick={closeMenu}
                href="/login"
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold text-[#183c31] hover:bg-[#f0f4ee] transition-colors min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <User size={18} className="text-[#557e62]" />
                  <span>Customer Sign In</span>
                </div>
                <ChevronRight size={16} className="text-[#a0b0a4]" />
              </Link>
            )}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="px-5 py-4 border-t border-[#e5ebe4] space-y-3 bg-[#f8faf5]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#718078]">Language</span>
            <LanguagePicker />
          </div>
          <Link
            onClick={closeMenu}
            href="/book"
            className="btn btn-dark w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs min-h-[48px]"
          >
            <span>{t("sendRequest")}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo />
            <p>
              Everyday household help, simple and close to home.
              <br />
              Connect directly with verified local service professionals in your city.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <strong>Explore</strong>
              <Link href="/#services">Services</Link>
              <Link href="/workers">Find Local Workers</Link>
              <Link href="/guide">Start Here</Link>
              <Link href="/book">Send a Request</Link>
            </div>
            <div>
              <strong>For You</strong>
              <Link href="/become-a-worker">I Am a Worker</Link>
              <Link href="/login">Customer Sign In</Link>
              <Link href="/customer">My Requests</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} homi. Everyday household help, simple and close to home.</span>
          <span>Quality local care for every home <span className="heart">♥</span></span>
        </div>
      </div>
    </footer>
  );
}
export const statusLabels: Record<string, string> = {
  open: "Looking for a worker",
  new: "Review Pending",
  NEW: "Review Pending",
  pending_admin_review: "Review Pending",
  PENDING_ADMIN_REVIEW: "Review Pending",
  shared_with_workers: "Finding a Worker",
  SHARED_WITH_WORKERS: "Finding a Worker",
  open_for_applications: "Finding a Worker",
  OPEN_FOR_APPLICATIONS: "Finding a Worker",
  worker_selected: "Worker Selected",
  WORKER_SELECTED: "Worker Selected",
  customer_approval_pending: "Price Approval Pending",
  CUSTOMER_APPROVAL_PENDING: "Price Approval Pending",
  customer_confirmed: "Confirmed by Customer",
  CUSTOMER_CONFIRMED: "Confirmed by Customer",
  customer_declined: "Quotation Declined",
  CUSTOMER_DECLINED: "Quotation Declined",
  assigned: "Technician Assigned",
  ASSIGNED: "Technician Assigned",
  accepted: "Technician Assigned",
  ACCEPTED: "Technician Assigned",
  on_the_way: "Worker on the way",
  in_progress: "Work in Progress",
  IN_PROGRESS: "Work in Progress",
  completed: "Completed",
  COMPLETED: "Completed",
  cancelled: "Cancelled",
  CANCELLED: "Cancelled",
  rejected: "Request Declined",
  REJECTED: "Request Declined",
};
export function formatDate(value: string, language: Language = "en") { return new Date(value + "T12:00:00").toLocaleDateString(`${language}-IN`, { month: "short", day: "numeric" }); }
