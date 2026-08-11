"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { skillLabel, sportLabel, formatDistance } from "@/lib/utils/formatters";
import { fetchDistances } from "@/lib/utils/distances";
import {
  SportIcon,
  FlagIcon,
  BanIcon,
  MapPinIcon,
  CheckIcon,
  MedalIcon,
  RulerIcon,
  TargetIcon,
} from "../shared/icons";
import type { Profile, PlayerStats } from "@/lib/types";
import { ensureMatch } from "@/lib/matchmaking";
import { useAppNav } from "../appNav";
import { FullLoading } from "../shared/ui";

function ConnectIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export default function FullProfile({
  userId,
  viewOnly,
}: {
  userId: string;
  viewOnly?: boolean;
}) {
  const t = useT();
  const { profile: me, closeSubView, refreshBadges, openSubView } = useAppNav();
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [distKm, setDistKm] = useState<number | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setP(data as Profile | null));
    supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setStats(data as PlayerStats | null));
    // Distanz serverseitig (keine Rohkoordinaten); null, wenn eigener/fremder Ort fehlt.
    fetchDistances([userId]).then((m) => setDistKm(m.get(userId) ?? null));
  }, [userId]);

  if (!p) return <FullLoading />;

  const images = [p.profile_image, ...(p.additional_images ?? [])].filter(
    Boolean,
  ) as string[];

  const next = () => setImgIndex((i) => (i + 1) % images.length);
  const prev = () => setImgIndex((i) => (i - 1 + images.length) % images.length);

  async function report() {
    const reason = window.prompt(t("profile.reportPrompt"));
    if (!reason) return;
    await supabase.from("reports").insert({
      reporter_id: me.id,
      reported_user_id: userId,
      reason,
      status: "pending",
    });
    window.alert(t("profile.reportThanks"));
  }

  async function block() {
    if (!window.confirm(t("profile.blockConfirm"))) return;
    await supabase
      .from("blocks")
      .insert({ blocker_id: me.id, blocked_id: userId });
    closeSubView();
  }

  async function connect() {
    setSent(true);
    await supabase
      .from("likes")
      .upsert(
        { from_user_id: me.id, to_user_id: userId },
        { onConflict: "from_user_id,to_user_id" },
      );
    const { data: reverse } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user_id", userId)
      .eq("to_user_id", me.id)
      .maybeSingle();
    if (reverse) {
      await ensureMatch(me.id, userId);
      const [u1, u2] = [me.id, userId].sort();
      const { data: m } = await supabase
        .from("matches")
        .select("id")
        .eq("user1_id", u1)
        .eq("user2_id", u2)
        .maybeSingle();
      refreshBadges();
      if (m) openSubView({ type: "chat", matchId: m.id });
      return;
    }
    refreshBadges();
  }

  const dist =
    distKm != null
      ? formatDistance(distKm)
      : p._distance != null
        ? formatDistance(p._distance)
        : null;
  const online = !!p.last_active && Date.now() - Date.parse(p.last_active) < 5 * 60000;
  const clubName = p.club_name_manual;

  return (
    <div className="flex h-full flex-col bg-white text-neutral-900">
      <div className="flex-1 overflow-y-auto">
        {/* Foto-Header */}
        <div
          className="relative select-none bg-neutral-200"
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null || images.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) < 40) return;
            if (dx > 0) prev();
            else next();
          }}
        >
          {images[imgIndex] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[imgIndex]} alt={p.first_name} className="h-[440px] w-full object-cover" draggable={false} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

          {/* Zurück */}
          <button
            type="button"
            onClick={closeSubView}
            aria-label={t("profile.back")}
            className="absolute left-4 top-[max(16px,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          {/* Drei-Punkte-Menü: Melden / Blockieren */}
          <div className="absolute right-4 top-[max(16px,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={t("profile.report")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
            </button>
            {menuOpen && (
              <>
                <button type="button" aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-black/10">
                  <button type="button" onClick={() => { setMenuOpen(false); report(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-700 active:bg-black/5">
                    <FlagIcon size={17} /> {t("profile.report")}
                  </button>
                  <button type="button" onClick={() => { setMenuOpen(false); block(); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-neutral-700 active:bg-black/5">
                    <BanIcon size={17} /> {t("profile.block")}
                  </button>
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-[76px] left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1}`}
                  onClick={() => setImgIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          )}

          {/* Name / Ort / Distanz */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-extrabold leading-none text-white">{p.first_name}, {p.age}</h1>
              {online && <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/60" />}
            </div>
            {(p.city || dist) && (
              <p className="mt-2 flex items-center gap-1.5 text-[14px] font-medium text-white/85">
                <MapPinIcon size={15} /> {[p.city, dist].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 p-5">
          {/* Sportarten / Level / Rating / Verifiziert */}
          <div className="flex flex-wrap gap-2">
            {p.sports.map((sp) => (
              <span key={sp} className="flex items-center gap-1.5 rounded-full bg-matchup/10 px-3.5 py-1.5 text-[13px] font-semibold text-matchup">
                <SportIcon sport={sp} size={14} /> {sportLabel(sp)}
              </span>
            ))}
            <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[13px] font-semibold text-neutral-700">{skillLabel(p.skill_level)}</span>
            {p.official_rating && (
              <span className="rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[13px] font-semibold text-neutral-700">{p.official_rating}</span>
            )}
            {p.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3.5 py-1.5 text-[13px] font-semibold text-matchup">
                <CheckIcon size={13} /> {t("profile.verifiedPlain")}
              </span>
            )}
          </div>

          {/* Statistik (nur echte Werte) */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: String(p.match_score ?? 1000), l: t("profile.matchScore") },
              { v: String(stats?.total_matches ?? p.matches_rated ?? 0), l: t("profile.matchesShort") },
              { v: String(stats?.current_streak ?? 0), l: t("profile.streakShort") },
            ].map((st) => (
              <div key={st.l} className="rounded-2xl bg-black/[0.035] px-3 py-4 text-center">
                <div className="text-[20px] font-extrabold tracking-tight text-neutral-900">{st.v}</div>
                <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-neutral-400">{st.l}</div>
              </div>
            ))}
          </div>

          {/* Über */}
          {p.bio && (
            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("profile.aboutMe")}</p>
              <p className="text-[15px] leading-relaxed text-neutral-700">{p.bio}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("profile.details")}</p>
            <ul className="space-y-2 text-[14px] text-neutral-700">
              {p.height_cm && (
                <li className="flex items-center gap-2.5"><RulerIcon size={16} className="text-neutral-400" /> {p.height_cm} cm</li>
              )}
              {p.official_rating && (
                <li className="flex items-center gap-2.5"><MedalIcon size={16} className="text-neutral-400" /> {p.official_rating}</li>
              )}
              {p.goals?.length > 0 && (
                <li className="flex items-center gap-2.5"><TargetIcon size={16} className="text-neutral-400" /> {p.goals.join(", ")}</li>
              )}
              {clubName && (
                <li className="flex items-center gap-2.5"><MapPinIcon size={16} className="text-neutral-400" /> {clubName}</li>
              )}
            </ul>
          </div>

          {/* Galerie (weitere Fotos) */}
          {images.length > 1 && (
            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-neutral-400">{t("profile.gallery")}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {images.slice(1).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImgIndex(i + 1)}
                    className="aspect-square overflow-hidden rounded-2xl bg-black/[0.05]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!viewOnly && (
        <div className="shrink-0 border-t border-black/10 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <button
            type="button"
            onClick={connect}
            disabled={sent}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors ${
              sent ? "bg-neutral-100 text-neutral-400" : "bg-matchup text-white hover:bg-matchup-hover"
            }`}
          >
            {sent ? (
              <><CheckIcon size={18} /> {t("profile.requestSent")}</>
            ) : (
              <><ConnectIcon size={18} /> {t("profile.connect")}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
