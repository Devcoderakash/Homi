"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import {
  SERVICE_COLOR_OPTIONS,
  SERVICE_ICON_OPTIONS,
} from "../../lib/service-icons";
import type { ServiceCategory } from "../../types";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Partial<ServiceCategory>) => Promise<void>;
  initialData?: ServiceCategory | null;
  nextSortOrder?: number;
}

function slugifyName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ServiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  nextSortOrder = 1,
}: ServiceFormModalProps) {
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Wrench");
  const [color, setColor] = useState("#e5edee");
  const [startingPrice, setStartingPrice] = useState(199);
  const [sortOrder, setSortOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setSlug(initialData.slug || "");
      setSlugEdited(true);
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIcon(initialData.icon || "Wrench");
      setColor(initialData.color || "#e5edee");
      setStartingPrice(initialData.startingPrice ?? 199);
      setSortOrder(initialData.sortOrder ?? 0);
      setActive(initialData.active ?? true);
    } else {
      setSlug("");
      setSlugEdited(false);
      setName("");
      setDescription("");
      setIcon("Wrench");
      setColor("#e5edee");
      setStartingPrice(199);
      setSortOrder(nextSortOrder);
      setActive(true);
    }
    setError("");
  }, [initialData, isOpen, nextSortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    const finalSlug = slugifyName(slug) || slugifyName(name);
    if (!finalSlug) {
      setError("Please provide a valid URL slug.");
      return;
    }
    if (Number(startingPrice) < 0) {
      setError("Base visit fee cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit({
        id: initialData?.id,
        slug: finalSlug,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        startingPrice: Number(startingPrice) || 0,
        sortOrder: Number(sortOrder) || 0,
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
      description="Configure category details, pricing, appearance, and customer visibility."
      maxWidth="lg"
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
            maxLength={80}
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              if (!slugEdited) {
                setSlug(slugifyName(val));
              }
            }}
            placeholder="e.g. Deep Cleaning & Sanitization"
            className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#183c31] mb-1">
              Identifier Slug *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
              }}
              placeholder="e.g. cleaning"
              className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] font-mono text-[#183c31]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183c31] mb-1">
              Base Visit Fee (₹) *
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              required
              value={startingPrice}
              onChange={(e) => setStartingPrice(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183c31] mb-1">
              Display Order
            </label>
            <input
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-[#e5ebe4] rounded-lg outline-none focus:border-[#123b30] bg-[#f8faf5] focus:bg-white text-[#183c31]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#183c31] mb-1.5">
            Service Icon
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {SERVICE_ICON_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const selected = icon === opt.name;
              return (
                <button
                  key={opt.name}
                  type="button"
                  title={opt.label}
                  onClick={() => setIcon(opt.name)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                    selected
                      ? "border-[#123b30] bg-[#e8f3e0] text-[#123b30] ring-1 ring-[#123b30]"
                      : "border-[#e5ebe4] bg-[#f8faf5] text-[#526e57] hover:border-[#9eb99b]"
                  }`}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#183c31] mb-1.5">
            Badge Accent Color
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {SERVICE_COLOR_OPTIONS.map((cOpt) => {
              const selected = color.toLowerCase() === cOpt.value.toLowerCase();
              return (
                <button
                  key={cOpt.value}
                  type="button"
                  title={cOpt.label}
                  onClick={() => setColor(cOpt.value)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    selected ? "border-[#123b30] scale-110 shadow-xs" : "border-[#d8e2d7]"
                  }`}
                  style={{ backgroundColor: cOpt.value }}
                  aria-label={cOpt.label}
                />
              );
            })}
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#e5edee"}
              onChange={(e) => setColor(e.target.value)}
              title="Custom hex color"
              className="w-7 h-7 p-0 border border-[#e5ebe4] rounded-md cursor-pointer bg-white"
            />
            <span className="text-[11px] font-mono text-[#718078] ml-1">{color}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#183c31] mb-1">
            Short Description
          </label>
          <textarea
            rows={2}
            maxLength={300}
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
            Active &amp; Available for Customer Bookings
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
