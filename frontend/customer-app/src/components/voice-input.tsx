"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLanguage } from "@/components/language";
import { languages } from "@/lib/locales";

type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; abort: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null };
type RecognitionConstructor = new () => Recognition;
export function VoiceInput({ onText, disabled }: { onText: (text: string) => void; disabled: boolean }) {
  const { language, t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => () => { if (recognition.current) { recognition.current.onend = null; recognition.current.onerror = null; recognition.current.onresult = null; recognition.current.abort(); } }, []);
  function listen() {
    if (listening) { recognition.current?.stop(); return; }
    const browser = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice(t("voiceUnsupported")); return; }
    const recorder = new Constructor();
    recognition.current = recorder;
    recorder.lang = languages.find(l => l.code === language)!.speech;
    recorder.continuous = false;
    recorder.interimResults = false;
    recorder.onresult = event => { const text = event.results[event.resultIndex]?.[0]?.transcript; if (text) { onText(text); setNotice(""); } };
    recorder.onerror = () => { setListening(false); setNotice(t("voiceError")); };
    recorder.onend = () => setListening(false);
    try { setNotice(""); recorder.start(); setListening(true); } catch { setListening(false); setNotice(t("voiceError")); }
  }
  return <div className="voice-input"><button type="button" className={`voice-button ${listening ? "listening" : ""}`} disabled={disabled} onClick={listen} aria-pressed={listening}>{listening ? <Square size={15}/> : <Mic size={17}/>} {t(listening ? "stop" : "speak")}</button><span className="voice-notice" role="status">{listening ? t("listening") : notice}</span>{listening && <small>{t("voiceHint")}</small>}</div>;
}
