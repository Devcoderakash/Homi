import type { Language } from "@/lib/locales";
export function formatVisit(value: string | Date, language: Language = "en") { return new Date(value).toLocaleString(`${language}-IN`, { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); }
export function indiaInputs(value = new Date(Date.now() + 2 * 3600000)) { const local = new Date(value.getTime() + 330 * 60000).toISOString(); return { date: local.slice(0, 10), time: local.slice(11, 16) }; }
