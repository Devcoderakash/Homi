"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, Check, CheckCircle2, Clock3, Handshake, IndianRupee, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
import { Footer, Header, services, useCurrentUser, type WorkerProfile } from "@/components/site";
import { useAppCopy, useLanguage } from "@/components/language";
import { VoiceInput } from "@/components/voice-input";
import { exampleKeys, type TranslationKey } from "@/lib/locales";
import { indianDate, indianMobile, isDemoEmail } from "@/lib/india";
import { LocationInput } from "@/components/location-input";
import { coordinates, DEMO_LOCATION, locationPayload, savedLocation, type LocationValue } from "@/lib/location";
import { locationText } from "@/lib/location-copy";
import { PhotoPicker, uploadRequestPhotos } from "@/components/photo-picker";
import { useServiceCopy } from "@/components/service-language";

function BookContent() {
  const params = useSearchParams();
  const { user, loading: userLoading } = useCurrentUser();
  const { language, t, serviceLabel } = useLanguage();
  const l = (key: Parameters<typeof locationText>[1]) => locationText(language, key);
  const { s } = useServiceCopy();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoWarning, setPhotoWarning] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const locationEdited = useRef(false);
  function chooseLocation(value: LocationValue | null) {
    locationEdited.current = true; setLocation(value);
    if (value) setForm(f => ({ ...f, address: value.area || f.address, city: value.city || f.city }));
  }
  const { a } = useAppCopy();
  const [preferredWorkerId, setPreferredWorkerId] = useState<string | null>(params.get("worker"));
  const [preferredWorker, setPreferredWorker] = useState<WorkerProfile | null>(null);
  const [checkingWorker, setCheckingWorker] = useState(false);
  const submitKey = useRef<string | null>(null);
  useEffect(() => {
    if (!preferredWorkerId) { setCheckingWorker(false); return; }
    let active = true; setCheckingWorker(true);
    const query = location ? `?${new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) })}` : "";
    fetch(`/api/workers/${preferredWorkerId}${query}`, { cache: "no-store" }).then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error); if (active) { setPreferredWorker(body.worker); setForm(f => ({ ...f, city: f.city || body.worker.city || "", category: f.category || body.worker.specialty || "" })); } }).catch(err => { if (active) { setError(err instanceof Error ? err.message : "Worker not found."); setPreferredWorkerId(null); setPreferredWorker(null); } }).finally(() => { if (active) setCheckingWorker(false); });
    return () => { active = false; };
  }, [preferredWorkerId, location?.latitude, location?.longitude]);
  const [form, setForm] = useState({ category: services.some(s => s.name === params.get("service")) ? params.get("service")! : "", description: "", contactPhone: "", contactName: "", address: "", city: params.get("city") || "", preferredDate: indianDate(), preferredTime: "Morning (8am – 12pm)" });
  const [timing, setTiming] = useState("urgent");
  const [sample, setSample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: number; isDemo: boolean } | null>(null);
  const demo = sample || Boolean(user && isDemoEmail(user.email));
  useEffect(() => {
    if (user?.role === "customer") {
      setForm(f => ({ ...f, contactName: f.contactName || user.name, contactPhone: f.contactPhone || indianMobile(user.phone) || "", city: f.city || user.city || "", address: f.address || user.address || "" }));
      if (!locationEdited.current) setLocation(savedLocation(user));
    }
  }, [user]);
  const update = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }));
  function useSample() {
    setSample(true); setError(""); setPreferredWorkerId(null); setPreferredWorker(null); locationEdited.current = true; setLocation(DEMO_LOCATION);
    setForm(f => ({ ...f, category: f.category || "Furniture repair", description: f.description || t(exampleKeys[f.category || "Furniture repair"]), contactName: "Ankit Verma", contactPhone: "9999999999", address: language === "hi" ? "अरेरा कॉलोनी, हनुमान मंदिर के पास (उदाहरण)" : "Arera Colony, near Hanuman Mandir (sample)", city: "Bhopal" }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || checkingWorker) return;
    if (preferredWorker?.inRange === false) { setError(l("tooFar")); return; }
    setError("");
    const checks: { invalid: boolean; key: TranslationKey; id: string }[] = [
      { invalid: !form.category, key: "errorService", id: "service-choices" },
      { invalid: form.description.trim().length < 2, key: "errorProblem", id: "problem" },
      { invalid: !indianMobile(form.contactPhone), key: "errorPhone", id: "phone" },
      { invalid: form.address.trim().length < 2, key: "errorArea", id: "area" },
      { invalid: form.city.trim().length < 2, key: "errorCity", id: "city" },
      { invalid: timing === "schedule" && (!form.preferredDate || form.preferredDate < indianDate()), key: "errorDate", id: "date" },
    ];
    const invalid = checks.find(c => c.invalid);
    if (invalid) { setError(t(invalid.key)); document.getElementById(invalid.id)?.focus(); return; }
    if (!location || !coordinates(location)) { setError(l("required")); document.getElementById("customer-location")?.focus(); document.getElementById("customer-location")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setSaving(true);
    try {
      if (!submitKey.current) submitKey.current = crypto.randomUUID();
      const response = await fetch("/api/requests", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, ...locationPayload(location), language, demo, clientKey: submitKey.current, requestedWorkerId: preferredWorkerId ? Number(preferredWorkerId) : null, preferredDate: timing === "schedule" ? form.preferredDate : indianDate(), preferredTime: timing === "schedule" ? form.preferredTime : timing === "today" ? "Any time today" : "As soon as possible" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code ? t(data.code as TranslationKey) : data.error || t("errorServer"));
      setPhotoWarning("");
      if (photos.length) {
        setUploadingPhotos(true);
        try { await uploadRequestPhotos(data.id, photos); setPhotos([]); }
        catch { setPhotoWarning(s("photoPartial")); }
        finally { setUploadingPhotos(false); }
      }
      setReceipt({ id: data.id, isDemo: data.isDemo });
      window.dispatchEvent(new Event("homi-account-updated"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(err instanceof Error ? err.message : t("errorServer")); }
    finally { setSaving(false); }
  }
  return <><Header/><main className="quick-page"><div className="container"><Link className="back-link" href="/"><ArrowLeft size={17}/>{t("backHome")}</Link>
    <div className="quick-page-heading"><span className="section-kicker">{t("quickKicker")}</span><h1>{receipt ? t("requestSent") : t("requestTitle")}</h1><p>{receipt ? t("sentDetail") : t("requestSubtitle")}</p></div>
    <div className="quick-layout"><div>
    {receipt ? <section className="quick-success"><span className="quick-success-icon"><CheckCircle2 size={34}/></span><span className="receipt-number">#{String(receipt.id).padStart(4, "0")} {receipt.isDemo && `· ${t("demoLabel")}`}</span><h2>{form.description}</h2><p><MapPin size={17}/>{form.address}, {form.city}</p><div className="quick-waiting"><Clock3 size={18}/>{t("waiting")}</div><p className="guest-track-note">{t("guestNote")}</p>{photoWarning && <div className="photo-upload-warning" role="status">{photoWarning}</div>}<Link href={`/requests/${receipt.id}`} className="btn btn-dark">{a("details")}<ArrowRight size={18}/></Link>{!receipt.isDemo && user?.email.endsWith("@guest.homi.local") && <Link href="/settings" className="receipt-save-account">{a("saveAccount")}</Link>}<button className="another-request" onClick={() => { submitKey.current = null; setReceipt(null); setPhotos([]); setPhotoWarning(""); setForm(f => ({ ...f, description: "" })); }}>{t("sendRequest")}</button>{receipt.isDemo && <div className="request-demo-note">{t("demoNotice")}</div>}</section> : user?.role === "worker" ? <section className="workspace-panel worker-book-guard"><h2>{a("selectRole")}</h2><p>{a("accountIntro")}</p><Link className="btn btn-dark" href={`/auth?role=customer&next=${encodeURIComponent(`/book?${params.toString()}`)}`}>{t("demoCustomer")}<ArrowRight size={17}/></Link></section> : <form onSubmit={submit} className="quick-form" noValidate>
      {preferredWorker && <div className="selected-worker-banner"><span>{preferredWorker.name.charAt(0)}</span><div><small>{a("selectedWorker")}</small><strong>{preferredWorker.name} · {preferredWorker.city}</strong><small>{l("serviceRadius")}: {preferredWorker.serviceRadiusKm} km{preferredWorker.distanceKm !== null ? ` · ${l("distance")}: ${preferredWorker.distanceKm.toFixed(1)} km` : ""}{checkingWorker ? ` · ${t("loading")}` : ""}</small>{preferredWorker.inRange === false && <p className="location-error" role="alert">{l("tooFar")}</p>}<button type="button" onClick={() => { setPreferredWorkerId(null); setPreferredWorker(null); }}>{a("removeWorker")}</button></div></div>}
      <fieldset className="quick-service-field" id="service-choices" tabIndex={-1}><legend><span className="field-step">1</span>{t("selectService")}</legend><div className="quick-services">{services.map(s => { const Icon = s.icon; return <button type="button" className={`quick-service ${form.category === s.name ? "selected" : ""}`} key={s.name} onClick={() => update("category", s.name)} aria-pressed={form.category === s.name}><span style={{ background: s.color }}><Icon size={22}/></span><strong>{serviceLabel(s.name)}</strong>{form.category === s.name && <Check size={15} className="quick-service-check"/>}</button>; })}</div></fieldset>
      <div className="quick-problem-field"><label htmlFor="problem"><span className="field-step">2</span>{t("problem")}</label><textarea id="problem" dir="auto" required maxLength={1200} rows={3} placeholder={t("problemPlaceholder")} value={form.description} onChange={e => update("description", e.target.value)}/><div className="quick-problem-help"><small>{t("anyLanguage")}</small><VoiceInput disabled={saving} onText={text => setForm(f => ({ ...f, description: `${f.description}${f.description ? " " : ""}${text}`.slice(0, 1200) }))}/></div>{form.category && <button type="button" className="problem-example" onClick={() => update("description", t(exampleKeys[form.category]))}><Sparkles size={14}/>{t(exampleKeys[form.category])}<span>+</span></button>}</div>
      <details className="booking-photo-option"><summary><Camera size={17}/>{s("photoOptional")}{photos.length > 0 && <span>{photos.length}/3</span>}</summary><PhotoPicker files={photos} onChange={setPhotos} disabled={saving}/>{demo && <p className="photo-demo-note">{s("demoPhoto")}</p>}</details>
      <div className="quick-contact-section"><div className="quick-field-heading"><span className="field-step">3</span>{t("contactDetails")}</div><div className="form-field"><label htmlFor="phone">{t("phone")}</label><div className="india-phone"><span>🇮🇳 +91</span><input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t("phone")} maxLength={18} value={form.contactPhone} onChange={e => update("contactPhone", e.target.value)}/></div><small className="field-help">{t("phoneHint")}</small></div><div id="customer-location" tabIndex={-1}><LocationInput value={location} onChange={chooseLocation} role="customer" autoDetect={!demo && !userLoading} disabled={saving} cityHint={form.city}/></div><div className="proximity-banner"><span><MapPin size={15}/> {l("nearby")}</span><p>{l("matchingHint")}</p></div><div className="quick-location-grid"><div className="form-field"><label htmlFor="area">{t("area")}</label><input id="area" autoComplete="address-line2" maxLength={300} placeholder={t("areaPlaceholder")} value={form.address} onChange={e => update("address", e.target.value)}/></div><div className="form-field"><label htmlFor="city">{t("city")}</label><input id="city" autoComplete="address-level2" maxLength={120} placeholder={t("cityPlaceholder")} value={form.city} onChange={e => update("city", e.target.value)}/></div></div><details className="optional-name"><summary>{t("name")} <span>({t("optional")})</span></summary><div className="form-field"><input aria-label={t("name")} autoComplete="name" maxLength={120} placeholder={t("namePlaceholder")} value={form.contactName} onChange={e => update("contactName", e.target.value)}/></div></details></div>
      <fieldset className="quick-timing"><legend>{t("when")}</legend><div className="timing-options">{(["urgent", "today", "schedule"] as const).map(value => <button key={value} type="button" className={timing === value ? "selected" : ""} onClick={() => setTiming(value)} aria-pressed={timing === value}>{value === "urgent" && <Clock3 size={16}/>} {t(value)}</button>)}</div>{timing === "schedule" && <div className="form-row"><div className="form-field"><label htmlFor="date">{t("date")}</label><input id="date" type="date" min={indianDate()} value={form.preferredDate} onChange={e => update("preferredDate", e.target.value)}/></div><div className="form-field"><label htmlFor="time">{t("time")}</label><select id="time" value={form.preferredTime} onChange={e => update("preferredTime", e.target.value)}><option value="Morning (8am – 12pm)">{t("morning")} · 8–12</option><option value="Afternoon (12pm – 5pm)">{t("afternoon")} · 12–5</option><option value="Evening (5pm – 9pm)">{t("evening")} · 5–9</option></select></div></div>}</fieldset>
      {error && <div className="form-error" role="alert">{error}</div>}<button className="btn btn-dark quick-send" disabled={saving || checkingWorker || Boolean(preferredWorkerId && (!preferredWorker || !preferredWorker.available || preferredWorker.inRange === false))} aria-busy={saving}>{uploadingPhotos ? s("uploading") : saving ? t("sending") : t("send")}<Send size={19}/></button><p className="quick-consent">{t("consent")}</p><div className="quick-price-note"><IndianRupee size={16}/>{t("rateNote")}</div><div className="sample-details-row"><button type="button" disabled={saving} onClick={useSample}><Sparkles size={15}/>{t("tryDemo")}</button>{demo && <small>{t("demoNotice")}</small>}</div>
    </form>}
    </div><aside className="quick-aside"><div className="local-help-card"><span className="local-help-icon"><Handshake size={27}/></span><h2>{t("nextTitle")}</h2><ol><li><span>1</span><p>{t("next1")}</p></li><li><span>2</span><p>{t("next2")}</p></li><li><span>3</span><p>{t("next3")}</p></li></ol><div className="local-language-tip"><MessageCircle size={22}/><div><strong>{t("talkLocal")}</strong><p>{t("talkLocalDetail")}</p></div></div></div><div className="quick-reassurance"><span><Phone size={18}/>{t("directCall")}</span><span><IndianRupee size={18}/>{t("priceFirst")}</span><span><CheckCircle2 size={18}/>{t("noSignup")}</span><p>{a("noGuarantee")}</p></div></aside></div>
  </div></main><Footer/></>;
}
export default function BookPage() { return <Suspense fallback={<div className="page-loading">Loading…</div>}><BookContent/></Suspense>; }
