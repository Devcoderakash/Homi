"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import type { ServiceCategory } from "../../types";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Partial<ServiceCategory>) => Promise<void>;
  initialData?: ServiceCategory | null;
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ServiceFormModalProps) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Wrench");
  const [startingPrice, setStartingPrice] = useState(199);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setSlug(initialData.slug || "");
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIcon(initialData.icon || "Wrench");
      setStartingPrice(initialData.startingPrice || 199);
      setActive(initialData.active ?? true);
    } else {
      setSlug("");
      setName("");
      setDescription("");
      setIcon("Wrench");
      setStartingPrice(199);
      setActive(true);
    }
    setError("");
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        id: initialData?.id,
        slug: finalSlug,
        name: name.trim(),
        description: description.trim(),
        icon,
        startingPrice: Number(startingPrice) || 0,
        active,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save service category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Service Category" : "Add Service Category"}
      description="Configure household service offerings available for customer requests."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#183c31] mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!initialData) {
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }
            }}
            placeholder="e.g. Deep Cleaning & Sanitization"
            className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#183c31] mb-1">
              Identifier Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. cleaning"
              className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] font-mono text-[#183c31]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183c31] mb-1">
              Base Inspection Fee (₹)
            </label>
            <input
              type="number"
              min={0}
              value={startingPrice}
              onChange={(e) => setStartingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#183c31] mb-1">
            Short Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of problems covered under this category..."
            className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="service-active-toggle"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-[#e5ebe4] text-[#123b30] accent-[#123b30] cursor-pointer"
          />
          <label
            htmlFor="service-active-toggle"
            className="text-xs font-bold text-[#183c31] cursor-pointer select-none"
          >
            Active & Available for Customer Bookings
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[#e5ebe4]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs px-3.5 py-2 font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-dark text-xs px-4 py-2 font-bold shadow-xs"
          >
            {saving ? "Saving..." : initialData ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
