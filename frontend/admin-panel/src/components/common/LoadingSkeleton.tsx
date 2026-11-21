import React from "react";

export const TableLoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded-md w-12" />
          <div className="h-4 bg-slate-200 rounded-md flex-1" />
          <div className="h-4 bg-slate-200 rounded-md w-28" />
          <div className="h-4 bg-slate-200 rounded-md w-20" />
          <div className="h-4 bg-slate-200 rounded-md w-16" />
        </div>
      ))}
    </div>
  );
};

export const CardLoadingSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 animate-pulse shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-200 rounded-md w-24" />
        <div className="h-8 w-8 bg-slate-100 rounded-xl" />
      </div>
      <div className="mt-4 h-7 bg-slate-200 rounded-md w-32" />
      <div className="mt-2 h-3 bg-slate-100 rounded-md w-44" />
    </div>
  );
};
