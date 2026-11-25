"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Armchair,
  Droplets,
  Fan,
  Hammer,
  Home,
  Lock,
  PaintRoller,
  PlugZap,
  Scissors,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ServiceCategoryItem = {
  id?: number;
  name: string;
  slug?: string;
  subtitle: string;
  description?: string;
  iconName?: string;
  icon: LucideIcon;
  color: string;
  startingPrice: number;
  sortOrder?: number;
};

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets,
  PlugZap,
  Hammer,
  Sparkles,
  PaintRoller,
  Fan,
  Armchair,
  Wrench,
  Zap,
  Thermometer,
  Lock,
  ShieldCheck,
  Home,
  Scissors,
  Truck,
};

export function getCategoryIcon(iconName?: string): LucideIcon {
  if (!iconName) return Wrench;
  return ICON_MAP[iconName] || Wrench;
}

export const FALLBACK_SERVICES: ServiceCategoryItem[] = [
  { name: "Plumbing", slug: "plumbing", subtitle: "Taps, pipes & leaks", iconName: "Droplets", icon: Droplets, color: "#dfeefd", startingPrice: 199 },
  { name: "Electrical", slug: "electrical", subtitle: "Fans, lights & switches", iconName: "PlugZap", icon: PlugZap, color: "#fff0d8", startingPrice: 199 },
  { name: "Carpentry", slug: "carpentry", subtitle: "Doors & woodwork", iconName: "Hammer", icon: Hammer, color: "#f7e8d8", startingPrice: 199 },
  { name: "Cleaning", slug: "cleaning", subtitle: "Kitchen & home", iconName: "Sparkles", icon: Sparkles, color: "#e9e4fa", startingPrice: 199 },
  { name: "Painting", slug: "painting", subtitle: "Walls & touch-ups", iconName: "PaintRoller", icon: PaintRoller, color: "#fce4e4", startingPrice: 199 },
  { name: "Appliance repair", slug: "appliance-repair", subtitle: "AC, fridge & washing machine", iconName: "Fan", icon: Fan, color: "#e2f2e8", startingPrice: 199 },
  { name: "Furniture repair", slug: "furniture-repair", subtitle: "Sofas, chairs & beds", iconName: "Armchair", icon: Armchair, color: "#f4e9d9", startingPrice: 199 },
  { name: "General handyman", slug: "general-handyman", subtitle: "Not sure? Start here", iconName: "Wrench", icon: Wrench, color: "#e5edee", startingPrice: 199 },
];

let cachedCategories: ServiceCategoryItem[] | null = null;

function normalizeCategory(raw: any): ServiceCategoryItem {
  const iconName = raw.icon || raw.iconName || "Wrench";
  const subtitle = raw.description || raw.subtitle || "Household repair & local help";
  return {
    id: typeof raw.id === "number" ? raw.id : undefined,
    name: String(raw.name || "").trim(),
    slug: raw.slug || undefined,
    subtitle,
    description: raw.description || subtitle,
    iconName,
    icon: getCategoryIcon(iconName),
    color: raw.color || "#e5edee",
    startingPrice: typeof raw.startingPrice === "number" ? raw.startingPrice : 199,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

export function useServiceCategories() {
  const [categories, setCategories] = useState<ServiceCategoryItem[]>(
    () => cachedCategories ?? FALLBACK_SERVICES
  );
  const [loading, setLoading] = useState<boolean>(cachedCategories === null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const rawList = Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.services)
        ? data.services
        : null;

      if (rawList) {
        const normalized = rawList
          .filter((item: any) => item && item.name && item.active !== false)
          .map(normalizeCategory);
        cachedCategories = normalized;
        setCategories(normalized);
      }
    } catch {
      // Keep fallback or cached categories when offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { categories, loading, reload };
}
