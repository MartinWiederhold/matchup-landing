"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import WimbledonWidget from "../mockup/WimbledonWidget";

function Icon({ path, className = "", size = 22, fill = "none" }: { path: string; className?: string; size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ME = { name: "Martin", img: "https://i.pravatar.cc/160?img=47" };

const FRIENDS = [
  { name: "Adzana", img: "https://i.pravatar.cc/160?img=5" },
  { name: "Feera", img: "https://i.pravatar.cc/160?img=9" },
  { name: "Kevin", img: "https://i.pravatar.cc/160?img=12" },
  { name: "Laila", img: "https://i.pravatar.cc/160?img=16" },
  { name: "Fernando", img: "https://i.pravatar.cc/160?img=13" },
];

const CIRCLE = [
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=45",
  "https://i.pravatar.cc/120?img=11",
  "https://i.pravatar.cc/120?img=7",
];

type Post = { id: number; text: string; image: string | null; time: string };

export default function Mockup2Screen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftImg, setDraftImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nextId = useRef(1);

  function openComposer(withPicker = false) {
    setComposerOpen(true);
    if (withPicker) setTimeout(() => fileRef.current?.click(), 60);
  }
  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setDraftImg(URL.createObjectURL(f));
  }
  function publish() {
    if (!draft.trim() && !draftImg) return;
    setPosts((p) => [{ id: nextId.current++, text: draft.trim(), image: draftImg, time: "gerade eben" }, ...p]);
    setDraft("");
    setDraftImg(null);
    setComposerOpen(false);
  }
  function closeComposer() {
    setComposerOpen(false);
    setDraft("");
    setDraftImg(null);
  }

  return (
    <div className="min-h-[100dvh] w-full bg-white text-black">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white px-5 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
        {/* Header */}
        <header className="flex items-center justify-between pt-2">
          <img src={ME.img} alt="" className="h-14 w-14 rounded-full object-cover" />
          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] text-black ring-1 ring-black/10">
            <Icon path="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" size={20} />
          </button>
        </header>

        {/* Headline */}
        <h1 className="mt-6 text-[30px] font-medium leading-[1.15] tracking-tight text-black">
          Your <span className="font-extrabold">Fitness Journey</span>
          <br />
          With Friends
        </h1>

        {/* Story-Reihe */}
        <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">
          <button type="button" onClick={() => openComposer(false)} className="flex w-[58px] shrink-0 flex-col items-center gap-2">
            <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-black text-white">
              <Icon path="M12 5v14M5 12h14" size={22} />
            </span>
            <span className="text-[11px] text-neutral-500">Add Friend</span>
          </button>
          {FRIENDS.map((f) => (
            <div key={f.name} className="flex w-[58px] shrink-0 flex-col items-center gap-2">
              <span className="block h-[58px] w-[58px] rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                <img src={f.img} alt="" className="h-full w-full rounded-full object-cover ring-[2.5px] ring-white" />
              </span>
              <span className="max-w-[58px] truncate text-[11px] text-neutral-500">{f.name}</span>
            </div>
          ))}
        </div>

        {/* Start a post (Instagram-Style, interaktiv) */}
        <div className="mt-6 rounded-[24px] bg-black/[0.035] p-5">
          <button type="button" onClick={() => openComposer(false)} className="block w-full text-left text-[17px] text-neutral-400">
            Start a post
          </button>
          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => openComposer(false)} className="flex items-center gap-2 rounded-full bg-black/[0.05] py-2.5 pl-3 pr-4 text-sm font-semibold text-black">
              <Icon path="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" size={16} className="text-matchup" fill="currentColor" />
              Format
            </button>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => openComposer(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-black">
                <Icon path="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" size={19} />
              </button>
              <button type="button" onClick={() => openComposer(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.05] text-black">
                <Icon path="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={19} />
              </button>
            </div>
          </div>
        </div>

        {/* Feed der erstellten Posts */}
        {posts.length > 0 && (
          <div className="mt-4 space-y-4">
            {posts.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-[24px] bg-black/[0.035]">
                <div className="flex items-center gap-3 px-5 pt-4">
                  <img src={ME.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{ME.name}</p>
                    <p className="text-[11px] text-neutral-400">{p.time}</p>
                  </div>
                </div>
                {p.text && <p className="px-5 pt-3 text-[15px] leading-snug text-neutral-700">{p.text}</p>}
                {p.image && <img src={p.image} alt="" className="mt-3 max-h-[420px] w-full object-cover" />}
                <div className="flex items-center gap-5 px-5 py-3.5 text-neutral-400">
                  <Icon path="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" size={21} />
                  <Icon path="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" size={21} />
                  <Icon path="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" size={21} />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Live-Turnier (hell) */}
        <WimbledonWidget theme="light" />

        {/* Karten-Raster */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="row-span-2 flex flex-col justify-between rounded-[24px] bg-black/[0.035] p-5">
            <div className="flex items-start justify-between">
              <span className="text-sm text-neutral-500">28 Aug 2025</span>
              <Icon path="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" size={19} className="text-neutral-500" />
            </div>
            <div className="mt-16">
              <h3 className="text-[22px] font-bold leading-tight tracking-tight">Padel Champs Circle</h3>
              <div className="mt-4 flex -space-x-3">
                {CIRCLE.map((src, i) => (
                  <img key={i} src={src} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-black/[0.035] p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-matchup to-indigo-500 p-[1.5px]">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">
                <Icon path="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" size={13} className="text-matchup" fill="currentColor" />
                New Challenge
              </span>
            </span>
            <h3 className="mt-4 text-[19px] font-bold leading-tight tracking-tight">30-Day Pushup Challenge</h3>
          </div>

          <div className="flex items-center justify-between rounded-[24px] bg-black/[0.035] p-5">
            <div className="flex -space-x-3">
              {[
                "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20",
                "M6 20v-6M6 8V4M12 20v-9M12 6V4M18 20v-4M18 10V4",
                "M4 18l6-6M14 8l6-6M9 5l10 10M5 9l10 10",
              ].map((p, i) => (
                <span key={i} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.06] text-neutral-500 ring-2 ring-white">
                  <Icon path={p} size={18} />
                </span>
              ))}
            </div>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <Icon path="M12 5v14M5 12h14" size={20} />
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="relative mt-4 rounded-[24px] bg-black/[0.035] px-5 pb-14 pt-5">
          <p className="text-[17px] text-neutral-500">Leaderboard</p>
          <div className="mt-10 flex items-end justify-center gap-1">
            <div className="relative flex flex-col items-center">
              <Icon path="M5 16l-2-9 5.5 4L12 5l3.5 6L21 7l-2 9zM5 20h14" size={26} className="text-matchup" fill="currentColor" />
              <span className="mt-2 h-14 w-14 rounded-full bg-gradient-to-br from-matchup to-indigo-500 p-[2px]">
                <img src="https://i.pravatar.cc/120?img=25" alt="" className="h-full w-full rounded-full object-cover" />
              </span>
            </div>
          </div>
        </div>

        {/* Tab-Bar (schwebend) — Home aktiv */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] justify-center px-5 pb-[max(16px,env(safe-area-inset-bottom))]">
          <nav className="pointer-events-auto flex w-full items-center justify-between rounded-full bg-white px-3 py-2.5 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/10">
            <button type="button" className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-matchup to-indigo-500 text-white shadow-lg">
              <Icon path="M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" size={22} />
            </button>
            {[
              "M6 8v8M18 8v8M6 12h12M3 10v4M21 10v4",
              "M2 17h12l5-2c1.2 0 2 .9 2 2v1H2zM2 17v-4l5-1 2.5 2.5",
              "M6 20V10M12 20V4M18 20v-7",
              "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75",
            ].map((p, i) => (
              <button key={i} type="button" className="flex h-12 w-12 items-center justify-center rounded-full text-neutral-500">
                <Icon path={p} size={23} />
              </button>
            ))}
          </nav>
        </div>

        {/* Composer (Instagram-Style, hell) */}
        {composerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={closeComposer}>
            <div className="mx-auto w-full max-w-[430px]" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-t-[28px] border-t border-black/10 bg-white p-5 pb-8">
                <div className="mb-4 flex items-center justify-between">
                  <button type="button" onClick={closeComposer} className="text-sm font-medium text-neutral-500">Abbrechen</button>
                  <span className="text-sm font-bold text-neutral-900">Neuer Post</span>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={!draft.trim() && !draftImg}
                    className="rounded-full bg-matchup px-4 py-1.5 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Teilen
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <img src={ME.img} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Was gibt's Neues?"
                    rows={3}
                    className="min-h-[80px] flex-1 resize-none bg-transparent text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
                {draftImg && (
                  <div className="relative mt-3">
                    <img src={draftImg} alt="" className="max-h-[300px] w-full rounded-2xl object-cover" />
                    <button type="button" onClick={() => setDraftImg(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
                      <Icon path="M18 6 6 18M6 6l12 12" size={16} />
                    </button>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-3 border-t border-black/10 pt-4">
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full bg-black/[0.05] px-3.5 py-2 text-sm font-semibold text-black">
                    <Icon path="M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" size={18} className="text-matchup" />
                    Foto
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
