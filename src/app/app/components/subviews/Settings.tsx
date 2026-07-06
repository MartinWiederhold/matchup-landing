"use client";

import { useState } from "react";
import { useT, useLocale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

type PushKey =
  | "push_matches"
  | "push_messages"
  | "push_reminders"
  | "push_community";

export default function Settings() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { signOut } = useAuth();
  const { profile, openSubView, refreshBadges } = useAppNav();
  const [push, setPush] = useState({
    push_matches: profile.push_matches,
    push_messages: profile.push_messages,
    push_reminders: profile.push_reminders,
    push_community: profile.push_community,
  });

  async function togglePush(key: PushKey) {
    const next = !push[key];
    setPush((p) => ({ ...p, [key]: next }));
    await supabase.from("profiles").update({ [key]: next }).eq("id", profile.id);
  }

  async function pauseAccount() {
    if (!window.confirm(t("profile.pauseConfirm"))) return;
    await supabase
      .from("profiles")
      .update({ is_paused: true })
      .eq("id", profile.id);
    refreshBadges();
    window.location.reload();
  }

  async function deleteAccount() {
    if (!window.confirm(t("profile.deleteConfirm"))) return;
    const confirmText = window.prompt(t("profile.deletePrompt"));
    if (confirmText !== "DELETE") return;
    const { data: files } = await supabase.storage
      .from("web-avatars")
      .list(profile.id);
    if (files?.length) {
      await supabase.storage
        .from("web-avatars")
        .remove(files.map((f) => `${profile.id}/${f.name}`));
    }
    await supabase.rpc("delete_my_account");
    await supabase.auth.signOut();
    window.location.reload();
  }

  const pushRows: { key: PushKey; label: string }[] = [
    { key: "push_matches", label: t("profile.pushMatches") },
    { key: "push_messages", label: t("profile.pushMessages") },
    { key: "push_reminders", label: t("profile.pushReminders") },
    { key: "push_community", label: t("profile.pushCommunity") },
  ];

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("profile.settingsTitle")} />
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <Group title={t("profile.language")}>
          <div className="flex gap-2 p-3">
            {([
              { v: "de", label: "Deutsch" },
              { v: "en", label: "English" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setLocale(o.v)}
                className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  locale === o.v ? "bg-matchup text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title={t("profile.notifications")}>
          {pushRows.map((r) => (
            <Row key={r.key} label={r.label}>
              <Switch value={push[r.key]} onChange={() => togglePush(r.key)} />
            </Row>
          ))}
        </Group>

        <Group title={t("profile.account")}>
          <Row label={t("profile.blockedUsers")} onClick={() => openSubView({ type: "blocked-users" })}>
            <span className="text-zinc-500">›</span>
          </Row>
        </Group>

        <Group title={t("profile.legal")}>
          <LinkRow label={t("profile.privacyPolicy")} href="/datenschutz" />
          <LinkRow label={t("profile.terms")} href="/agb" />
        </Group>

        <Group title={t("profile.support")}>
          <Row label={t("profile.helpSupport")} onClick={() => openSubView({ type: "support" })}>
            <span className="text-zinc-500">›</span>
          </Row>
        </Group>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={pauseAccount}
            className="w-full rounded-full bg-orange-500/90 py-3 text-sm font-bold text-white"
          >
            {t("profile.pauseAccount")}
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full rounded-full border border-zinc-700 py-3 text-sm font-semibold"
          >
            {t("profile.logout")}
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            className="w-full rounded-full bg-zinc-700 py-3 text-sm font-bold text-white"
          >
            {t("profile.deleteAccount")}
          </button>
          <p className="text-center text-xs text-zinc-500">
            {t("profile.deleteNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl bg-zinc-900">{children}</div>
    </div>
  );
}

function Row({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-zinc-800 px-4 py-3.5 text-sm last:border-0"
    >
      <span>{label}</span>
      {children}
    </button>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between border-b border-zinc-800 px-4 py-3.5 text-sm last:border-0"
    >
      <span>{label}</span>
      <span className="text-zinc-500">›</span>
    </a>
  );
}

function Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <span
      onClick={onChange}
      className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${value ? "bg-matchup" : "bg-zinc-600"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-[22px]" : "left-0.5"}`}
      />
    </span>
  );
}
