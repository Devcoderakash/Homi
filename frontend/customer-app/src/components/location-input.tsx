"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Crosshair, ExternalLink, LoaderCircle, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { useLanguage } from "@/components/language";
import { coordinates, type Coordinates, type LocationValue } from "@/lib/location";
import { locationText, type LocationKey } from "@/lib/location-copy";
const LocationMap = dynamic(() => import("@/components/location-map"), { ssr: false, loading: () => <div className="location-map-placeholder"><LoaderCircle className="spin" size={22}/></div> });

export function LocationInput({ value, onChange, role = "customer", autoDetect = false, disabled = false, radiusKm, cityHint = "", compact = false }: { value: LocationValue | null; onChange: (value: LocationValue | null) => void; role?: "customer" | "worker"; autoDetect?: boolean; disabled?: boolean; radiusKm?: number; cityHint?: string; compact?: boolean }) {
  const { language } = useLanguage(); const l = useCallback((key: LocationKey) => locationText(language, key), [language]);
  const [query, setQuery] = useState(""); const [results, setResults] = useState<LocationValue[]>([]);
  const [busy, setBusy] = useState<"gps" | "search" | "lookup" | "">(""); const [error, setError] = useState(""); const [warning, setWarning] = useState("");
  const [showMap, setShowMap] = useState(false); const [embedHref, setEmbedHref] = useState("");
  const callback = useRef(onChange); const currentValue = useRef(value); const seq = useRef(0); const autoTried = useRef(false); const mounted = useRef(true);
  callback.current = onChange; currentValue.current = value;
  useEffect(() => { mounted.current = true; if (window.self !== window.top) setEmbedHref(window.location.href); return () => { mounted.current = false; seq.current += 1; }; }, []);
  const applyPoint = useCallback(async (input: Coordinates, source: "gps" | "map", accuracy: number | null = null, operation?: number) => {
    const point = coordinates(input); if (!point) { setError(l("outsideIndia")); setBusy(""); return; }
    const key = operation ?? ++seq.current;
    const previous = currentValue.current;
    const provisional: LocationValue = { ...point, source, accuracy, label: source === "gps" ? l("gpsLabel") : l("selected"), city: previous?.city || "", area: "" };
    callback.current(provisional); setError(""); setWarning(accuracy && accuracy > 200 ? l("lowAccuracy") : ""); setShowMap(source === "map" || Boolean(accuracy && accuracy > 200)); setResults([]); setBusy("lookup");
    try {
      const response = await fetch(`/api/location?mode=reverse&lat=${point.latitude}&lon=${point.longitude}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      const body = await response.json(); if (!response.ok) throw new Error();
      if (!mounted.current || seq.current !== key) return;
      const result = body.results?.[0] as LocationValue | undefined;
      if (result) callback.current({ ...provisional, label: result.label || provisional.label, area: result.area, city: result.city || provisional.city });
      else setWarning(l("lookupUnavailable"));
    } catch { if (mounted.current && seq.current === key) setWarning(l("lookupUnavailable")); }
    finally { if (mounted.current && seq.current === key) setBusy(""); }
  }, [l]);
  const detect = useCallback(() => {
    if (disabled || busy) return;
    if (!window.isSecureContext || !navigator.geolocation) { setError(l("unavailable")); return; }
    const operation = ++seq.current; setBusy("gps"); setError(""); setWarning("");
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current || seq.current !== operation) return;
      void applyPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude }, "gps", position.coords.accuracy, operation);
    }, failure => {
      if (!mounted.current || seq.current !== operation) return;
      setError(l(failure.code === 1 ? "permissionDenied" : "unavailable")); setBusy("");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, [applyPoint, busy, disabled, l]);
  useEffect(() => {
    if (!autoDetect || disabled || value || autoTried.current || !navigator.permissions) return;
    autoTried.current = true;
    void navigator.permissions.query({ name: "geolocation" }).then(permission => { if (mounted.current && !currentValue.current && permission.state === "granted") detect(); }).catch(() => {});
  }, [autoDetect, value, disabled, detect]);
  async function search() {
    if (disabled || busy) return;
    const term = query.trim(); if (term.length < 3) { setError(l("searchPlaceholder")); return; }
    const operation = ++seq.current; setBusy("search"); setError(""); setWarning("");
    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(term)}`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      const body = await response.json(); if (!response.ok) throw new Error();
      if (!mounted.current || seq.current !== operation) return;
      setResults(body.results || []); if (!body.results?.length) setWarning(l("noResults"));
    } catch { if (mounted.current && seq.current === operation) { setError(l("unavailable")); setShowMap(true); } }
    finally { if (mounted.current && seq.current === operation) setBusy(""); }
  }
  return <section className={`location-input ${compact ? "compact" : ""}`} aria-label={l(role === "worker" ? "workerTitle" : "customerTitle")}><div className="location-input-title"><span className="location-symbol"><MapPin size={19}/></span><div><strong>{l(role === "worker" ? "workerTitle" : "customerTitle")}</strong>{!compact && <p>{l(role === "worker" ? "workerHint" : "customerHint")}</p>}</div>{value && <span className="location-ready"><Check size={14}/></span>}</div>
    <div className="location-actions"><button type="button" className="location-detect" disabled={disabled || Boolean(busy)} onClick={detect}>{busy === "gps" ? <LoaderCircle className="spin" size={18}/> : <Crosshair size={18}/>} {l(busy === "gps" ? "detecting" : "detect")}</button><button type="button" className="location-map-toggle" disabled={disabled || Boolean(busy)} onClick={() => setShowMap(!showMap)}><MapPin size={16}/>{l("manual")}</button></div>
    {value && <div className="location-selected"><span><Check size={16}/></span><div><strong>{value.label || l("selected")}</strong><small>{value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}{value.source === "gps" ? ` · GPS${value.accuracy ? ` ±${Math.round(value.accuracy)} m` : ""}` : value.source === "saved" ? ` · ${l("savedLabel")}` : ""}</small></div><button type="button" aria-label={l("clear")} disabled={disabled || Boolean(busy)} onClick={() => { seq.current += 1; callback.current(null); setResults([]); setWarning(""); }}><X size={15}/></button></div>}
    <div className="location-search-row"><Search size={16}/><input aria-label={l("searchPlaceholder")} disabled={disabled || Boolean(busy)} placeholder={cityHint ? `${cityHint} · ${l("search")}` : l("searchPlaceholder")} maxLength={180} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void search(); } }}/><button type="button" disabled={disabled || Boolean(busy)} onClick={() => void search()}>{busy === "search" ? <LoaderCircle className="spin" size={16}/> : l("search")}</button></div>
    {results.length > 0 && <ul className="location-search-results">{results.map((place, index) => <li key={`${place.latitude}:${place.longitude}:${index}`}><button type="button" disabled={disabled} onClick={() => { seq.current += 1; callback.current({ ...place, source: "search" }); setResults([]); setError(""); setWarning(""); setShowMap(true); }}><MapPin size={17}/><span>{place.label || `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`}</span><Check size={15}/></button></li>)}</ul>}
    {busy === "lookup" && <div className="location-inline-status" role="status"><LoaderCircle size={15} className="spin"/>{l("searching")}</div>}{error && <p className="location-error" role="alert">{error}{embedHref && <a href={embedHref} target="_blank" rel="noopener noreferrer">{l("openTab")}<ExternalLink size={13}/></a>}</p>}{warning && <p className="location-warning" role="status">{warning}</p>}
    {showMap && <LocationMap value={value} radiusKm={radiusKm} disabled={disabled || Boolean(busy)} onChoose={point => void applyPoint(point, "map")}/>}
    <p className="location-privacy"><ShieldCheck size={13}/>{l("privacy")}</p><small className="location-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · <a href="https://photon.komoot.io" target="_blank" rel="noopener noreferrer">Photon</a></small>
  </section>;
}
