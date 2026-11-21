export type Coordinates = { latitude: number; longitude: number };
export type LocationSource = "gps" | "search" | "map" | "saved" | "demo";
export type LocationValue = Coordinates & { label: string; area: string; city: string; source: LocationSource; accuracy: number | null };
export const EARTH_KM = 6371.0088;
export const DEFAULT_RADIUS_KM = 10;
export const MAX_RADIUS_KM = 25;
export const INDIA_BOUNDS = { south: 6, north: 38, west: 68, east: 98 };
export const DEMO_LOCATION: LocationValue = { latitude: 23.2181, longitude: 77.4345, label: "Arera Colony, Bhopal (sample)", area: "Arera Colony, near Hanuman Mandir (sample)", city: "Bhopal", source: "demo", accuracy: null };
export function coordinates(value: { latitude?: unknown; longitude?: unknown }): Coordinates | null {
  const { latitude, longitude } = value;
  if (typeof latitude !== "number" || typeof longitude !== "number" || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < INDIA_BOUNDS.south || latitude > INDIA_BOUNDS.north || longitude < INDIA_BOUNDS.west || longitude > INDIA_BOUNDS.east) return null;
  return { latitude: Math.round(latitude * 1e6) / 1e6, longitude: Math.round(longitude * 1e6) / 1e6 };
}
export function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude); const dLon = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export function serviceRadius(value: unknown) { return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_RADIUS_KM ? value : null; }
export function locationFrom(body: Record<string, unknown>): LocationValue | null {
  const point = coordinates(body); if (!point) return null;
  const source = ["gps", "search", "map", "saved", "demo"].includes(String(body.locationSource)) ? body.locationSource as LocationSource : "map";
  const accuracy = typeof body.locationAccuracy === "number" && Number.isFinite(body.locationAccuracy) && body.locationAccuracy >= 0 && body.locationAccuracy <= 100000 ? body.locationAccuracy : null;
  return { ...point, source, accuracy, label: typeof body.locationLabel === "string" ? body.locationLabel.trim().slice(0, 300) : "", area: typeof body.address === "string" ? body.address.trim().slice(0, 300) : "", city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : "" };
}
export function locationPayload(location: LocationValue | null) {
  return { latitude: location?.latitude ?? null, longitude: location?.longitude ?? null, locationLabel: location?.label || "", locationSource: location?.source || "map", locationAccuracy: location?.accuracy ?? null };
}
export function savedLocation(value: { latitude?: number | null; longitude?: number | null; locationLabel?: string | null; city?: string | null; address?: string | null }): LocationValue | null {
  const point = coordinates(value); return point ? { ...point, label: value.locationLabel || [value.address, value.city].filter(Boolean).join(", "), city: value.city || "", area: value.address || "", source: "saved", accuracy: null } : null;
}
export function canServe(worker: { latitude: number | null; longitude: number | null; serviceRadiusKm: number }, destination: { latitude: number | null; longitude: number | null }) {
  const start = coordinates(worker), finish = coordinates(destination), radius = serviceRadius(worker.serviceRadiusKm);
  return Boolean(start && finish && radius && distanceKm(start, finish) <= radius);
}
export function formattedDistance(value: number) { return `${value < 0.1 ? "<0.1" : value.toFixed(1)} km`; }
