"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MessageCircle,
  Send,
  Star,
  Wrench,
  UserCheck,
  Calendar,
  AlertCircle,
  XCircle,
  FileText,
  User,
  ShieldCheck,
  Phone,
  Copy,
  QrCode,
  Building2,
  CreditCard,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import { DashboardGuard, DashboardShell } from "@/components/dashboard";
import { RequestCard } from "@/components/request-card";
import { useAppCopy, useLanguage } from "@/components/language";
import { useCurrentUser, type ServiceRequest, type CustomerQuotation } from "@/components/site";
import { money } from "@/lib/app-copy";
import { RequestLocation } from "@/components/request-location";
import { locationText } from "@/lib/location-copy";
import { RequestPhotos } from "@/components/request-photos";
import { RequestVisit } from "@/components/request-visit";
import { useServiceCopy } from "@/components/service-language";
import { formatVisit } from "@/lib/visit-time";
import type { PhotoInfo } from "@/lib/photo-settings";
import { useReportCopy } from "@/components/report-language";

type ChatMessage = { id: number; senderId: number; senderName: string; body: string; createdAt: string };
type JobEvent = { id: number; kind: string; actorName: string | null; createdAt: string; data: { amount?: number; note?: string; method?: string; startsAt?: string; count?: number } };
type PaymentRecord = {
  id: number;
  requestId: number;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  paymentScreenshotPath?: string;
  status: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
};
type PaymentSettings = {
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  bankAccountHolder?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  enableUpi?: boolean;
  enableBank?: boolean;
};
type Detail = {
  request: ServiceRequest;
  quotation?: CustomerQuotation;
  assignment?: any;
  payment?: PaymentRecord;
  participant: boolean;
  messages: ChatMessage[];
  events: JobEvent[];
  photos: PhotoInfo[];
};

const TRACKING_STAGES = [
  { id: "submitted", label: "Request Submitted", hi: "अनुरोध भेजा गया" },
  { id: "finding", label: "Finding a Worker", hi: "कारीगर खोज जारी" },
  { id: "selected", label: "Worker Selected", hi: "कारीगर चुना गया" },
  { id: "price_approval", label: "Price Approval Pending", hi: "मूल्य स्वीकृति बाकी" },
  { id: "confirmed", label: "Confirmed", hi: "स्वीकृत एवं पुष्ट" },
  { id: "assigned", label: "Assigned", hi: "कारीगर नियुक्त" },
  { id: "in_progress", label: "Work In Progress", hi: "कार्य प्रगति पर" },
  { id: "completed", label: "Completed", hi: "पूर्ण हुआ" },
  { id: "cancelled", label: "Cancelled", hi: "रद्द / अस्वीकृत" },
];

function getStageIndex(rawStatus: string): number {
  const status = (rawStatus || "").toLowerCase();
  switch (status) {
    case "new":
    case "pending_admin_review":
    case "pending":
    case "":
      return 0;
    case "shared_with_workers":
    case "finding_worker":
    case "open_for_applications":
    case "open":
    case "approved":
    case "under_review":
      return 1;
    case "worker_selected":
      return 2;
    case "customer_approval_pending":
      return 3;
    case "customer_confirmed":
    case "accepted_by_customer":
      return 4;
    case "assigned":
    case "accepted":
      return 5;
    case "on_the_way":
    case "in_progress":
    case "awaiting_confirmation":
      return 6;
    case "completed":
      return 7;
    case "customer_declined":
    case "cancelled":
    case "rejected":
      return 8;
    default:
      return 0;
  }
}

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useCurrentUser();
  const { language, t, statusLabel } = useLanguage();
  const { a, eventLabel } = useAppCopy();
  const { s } = useServiceCopy();
  const { r } = useReportCopy();

  const [data, setData] = useState<Detail | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState({ amount: "", note: "" });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Customer decision state
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [showDeclineBox, setShowDeclineBox] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Payment states
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "BANK_TRANSFER" | "CASH">("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const messageBox = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.ok && resData.settings) {
          setPaymentSettings(resData.settings);
        }
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${id}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || (response.status >= 500 ? "Server is starting up. Please refresh in a moment." : t("errorServer")));
      setData({
        ...body,
        request: body.request,
        quotation: body.quotation || body.request?.quotation,
        assignment: body.assignment || body.request?.assignment,
        payment: body.payment || body.request?.payment,
        messages: Array.isArray(body?.messages) ? body.messages : [],
        events: Array.isArray(body?.events) ? body.events : [],
        photos: Array.isArray(body?.photos) ? body.photos : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorServer"));
    } finally {
      setFetching(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!user) return;
    void load();

    const handleSync = () => {
      if (!document.hidden) {
        void load();
      }
    };

    window.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    const interval = setInterval(() => {
      if (!document.hidden) void load();
    }, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [user, load]);

  const lastMessage = Array.isArray(data?.messages) && data.messages.length > 0
    ? data.messages[data.messages.length - 1]?.id
    : undefined;
  useEffect(() => {
    if (messageBox.current) messageBox.current.scrollTop = messageBox.current.scrollHeight;
  }, [lastMessage]);

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(action);
    setError("");
    try {
      const path =
        action === "message"
          ? `/api/requests/${id}/messages`
          : action === "review"
          ? `/api/requests/${id}/review`
          : `/api/requests/${id}`;
      const response = await fetch(path, {
        method: action === "message" || action === "review" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Action could not be completed. Please try again.");
      if (action === "message") setMessage("");
      if (action === "release") {
        window.location.assign("/worker");
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorServer"));
    } finally {
      setBusy("");
    }
  }

  async function handleCustomerDecision(decision: "accept" | "decline") {
    if (decisionBusy) return;
    setDecisionBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/requests/${id}/customer-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: declineReason }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to record your decision.");
      setShowDeclineBox(false);
      await load();
    } catch (err: any) {
      setError(err.message || t("errorServer"));
    } finally {
      setDecisionBusy(false);
    }
  }

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setPaymentError("Transaction ID / UTR Number is required");
      return;
    }
    if (!paymentDate) {
      setPaymentError("Payment date is required");
      return;
    }
    setSubmittingPayment(true);
    setPaymentError("");
    setPaymentSuccess("");
    try {
      let screenshotUrl = "";
      if (paymentScreenshot) {
        const formData = new FormData();
        formData.append("screenshot", paymentScreenshot);
        const uploadRes = await fetch(`/api/requests/${id}/payment/screenshot`, {
          method: "POST",
          body: formData,
        });
        const uploadBody = await uploadRes.json();
        if (uploadRes.ok && uploadBody.url) {
          screenshotUrl = uploadBody.url;
        }
      }

      const res = await fetch(`/api/requests/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: quoteTotal,
          paymentMethod,
          transactionReference: transactionRef.trim(),
          paymentDate,
          paymentScreenshotPath: screenshotUrl,
        }),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || "Failed to submit payment details");
      setPaymentSuccess(
        resBody.message || "Payment details submitted successfully. Your payment is awaiting verification by Homi administration."
      );
      setTransactionRef("");
      setPaymentScreenshot(null);
      setShowPaymentForm(false);
      await load();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to submit payment details");
    } finally {
      setSubmittingPayment(false);
    }
  }

  if (loading) return <div className="page-loading">{t("loading")}</div>;
  if (!user) return <DashboardGuard role="customer" />;

  const role = user.role === "worker" ? "worker" : "customer";
  const job = data?.request;
  const owner = job
    ? job.customerId === user.id ||
      user.role === "admin" ||
      (Boolean(user.phone && (job.contactPhone || job.customerPhone)) &&
        (user.phone === (job.contactPhone || job.customerPhone) ||
          user.phone.endsWith(job.contactPhone || job.customerPhone || "") ||
          (job.contactPhone || job.customerPhone || "").endsWith(user.phone)))
    : false;
  const assigned = job?.workerId === user.id;

  const normStatus = (job?.status || "").toLowerCase();
  const currentStageIndex = job ? getStageIndex(normStatus) : 0;
  const isCancelledState = ["cancelled", "customer_declined", "rejected"].includes(normStatus);

  const quotation = data?.quotation || job?.quotation;
  const quoteTotal = job?.quoteFinalTotal ?? quotation?.finalTotal ?? (job?.quotedAmount ? job.quotedAmount / 100 : 0);
  const workerName = job?.selectedWorkerName || quotation?.selectedWorkerName || "Homi Verified Technician";
  const workerPhone = job?.selectedWorkerPhone || quotation?.selectedWorkerPhone;
  const workDesc = job?.quoteWorkDescription || quotation?.workDescription || job?.description;
  const visitDate = job?.quoteProposedVisitDate || quotation?.proposedVisitDate || job?.preferredDate;
  const visitTime = job?.quoteProposedVisitTime || quotation?.proposedVisitTime || job?.preferredTime;
  const duration = job?.quoteEstimatedDuration || quotation?.estimatedDuration || "1-2 hours";
  const hasQuotation = Boolean(quoteTotal > 0 || job?.quoteLabourCharges || quotation || normStatus === "customer_approval_pending" || normStatus === "customer_confirmed");

  const stamp = (value: string) =>
    new Date(value).toLocaleString(`${language}-IN`, {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <DashboardShell user={user} role={role}>
      <Link href={role === "worker" ? "/worker" : "/customer"} className="back-link">
        <ArrowLeft size={16} />
        {a("back")}
      </Link>

      <div className="detail-heading">
        <div>
          <span className="section-kicker">{a("requestDetails")}</span>
          <h1>{job ? `#HOMI-${job.id}` : a("requestDetails")}</h1>
        </div>
        {job && <span className={`status-pill status-${job.status}`}>{statusLabel(job.status)}</span>}
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="panel-loading">{t("loading")}</div>
      ) : !job || !data ? (
        <div className="empty-state">
          <Wrench size={32} />
          <h3>{t("noRequests")}</h3>
          <Link className="btn btn-dark" href={role === "worker" ? "/worker" : "/customer"}>
            {a("back")}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visual 9-Stage Tracking Timeline */}
          <section className="workspace-panel">
            <h2 style={{ fontSize: "14px", fontWeight: "800", color: "#123b30", marginBottom: "14px" }}>
              {language === "hi" ? "अनुरोध प्रगति स्थिति" : "Service Request Progress Timeline"}
            </h2>
            <div className="tracking-timeline-grid">
              {TRACKING_STAGES.map((st, idx) => {
                const isPassed = !isCancelledState ? idx <= currentStageIndex : idx === 8;
                const isCurrent = !isCancelledState ? idx === currentStageIndex : idx === 8;
                const isRed = isCancelledState && idx === 8;

                return (
                  <div
                    key={st.id}
                    className="tracking-timeline-step"
                    style={{
                      background: isRed
                        ? "#fdf2f2"
                        : isCurrent
                        ? "#d9ed89"
                        : isPassed
                        ? "#ecf6e5"
                        : "#f8faf5",
                      border: isRed
                        ? "1px solid #f5c6c6"
                        : isCurrent
                        ? "2px solid #123b30"
                        : isPassed
                        ? "1px solid #cbe1c3"
                        : "1px solid #e5ebe4",
                      borderRadius: "8px",
                      padding: "8px 6px",
                      textAlign: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        color: isRed
                          ? "#991b1b"
                          : isCurrent
                          ? "#123b30"
                          : isPassed
                          ? "#285437"
                          : "#8a998d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      {isPassed && !isRed ? <Check size={11} strokeWidth={3} /> : null}
                      <span>Stage {idx + 1}</span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: isCurrent ? "800" : "600",
                        color: isRed ? "#991b1b" : isCurrent ? "#123b30" : "#4a5d4e",
                        marginTop: "3px",
                        lineHeight: 1.2,
                      }}
                    >
                      {language === "hi" ? st.hi : st.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Service Quotation Card */}
          {hasQuotation && (
            <section
              className="workspace-panel service-quotation-panel"
              style={{
                background: "#ffffff",
                border: normStatus === "customer_approval_pending" ? "2px solid #285437" : "1px solid #cbe1c3",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: normStatus === "customer_approval_pending" ? "0 6px 22px rgba(18, 59, 48, 0.12)" : "0 2px 10px rgba(0,0,0,0.04)",
                marginBottom: "20px",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      background: normStatus === "customer_approval_pending" ? "#d9ed89" : "#285437",
                      color: normStatus === "customer_approval_pending" ? "#123b30" : "#d9ed89",
                      padding: "8px",
                      borderRadius: "10px",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </span>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#123b30", margin: 0 }}>
                      {normStatus === "customer_approval_pending"
                        ? (language === "hi" ? "सेवा कोटेशन — आपकी स्वीकृति आवश्यक" : "Service Quotation — Action Required")
                        : (normStatus === "customer_confirmed" || normStatus === "accepted_by_customer")
                        ? (language === "hi" ? "कोटेशन स्वीकृत हो चुका है ✓" : "Quotation Confirmed & Accepted ✓")
                        : (normStatus === "customer_declined")
                        ? (language === "hi" ? "कोटेशन अस्वीकृत" : "Quotation Declined")
                        : (language === "hi" ? "आधिकारिक सेवा कोटेशन" : "Official Service Quotation")}
                    </h2>
                    <p style={{ fontSize: "13px", color: "#48624d", margin: "3px 0 0" }}>
                      {normStatus === "customer_approval_pending"
                        ? (language === "hi" ? "कारीगर की कोटेशन और समय का विवरण देखें और कार्य की पुष्टि करें।" : "Review the technician visit fee, schedule, and scope below to confirm your booking.")
                        : (normStatus === "customer_confirmed" || normStatus === "accepted_by_customer")
                        ? (language === "hi" ? `आपने ₹${quoteTotal} का कोटेशन स्वीकार कर लिया है। एडमिन तकनीशियन की नियुक्ति अंतिम कर रहे हैं।` : `You accepted this quotation of ₹${quoteTotal}. Admin is finalizing worker dispatch.`)
                        : (language === "hi" ? "इस अनुरोध के लिए स्वीकृत कोटेशन विवरण।" : `Confirmed quotation breakdown for Request #HOMI-${job.id}.`)}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    background: normStatus === "customer_approval_pending" ? "#fef3c7" : "#ecfdf5",
                    color: normStatus === "customer_approval_pending" ? "#92400e" : "#065f46",
                    border: normStatus === "customer_approval_pending" ? "1px solid #fde68a" : "1px solid #a7f3d0",
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "6px 14px",
                    borderRadius: "20px",
                  }}
                >
                  {statusLabel(job.status)}
                </span>
              </div>

              {/* Technician & Proposed Schedule */}
              <div
                style={{
                  background: "#f8faf6",
                  border: "1px solid #e2ede0",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "14px",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {language === "hi" ? "सेवा प्रदाता" : "Service Provider"}
                    </span>
                    <strong style={{ display: "block", fontSize: "15px", color: "#123b30", marginTop: "3px" }}>
                      {language === "hi" ? "होमई सत्यापित सेवा प्रदाता" : "Homi Verified Technician Partner"}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#475569" }}>
                      {language === "hi" ? "स्वीकृति पर तकनीशियन नियुक्त होगा" : "Dedicated technician assigned upon acceptance"}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {language === "hi" ? "प्रस्तावित आगमन समय" : "Proposed Visit Schedule"}
                    </span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#123b30", marginTop: "3px" }}>
                      📅 {visitDate} · {visitTime || "As soon as possible"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {language === "hi" ? "अनुमानित समय" : "Estimated Duration"}
                    </span>
                    <strong style={{ display: "block", fontSize: "14px", color: "#123b30", marginTop: "3px" }}>
                      ⏱️ {duration}
                    </strong>
                  </div>
                </div>

                {workDesc && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #e8eee6" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {language === "hi" ? "कार्य का विवरण एवं दायरा" : "Work Scope & Description"}
                    </span>
                    <p style={{ fontSize: "13px", color: "#183c31", margin: "4px 0 0", lineHeight: 1.5 }}>
                      {workDesc}
                    </p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div
                style={{
                  border: "1px solid #e2ede0",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  background: "#fff",
                  marginBottom: normStatus === "customer_approval_pending" ? "20px" : "0",
                }}
              >
                <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#123b30", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {language === "hi" ? "कोटेशन शुल्क विवरण" : "Official Price Breakdown"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#48624d" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{language === "hi" ? "श्रम शुल्क (Labour Charges)" : "Labour Charges"}:</span>
                    <strong>₹{job.quoteLabourCharges ?? quotation?.labourCharges ?? 0}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{language === "hi" ? "सामग्री शुल्क (Material / Parts)" : "Material / Parts"}:</span>
                    <strong>₹{job.quoteMaterialCharges ?? quotation?.materialCharges ?? 0}</strong>
                  </div>
                  {((job.quoteInspectionCharges ?? quotation?.inspectionCharges ?? 0) + (job.quoteAdditionalCharges ?? quotation?.additionalCharges ?? 0)) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{language === "hi" ? "निरीक्षण व अन्य शुल्क" : "Inspection & Additional Charges"}:</span>
                      <strong>₹{(job.quoteInspectionCharges ?? quotation?.inspectionCharges ?? 0) + (job.quoteAdditionalCharges ?? quotation?.additionalCharges ?? 0)}</strong>
                    </div>
                  )}
                  {(job.quoteDiscount ?? quotation?.discount ?? 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b91c1c" }}>
                      <span>{language === "hi" ? "छूट (Discount)" : "Discount"}:</span>
                      <strong>-₹{job.quoteDiscount ?? quotation?.discount}</strong>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "18px",
                      fontWeight: "900",
                      color: "#123b30",
                      paddingTop: "12px",
                      marginTop: "6px",
                      borderTop: "2px dashed #e2ede0",
                    }}
                  >
                    <span>{language === "hi" ? "कुल देय राशि (Final Total)" : "Final Amount to Pay"}:</span>
                    <span style={{ color: "#123b30" }}>
                      ₹{quoteTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Accept & Confirm / Decline when CUSTOMER_APPROVAL_PENDING */}
              {normStatus === "customer_approval_pending" && (
                !showDeclineBox ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "16px" }}>
                    <button
                      type="button"
                      disabled={decisionBusy}
                      onClick={() => handleCustomerDecision("accept")}
                      className="btn btn-dark"
                      style={{
                        background: "#123b30",
                        color: "#d9ed89",
                        padding: "14px 24px",
                        fontSize: "14px",
                        fontWeight: "800",
                        borderRadius: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(18, 59, 48, 0.2)",
                        border: "none",
                        minHeight: "44px",
                        flex: "1 1 200px",
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                      <span>
                        {decisionBusy
                          ? (language === "hi" ? "स्वीकृति प्रक्रिया जारी..." : "Confirming...")
                          : (language === "hi" ? `स्वीकार एवं पुष्ट करें (₹${quoteTotal})` : `Accept & Confirm (₹${quoteTotal})`)}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={decisionBusy}
                      onClick={() => setShowDeclineBox(true)}
                      className="btn btn-secondary"
                      style={{
                        background: "#fff",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                        padding: "14px 20px",
                        fontSize: "14px",
                        fontWeight: "700",
                        borderRadius: "10px",
                        cursor: "pointer",
                        minHeight: "44px",
                        flex: "1 1 140px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {language === "hi" ? "कोटेशन अस्वीकृत करें" : "Decline Quotation"}
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#fff5f5",
                      border: "1px solid #fed7d7",
                      borderRadius: "10px",
                      padding: "16px",
                      marginTop: "16px",
                    }}
                  >
                    <label
                      style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#9b2c2c", marginBottom: "6px" }}
                    >
                      {language === "hi" ? "अस्वीकृत करने का कारण (वैकल्पिक)" : "Reason for declining (Optional)"}
                    </label>
                    <textarea
                      rows={2}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder={language === "hi" ? "उदा. शुल्क अधिक है, समय उपयुक्त नहीं, इत्यादि..." : "e.g. Price is too high, timing does not suit..."}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "13px",
                        borderRadius: "8px",
                        border: "1px solid #feb2b2",
                        background: "#fff",
                        outline: "none",
                        marginBottom: "10px",
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        disabled={decisionBusy}
                        onClick={() => handleCustomerDecision("decline")}
                        style={{
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 18px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {decisionBusy ? "Submitting..." : (language === "hi" ? "अस्वीकृति की पुष्टि करें" : "Confirm Decline")}
                      </button>
                      <button
                        type="button"
                        disabled={decisionBusy}
                        onClick={() => setShowDeclineBox(false)}
                        style={{
                          background: "transparent",
                          color: "#718096",
                          border: "1px solid #cbd5e0",
                          borderRadius: "8px",
                          padding: "10px 16px",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        {language === "hi" ? "रद्द करें" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </section>
          )}

          {/* Customer Declined Banner */}
          {owner && normStatus === "customer_declined" && (
            <div
              style={{
                background: "#fdf2f2",
                border: "1px solid #f5c6c6",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "start",
                gap: "12px",
              }}
            >
              <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong style={{ fontSize: "13px", color: "#991b1b", display: "block" }}>
                  Quotation Declined
                </strong>
                <p style={{ fontSize: "12px", color: "#7f1d1d", margin: "2px 0 0" }}>
                  Reason: <em>"{job.customerDeclineReason || "Price or schedule did not suit"}"</em>. Our support team will review and contact you if alternative arrangements can be made.
                </p>
              </div>
            </div>
          )}

          {/* Assigned Worker Banner & Direct Actions */}
          {(normStatus === "assigned" || normStatus === "in_progress" || normStatus === "on_the_way") && (
            <div
              style={{
                background: "#ffffff",
                border: "2px solid #285437",
                borderRadius: "14px",
                padding: "22px 24px",
                boxShadow: "0 6px 20px rgba(18, 59, 48, 0.08)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      background: "#123b30",
                      color: "#d9ed89",
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#285437", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {language === "hi" ? "कारीगर नियुक्त हो चुका है" : "Verified Technician Assigned"}
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#123b30", margin: "2px 0 0" }}>
                      {workerName}
                    </h2>
                  </div>
                </div>

                <span
                  style={{
                    background: normStatus === "in_progress" ? "#eff6ff" : "#ecfdf5",
                    color: normStatus === "in_progress" ? "#1d4ed8" : "#065f46",
                    border: normStatus === "in_progress" ? "1px solid #bfdbfe" : "1px solid #a7f3d0",
                    fontSize: "12px",
                    fontWeight: "800",
                    padding: "6px 14px",
                    borderRadius: "20px",
                  }}
                >
                  {statusLabel(job.status)}
                </span>
              </div>

              {/* Visit and Price info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  background: "#f8faf6",
                  border: "1px solid #e2ede0",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                    {language === "hi" ? "आगमन समय" : "Scheduled Visit"}
                  </span>
                  <strong style={{ display: "block", color: "#123b30", marginTop: "2px" }}>
                    📅 {visitDate} · {visitTime || "Flexible"}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                    {language === "hi" ? "स्वीकृत देय राशि" : "Agreed Quote Amount"}
                  </span>
                  <strong style={{ display: "block", color: "#123b30", marginTop: "2px", fontSize: "15px" }}>
                    ₹{quoteTotal}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                    {language === "hi" ? "अनुमानित समय" : "Duration"}
                  </span>
                  <strong style={{ display: "block", color: "#123b30", marginTop: "2px" }}>
                    ⏱️ {duration}
                  </strong>
                </div>
              </div>

              {/* Direct Actions: Call and WhatsApp */}
              {workerPhone && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <a
                    href={`tel:${workerPhone.replace(/\D/g, "")}`}
                    style={{
                      background: "#123b30",
                      color: "#d9ed89",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "800",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                    }}
                  >
                    <Phone size={15} />
                    <span>{language === "hi" ? `कारीगर को कॉल करें (${workerPhone})` : `Call Technician (${workerPhone})`}</span>
                  </a>

                  <a
                    href={`https://wa.me/${workerPhone.replace(/\D/g, "").replace(/^0/, "91").length === 10 ? `91${workerPhone.replace(/\D/g, "")}` : workerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${workerName}, regarding my Homi service booking #HOMI-${job.id} for ${job.category}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#25D366",
                      color: "#ffffff",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "800",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      textDecoration: "none",
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Payment Section (Activated when work is COMPLETED) */}
          {normStatus === "completed" && (() => {
            const currentPayment = data?.payment || (job as any).payment;
            const currentPaymentStatus = (job.paymentStatus || currentPayment?.status || "PAYMENT_PENDING").toUpperCase();

            // Case 1: Already Paid and Verified
            if (currentPaymentStatus === "PAID") {
              return (
                <section
                  className="workspace-panel"
                  style={{
                    background: "#ecfdf5",
                    border: "2px solid #10b981",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          background: "#10b981",
                          color: "#ffffff",
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <ShieldCheck size={26} />
                      </span>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#065f46", textTransform: "uppercase" }}>
                          {language === "hi" ? "भुगतान पूर्ण" : "Payment Verified & Settled"}
                        </span>
                        <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#064e3b", margin: "2px 0 0" }}>
                          {language === "hi" ? `₹${quoteTotal} का भुगतान स्वीकृत ✓` : `Payment of ₹${quoteTotal} Verified ✓`}
                        </h2>
                      </div>
                    </div>

                    <Link
                      href={`/requests/${job.id}/receipt`}
                      className="btn btn-dark"
                      style={{
                        background: "#064e3b",
                        color: "#d9ed89",
                        fontWeight: "700",
                        padding: "10px 18px",
                        borderRadius: "10px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        textDecoration: "none",
                        fontSize: "13px",
                      }}
                    >
                      <FileText size={16} />
                      <span>{language === "hi" ? "रसीद देखें" : "View Receipt"}</span>
                    </Link>
                  </div>

                  {currentPayment && (
                    <div style={{ marginTop: "14px", fontSize: "12px", color: "#065f46", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      <span><strong>{language === "hi" ? "भुगतान माध्यम" : "Method"}:</strong> {currentPayment.paymentMethod}</span>
                      <span><strong>{language === "hi" ? "यूटीआर / संदर्भ" : "Ref / UTR"}:</strong> {currentPayment.transactionReference}</span>
                      {currentPayment.verifiedAt && <span><strong>{language === "hi" ? "सत्यापित" : "Verified At"}:</strong> {stamp(currentPayment.verifiedAt)}</span>}
                    </div>
                  )}
                </section>
              );
            }

            // Case 2: Payment Submitted - Waiting for Admin Verification
            if (currentPaymentStatus === "PAYMENT_SUBMITTED") {
              return (
                <section
                  className="workspace-panel"
                  style={{
                    background: "#fffbeb",
                    border: "2px solid #f59e0b",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <span
                      style={{
                        background: "#f59e0b",
                        color: "#ffffff",
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Clock3 size={24} />
                    </span>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#92400e", textTransform: "uppercase" }}>
                        {language === "hi" ? "सत्यापन बाकी" : "Verification In Progress"}
                      </span>
                      <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#78350f", margin: "2px 0 0" }}>
                        {language === "hi" ? "भुगतान जमा किया गया — एडमिन पुष्टि जारी" : "Payment Submitted — Pending Verification"}
                      </h2>
                    </div>
                  </div>

                  <p style={{ fontSize: "13px", color: "#92400e", margin: "0 0 14px 0", lineHeight: 1.5 }}>
                    {language === "hi"
                      ? "आपके द्वारा सबमिट किया गया भुगतान संदर्भ बैंक रिकॉर्ड से मिलाया जा रहा है। पुष्टि होते ही रसीद यहां उपलब्ध होगी।"
                      : "We received your payment reference. Our accounts team is verifying the transaction with our bank. Status will update to Paid once verified."}
                  </p>

                  {currentPayment && (
                    <div
                      style={{
                        background: "#fef3c7",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#78350f",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "18px",
                      }}
                    >
                      <span><strong>{language === "hi" ? "राशि" : "Amount"}:</strong> ₹{currentPayment.amount || quoteTotal}</span>
                      <span><strong>{language === "hi" ? "माध्यम" : "Method"}:</strong> {currentPayment.paymentMethod}</span>
                      <span><strong>{language === "hi" ? "यूटीआर / संदर्भ संख्या" : "UTR / Ref"}:</strong> {currentPayment.transactionReference}</span>
                    </div>
                  )}
                </section>
              );
            }

            // Case 3: Payment Required (PAYMENT_PENDING or PAYMENT_REJECTED)
            const upiId = paymentSettings?.upiId || "homi@upi";
            const payeeName = paymentSettings?.payeeName || "Homi Everyday Care";
            const qrUrl = paymentSettings?.qrCodeUrl || "/images/payment-qr.jpg";

            return (
              <section
                className="workspace-panel"
                style={{
                  background: "#ffffff",
                  border: currentPaymentStatus === "PAYMENT_REJECTED" ? "2px solid #ef4444" : "2px solid #123b30",
                  borderRadius: "14px",
                  padding: "24px",
                  boxShadow: "0 6px 24px rgba(18, 59, 48, 0.1)",
                  marginBottom: "20px",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        background: currentPaymentStatus === "PAYMENT_REJECTED" ? "#fee2e2" : "#d9ed89",
                        color: currentPaymentStatus === "PAYMENT_REJECTED" ? "#b91c1c" : "#123b30",
                        padding: "10px",
                        borderRadius: "12px",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <CreditCard size={24} />
                    </span>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#123b30", margin: 0 }}>
                        {language === "hi" ? "कार्य पूर्ण — भुगतान करें" : "Service Work Completed — Payment Required"}
                      </h2>
                      <p style={{ fontSize: "13px", color: "#48624d", margin: "2px 0 0" }}>
                        {language === "hi"
                          ? `कारीगर ने कार्य पूर्ण कर दिया है। कृपया देय राशि ₹${quoteTotal} का भुगतान नीचे दिए गए UPI अथवा बैंक खाते में करें।`
                          : `The technician has completed the work. Please pay the total amount of ₹${quoteTotal} via UPI or Bank Transfer below.`}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                      {language === "hi" ? "कुल देय राशि" : "Payable Amount"}
                    </span>
                    <div style={{ fontSize: "26px", fontWeight: "900", color: "#123b30", lineHeight: 1.1 }}>
                      ₹{quoteTotal}
                    </div>
                  </div>
                </div>

                {/* Rejection notice if previously rejected */}
                {currentPaymentStatus === "PAYMENT_REJECTED" && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "18px",
                      fontSize: "13px",
                      color: "#991b1b",
                    }}
                  >
                    <strong>{language === "hi" ? "पिछला भुगतान विवरण अस्वीकृत" : "Payment Submission Rejected"}:</strong>{" "}
                    <em>"{currentPayment?.rejectionReason || "UTR number could not be verified in bank records"}"</em>.{" "}
                    {language === "hi" ? "कृपया सही UTR / संदर्भ संख्या दर्ज कर पुनः सबमिट करें।" : "Please check your bank transaction and resubmit with the correct UTR."}
                  </div>
                )}

                {/* Payment Options Grid: UPI QR Code + Bank Details */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "16px",
                    marginBottom: "22px",
                  }}
                >
                  {/* Option 1: Dynamic UPI QR Code */}
                  <div
                    style={{
                      border: "1px solid #e2ede0",
                      background: "#fcfdfb",
                      borderRadius: "12px",
                      padding: "18px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
                      <QrCode size={18} className="text-[#123b30]" />
                      <strong style={{ fontSize: "14px", color: "#123b30" }}>
                        {language === "hi" ? "UPI द्वारा तुरंत भुगतान करें" : "Pay via UPI QR Code"}
                      </strong>
                    </div>

                    <div style={{ display: "inline-block", background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid #e5ebe4", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <img
                        src={qrUrl}
                        alt="Homi Payment UPI QR Code"
                        style={{ width: "180px", height: "180px", objectFit: "contain", display: "block" }}
                      />
                    </div>

                    <div style={{ marginTop: "12px", fontSize: "12px", color: "#48624d" }}>
                      <div style={{ fontWeight: "700", color: "#123b30" }}>{payeeName}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
                        <code style={{ background: "#f0f4ee", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", color: "#183c31" }}>
                          {upiId}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(upiId, "upi")}
                          style={{
                            background: "transparent",
                            border: "1px solid #cbe1c3",
                            borderRadius: "6px",
                            padding: "3px 7px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#123b30",
                            cursor: "pointer",
                          }}
                        >
                          {copiedField === "upi" ? "✓ Copied" : <Copy size={12} />}
                        </button>
                      </div>
                      <p style={{ fontSize: "11px", color: "#718078", margin: "6px 0 0" }}>
                        {language === "hi" ? "Google Pay, PhonePe, Paytm अथवा किसी भी UPI ऐप से स्कैन करें।" : "Scan with Google Pay, PhonePe, Paytm, or any BHIM UPI app."}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Bank Transfer Details */}
                  <div
                    style={{
                      border: "1px solid #e2ede0",
                      background: "#fcfdfb",
                      borderRadius: "12px",
                      padding: "18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                      <Building2 size={18} className="text-[#123b30]" />
                      <strong style={{ fontSize: "14px", color: "#123b30" }}>
                        {language === "hi" ? "बैंक खाता विवरण (NEFT / IMPS)" : "Bank Transfer Details (NEFT / IMPS)"}
                      </strong>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", color: "#48624d" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                          {language === "hi" ? "खाता धारक" : "Account Holder"}
                        </span>
                        <div style={{ fontWeight: "700", color: "#123b30" }}>
                          {paymentSettings?.bankAccountHolder || "Homi Platform Operations"}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                          {language === "hi" ? "बैंक का नाम एवं शाखा" : "Bank & Branch"}
                        </span>
                        <div style={{ fontWeight: "700", color: "#123b30" }}>
                          {paymentSettings?.bankName || "State Bank of India"} · {paymentSettings?.branch || "Arera Colony, Bhopal"}
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                            {language === "hi" ? "खाता संख्या" : "Account Number"}
                          </span>
                          <div style={{ fontWeight: "800", color: "#123b30", fontSize: "14px", letterSpacing: "0.5px" }}>
                            {paymentSettings?.accountNumber || "409281726354"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings?.accountNumber || "409281726354", "acc")}
                          style={{
                            border: "1px solid #cbe1c3",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#123b30",
                            cursor: "pointer",
                          }}
                        >
                          {copiedField === "acc" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "10px", fontWeight: "800", color: "#718078", textTransform: "uppercase" }}>
                            IFSC Code
                          </span>
                          <div style={{ fontWeight: "800", color: "#123b30", fontSize: "13px" }}>
                            {paymentSettings?.ifsc || "SBIN0001234"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentSettings?.ifsc || "SBIN0001234", "ifsc")}
                          style={{
                            border: "1px solid #cbe1c3",
                            background: "#fff",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: "#123b30",
                            cursor: "pointer",
                          }}
                        >
                          {copiedField === "ifsc" ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Payment Submission Form */}
                <form
                  onSubmit={handleSubmitPayment}
                  style={{
                    background: "#f8faf6",
                    border: "1px solid #dbe6d9",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#123b30", margin: "0 0 12px 0" }}>
                    {language === "hi" ? "भुगतान की पुष्टि दर्ज करें" : "Submit Payment Confirmation Reference"}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#48624d", margin: "0 0 16px 0" }}>
                    {language === "hi"
                      ? "भुगतान करने के बाद, अपने बैंक / UPI ऐप का 12-अंकों का संदर्भ (UTR) नंबर यहाँ दर्ज करें ताकि एडमिन सत्यापन कर सके।"
                      : "After completing your transfer, enter your 12-digit UPI reference or bank UTR number below for admin verification."}
                  </p>

                  {paymentError && (
                    <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                      {paymentError}
                    </div>
                  )}

                  {paymentSuccess && (
                    <div style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "12px" }}>
                      {paymentSuccess}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#718078", textTransform: "uppercase", marginBottom: "4px" }}>
                        {language === "hi" ? "भुगतान माध्यम *" : "Payment Method *"}
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbe1c3",
                          background: "#fff",
                          fontSize: "13px",
                          fontWeight: "600",
                          outline: "none",
                        }}
                      >
                        <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                        <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS / NetBanking)</option>
                        <option value="CASH">Cash Paid to Technician</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#718078", textTransform: "uppercase", marginBottom: "4px" }}>
                        {language === "hi" ? "यूटीआर / संदर्भ संख्या *" : "Transaction Reference / UTR *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 432190876543"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbe1c3",
                          background: "#fff",
                          fontSize: "13px",
                          fontWeight: "600",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#718078", textTransform: "uppercase", marginBottom: "4px" }}>
                        {language === "hi" ? "स्क्रीनशॉट (वैकल्पिक)" : "Payment Screenshot (Optional)"}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                        style={{
                          width: "100%",
                          fontSize: "12px",
                          color: "#183c31",
                          marginTop: "4px",
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="btn btn-dark"
                    style={{
                      background: "#123b30",
                      color: "#d9ed89",
                      padding: "14px 24px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: "800",
                      border: "none",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      minHeight: "44px",
                      boxShadow: "0 4px 12px rgba(18, 59, 48, 0.15)",
                    }}
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>
                      {submittingPayment
                        ? (language === "hi" ? "जमा हो रहा है..." : "Submitting...")
                        : (language === "hi" ? "भुगतान विवरण सबमिट करें" : "Submit Payment for Verification")}
                    </span>
                  </button>
                </form>
              </section>
            );
          })()}

          <div className="detail-grid">
            <div className="detail-main">
              <RequestCard request={job} workerView={role === "worker"} detail />

              {owner &&
                (normStatus === "open" || normStatus === "new") &&
                (!job.hasLocation ? (
                  <RequestLocation request={job} onSaved={() => void load()} />
                ) : (
                  <details className="workspace-panel">
                    <summary className="location-field-label">
                      {locationText(language, "updateLocation")}
                    </summary>
                    <RequestLocation request={job} onSaved={() => void load()} />
                  </details>
                ))}

              <RequestPhotos
                request={job}
                photos={data.photos || []}
                participant={data.participant}
                userId={user.id}
                onChanged={() => void load()}
              />

              {data.participant && job.workerId && job.status !== "cancelled" && (
                <RequestVisit request={job} userId={user.id} disabled={Boolean(busy)} onAction={act} />
              )}

              {/* Chat Panel */}
              <section className="workspace-panel chat-panel">
                <div className="panel-heading">
                  <span className="panel-icon">
                    <MessageCircle size={23} />
                  </span>
                  <div>
                    <h2>{a("messages")}</h2>
                    <p>{data.participant && job.workerId ? t("talkLocal") : a("chatLocked")}</p>
                  </div>
                </div>
                {data.participant && job.workerId && (
                  <>
                    <div className="chat-messages" ref={messageBox} role="log" aria-live="polite">
                      {(data.messages || []).length === 0 ? (
                        <p className="chat-empty">{a("noMessages")}</p>
                      ) : (
                        (data.messages || []).map((item) => (
                          <div className={`chat-bubble ${item.senderId === user.id ? "mine" : ""}`} key={item.id}>
                            <small>{item.senderId === user.id ? a("you") : item.senderName}</small>
                            <p dir="auto">{item.body}</p>
                            <time>{stamp(item.createdAt)}</time>
                          </div>
                        ))
                      )}
                    </div>
                    {job.status !== "cancelled" && (
                      <form
                        className="chat-compose"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void act("message", { body: message });
                        }}
                      >
                        <textarea
                          aria-label={a("messagePlaceholder")}
                          rows={2}
                          dir="auto"
                          maxLength={2000}
                          placeholder={a("messagePlaceholder")}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                          className="btn btn-dark"
                          aria-label={a("sendMessage")}
                          disabled={Boolean(busy) || !message.trim()}
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    )}
                  </>
                )}
              </section>

              {/* Cancellation */}
              {owner && ["new", "pending_admin_review", "open", "accepted", "finding_worker", "shared_with_workers"].includes(normStatus) && (
                <div className="detail-danger-actions">
                  <button
                    disabled={Boolean(busy)}
                    onClick={() => {
                      if (window.confirm(t("cancelConfirm"))) void act("cancel");
                    }}
                  >
                    {t("cancel")}
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Activity */}
            <aside className="detail-aside">
              <section className="workspace-panel">
                <h2>{a("activity")}</h2>
                <ol className="request-timeline">
                  <li>
                    <span className="timeline-dot" />
                    <strong>{t("requestSent")}</strong>
                    <small>{stamp(job.createdAt)}</small>
                  </li>
                  {(data.events || [])
                    .filter((event) => event.kind !== "created")
                    .map((event) => (
                      <li key={event.id}>
                        <span className="timeline-dot" />
                        <strong>{eventLabel(event.kind)}</strong>
                        {event.data.amount !== undefined && <p>{money(event.data.amount)}</p>}
                        {event.data.note && <p dir="auto">{event.data.note}</p>}
                        {event.data.startsAt && (
                          <p className="timeline-visit-time">
                            {formatVisit(event.data.startsAt, language)} · IST
                          </p>
                        )}
                        {event.data.count && (
                          <p>
                            {event.data.count} · {s("photos")}
                          </p>
                        )}
                        <small>
                          {stamp(event.createdAt)}
                          {event.actorName ? ` · ${event.actorName.split(" ")[0]}` : ""}
                        </small>
                      </li>
                    ))}
                </ol>
              </section>
              <p className="detail-footnote">{a("paymentHint")}</p>
            </aside>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
