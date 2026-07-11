"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Runder Foto-Cropper: Bild in Kreis-Vorschau, per Ziehen verschieben + Zoom-Slider
 * justieren. Auf „Fertig" wird der sichtbare Ausschnitt als quadratisches JPEG (512px)
 * ausgegeben (Avatare werden per CSS als Kreis dargestellt).
 */
const BOX = 288; // Ausschnittgrösse auf dem Bildschirm

export default function AvatarCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const t = useT();
  const [url] = useState(() => URL.createObjectURL(file));
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const base = img ? Math.max(BOX / img.width, BOX / img.height) : 1;
  const scale = base * zoom;

  function clamp(o: { x: number; y: number }) {
    if (!img) return o;
    const w = img.width * scale;
    const h = img.height * scale;
    return {
      x: Math.min(0, Math.max(BOX - w, o.x)),
      y: Math.min(0, Math.max(BOX - h, o.y)),
    };
  }

  // Beim Laden mittig setzen
  useEffect(() => {
    if (!img) return;
    const w = img.width * base;
    const h = img.height * base;
    setOffset({ x: (BOX - w) / 2, y: (BOX - h) / 2 });
    // base ändert sich nur mit img → bewusst nur auf img reagieren
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  // Bei Zoom-Änderung Offset neu klemmen
  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    setOffset(clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function confirm() {
    if (!img) return;
    const OUT = 512;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sSize = BOX / scale; // Quell-Ausschnittgrösse in Bildpixeln
    const sx = (0 - offset.x) / scale;
    const sy = (0 - offset.y) / scale;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-[80] mx-auto flex max-w-[430px] flex-col bg-white">
      <header className="flex items-center justify-between border-b border-black/10 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-3">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-neutral-500">{t("common.cancel")}</button>
        <span className="text-sm font-bold text-neutral-900">{t("profile.cropTitle")}</span>
        <button type="button" onClick={confirm} disabled={!img} className="text-sm font-bold text-matchup disabled:opacity-40">{t("common.done")}</button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <div
          className="relative overflow-hidden bg-neutral-100 touch-none"
          style={{ width: BOX, height: BOX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {img && (
            <img
              src={url}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              style={{ width: img.width * scale, height: img.height * scale, left: offset.x, top: offset.y }}
            />
          )}
          {/* Kreis-Maske */}
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "0 0 0 9999px rgba(255,255,255,0.72)", borderRadius: "9999px" }} />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-matchup/70" />
        </div>

        <div className="w-full max-w-[288px]">
          <p className="mb-1.5 text-center text-xs text-neutral-400">{t("profile.cropHint")}</p>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-matchup" />
        </div>
      </div>
    </div>
  );
}
