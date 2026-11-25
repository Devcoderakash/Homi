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

export const SERVICE_ICON_OPTIONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "Droplets", label: "Plumbing", icon: Droplets },
  { name: "PlugZap", label: "Electrical", icon: PlugZap },
  { name: "Hammer", label: "Carpentry", icon: Hammer },
  { name: "Sparkles", label: "Cleaning", icon: Sparkles },
  { name: "PaintRoller", label: "Painting", icon: PaintRoller },
  { name: "Fan", label: "Appliance", icon: Fan },
  { name: "Armchair", label: "Furniture", icon: Armchair },
  { name: "Wrench", label: "Handyman", icon: Wrench },
  { name: "Zap", label: "Power", icon: Zap },
  { name: "Thermometer", label: "AC / Cooling", icon: Thermometer },
  { name: "Lock", label: "Locksmith", icon: Lock },
  { name: "ShieldCheck", label: "Safety", icon: ShieldCheck },
  { name: "Home", label: "Home Care", icon: Home },
  { name: "Scissors", label: "Garden / Trim", icon: Scissors },
  { name: "Truck", label: "Shifting", icon: Truck },
];

export const SERVICE_COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "#dfeefd", label: "Sky Blue" },
  { value: "#fff0d8", label: "Warm Amber" },
  { value: "#f7e8d8", label: "Soft Wood" },
  { value: "#e9e4fa", label: "Lavender" },
  { value: "#fce4e4", label: "Soft Rose" },
  { value: "#e2f2e8", label: "Mint Green" },
  { value: "#f4e9d9", label: "Sandstone" },
  { value: "#e5edee", label: "Cool Slate" },
];

const iconLookup: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_OPTIONS.map((opt) => [opt.name, opt.icon])
);

export function getServiceIcon(iconName?: string): LucideIcon {
  if (!iconName) return Wrench;
  return iconLookup[iconName] || Wrench;
}
