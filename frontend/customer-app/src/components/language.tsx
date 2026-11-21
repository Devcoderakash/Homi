"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Languages } from "lucide-react";
import { languages, serviceKeys, translate, type Language, type TranslationKey } from "@/lib/locales";
import { appText, type AppKey } from "@/lib/app-copy";
import { locationText } from "@/lib/location-copy";
import { serviceText, type ServiceKey } from "@/lib/service-copy";
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: "en", setLanguage: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => { try { const stored = localStorage.getItem("homi-language"); if (languages.some(l => l.code === stored)) setLanguageState(stored as Language); } catch { /* Optional storage. */ } }, []);
  const setLanguage = useCallback((value: Language) => { setLanguageState(value); try { localStorage.setItem("homi-language", value); } catch { /* Optional storage. */ } }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
}
const statuses: Record<string, TranslationKey> = { open: "status_open", accepted: "status_accepted", on_the_way: "status_on_the_way", completed: "status_completed", cancelled: "status_cancelled" };
export function useLanguage() {
  const { language, setLanguage } = useContext(LanguageContext);
  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);
  const serviceLabel = (name: string) => serviceKeys[name] ? t(serviceKeys[name]) : name;
  const statusLabel = (rawStatus: string) => {
    const status = (rawStatus || "").toLowerCase();
    if (status === "new" || status === "pending_admin_review" || status === "pending") return language === "hi" ? "समीक्षा जारी" : "Review Pending";
    if (status === "shared_with_workers" || status === "open_for_applications" || status === "finding_worker" || status === "approved") return language === "hi" ? "कारीगर खोज जारी" : "Finding a Worker";
    if (status === "worker_selected") return language === "hi" ? "कारीगर चुना गया" : "Worker Selected";
    if (status === "customer_approval_pending") return language === "hi" ? "कीमत स्वीकृति बाकी" : "Price Approval Pending";
    if (status === "customer_confirmed" || status === "accepted_by_customer") return language === "hi" ? "स्वीकृत एवं पुष्ट" : "Confirmed by Customer";
    if (status === "customer_declined") return language === "hi" ? "कोटेशन अस्वीकृत" : "Quotation Declined";
    if (status === "assigned" || status === "accepted") return language === "hi" ? "कारीगर नियुक्त" : "Technician Assigned";
    if (status === "rejected") return language === "hi" ? "अनुरोध अस्वीकृत" : "Request Declined";
    if (status === "cancelled") return language === "hi" ? "रद्द किया गया" : "Cancelled";
    if (status === "in_progress" || status === "on_the_way") return appText(language, "workInProgress");
    if (status === "awaiting_confirmation") return appText(language, "awaitingConfirmation");
    if (status === "completed") return language === "hi" ? "कार्य पूर्ण" : "Completed";
    return t(statuses[status] || "status_open");
  };
  return { language, setLanguage, t, serviceLabel, statusLabel };
}
export function useAppCopy() {
  const { language, t, statusLabel } = useLanguage();
  const a = useCallback((key: AppKey) => appText(language, key), [language]);
  function eventLabel(kind: string) {
    if (kind === "accept") return statusLabel("accepted");
    if (kind === "created") return t("requestSent");
    if (kind === "new_request") return t("newRequest");
    if (kind === "location") return locationText(language, "updateLocation");
    const serviceEvents: Record<string, ServiceKey> = { visit_proposed: "visitProposed", visit_confirmed: "visitConfirmed", visit_declined: "visitDeclined", photo_added: "photoAdded", photo_removed: "photoRemoved" };
    if (serviceEvents[kind]) return serviceText(language, serviceEvents[kind]);
    const events: Record<string, AppKey> = { quote: "quote", approve_quote: "quoteApproved", decline_quote: "quoteDeclined", message: "messages", review: "yourReview", released: "released", payment_reported: "payment", payment_received: "paymentReceived" };
    if (events[kind]) return a(events[kind]);
    return statusLabel(kind);
  }
  return { a, eventLabel };
}
export function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();
  return <label className="language-picker"><Languages size={17} aria-hidden="true"/><select aria-label={t("language")} value={language} onChange={e => setLanguage(e.target.value as Language)}>{languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></label>;
}
