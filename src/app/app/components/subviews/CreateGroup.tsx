"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { sportLabel } from "@/lib/utils/formatters";
import type { Sport } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useAppNav } from "../appNav";
import { SubViewHeader } from "../shared/ui";

const SPORTS: Sport[] = ["tennis", "padel", "pickleball"];

export default function CreateGroup() {
  const t = useT();
  const { profile, closeSubView } = useAppNav();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<Sport>("tennis");
  const [maxMembers, setMaxMembers] = useState(20);
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length >= 3;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description || null,
        sport,
        max_members: maxMembers,
        is_open: isOpen,
        created_by: profile.id,
      })
      .select("id")
      .maybeSingle();
    if (!error && data) {
      await supabase
        .from("group_members")
        .insert({ group_id: data.id, user_id: profile.id, role: "owner" });
    }
    setSaving(false);
    if (!error) closeSubView();
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title={t("groups.createTitle")} />
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("groups.nameLabel")}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("groups.namePlaceholder")}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("groups.descriptionLabel")}</p>
          <textarea
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("groups.descriptionPlaceholder")}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">{t("groups.sportLabel")}</p>
          <div className="flex gap-2">
            {SPORTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSport(s)}
                className={`flex-1 rounded-xl py-2.5 text-sm ${
                  sport === s
                    ? "bg-matchup/20 ring-2 ring-matchup"
                    : "bg-zinc-800 ring-1 ring-zinc-700"
                }`}
              >
                {sportLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-300">
            {t("groups.maxMembersLabel")}
          </p>
          <input
            type="number"
            min={2}
            max={500}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 text-sm"
        >
          <span>{isOpen ? t("groups.openGroup") : t("groups.closedGroup")}</span>
          <span
            className={`relative h-6 w-11 rounded-full ${isOpen ? "bg-matchup" : "bg-zinc-600"}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${isOpen ? "left-[22px]" : "left-0.5"}`}
            />
          </span>
        </button>
      </div>
      <div className="shrink-0 border-t border-zinc-800 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!valid || saving}
          onClick={submit}
          className="w-full rounded-full bg-matchup py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? t("groups.creating") : t("groups.create")}
        </button>
      </div>
    </div>
  );
}
