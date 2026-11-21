"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Armchair, Droplets, Fan, Hammer, House, Menu, PaintRoller, PlugZap, Sparkles, Wrench, X } from "lucide-react";
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

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className={`header-nav ${menuOpen ? "open" : ""}`} aria-label="Main navigation">
          <Link onClick={() => setMenuOpen(false)} href="/#services">Services</Link>
          <Link onClick={() => setMenuOpen(false)} href="/workers">Find Local Workers</Link>
          <Link onClick={() => setMenuOpen(false)} href="/become-a-worker">I Am a Worker</Link>
          <Link onClick={() => setMenuOpen(false)} href="/guide">Start Here</Link>
          {user && (
            <Link onClick={() => setMenuOpen(false)} href="/customer" className="mobile-only">
              My Requests
            </Link>
          )}
          <Link
            onClick={() => setMenuOpen(false)}
            href={user ? "/customer" : "/login"}
            className="mobile-only"
          >
            {user ? (user.name ? user.name.split(" ")[0] : "Dashboard") : "Sign In"}
          </Link>
        </nav>
        <div className="header-actions">
          <LanguagePicker />
          <Link
            href={user ? "/customer" : "/login"}
            className="header-account"
          >
            {user ? (user.name ? user.name.split(" ")[0] : "Dashboard") : "Sign In"}
          </Link>
          <Link href="/book" className="btn btn-dark header-cta">
            {t("sendRequest")} <ArrowRight size={16} />
          </Link>
        </div>
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
    </header>
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
