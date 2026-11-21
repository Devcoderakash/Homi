"use client";
import { useCallback } from "react";
import { useLanguage } from "@/components/language";
import { reportText, type ReportKey } from "@/lib/report-copy";
export function useReportCopy() { const { language } = useLanguage(); const r = useCallback((key: ReportKey) => reportText(language, key), [language]); return { r }; }
