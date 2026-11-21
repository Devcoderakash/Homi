"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Plus,
  Edit2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  RotateCw,
} from "lucide-react";
import { AdminShell } from "../../components/layout/AdminShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ServiceFormModal } from "../../components/forms/ServiceFormModal";
import { adminApi } from "../../services/adminApi";
import type { ServiceCategory } from "../../types";

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      const list = res.data?.categories || res.categories || [];
      if (list.length > 0) {
        setCategories(
          list.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            description: c.description || "",
            icon: c.icon || "Wrench",
            startingPrice: 199,
            active: c.active ?? true,
          }))
        );
      }
    } catch (err) {
      console.warn("Using fallback fixture categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleToggleActive = async (id: string | number) => {
    try {
      if (typeof id === "number") {
        await adminApi.toggleCategory(id);
      }
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
      );
    } catch (err) {
      console.error("Failed to toggle category", err);
    }
  };

  const handleSaveCategory = async (catData: Partial<ServiceCategory>) => {
    try {
      if (editingCategory && typeof editingCategory.id === "number") {
        await adminApi.updateCategory(editingCategory.id, {
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          icon: catData.icon,
          active: catData.active,
        });
      } else if (catData.name && catData.slug) {
        await adminApi.createCategory({
          name: catData.name,
          slug: catData.slug,
          description: catData.description,
          icon: catData.icon,
        });
      }
      await loadCategories();
    } catch (err) {
      console.error("Failed to save category", err);
    }
  };

  const activeCount = categories.filter((c) => c.active).length;

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
              Configure trade offerings, minimum inspection fees, and customer-facing service availability.
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

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`homi-card p-5 transition-all flex flex-col justify-between ${
                cat.active ? "bg-white hover:border-[#b8d1ad]" : "bg-[#f8faf5] opacity-75"
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f4ee] border border-[#dce9d7] flex items-center justify-center text-[#123b30] font-extrabold shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#183c31] text-sm">{cat.name}</h3>
                      <span className="font-mono text-[10px] text-[#718078]">/{cat.slug}</span>
                    </div>
                  </div>

                  <StatusBadge status={cat.active ? "active" : "inactive"} />
                </div>

                {/* Description */}
                <p className="text-xs text-[#526e57] leading-relaxed min-h-[36px] line-clamp-2">
                  {cat.description || "Reliable repair and home maintenance services in Bhopal."}
                </p>
              </div>

              {/* Footer / Pricing & Actions */}
              <div className="mt-5 pt-3.5 border-t border-[#f0f4ee] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#718078] uppercase font-bold tracking-wider">
                    Base Visit Fee
                  </span>
                  <p className="text-sm font-extrabold text-[#123b30]">
                    ₹{cat.startingPrice}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat.id)}
                    title={cat.active ? "Disable category" : "Enable category"}
                    className="p-1 text-[#718078] hover:text-[#123b30] rounded-md transition-colors"
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
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit Category Modal */}
        <ServiceFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSaveCategory}
          initialData={editingCategory}
        />
      </div>
    </AdminShell>
  );
}
