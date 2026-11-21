"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock, ArrowRight, RotateCw } from "lucide-react";
import { Header, Footer, useCurrentUser } from "@/components/site";
import { api } from "@/services/api";

export default function NotificationsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ notifications: any[]; unread: number }>("/notifications");
      setNotifications(res.notifications || []);
      setUnread(res.unread || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchNotifications();
    }
  }, [user, userLoading]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications", { all: true });
      setUnread(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  return (
    <>
      <Header />
      <main style={{ background: "#f8faf5", minHeight: "85vh", padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "#123b30", margin: 0 }}>
                  Notifications
                </h1>
                {unread > 0 && (
                  <span className="badge" style={{ background: "#ef4444", color: "#fff" }}>
                    {unread} New
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#718078", margin: "4px 0 0" }}>
                Platform updates, proposal notifications, quotation requests, and review alerts.
              </p>
            </div>

            {unread > 0 && (
              <button onClick={markAllRead} className="btn btn-outline" style={{ padding: "8px 14px", fontSize: 12 }}>
                <CheckCheck size={14} /> Mark All Read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ background: "#fff", padding: 48, borderRadius: 16, border: "1px solid #e5ebe4", textAlign: "center" }}>
              <div className="w-8 h-8 border-3 border-[#123b30] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p style={{ fontSize: 13, fontWeight: 700, color: "#123b30" }}>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ background: "#fff", padding: 48, borderRadius: 16, border: "1px solid #e5ebe4", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f0f4ee", color: "#123b30", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
                <Bell size={22} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#123b30", marginBottom: 6 }}>
                All Caught Up!
              </h3>
              <p style={{ fontSize: 13, color: "#718078", maxWidth: 360, margin: "0 auto" }}>
                You have no unread notifications or alerts right now.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: item.read ? "1px solid #e5ebe4" : "1px solid #a3e635",
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14, color: "#123b30", display: "block" }}>
                      {item.title}
                    </strong>
                    <p style={{ fontSize: 13, color: "#526e57", margin: "4px 0 6px" }}>
                      {item.body}
                    </p>
                    <span style={{ fontSize: 11, color: "#718078" }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {item.requestId && (
                    <Link
                      href={user?.role === "worker" ? `/worker/assignments` : `/requests/${item.requestId}`}
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 11, flexShrink: 0 }}
                    >
                      View <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
