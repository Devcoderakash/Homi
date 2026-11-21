"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";

export interface BarChartItem {
  label: string;
  value: number;
  subValue?: number;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  barColor?: string;
  accentColor?: string;
  valueFormatter?: (val: number) => string;
  className?: string;
}

export function BarChart({
  data,
  title,
  subtitle,
  height = 240,
  barColor = "bg-indigo-500",
  valueFormatter = (val) => val.toLocaleString(),
  className,
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={cn("p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 text-sm", className)} style={{ height }}>
        No bar chart data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Chart container */}
      <div className="relative flex items-end justify-between gap-2 pt-6 pb-2" style={{ height }}>
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-dashed border-slate-200 w-full" />
          <div className="border-b border-slate-200 w-full" />
        </div>

        {data.map((item, idx) => {
          const heightPercent = Math.max((item.value / maxValue) * 100, 4);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="relative flex-1 flex flex-col items-center h-full justify-end group z-10"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 px-2 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-md whitespace-nowrap z-20 pointer-events-none transition-transform -translate-y-1">
                  <span className="font-semibold">{item.label}:</span> {valueFormatter(item.value)}
                </div>
              )}

              {/* Bar */}
              <div className="w-full max-w-[40px] px-0.5 flex flex-col justify-end h-full">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    "w-full rounded-t-md transition-all duration-300",
                    barColor,
                    isHovered ? "opacity-100 ring-2 ring-indigo-400/50" : "opacity-85 hover:opacity-100"
                  )}
                />
              </div>

              {/* Label */}
              <span className="text-[11px] text-slate-500 font-medium truncate w-full text-center mt-2 group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
