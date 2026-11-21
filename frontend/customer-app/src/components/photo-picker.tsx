"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { useServiceCopy } from "@/components/service-language";
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/photo-settings";

export function PhotoPicker({ files, onChange, disabled = false, maximum = MAX_PHOTOS }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean; maximum?: number }) {
  const { s } = useServiceCopy(); const input = useRef<HTMLInputElement>(null); const [error, setError] = useState(""); const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  useEffect(() => { const images = files.map(file => ({ url: URL.createObjectURL(file), name: file.name })); setPreviews(images); return () => images.forEach(image => URL.revokeObjectURL(image.url)); }, [files]);
  function choose(newFiles: FileList | null) {
    if (!newFiles) return; setError("");
    const selected = [...files];
    for (const file of Array.from(newFiles)) {
      if (!file.size || file.size > MAX_PHOTO_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError(s("photoLimit")); return; }
      if (!selected.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) selected.push(file);
    }
    if (selected.length > maximum) { setError(s("photoLimit")); return; }
    onChange(selected);
  }
  return <div className="photo-picker"><div className="photo-picker-header"><span className="photo-icon"><Camera size={20}/></span><div><strong>{s("photoOptional")}</strong><p>{s("photoHelp")}</p></div><span className="photo-counter">{files.length}/{maximum}</span></div>{previews.length > 0 && <div className="selected-photos">{previews.map((preview, index) => <div className="selected-photo" key={preview.url}><Image src={preview.url} alt={`${s("photos")} ${index + 1}`} width={160} height={120} unoptimized/><button type="button" aria-label={`${s("removePhoto")} ${index + 1}`} disabled={disabled} onClick={() => { onChange(files.filter((_, position) => position !== index)); setError(""); }}><X size={15}/></button></div>)}</div>}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={disabled} aria-label={s("choosePhotos")} onChange={event => { choose(event.target.files); event.target.value = ""; }}/><button type="button" className="photo-choose-button" disabled={disabled || files.length >= maximum || maximum < 1} onClick={() => input.current?.click()}><ImagePlus size={17}/>{s("choosePhotos")}</button>{error && <p className="photo-error" role="alert">{error}</p>}<p className="photo-privacy">{s("photoPrivacy")}</p></div>;
}
export async function uploadRequestPhotos(id: number, files: File[]) {
  if (!files.length) return;
  const form = new FormData(); files.forEach(file => form.append("photos", file));
  const response = await fetch(`/api/requests/${id}/photos`, { method: "POST", credentials: "same-origin", body: form });
  const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error || "Could not upload the photos. Please try again.");
  return body;
}
