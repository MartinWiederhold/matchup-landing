"use client";

import { useAppNav, type SubViewState } from "./appNav";

export default function SubViewRenderer({
  subView,
}: {
  subView: SubViewState;
}) {
  const { closeSubView } = useAppNav();
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={closeSubView}
          className="text-zinc-300 hover:text-white"
          aria-label="Zurück"
        >
          ←
        </button>
        <span className="font-semibold capitalize">{subView.type}</span>
      </header>
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        {subView.type}
      </div>
    </div>
  );
}
