"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export function DonutChart({
  data,
  title,
  subtitle,
  centerLabel,
  centerValue,
  className,
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <div className={cn("p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 text-sm", className)}>
        No distribution data
      </div>
    );
  }

  // Calculate SVG stroke dashes for circle of radius 40
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let cumulativeOffset = 0;
  const segments = data.map((d, idx) => {
    const fraction = d.value / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += fraction * circumference;
    return {
      ...d,
      fraction,
      strokeDasharray,
      strokeDashoffset,
      idx,
    };
  });

  return (
    <div className={cn("p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6 my-auto pt-2">
        {/* SVG Circle */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            {segments.map((seg) => {
              const isHovered = hoveredIdx === seg.idx;
              return (
                <circle
                  key={seg.idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? "16" : "14"}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(seg.idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {hoveredIdx !== null ? (
              <>
                <span className="text-xs font-semibold text-slate-800">
                  {Math.round(segments[hoveredIdx].fraction * 100)}%
                </span>
                <span className="text-[10px] text-slate-500 max-w-[80px] truncate">
                  {segments[hoveredIdx].label}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-slate-900">
                  {centerValue || total.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  {centerLabel || "Total"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full flex flex-col gap-2.5">
          {segments.map((seg) => {
            const isHovered = hoveredIdx === seg.idx;
            const pct = Math.round(seg.fraction * 100);
            return (
              <div
                key={seg.idx}
                onMouseEnter={() => setHoveredIdx(seg.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={cn(
                  "flex items-center justify-between text-xs py-1 px-2 rounded-md transition-colors cursor-pointer",
                  isHovered ? "bg-slate-100" : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <span className="font-semibold text-slate-900">{seg.value.toLocaleString()}</span>
                  <span className="text-slate-400 text-[11px] w-8">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
