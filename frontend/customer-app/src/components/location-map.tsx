"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Check } from "lucide-react";
import type * as Leaflet from "leaflet";
import { serviceRadius, type Coordinates, type LocationValue } from "@/lib/location";
import { useLanguage } from "@/components/language";
import { locationText } from "@/lib/location-copy";

export default function LocationMap({ value, radiusKm, disabled, onChoose }: { value: LocationValue | null; radiusKm?: number; disabled: boolean; onChoose: (point: Coordinates) => void }) {
  const { language } = useLanguage(); const l = (key: Parameters<typeof locationText>[1]) => locationText(language, key);
  const host = useRef<HTMLDivElement>(null); const map = useRef<Leaflet.Map | null>(null); const ring = useRef<Leaflet.Circle | null>(null); const library = useRef<typeof Leaflet | null>(null);
  const initial = useRef(value); const [ready, setReady] = useState(false); const [zoom, setZoom] = useState(value ? 16 : 5); const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    void import("leaflet").then(L => {
      if (!alive || !host.current) return;
      library.current = L;
      const point = initial.current;
      const instance = L.map(host.current, { center: point ? [point.latitude, point.longitude] : [23.5, 80], zoom: point ? 16 : 5, minZoom: 4, maxZoom: 19, scrollWheelZoom: false, attributionControl: true, zoomControl: true, maxBounds: [[5, 66], [39, 100]], maxBoundsViscosity: 0.8 });
      map.current = instance;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' }).addTo(instance);
      instance.on("zoomend", () => setZoom(instance.getZoom()));
      instance.on("click", (event: Leaflet.LeafletMouseEvent) => instance.panTo(event.latlng));
      setReady(true); setTimeout(() => instance.invalidateSize(), 0);
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current || !ready || !value) return;
    map.current.setView([value.latitude, value.longitude], 16, { animate: false });
  }, [ready, value?.latitude, value?.longitude]);
  useEffect(() => {
    if (!map.current || !library.current || !ready) return;
    ring.current?.remove(); ring.current = null;
    const radius = serviceRadius(radiusKm);
    if (value && radius) ring.current = library.current.circle([value.latitude, value.longitude], { radius: radius * 1000, color: "#71914e", weight: 1.5, fillColor: "#c8dfaa", fillOpacity: 0.12 }).addTo(map.current);
  }, [ready, value?.latitude, value?.longitude, radiusKm]);
  return <div className="location-map-picker"><p className="location-map-help">{l("pinHelp")}</p><div className="location-map-frame"><div className="location-map" ref={host} role="region" aria-label={l("manual")}/>{!failed && <span className="map-center-pin" aria-hidden="true"><MapPin size={38} fill="#224e38" color="white" strokeWidth={1.6}/><span/></span>}{failed && <p className="map-loading">{l("unavailable")}</p>}</div><button type="button" className="btn btn-dark confirm-location-pin" disabled={!ready || disabled || zoom < 13} onClick={() => { const point = map.current?.getCenter(); if (point) onChoose({ latitude: point.lat, longitude: point.lng }); }}><Check size={17}/>{zoom < 13 ? l("zoomIn") : l("usePin")}</button></div>;
}
