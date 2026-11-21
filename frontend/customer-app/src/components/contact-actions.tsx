"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { useLanguage } from "@/components/language";
import { indianMobile } from "@/lib/india";

export function ContactActions({ phone, title, isDemo }: { phone: string; title: string; isDemo: boolean }) {
  const { t } = useLanguage();
  const [notice, setNotice] = useState(false);
  const mobile = indianMobile(phone);
  const message = encodeURIComponent(`${t("contactMessage")} ${title}`);
  return <div className="contact-actions-wrap"><div className="local-contact-actions">{isDemo || !mobile ? <><button type="button" className="contact-link call-button" onClick={() => setNotice(!notice)}><Phone size={16}/>{t("call")}</button><button type="button" className="contact-link whatsapp-button" onClick={() => setNotice(!notice)}><MessageCircle size={16}/>{t("whatsapp")}</button></> : <><a className="contact-link call-button" href={`tel:+91${mobile}`}><Phone size={16}/>{t("call")}</a><a className="contact-link whatsapp-button" href={`https://wa.me/91${mobile}?text=${message}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>{t("whatsapp")}</a></>}</div>{notice && <p className="contact-demo-note" role="status">{t("demoContact")}</p>}</div>;
}
