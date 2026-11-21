"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { adminApi } from "../../services/adminApi";
import { formatDateTime } from "../../lib/utils";
import type { SystemNotification } from "../../types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = () => {
    adminApi.getNotifications()
      .then((res: any) => {
        const list = res.notifications || [];
        setNotifications(
          list.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.title,
            type: n.kind || "system",
            timestamp: n.createdAt,
            createdAt: n.createdAt,
            read: n.read ?? false,
          }))
        );
      })
      .catch((err) => console.error("Failed to load notifications:", err));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string | number) => {
    await adminApi.markNotificationRead(Number(id)).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await adminApi.markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, filter]);

  const getIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-[#285437]" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-[#123b30]" />;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#123b30] tracking-tight">
                Platform Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="text-[11px] font-extrabold bg-[#d9ed89] text-[#123b30] px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-[#718078] mt-0.5">
              Operational updates, technician proposals, and customer payment milestone notices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-outline text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#123b30]" />
                <span>Mark all as read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="btn bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[#e5ebe4] gap-4 text-xs font-bold">
          <button
            onClick={() => setFilter("all")}
            className={`pb-2.5 border-b-2 transition-colors ${
              filter === "all" ? "border-[#123b30] text-[#123b30] font-extrabold" : "border-transparent text-[#718078]"
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`pb-2.5 border-b-2 transition-colors ${
              filter === "unread" ? "border-[#123b30] text-[#123b30] font-extrabold" : "border-transparent text-[#718078]"
            }`}
          >
            Unread Only ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="homi-card divide-y divide-[#f0f4ee] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#718078]">
              No notifications to display.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                  item.read ? "bg-white hover:bg-[#f8faf5]" : "bg-[#f5f8f0] hover:bg-[#edf4e7]"
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-[#e5ebe4] shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-[#123b30] truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-[#718078] shrink-0">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#526e57] mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-[#123b30] shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
