"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  IndianRupee,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { DashboardGuard, DashboardShell } from "@/components/dashboard";
import { useAppCopy, useLanguage } from "@/components/language";
import { useReportCopy } from "@/components/report-language";
import { useCurrentUser } from "@/components/site";
import { money } from "@/lib/app-copy";
import { paymentLabel } from "@/lib/report-copy";
import { formatVisit } from "@/lib/visit-time";
import type { Overview, WorkRecord } from "@/lib/report-types";

export default function OverviewPage() {
  const { user, loading } = useCurrentUser();
  const { t, language, statusLabel, serviceLabel } = useLanguage();
  const { a } = useAppCopy();
  const { r } = useReportCopy();

  const [data, setData] = useState<Overview | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const role = user?.role === "worker" ? "worker" : "customer";

  const load = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const response = await fetch("/api/overview", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to load overview");

      const normalized: Overview = {
        role: body.role || role,
        totals: {
          requests: body.totals?.requests || 0,
          active: body.totals?.active || 0,
          completed: body.totals?.completed || 0,
          agreedAmount: body.totals?.agreedAmount || 0,
          acknowledgedAmount: body.totals?.acknowledgedAmount || 0,
          outstandingAmount: body.totals?.outstandingAmount || 0,
          reportedAmount: body.totals?.reportedAmount || 0,
        },
        months: Array.isArray(body.months) ? body.months : [],
        visits: Array.isArray(body.visits) ? body.visits : [],
        outstanding: Array.isArray(body.outstanding) ? body.outstanding : [],
        recent: Array.isArray(body.recent) ? body.recent : [],
      };
      setData(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorServer"));
    } finally {
      setFetching(false);
    }
  }, [role, t]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  if (loading) return <div className="page-loading">{t("loading")}</div>;
  if (!user) return <DashboardGuard role="customer" />;

  const counterparty = (record: WorkRecord) =>
    role === "worker" ? record.customerName : record.workerName || t("waiting");

  const months = data?.months || [];
  const visits = data?.visits || [];
  const recent = data?.recent || [];
  const outstanding = data?.outstanding || [];
  const max =
    months.length > 0
      ? Math.max(1, ...months.map((item) => item.amount || 0))
      : 1;

  return (
    <DashboardShell user={user} role={role}>
      <div className="dash-welcome report-welcome">
        <div>
          <span className="section-kicker">{r("overview")}</span>
          <h1>{r(role === "worker" ? "overview" : "customerOverview")}</h1>
          <p>{r("overviewIntro")}</p>
        </div>
        <button
          className="refresh-button"
          disabled={fetching}
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
          {t("refresh")}
        </button>
      </div>

      <div className="report-payment-note">
        <Wallet size={20} />
        <p>{r("paymentNote")}</p>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {fetching && !data ? (
        <div className="panel-loading">{t("loading")}</div>
      ) : (
        data && (
          <>
            <div className="report-totals">
              <article>
                <span className="report-stat-icon">
                  <IndianRupee size={22} />
                </span>
                <small>{r("agreed")}</small>
                <strong>{money(data.totals.agreedAmount)}</strong>
                <p>
                  {data.totals.completed} · {t("completedCount")}
                </p>
              </article>
              <article>
                <span className="report-stat-icon green">
                  <CheckCircle2 size={22} />
                </span>
                <small>{r("acknowledged")}</small>
                <strong>{money(data.totals.acknowledgedAmount)}</strong>
                <p>{r("received")}</p>
              </article>
              <article>
                <span className="report-stat-icon gold">
                  <Clock3 size={22} />
                </span>
                <small>{r("outstanding")}</small>
                <strong>{money(data.totals.outstandingAmount)}</strong>
                <p>
                  {r("reported")}: {money(data.totals.reportedAmount)}
                </p>
              </article>
            </div>

            <div className="report-layout">
              <section className="workspace-panel monthly-panel">
                <h2>{r("months")}</h2>
                <div
                  className="monthly-chart"
                  role="img"
                  aria-label={`${r("months")}: ${months
                    .map((item) => `${item.month}: ${money(item.amount)}`)
                    .join("; ")}`}
                >
                  {months.map((item) => (
                    <div className="month-column" key={item.month}>
                      <span>{money(item.amount)}</span>
                      <div className="month-bar-space">
                        <div
                          className={`month-bar ${
                            item.amount === 0 ? "empty" : ""
                          }`}
                          style={{
                            height:
                              item.amount > 0
                                ? `${Math.max(5, (item.amount / max) * 100)}%`
                                : "3px",
                          }}
                        />
                      </div>
                      <strong>
                        {new Date(`${item.month}-15T12:00:00Z`).toLocaleDateString(
                          `${language}-IN`,
                          { month: "short" }
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="workspace-panel upcoming-panel">
                <div className="report-panel-heading">
                  <h2>{r("upcoming")}</h2>
                  <CalendarDays size={20} />
                </div>
                {visits.length === 0 ? (
                  <p className="report-empty">{r("noVisits")}</p>
                ) : (
                  <div className="upcoming-visits">
                    {visits.map((visit) => (
                      <Link href={`/requests/${visit.id}`} key={visit.id}>
                        <span className="upcoming-icon">
                          <CalendarDays size={18} />
                        </span>
                        <div>
                          <strong dir="auto">{visit.title}</strong>
                          <small>
                            {visit.visitStartsAt &&
                              formatVisit(visit.visitStartsAt, language)}{" "}
                            · IST
                          </small>
                          <p>{counterparty(visit)}</p>
                        </div>
                        <ArrowRight size={17} />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="workspace-panel report-records">
              <div className="report-panel-heading">
                <div>
                  <h2>{r("recent")}</h2>
                  <p>
                    {data.totals.requests} · {t("totalCount")} ·{" "}
                    {data.totals.active} {t("activeCount")}
                  </p>
                </div>
                <a
                  className="btn btn-secondary report-export"
                  href={`/api/overview?format=csv&lang=${language}`}
                >
                  <Download size={16} />
                  {r("export")}
                </a>
              </div>
              {recent.length === 0 ? (
                <div className="report-empty">
                  {t("noRequests")}
                  <Link href={role === "worker" ? "/worker" : "/book"}>
                    {t(role === "worker" ? "workerTitle" : "sendRequest")}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <div className="work-record-list">
                  {recent.map((record) => (
                    <div className="work-record" key={record.id}>
                      <Link
                        href={`/requests/${record.id}`}
                        className="work-record-details"
                      >
                        <small>
                          #{String(record.id).padStart(4, "0")} ·{" "}
                          {serviceLabel(record.category)}
                        </small>
                        <strong dir="auto">{record.title}</strong>
                        <span>
                          {counterparty(record)} · {statusLabel(record.status)}
                        </span>
                      </Link>
                      <div className="work-record-amount">
                        <strong>
                          {record.quotedAmount === null
                            ? "—"
                            : money(record.quotedAmount)}
                        </strong>
                        <span className={`record-payment ${record.paymentStatus}`}>
                          {paymentLabel(language, record.paymentStatus)}
                        </span>
                        {record.status === "completed" &&
                          record.quoteStatus === "approved" &&
                          record.quotedAmount !== null && (
                            <Link href={`/requests/${record.id}/receipt`}>
                              {r("receipt")}
                              <ArrowRight size={13} />
                            </Link>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="workspace-panel">
              <h2>{r("unsettled")}</h2>
              {outstanding.length === 0 ? (
                <div className="settled-empty">
                  <CheckCircle2 size={21} />
                  {r("none")}
                </div>
              ) : (
                <div className="unsettled-list">
                  {outstanding.map((record) => (
                    <Link key={record.id} href={`/requests/${record.id}`}>
                      <div>
                        <strong dir="auto">{record.title}</strong>
                        <small>
                          {paymentLabel(language, record.paymentStatus)}
                        </small>
                      </div>
                      <span>{money(record.quotedAmount)}</span>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <Link className="report-guide-link" href="/guide">
              {r("guide")}
              <ArrowRight size={16} />
            </Link>
          </>
        )
      )}
    </DashboardShell>
  );
}
