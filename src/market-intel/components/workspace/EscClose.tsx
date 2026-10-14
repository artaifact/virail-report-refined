"use client";

import { useRouter } from "../../compat";
import { useEffect } from "react";

/** Clavier du panneau : Échap ferme, ↑ et ↓ passent à l'acteur précédent ou suivant du classement (sans toucher
 *  à un champ de saisie ni à une liste déroulante, qui gardent leurs flèches). */
export default function EscClose({ marketId, ids, current }: { marketId: string; ids: string[]; current: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (e.key === "Escape") router.push(`/?m=${marketId}`, { scroll: false });
      const i = ids.indexOf(current);
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && i >= 0) {
        const next = ids[i + (e.key === "ArrowDown" ? 1 : -1)];
        if (next) { e.preventDefault(); router.push(`/?m=${marketId}&c=${next}`, { scroll: false }); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [marketId, ids, current, router]);
  return null;
}
