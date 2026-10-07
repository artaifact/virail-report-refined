"use client";

import { Link } from "../../compat";
import { useEffect, useState } from "react";

export interface RailMarket {
  id: string;
  name: string;
  family: string;
  tone: "hot" | "warm" | "calm";
  events: number;
}

type Pref = "collapsed" | "expanded" | null;
const KEY = "ami-rail";

const formatFamily = (f: string) => {
  if (!f) return f;
  return f.replace(/ et /gi, " & ");
};

/** Sélecteur de marché repliable et ergonomique. */
export default function Rail({ markets, current, drawerOpen }: { markets: RailMarket[]; current?: string; drawerOpen: boolean }) {
  const [q, setQ] = useState("");
  const [pref, setPref] = useState<Pref>(null);
  const [narrow, setNarrow] = useState(false);
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    try { setPref((localStorage.getItem(KEY) as Pref) || null); } catch { /* ignore */ }
    const mq = window.matchMedia("(max-width: 860px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => setPeek(false), [drawerOpen, current]);

  const auto = drawerOpen || narrow;
  const collapsed = auto ? !peek : pref === "collapsed";
  const toggle = () => {
    if (auto) { setPeek(!peek); return; }
    const next: Pref = collapsed ? "expanded" : "collapsed";
    setPref(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  };

  const query = q.trim().toLowerCase();
  const item = (m: RailMarket) => (
    <li key={m.id}>
      <Link href={`/?m=${m.id}`} scroll={false} className={`rail-item ${m.id === current ? "on" : ""}`}>
        <i className={`rail-heat-dot heat-${m.tone}`} aria-hidden="true" />
        <span className="rail-item-name">{m.name}</span>
        {m.events > 0 && <span className="rail-item-badge" title={`${m.events} nouveautés ce mois`}>+{m.events}</span>}
      </Link>
    </li>
  );

  const families = [...new Set(markets.map((m) => m.family))];
  const currentFamily = markets.find((m) => m.id === current)?.family;
  const found = markets.filter((m) => m.name.toLowerCase().includes(query));

  return (
    <>
      <button
        type="button"
        className={`rail-toggle ${collapsed ? "" : "open"} ${!collapsed && auto ? "over" : ""}`}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Ouvrir la liste des marchés" : "Fermer la liste des marchés"}
        title={collapsed ? "Marchés" : "Replier"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? (
            <>
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </>
          ) : (
            <polyline points="15 18 9 12 15 6" />
          )}
        </svg>
      </button>

      <nav className={`rail ${collapsed ? "collapsed" : ""} ${!collapsed && auto ? "overlay" : ""}`} aria-label="Marchés" hidden={collapsed}>
        <div className="rail-top">
          <Link href="/" scroll={false} className={`rail-all-btn ${!current ? "on" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1.5" />
              <rect width="7" height="7" x="14" y="3" rx="1.5" />
              <rect width="7" height="7" x="14" y="14" rx="1.5" />
              <rect width="7" height="7" x="3" y="14" rx="1.5" />
            </svg>
            <span className="rail-all-label">Tous les marchés</span>
            <span className="rail-badge-count">{markets.length}</span>
          </Link>

          <div className="rail-search-box">
            <svg className="rail-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              className="rail-search-input"
              placeholder="Filtrer un marché..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Chercher un marché"
            />
            {q && (
              <button type="button" className="rail-search-clear" onClick={() => setQ("")} aria-label="Effacer">✕</button>
            )}
          </div>
        </div>

        <div className="rail-list-wrap">
          {query ? (
            <ul className="rail-group-items">
              {found.map(item)}
              {!found.length && <li className="rail-empty">Aucun marché correspondant.</li>}
            </ul>
          ) : (
            families.map((family) => {
              const inFamily = markets.filter((m) => m.family === family);
              const events = inFamily.reduce((n, m) => n + m.events, 0);
              return (
                <details key={family} className="rail-group" open={family === currentFamily || undefined}>
                  <summary className="rail-group-head">
                    <div className="rail-group-title">
                      <svg className="rail-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span>{formatFamily(family)}</span>
                    </div>
                    <span className="rail-group-count">{inFamily.length}</span>
                  </summary>
                  <ul className="rail-group-items">{inFamily.map(item)}</ul>
                </details>
              );
            })
          )}
        </div>
      </nav>
    </>
  );
}
