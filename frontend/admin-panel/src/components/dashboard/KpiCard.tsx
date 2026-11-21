"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  className?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  change,
  trend = "neutral",
  subtitle = "vs last period",
  icon,
  iconBg = "bg-indigo-50",
  iconColor = "text-indigo-600",
  className,
  onClick,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between",
        onClick && "cursor-pointer hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {value}
          </div>
        </div>

        <div className={cn("p-2.5 rounded-lg shrink-0", iconBg, iconColor)}>
          {icon}
        </div>
      </div>

      {(change || subtitle) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-rose-600",
                trend === "neutral" && "text-slate-500"
              )}
            >
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              {trend === "neutral" && <Minus className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
