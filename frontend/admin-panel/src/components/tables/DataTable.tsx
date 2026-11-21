"use client";

import React from "react";
import { TableLoadingSkeleton } from "../common/LoadingSkeleton";
import { EmptyState } from "../common/EmptyState";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  accessor?: (item: T) => React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  keyExtractor?: (item: T) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading,
  isLoading,
  onRowClick,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyMessage,
}: DataTableProps<T>) {
  const showLoading = loading ?? isLoading ?? false;

  if (showLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <TableLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-2xs">
        <EmptyState title={emptyTitle || emptyMessage || "No records found"} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 ${col.headerClassName || ""} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {data.map((item, rowIdx) => {
              const rowKey = keyExtractor ? keyExtractor(item) : item.id ?? rowIdx;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100"
                      : "hover:bg-slate-50/40"
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    let content: React.ReactNode = null;
                    if (col.accessor) {
                      content = col.accessor(item);
                    } else if (col.cell) {
                      content = col.cell(item);
                    } else if (col.accessorKey) {
                      content = String(item[col.accessorKey] ?? "");
                    }

                    return (
                      <td key={colIdx} className={`py-3 px-4 ${col.className || ""}`}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
