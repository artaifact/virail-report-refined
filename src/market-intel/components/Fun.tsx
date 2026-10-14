import { useState } from "react";
import type { Badge, Mood } from "../lib/fun";

const PALETTE = ["#2f4fe0", "#e0562f", "#15a36b", "#b3368f", "#d49100", "#0e8fb0", "#6b4fd6", "#c23a3a"];

/** Logo de l'acteur (favicon de son site) ; initiales colorées si pas de site ou pas d'icône. */
export function Logo({ name, domain, size = 40 }: { name: string; domain?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const color = PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="logo" style={{ width: size, height: size, background: failed || !domain ? color : "var(--surface)", fontSize: size * 0.38 }}>
      {domain && !failed ? (
        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} alt="" width={size * 0.62} height={size * 0.62}
          onError={() => setFailed(true)} />
      ) : initials}
    </span>
  );
}

/** Jauge circulaire : la note sur 100, colorée selon le niveau. */
export function ScoreRing({ score, tone, size = 72 }: { score: number; tone: "good" | "mid" | "low"; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={`ring ring-${tone}`} style={{ width: size, height: size }} role="img" aria-label={`Note ${score} sur 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" />
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-value" strokeDasharray={`${(score / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-label" style={{ fontSize: size * 0.3 }}>{score}</span>
    </span>
  );
}

export function MoodTag({ mood }: { mood: Mood }) {
  return <span className={`mood mood-${mood.tone}`}>{mood.label}</span>;
}

/** Badges : gagnés en plein, à débloquer en pointillés. « list » : sans compteur (ex. « à débloquer »). */
export function BadgeShelf({ items, mode = "full" }: { items: Badge[]; mode?: "full" | "list" }) {
  const earned = items.filter((b) => b.earned).length;
  return (
    <div className="badges">
      {mode === "full" && <span className="badges-count">{earned}/{items.length} badges</span>}
      {items.map((b) => (
        <span key={b.key} className={`badge-fun ${b.earned ? "earned" : "locked"}`} title={b.help}>
          {b.earned && <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          {b.label}
        </span>
      ))}
    </div>
  );
}
