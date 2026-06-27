"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Block, Profile } from "@/lib/types";
import { useAppNav } from "../appNav";
import Avatar from "../shared/Avatar";
import { FullLoading, EmptyState, SubViewHeader } from "../shared/ui";
import { BanIcon } from "../shared/icons";

type BlockRow = Block & { blocked?: Profile };

export default function BlockedUsers() {
  const { profile } = useAppNav();
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blocks")
      .select("*, blocked:profiles!blocks_blocked_id_fkey(*)")
      .eq("blocker_id", profile.id);
    setRows((data as BlockRow[]) ?? []);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function unblock(id: string) {
    await supabase.from("blocks").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="flex h-full flex-col">
      <SubViewHeader title="Blockierte Nutzer" />
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <FullLoading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BanIcon size={44} />}
            title="Niemand blockiert"
            message="Du hast keine Nutzer blockiert."
          />
        ) : (
          <ul className="divide-y divide-zinc-800">
            {rows.map((b) => (
              <li key={b.id} className="flex items-center gap-3 p-4">
                <Avatar
                  src={b.blocked?.profile_image}
                  alt={b.blocked?.first_name}
                  size="md"
                />
                <span className="flex-1 font-semibold">
                  {b.blocked?.first_name ?? "Nutzer"}
                </span>
                <button
                  type="button"
                  onClick={() => unblock(b.id)}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm"
                >
                  Entsperren
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
