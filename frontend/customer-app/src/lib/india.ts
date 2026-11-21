export function indianDate(daysFromToday = 0) {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(Date.now() + daysFromToday * 86400000));
  return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
}
export function indianMobile(value: string) {
  let digits = value.replace(/[०-९]/g, ch => String("०१२३४५६७८९".indexOf(ch))).replace(/[০-৯]/g, ch => String("০১২৩৪৫৬৭৮৯".indexOf(ch))).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}
const cityNames: Record<string, string> = {
  "भोपाल": "Bhopal", "इंदौर": "Indore", "दिल्ली": "Delhi", "नई दिल्ली": "New Delhi", "मुंबई": "Mumbai", "पुणे": "Pune", "जयपुर": "Jaipur", "लखनऊ": "Lucknow", "नागपुर": "Nagpur", "पटना": "Patna", "अहमदाबाद": "Ahmedabad", "बेंगलुरु": "Bengaluru", "चेन्नई": "Chennai", "हैदराबाद": "Hyderabad", "कोलकाता": "Kolkata",
  "சென்னை": "Chennai", "கோயம்புத்தூர்": "Coimbatore", "மதுரை": "Madurai", "హైదరాబాద్": "Hyderabad", "విజయవాడ": "Vijayawada", "విశాఖపట్నం": "Visakhapatnam", "কলকাতা": "Kolkata", "দিল্লি": "Delhi", "ভোপাল": "Bhopal", "mumbai": "Mumbai", "bombay": "Mumbai", "bangalore": "Bengaluru", "bengaluru": "Bengaluru", "madras": "Chennai", "calcutta": "Kolkata",
};
export function normaliseCity(value: string) { const clean = value.trim().replace(/\s+/g, " "); return cityNames[clean] || cityNames[clean.toLowerCase()] || clean; }
export function isDemoEmail(email: string) {
  return email === "customer@homi.demo" || email === "worker@homi.demo" || email.endsWith("@guest.homi.demo");
}
export function readableTime(value: string, t: (key: "urgent" | "today" | "morning" | "afternoon" | "evening") => string) {
  if (value === "As soon as possible") return t("urgent");
  if (value === "Any time today") return t("today");
  if (value.startsWith("Morning")) return `${t("morning")} · 8–12`;
  if (value.startsWith("Afternoon")) return `${t("afternoon")} · 12–5`;
  if (value.startsWith("Evening")) return `${t("evening")} · 5–9`;
  return value;
}
