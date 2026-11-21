"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  totalPages: propTotalPages,
  onPageChange,
}) => {
  const calculatedTotalPages = Math.ceil(totalItems / pageSize) || 1;
  const totalPages = propTotalPages ?? calculatedTotalPages;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#718078]">
      <div>
        Showing <span className="font-bold text-[#123b30]">{totalItems === 0 ? 0 : startItem}</span> to{" "}
        <span className="font-bold text-[#123b30]">{endItem}</span> of{" "}
        <span className="font-bold text-[#123b30]">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-outline text-xs px-2.5 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-bold text-[#123b30]">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-outline text-xs px-2.5 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
