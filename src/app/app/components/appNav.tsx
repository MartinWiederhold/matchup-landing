"use client";

import { createContext, useContext } from "react";
import type { Profile, Sport } from "@/lib/types";

export type TabKey = "discover" | "likes" | "matches" | "earth" | "games" | "profile";

export type SubViewState =
  | { type: "chat"; matchId: string }
  | { type: "full-profile"; userId: string; viewOnly?: boolean }
  | { type: "edit-profile" }
  | { type: "settings" }
  | { type: "group-detail"; groupId: string }
  | { type: "group-chat"; groupId: string }
  | { type: "create-group" }
  | { type: "game-detail"; gameId: string }
  | { type: "create-game"; invite?: string; sport?: Sport }
  | { type: "edit-game"; gameId: string }
  | { type: "game-review"; gameId: string }
  | { type: "game-result"; gameId: string }
  | { type: "leaderboard" }
  | { type: "people-browse" }
  | { type: "tennis-live" }
  | { type: "game-requests"; gameId: string }
  | { type: "comments"; postId: string }
  | { type: "create-post" }
  | { type: "support" }
  | { type: "ticket-chat"; ticketId: string }
  | { type: "create-ticket" }
  | { type: "blocked-users" }
  | { type: "tour-expenses" }
  | { type: "tour-schedule"; addKind?: string }
  | { type: "tour-profile-edit" }
  | { type: "tour-players" }
  | { type: "tour-player-view"; playerId: string; role: string; playerName?: string }
  | { type: "tour-deadlines" }
  | { type: "tour-visa" }
  | { type: "tour-planner" }
  | { type: "tour-tournament"; tournamentId: string }
  | { type: "services" }
  | { type: "service-detail"; providerId: string }
  | { type: "my-team" }
  | { type: "list-provider" }
  | { type: "tournament-finder" }
  // sport: optionaler Vorfilter, wenn die Ansicht aus einer Sport-Karte geöffnet wird.
  | { type: "select-profile"; sport?: Sport };

interface AppNavContextType {
  profile: Profile;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  openSubView: (sv: SubViewState) => void;
  closeSubView: () => void;
  refreshBadges: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const AppNavContext = createContext<AppNavContextType | undefined>(
  undefined,
);

export function useAppNav() {
  const ctx = useContext(AppNavContext);
  if (!ctx) throw new Error("useAppNav must be used within AppShell");
  return ctx;
}
