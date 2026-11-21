"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  UserCheck,
  IndianRupee,
  Star,
  FileText,
  AlertCircle,
} from "lucide-react";
import { cn, formatDateTime } from "../../lib/utils";

export interface ActivityItem {
  id: string;
  type: "booking" | "worker" | "payment" | "review" | "assignment" | "alert";
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
  className?: string;
}

export function ActivityFeed({
  items,
  title = "Live Platform Activity",
  className,
}: ActivityFeedProps) {
  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "booking":
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case "worker":
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case "payment":
        return <IndianRupee className="w-4 h-4 text-amber-600" />;
      case "review":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "assignment":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case "alert":
      default:
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getBg = (type: ActivityItem["type"]) => {
    switch (type) {
      case "booking":
        return "bg-indigo-50 border-indigo-100";
      case "worker":
        return "bg-emerald-50 border-emerald-100";
      case "payment":
        return "bg-amber-50 border-amber-100";
      case "review":
        return "bg-yellow-50 border-yellow-100";
      case "assignment":
        return "bg-blue-50 border-blue-100";
      case "alert":
      default:
        return "bg-rose-50 border-rose-100";
    }
  };

  return (
    <div className={cn("p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col", className)}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Real-time
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No recent activity</p>
        ) : (
          items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-3 group">
              <div
                className={cn(
                  "p-2 rounded-lg border shrink-0 mt-0.5",
                  getBg(item.type)
                )}
              >
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatDateTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
