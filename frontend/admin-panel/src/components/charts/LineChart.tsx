"use client";

import React, { useState } from "react";

export interface DataPoint {
  label?: string;
  date?: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  valuePrefix?: string;
  valueFormatter?: (val: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subtitle,
  height = 220,
  color = "#6366f1",
  valuePrefix = "",
  valueFormatter,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1 || 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - minVal) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${curr.y}, ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const formatVal = (v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return `${valuePrefix}${v.toLocaleString("en-IN")}`;
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`chart-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#f1f5f9"
            strokeWidth="1.5"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Area fill */}
          <path d={areaD} fill={`url(#chart-grad-${color.replace("#", "")})`} />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const displayLabel = p.label || p.date || "";
            return (
              <g key={idx}>
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={height - paddingY}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2.5"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <text
                  x={p.x}
                  y={height - paddingY + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered ? "fill-slate-900 font-bold" : "fill-slate-400"
                  }`}
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-20"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
              top: `${(points[hoveredIdx].y / height) * 100 - 8}%`,
            }}
          >
            <span>{points[hoveredIdx].label || points[hoveredIdx].date}: </span>
            <span className="text-indigo-300 font-bold">{formatVal(points[hoveredIdx].value)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
