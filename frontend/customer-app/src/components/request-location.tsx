"use client";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { LocationInput } from "@/components/location-input";
import { useAppCopy, useLanguage } from "@/components/language";
import { type ServiceRequest } from "@/components/site";
import { locationPayload, savedLocation, type LocationValue } from "@/lib/location";
import { locationText } from "@/lib/location-copy";
export function RequestLocation({ request, onSaved }: { request: ServiceRequest; onSaved: () => void }) {
  const { language, t } = useLanguage(); const { a } = useAppCopy(); const l = (key: Parameters<typeof locationText>[1]) => locationText(language, key);
  const [location, setLocation] = useState<LocationValue | null>(savedLocation(request));
  const [form, setForm] = useState({ address: request.address, city: request.city });
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!location) { setError(l("required")); return; } setBusy(true); setError("");
    try { const response = await fetch(`/api/requests/${request.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "location", ...form, ...locationPayload(location) }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : t("errorServer")); } finally { setBusy(false); }
  }
  return <section className="workspace-panel request-location-fix"><div className="panel-heading"><span className="panel-icon"><MapPin size={22}/></span><h2>{l("updateLocation")}</h2></div>{!request.hasLocation && <p>{l("legacyLocation")}</p>}<form onSubmit={save}><LocationInput value={location} onChange={value => { setLocation(value); if (value) setForm(f => ({ address: value.area || f.address, city: value.city || f.city })); }} disabled={busy} cityHint={form.city}/><div className="form-field"><label htmlFor="request-area">{t("area")}</label><input id="request-area" required minLength={2} maxLength={300} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/></div><div className="form-field"><label htmlFor="request-city">{t("city")}</label><input id="request-city" required minLength={2} maxLength={120} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}/></div>{error && <div className="form-error" role="alert">{error}</div>}<button className="btn btn-dark" disabled={busy}><Check size={16}/>{busy ? t("loading") : a("save")}</button></form></section>;
}
