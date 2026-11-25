"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RotateCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Modal } from "../../components/common/Modal";
import { ServiceFormModal } from "../../components/forms/ServiceFormModal";
import { getServiceIcon } from "../../lib/service-icons";
import { adminApi } from "../../services/adminApi";
import type { ServiceCategory } from "../../types";

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      const list = res.data?.categories || res.categories || [];
      setCategories(
        list.map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description || "",
          icon: c.icon || "Wrench",
          color: c.color || "#f0f4ee",
          startingPrice: c.startingPrice ?? 199,
          sortOrder: c.sortOrder ?? 0,
          active: c.active ?? true,
        }))
      );
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to load service categories." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleToggleActive = async (id: string | number) => {
    setFeedback(null);
    try {
      if (typeof id === "number") {
        await adminApi.toggleCategory(id);
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
      );
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to update category status." });
    }
  };

  const handleSaveCategory = async (catData: Partial<ServiceCategory>) => {
    setFeedback(null);
    if (editingCategory && typeof editingCategory.id === "number") {
      await adminApi.updateCategory(editingCategory.id, {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
        color: catData.color,
        startingPrice: catData.startingPrice,
        active: catData.active,
        sortOrder: catData.sortOrder,
      });
      setFeedback({ type: "success", text: `Updated "${catData.name}" successfully.` });
    } else if (catData.name && catData.slug) {
      await adminApi.createCategory({
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        icon: catData.icon,
        color: catData.color,
        startingPrice: catData.startingPrice,
        active: catData.active,
        sortOrder: catData.sortOrder,
      });
      setFeedback({ type: "success", text: `Created "${catData.name}" successfully.` });
    }
    await loadCategories();
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory || typeof deletingCategory.id !== "number") return;
    setDeleting(true);
    setFeedback(null);
    try {
      await adminApi.deleteCategory(deletingCategory.id);
      const removedName = deletingCategory.name;
      setDeletingCategory(null);
      setFeedback({ type: "success", text: `Removed service category "${removedName}".` });
      await loadCategories();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to remove service category." });
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = categories.filter((c) => c.active).length;
  const maxSortOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#123b30]">
              Household Service Categories
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Edit names, fees, icons, visibility, or remove categories ({activeCount} active of {categories.length}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCategories}
              className="btn btn-outline text-xs px-3 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#123b30]" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
              className="btn btn-dark text-xs px-3.5 py-2 font-bold inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service Category</span>
            </button>
          </div>
        </div>

        {/* Inline Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
              feedback.type === "success"
                ? "bg-[#eef7ee] border-[#c3e2be] text-[#285437]"
                : "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] font-bold underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length === 0 && !loading ? (
          <div className="homi-card p-10 text-center space-y-3">
            <p className="text-sm font-bold text-[#123b30]">No service categories configured yet.</p>
            <p className="text-xs text-[#718078]">
              Add a service category so customers can submit requests and workers can select a trade.
            </p>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
              className="btn btn-dark text-xs px-4 py-2 font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Service</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const Icon = getServiceIcon(cat.icon);
              return (
                <div
                  key={cat.id}
                  className={`homi-card p-5 transition-all flex flex-col justify-between ${
                    cat.active ? "bg-white hover:border-[#b8d1ad]" : "bg-[#f8faf5] opacity-75"
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl border border-[#dce9d7] flex items-center justify-center text-[#123b30] font-extrabold shrink-0"
                          style={{ backgroundColor: cat.color || "#f0f4ee" }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-[#183c31] text-sm truncate">{cat.name}</h3>
                          <span className="font-mono text-[10px] text-[#718078] block truncate">/{cat.slug}</span>
                        </div>
                      </div>

                      <StatusBadge status={cat.active ? "active" : "inactive"} />
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#526e57] leading-relaxed min-h-[36px] line-clamp-2">
                      {cat.description || "Household repair & home maintenance service."}
                    </p>
                  </div>

                  {/* Footer / Pricing & Actions */}
                  <div className="mt-5 pt-3.5 border-t border-[#f0f4ee] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                        Base Visit Fee
                      </span>
                      <p className="text-sm font-extrabold text-[#123b30]">
                        ₹{cat.startingPrice ?? 199}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat.id)}
                        title={cat.active ? "Disable category" : "Enable category"}
                        aria-label={cat.active ? `Disable ${cat.name}` : `Enable ${cat.name}`}
                        className="p-1.5 text-[#718078] hover:text-[#123b30] rounded-md transition-colors cursor-pointer"
                      >
                        {cat.active ? (
                          <ToggleRight className="w-5 h-5 text-[#285437]" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="btn btn-outline p-1.5 text-[#123b30] font-bold"
                        title="Edit Category"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(cat)}
                        className="btn btn-outline p-1.5 text-[#b3483b] border-[#f2d0cb] hover:bg-[#fff2f0] font-bold"
                        title="Remove Category"
                        aria-label={`Remove ${cat.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Category Modal */}
        <ServiceFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSaveCategory}
          initialData={editingCategory}
          nextSortOrder={maxSortOrder + 1}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={Boolean(deletingCategory)}
          onClose={() => {
            if (!deleting) setDeletingCategory(null);
          }}
          title="Remove Service Category"
          description="This action permanently deletes the category from Homi."
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#4a5f53] leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-[#123b30]">{deletingCategory?.name}</strong>{" "}
              (<span className="font-mono">/{deletingCategory?.slug}</span>)?
            </p>
            <p className="text-[11px] text-[#718078] bg-[#f8faf5] border border-[#e5ebe4] p-3 rounded-lg leading-relaxed">
              Customers will no longer see this service when booking new requests. Existing past requests keep their saved record.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#e5ebe4]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeletingCategory(null)}
                className="btn btn-outline text-xs px-3.5 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="btn px-4 py-2 text-xs font-bold bg-[#b3483b] hover:bg-[#96382d] text-white border-0 rounded-lg cursor-pointer"
              >
                {deleting ? "Removing..." : "Remove Category"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
}
