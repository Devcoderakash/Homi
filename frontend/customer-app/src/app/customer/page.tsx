"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, Plus, RefreshCw, Wrench, AlertCircle, FileText, CreditCard, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { DashboardGuard, DashboardShell } from "@/components/dashboard";
import { RequestCard } from "@/components/request-card";
import { RequestBoardFilters, useRequestBoard } from "@/components/request-board";
import { useLanguage, useAppCopy } from "@/components/language";
import { useServiceCopy } from "@/components/service-language";
import { useCurrentUser } from "@/components/site";
function CustomerContent() {
  const { user, loading } = useCurrentUser(); const { language, t } = useLanguage(); const { a } = useAppCopy(); const { s } = useServiceCopy(); const params = useSearchParams();
  const [tab, setTab] = useState("all"), [busy, setBusy] = useState<number | null>(null), [error, setError] = useState("");
  const board = useRequestBoard(Boolean(user), tab);
  async function cancel(id: number) { if (busy || !window.confirm(t("cancelConfirm"))) return; setBusy(id); setError(""); try { const response = await fetch(`/api/requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); await board.reload(); } catch (err) { setError(err instanceof Error ? err.message : t("errorServer")); } finally { setBusy(null); } }
  if (loading) return <div className="page-loading">{t("loading")}</div>;
  if (!user || (user.role !== "customer" && user.role !== "admin")) return <DashboardGuard role="customer"/>;
  const filtered = Boolean(board.search || board.category);

  const pendingQuotations = (board.pendingQuotations && board.pendingQuotations.length > 0)
    ? board.pendingQuotations
    : board.requests.filter(r => (r.status || "").toUpperCase() === "CUSTOMER_APPROVAL_PENDING" || (r.quotation?.status || "").toUpperCase() === "PENDING");

  const completedRequests = board.requests.filter(
    (r) => (r.status || "").toUpperCase() === "COMPLETED"
  );

  return (
    <DashboardShell user={user} role="customer">
      <div className="dash-welcome">
        <div>
          <span className="section-kicker">{language === "hi" ? "ग्राहक डैशबोर्ड" : "Customer Portal"}</span>
          <h1>
            {t("hello")}, {user.name.split(" ")[0]} <span className="wave">👋</span>
          </h1>
          <p>
            {language === "hi"
              ? "घरेलू सेवाओं की बुकिंग, कारीगर कोटेशन एवं रसीदें — सब कुछ एक ही स्थान पर।"
              : "Manage household repairs, review technician quotations, and track active bookings in real-time."}
          </p>
        </div>
        <Link href="/book" className="btn btn-dark">
          <Plus size={18} />
          <span>{language === "hi" ? "नया अनुरोध भेजें" : "Book New Service"}</span>
        </Link>
      </div>
      {params.get("booked") === "1" && (
        <div className="success-alert">
          <span><Check size={20}/></span>
          <div><strong>{t("requestSent")}</strong><p>{t("sentDetail")}</p></div>
        </div>
      )}
      {user.email.endsWith("@guest.homi.local") ? (
        <Link href="/settings" className="guest-save-banner">
          <div><strong>{a("saveAccount")}</strong><p>{a("guestSave")}</p></div>
          <ArrowRight size={21}/>
        </Link>
      ) : user.email.endsWith("@guest.homi.demo") ? (
        <p className="guest-dashboard-note">{t("guestNote")}</p>
      ) : null}
      {(error || board.error) && <div className="form-error" role="alert">{error || board.error}</div>}

  {/* Dedicated Section: Quotations Awaiting Your Approval */}
  {pendingQuotations.length > 0 && (
    <section className="quotations-awaiting-approval" style={{
      background: "linear-gradient(135deg, #fbfdf9 0%, #edf7e6 100%)",
      border: "2px solid #285437",
      borderRadius: "16px",
      padding: "20px 24px",
      marginBottom: "24px",
      boxShadow: "0 4px 18px rgba(18, 59, 48, 0.08)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            background: "#285437",
            color: "#d9ed89",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "grid",
            placeItems: "center",
            fontSize: "15px",
            fontWeight: "800"
          }}>
            {pendingQuotations.length}
          </span>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#123b30", margin: 0 }}>
              {language === "hi" ? "आपकी स्वीकृति के लिए लंबित कोटेशन" : "Quotations Awaiting Your Approval"}
            </h2>
            <p style={{ fontSize: "13px", color: "#4a5d4e", margin: 0 }}>
              {language === "hi" 
                ? "कारीगर की कोटेशन तैयार है। कृपया शुल्क और समय देखकर अपनी स्वीकृति दें।" 
                : "A technician quotation is ready for your review. Accept to confirm worker visit."}
            </p>
          </div>
        </div>
        <span style={{
          background: "#d9ed89",
          color: "#123b30",
          fontWeight: "800",
          fontSize: "11px",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          padding: "5px 12px",
          borderRadius: "20px",
          border: "1px solid #c4de65"
        }}>
          {language === "hi" ? "स्वीकृति आवश्यक" : "Action Required"}
        </span>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {pendingQuotations.map(req => {
          const quote = req.quotation;
          const total = req.quoteFinalTotal || quote?.finalTotal || 0;
          const workerName = req.selectedWorkerName || quote?.selectedWorkerName || "Assigned Technician";
          const visitDate = req.quoteProposedVisitDate || quote?.proposedVisitDate || req.preferredDate || "Scheduled date";
          const visitTime = req.quoteProposedVisitTime || quote?.proposedVisitTime || req.preferredTime || "";

          return (
            <div
              key={req.id}
              style={{
                background: "#ffffff",
                border: "1px solid #cbe1c3",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                boxShadow: "0 2px 8px rgba(18, 59, 48, 0.04)"
              }}
            >
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "800", fontSize: "13px", color: "#285437" }}>#HOMI-{req.id}</span>
                  <span style={{ background: "#f0f4ee", color: "#285437", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
                    {req.category}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>
                  {req.title || req.description}
                </h3>
                <div style={{ fontSize: "13px", color: "#475569", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                  <span>🏢 <strong>{language === "hi" ? "होमई सत्यापित सेवा" : "Homi Verified Service"}</strong></span>
                  <span>📅 {visitDate} {visitTime ? `(${visitTime})` : ""}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>
                    {language === "hi" ? "कुल कोटेशन" : "Total Quoted"}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: "#123b30", lineHeight: 1.1 }}>
                    ₹{total}
                  </div>
                </div>

                <Link
                  href={`/requests/${req.id}`}
                  className="btn btn-dark"
                  style={{
                    background: "#123b30",
                    color: "#d9ed89",
                    fontWeight: "700",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none"
                  }}
                >
                  <span>{language === "hi" ? "कोटेशन देखें एवं स्वीकृत करें" : "Review Quotation"}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  )}

  {/* Dedicated Section: Completed Services & Payment Confirmation */}
  {completedRequests.length > 0 && (
    <section className="completed-services-payments" style={{
      background: "#ffffff",
      border: "2px solid #123b30",
      borderRadius: "16px",
      padding: "20px 24px",
      marginBottom: "24px",
      boxShadow: "0 4px 18px rgba(18, 59, 48, 0.08)"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            background: "#123b30",
            color: "#d9ed89",
            borderRadius: "10px",
            width: "36px",
            height: "36px",
            display: "grid",
            placeItems: "center"
          }}>
            <CreditCard size={20} />
          </span>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#123b30", margin: 0 }}>
              {language === "hi" ? "पूर्ण सेवाएं एवं भुगतान स्थिति" : "Completed Services & Payment Status"}
            </h2>
            <p style={{ fontSize: "13px", color: "#4a5d4e", margin: 0 }}>
              {language === "hi"
                ? "कार्य पूरा होने के बाद भुगतान विवरण दर्ज करें या रसीद देखें।"
                : "Submit transaction details after paying the worker or view official tax receipts."}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {completedRequests.map((req) => {
          const currentPayment = (req as any).payment;
          const rawPayStatus = (currentPayment?.status || req.paymentStatus || "PAYMENT_PENDING").toUpperCase();
          const payStatus = rawPayStatus === "UNPAID" ? "PAYMENT_PENDING" : rawPayStatus;
          const totalAmount = req.quoteFinalTotal || (currentPayment?.amount ? (currentPayment.amount > 5000 ? currentPayment.amount / 100 : currentPayment.amount) : (req.quotedAmount ? req.quotedAmount / 100 : 0));
          const workerName = req.selectedWorkerName || (req as any).workerName || "Verified Technician";

          return (
            <div
              key={req.id}
              style={{
                background: payStatus === "PAID"
                  ? "#f0fdf4"
                  : payStatus === "PAYMENT_SUBMITTED"
                  ? "#eff6ff"
                  : payStatus === "PAYMENT_REJECTED"
                  ? "#fef2f2"
                  : "#fbfdf9",
                border: payStatus === "PAID"
                  ? "1px solid #bbf7d0"
                  : payStatus === "PAYMENT_SUBMITTED"
                  ? "1px solid #bfdbfe"
                  : payStatus === "PAYMENT_REJECTED"
                  ? "1px solid #fecaca"
                  : "1px solid #fed7aa",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "800", fontSize: "13px", color: "#123b30" }}>#HOMI-{req.id}</span>
                  <span style={{ background: "#ffffff", border: "1px solid #e2ede0", color: "#285437", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "6px" }}>
                    {req.category}
                  </span>
                  {payStatus === "PAYMENT_PENDING" && (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                      PAYMENT_PENDING
                    </span>
                  )}
                  {payStatus === "PAYMENT_SUBMITTED" && (
                    <span style={{ background: "#dbeafe", color: "#1e40af", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                      PAYMENT_SUBMITTED
                    </span>
                  )}
                  {payStatus === "PAYMENT_REJECTED" && (
                    <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                      PAYMENT_REJECTED
                    </span>
                  )}
                  {payStatus === "PAID" && (
                    <span style={{ background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "20px" }}>
                      PAID
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px 0" }}>
                  {req.title || req.description}
                </h3>

                <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 6px 0" }}>
                  {payStatus === "PAYMENT_PENDING" && (
                    <span><strong>Pay for your completed service.</strong> Direct UPI / Bank Transfer to Homi.</span>
                  )}
                  {payStatus === "PAYMENT_SUBMITTED" && (
                    <span style={{ color: "#1e40af" }}>
                      <strong>Payment confirmation submitted; awaiting verification.</strong> UTR: {currentPayment?.transactionReference || "Submitted"}
                    </span>
                  )}
                  {payStatus === "PAYMENT_REJECTED" && (
                    <span style={{ color: "#b91c1c" }}>
                      <strong>Payment could not be verified.</strong> Please check your details and resubmit.
                    </span>
                  )}
                  {payStatus === "PAID" && (
                    <span style={{ color: "#166534" }}>
                      <strong>Payment successfully verified.</strong> Official receipt generated.
                    </span>
                  )}
                </p>

                <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "12px" }}>
                  <span>Technician: <strong>{workerName}</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "800" }}>
                    Payable Amount
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#123b30", lineHeight: 1.1 }}>
                    ₹{totalAmount}
                  </div>
                </div>

                {payStatus === "PAYMENT_PENDING" && (
                  <Link
                    href={`/requests/${req.id}`}
                    className="btn btn-dark"
                    style={{
                      background: "#123b30",
                      color: "#d9ed89",
                      fontWeight: "800",
                      padding: "10px 18px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>I Have Paid — Confirm Payment</span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                {payStatus === "PAYMENT_SUBMITTED" && (
                  <Link
                    href={`/requests/${req.id}`}
                    style={{
                      background: "#eff6ff",
                      color: "#1e40af",
                      border: "1px solid #bfdbfe",
                      fontWeight: "700",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>Awaiting Admin Verification</span>
                    <ArrowRight size={14} />
                  </Link>
                )}

                {payStatus === "PAYMENT_REJECTED" && (
                  <Link
                    href={`/requests/${req.id}`}
                    className="btn btn-dark"
                    style={{
                      background: "#b91c1c",
                      color: "#fff",
                      fontWeight: "700",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>Resubmit Payment Details</span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                {payStatus === "PAID" && (
                  <Link
                    href={`/requests/${req.id}/receipt`}
                    style={{
                      background: "#166534",
                      color: "#d9ed89",
                      fontWeight: "700",
                      padding: "10px 16px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>View Official Receipt</span>
                    <FileText size={16} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  )}

  <div className="stats-grid">
    <div className="stat-card">
      <span className="stat-icon stat-icon-green"><CalendarDays size={24}/></span>
      <div className="stat-info">
        <span className="stat-number">{board.counts.total}</span>
        <span className="stat-label">{t("totalCount")}</span>
      </div>
    </div>
    <div className="stat-card">
      <span className="stat-icon stat-icon-yellow"><Clock3 size={24}/></span>
      <div className="stat-info">
        <span className="stat-number">{board.counts.active}</span>
        <span className="stat-label">{t("activeCount")}</span>
      </div>
    </div>
    <div className="stat-card">
      <span className="stat-icon stat-icon-blue"><Check size={24}/></span>
      <div className="stat-info">
        <span className="stat-number">{board.counts.completed}</span>
        <span className="stat-label">{t("completedCount")}</span>
      </div>
    </div>
  </div>

  <div className="dash-section-heading">
    <div>
      <h2>{language === "hi" ? "सेवा अनुरोध एवं इतिहास" : "Service Requests & History"}</h2>
      <p>{language === "hi" ? "आपके सभी घरेलू मरम्मत व सेवा अनुरोधों की नवीनतम स्थिति" : "Track live progress, technician dispatch, and completed jobs"}</p>
    </div>
    <button className="refresh-button" disabled={board.fetching} onClick={() => { setError(""); void board.reload(); }}>
      <RefreshCw size={15}/>
      {t("refresh")}
    </button>
  </div>

  <div className="dash-tabs">
    {["all", "active", "completed", "cancelled"].map(value => (
      <button key={value} onClick={() => setTab(value)} className={tab === value ? "active" : ""}>
        {value === "cancelled" ? t("status_cancelled") : t(value as "all" | "active" | "completed")}
      </button>
    ))}
  </div>

  <RequestBoardFilters board={board}/>

  {board.fetching ? (
    <div className="panel-loading">{t("loading")}</div>
  ) : board.requests.length === 0 ? (
    <div className="empty-state">
      <span><Wrench size={32}/></span>
      <h3>{filtered ? s("noMatches") : (language === "hi" ? "कोई सेवा अनुरोध नहीं मिला" : "No Service Requests Yet")}</h3>
      <p>
        {filtered
          ? t("emptyDetail")
          : (language === "hi"
              ? "बिजली, प्लंबिंग, बढ़ईगीरी या उपकरण मरम्मत की आवश्यकता है? 2 मिनट में होमई सत्यापित कारीगर बुक करें।"
              : "Need an electrician, plumber, carpenter, or appliance technician? Book a verified local professional in under 2 minutes.")}
      </p>
      {filtered ? (
        <button className="btn btn-secondary" onClick={() => { board.setSearch(""); board.setCategory(""); }}>
          {s("clearFilters")}
        </button>
      ) : (
        <Link href="/book" className="btn btn-dark">
          {t("sendRequest")}
          <ArrowRight size={18}/>
        </Link>
      )}
    </div>
  ) : (
    <>
      <div className="request-list">
        {board.requests.map(request => (
          <RequestCard key={request.id} request={request}>
            {request.status === "open" && (
              <div className="request-card-footer">
                <span><Clock3 size={15}/>{t("waiting")}</span>
                <button onClick={() => void cancel(request.id)} disabled={busy !== null}>{t("cancel")}</button>
              </div>
            )}
            {request.status === "on_the_way" && (
              <div className="request-card-footer">
                <span><Check size={15}/>{t("workerOnWay")}</span>
              </div>
            )}
          </RequestCard>
        ))}
      </div>
      {board.hasMore && (
        <button className="btn btn-secondary board-load-more" disabled={board.loadingMore} onClick={board.loadMore}>
          {board.loadingMore ? t("loading") : s("loadMore")}
        </button>
      )}
    </>
  )}
    </DashboardShell>
  );
}
export default function CustomerPage() { return <Suspense fallback={<div className="page-loading">Loading…</div>}><CustomerContent/></Suspense>; }
