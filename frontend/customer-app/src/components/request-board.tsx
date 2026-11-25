"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/components/language";
import { useServiceCopy } from "@/components/service-language";
import { useServiceCategories, type ServiceRequest } from "@/components/site";
export type BoardCounts = { total: number; available: number; active: number; completed: number; cancelled: number; pendingQuotes?: number };
export function useRequestBoard(enabled: boolean, scope: string) {
  const { t } = useLanguage();
  const [search, setSearch] = useState(""), [debounced, setDebounced] = useState(""), [category, setCategory] = useState(""), [sort, setSort] = useState("newest");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pendingQuotations, setPendingQuotations] = useState<ServiceRequest[]>([]);
  const [counts, setCounts] = useState<BoardCounts>({ total: 0, available: 0, active: 0, completed: 0, cancelled: 0, pendingQuotes: 0 });
  const [fetching, setFetching] = useState(true), [loadingMore, setLoadingMore] = useState(false), [hasMore, setHasMore] = useState(false), [error, setError] = useState("");
  const page = useRef(1), sequence = useRef(0), pending = useRef(false);
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const load = useCallback(async (targetPage = 1, append = false, quiet = false) => {
    if (!enabled) return;
    const ticket = ++sequence.current; pending.current = true;
    if (!quiet) { setError(""); if (append) setLoadingMore(true); else setFetching(true); }
    try {
      const params = new URLSearchParams({ page: String(targetPage), scope, q: debounced, service: category, sort });
      const response = await fetch(`/api/requests?${params}`, { cache: "no-store", credentials: "same-origin" });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      if (ticket !== sequence.current) return;
      const rawRequests: ServiceRequest[] = Array.isArray(body.requests) ? body.requests : [];
      setRequests(current => append ? [...current, ...rawRequests.filter((item: ServiceRequest) => !current.some(existing => existing.id === item.id))] : rawRequests);
      if (Array.isArray(body.pendingQuotations)) {
        setPendingQuotations(body.pendingQuotations);
      } else {
        setPendingQuotations(rawRequests.filter(r => (r.status || "").toUpperCase() === "CUSTOMER_APPROVAL_PENDING" || (r.quotation?.status || "").toUpperCase() === "PENDING"));
      }
      if (body.counts) {
        setCounts({
          total: body.counts.total ?? 0,
          available: body.counts.available ?? 0,
          active: body.counts.active ?? 0,
          completed: body.counts.completed ?? 0,
          cancelled: body.counts.cancelled ?? 0,
          pendingQuotes: body.counts.pendingQuotes ?? 0,
        });
      }
      setHasMore(Boolean(body.hasMore)); page.current = targetPage;
    } catch (err) { if (ticket === sequence.current && !quiet) setError(err instanceof Error ? err.message : t("errorServer")); }
    finally { if (ticket === sequence.current) { pending.current = false; setFetching(false); setLoadingMore(false); } }
  }, [enabled, scope, debounced, category, sort, t]);
  useEffect(() => {
    if (!enabled) return;
    page.current = 1;
    void load();

    const handleSync = () => {
      if (!document.hidden && !pending.current && page.current === 1) {
        void load(1, false, true);
      }
    };

    window.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    const timer = setInterval(() => {
      if (!document.hidden && !pending.current && page.current === 1) {
        void load(1, false, true);
      }
    }, 5000);

    return () => {
      clearInterval(timer);
      window.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
      sequence.current += 1;
    };
  }, [enabled, load]);
  return { requests, pendingQuotations, counts, fetching, loadingMore, hasMore, error, search, setSearch, category, setCategory, sort, setSort, reload: () => load(), loadMore: () => { if (!pending.current) void load(page.current + 1, true); } };
}
export function RequestBoardFilters({ board, worker = false }: { board: ReturnType<typeof useRequestBoard>; worker?: boolean }) {
  const { t, serviceLabel } = useLanguage(); const { s } = useServiceCopy();
  const { categories: services } = useServiceCategories();
  return <div className="request-board-filters"><label className="board-search"><Search size={18}/><input aria-label={s("searchRequests")} maxLength={120} value={board.search} placeholder={s("searchRequests")} onChange={event => board.setSearch(event.target.value)}/>{board.search && <button type="button" aria-label={s("clearSearch")} onClick={() => board.setSearch("")}><X size={16}/></button>}</label><label className="board-category"><SlidersHorizontal size={16}/><select aria-label={t("allServices")} value={board.category} onChange={event => board.setCategory(event.target.value)}><option value="">{t("allServices")}</option>{services.map(service => <option key={service.name} value={service.name}>{serviceLabel(service.name)}</option>)}</select></label><select className="board-sort" aria-label={s("sort")} value={board.sort} onChange={event => board.setSort(event.target.value)}><option value="newest">{s("newest")}</option>{worker && <option value="nearest">{s("nearest")}</option>}<option value="visit">{s("visitSoon")}</option></select></div>;
}
