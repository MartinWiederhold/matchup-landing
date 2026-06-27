"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types";

export type TabKey = "discover" | "likes" | "matches" | "games" | "profile";

export type SubViewState =
  | { type: "chat"; matchId: string }
  | { type: "full-profile"; userId: string; viewOnly?: boolean }
  | { type: "edit-profile" }
  | { type: "settings" }
  | { type: "group-detail"; groupId: string }
  | { type: "group-chat"; groupId: string }
  | { type: "create-group" }
  | { type: "game-detail"; gameId: string }
  | { type: "create-game" }
  | { type: "game-requests"; gameId: string }
  | { type: "comments"; postId: string }
  | { type: "support" }
  | { type: "ticket-chat"; ticketId: string }
  | { type: "create-ticket" }
  | { type: "blocked-users" };

interface AppNavContextType {
  profile: Profile;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  openSubView: (sv: SubViewState) => void;
  closeSubView: () => void;
  refreshBadges: () => void;
}

export const AppNavContext = createContext<AppNavContextType | undefined>(
  undefined,
);

export function useAppNav() {
  const ctx = useContext(AppNavContext);
  if (!ctx) throw new Error("useAppNav must be used within AppShell");
  return ctx;
}
