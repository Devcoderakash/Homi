"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
  busy = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-4">
        {danger && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle size={22} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition disabled:opacity-50 ${
            danger
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
          }`}
        >
          {busy ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
};
