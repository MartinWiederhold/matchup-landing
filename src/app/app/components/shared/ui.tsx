"use client";

import type { ReactNode } from "react";
import { useAppNav } from "../appNav";

export function LoadingSpinner({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-10 w-10" : "h-7 w-7";
  return (
    <div
      className={`${dim} animate-spin rounded-full border-2 border-zinc-700 border-t-matchup`}
    />
  );
}

export function FullLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="text-zinc-600" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-full bg-matchup px-6 py-3 text-sm font-bold text-white hover:bg-matchup-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <p className="text-sm text-red-400">Etwas ist schiefgelaufen.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full border border-zinc-700 px-5 py-2.5 text-sm"
      >
        Erneut versuchen
      </button>
    </div>
  );
}

export function SubViewHeader({
  title,
  rightActions,
}: {
  title: string;
  rightActions?: React.ReactNode;
}) {
  const { closeSubView } = useAppNav();
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={closeSubView}
          className="text-xl text-zinc-300 hover:text-white"
          aria-label="Zurück"
        >
          ←
        </button>
        <span className="font-semibold">{title}</span>
      </div>
      {rightActions && <div className="flex items-center gap-3">{rightActions}</div>}
    </header>
  );
}

export function TabHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
      <div className="flex w-16 items-center">{left}</div>
      <span className="font-bold tracking-wide">{title}</span>
      <div className="flex w-16 items-center justify-end gap-2">{right}</div>
    </header>
  );
}
