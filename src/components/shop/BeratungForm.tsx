"use client";

import { useEffect } from "react";
import BeratungWizard from "./BeratungWizard";

/** Modal-Variante des Beratungs-Wizards (z.B. im Shop). */
export default function BeratungForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <BeratungWizard onClose={onClose} />
      </div>
    </div>
  );
}
