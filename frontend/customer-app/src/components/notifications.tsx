"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { useAppCopy, useLanguage } from "@/components/language";
type Update = { id: number; requestId: number | null; kind: string; title: string; readAt: string | null; createdAt: string };
export function Notifications() {
  const { a, eventLabel } = useAppCopy(); const { language } = useLanguage();
  const [open, setOpen] = useState(false); const [items, setItems] = useState<Update[]>([]); const [count, setCount] = useState(0);
  async function load() { try { const r = await fetch("/api/notifications", { cache: "no-store" }); if (r.ok) { const d = await r.json(); setItems(d.notifications); setCount(d.unread); } } catch { /* Next poll will retry. */ } }
  useEffect(() => { void load(); const interval = setInterval(() => void load(), 10000); return () => clearInterval(interval); }, []);
  async function read(id?: number) { await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) }); await load(); }
  return <div className="updates-menu"><button type="button" className="updates-toggle" aria-label={a("notifications")} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={19}/>{count > 0 && <span>{count > 99 ? "99+" : count}</span>}</button>{open && <><button className="updates-backdrop" aria-label={a("close")} onClick={() => setOpen(false)}/><div className="updates-panel"><div className="updates-heading"><h3>{a("notifications")}</h3><button onClick={() => setOpen(false)} aria-label={a("close")}><X size={18}/></button></div>{count > 0 && <button className="updates-mark" onClick={() => void read()}><CheckCheck size={15}/>{a("markRead")}</button>}<div className="updates-list">{items.length === 0 ? <p className="updates-empty">{a("noUpdates")}</p> : items.map(item => <Link href={item.requestId ? `/requests/${item.requestId}` : "/customer"} key={item.id} className={`update-item ${!item.readAt ? "unread" : ""}`} onClick={() => { void read(item.id); setOpen(false); }}><span className="update-dot"/><div><strong>{eventLabel(item.kind)}</strong><p dir="auto">{item.title}</p><small>{new Date(item.createdAt).toLocaleString(`${language}-IN`, { timeZone: "Asia/Kolkata", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small></div></Link>)}</div></div></>}</div>;
}
