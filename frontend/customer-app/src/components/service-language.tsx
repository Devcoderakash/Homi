"use client";
import { useCallback } from "react";
import { useLanguage } from "@/components/language";
import { serviceText, type ServiceKey } from "@/lib/service-copy";
export function useServiceCopy() { const { language } = useLanguage(); const s = useCallback((key: ServiceKey) => serviceText(language, key), [language]); return { s }; }
