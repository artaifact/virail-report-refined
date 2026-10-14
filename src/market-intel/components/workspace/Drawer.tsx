import { Link } from "../../compat";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CompanyDetail } from "../CompanyDetail";
import { DuelView } from "../DuelView";
import FilterSelect from "../FilterSelect";
import type { Overview } from "../../lib/api";
import EscClose from "./EscClose";

/** Modale grand format d'un acteur avec vue arrière-plan translucide, mode transparence et bascule volet latéral. */
export default function Drawer({ o, marketId, company, rival }: {
  o: Overview; marketId: string; company: string; rival?: string;
}) {
  const close = `/?m=${marketId}`;
  const currentCompany = o.companies.find((c) => c.id === company);
  const [peek, setPeek] = useState(false);
  const [hoverPeek, setHoverPeek] = useState(false);
  const [docked, setDocked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isPeeking = peek || hoverPeek;

  useEffect(() => {
    // Si on regarde l'arrière-plan ou si c'est ancré sur le côté, on libère le scroll
    if (isPeeking || docked) {
      document.body.style.overflow = "auto";
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isPeeking, docked]);

  const modalContent = (
    <div
      className={`mi-modal-portal ${isPeeking ? "is-peeking" : ""} ${docked ? "is-docked" : ""}`}
      style={{ background: "transparent" }}
      role="presentation"
    >
      {/* Fond très léger et transparent : l'arrière-plan reste parfaitement visible et lisible */}
      <Link
        href={close}
        scroll={false}
        className="mi-modal-backdrop"
        aria-label="Fermer la modale"
        onClick={(e) => {
          if (peek) {
            e.preventDefault();
            setPeek(false);
          }
        }}
      />

      {/* Bannière flottante en mode transparence pour restaurer la modale d'un clic */}
      {peek && (
        <button
          type="button"
          className="mi-modal-peek-banner"
          onClick={() => setPeek(false)}
          aria-label="Réafficher la fiche"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Arrière-plan visible • Cliquez pour réafficher la fiche</span>
        </button>
      )}

      {/* Boîte de dialogue centrée large (ou ancrée à droite si docked), porteuse du scope .mi */}
      <div
        className={`mi-modal-dialog mi ${isPeeking ? "peeking" : ""} ${expanded ? "expanded" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Fiche de l'acteur"
        onClick={() => {
          if (peek) setPeek(false);
        }}
      >
        <EscClose marketId={marketId} ids={o.companies.map((c) => c.id)} current={company} />

        <div className="mi-modal-header">
          <div className="mi-modal-title-row">
            <span className="mi-modal-badge">Fiche acteur</span>
            {currentCompany && <strong className="mi-modal-title">{currentCompany.name}</strong>}
          </div>

          <div className="mi-modal-controls">
            {/* Bouton pour voir l'arrière-plan en transparence */}
            <button
              type="button"
              className={`mi-modal-peek-btn ${peek ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setPeek(!peek);
              }}
              onMouseEnter={() => setHoverPeek(true)}
              onMouseLeave={() => setHoverPeek(false)}
              title={peek ? "Réafficher la fiche" : "Survolez ou cliquez pour voir le tableau derrière en transparence"}
              aria-label="Voir l'arrière-plan"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{peek ? "Fiche" : "Voir l'arrière"}</span>
            </button>

            {/* Bouton pour agrandir la largeur (Large ↔ Plein écran) */}
            {!docked && (
              <button
                type="button"
                className={`mi-modal-peek-btn ${expanded ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                title={expanded ? "Largeur standard (1180px)" : "Agrandir en très grand format (1420px)"}
                aria-label={expanded ? "Réduire la largeur" : "Agrandir la largeur"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {expanded ? (
                    <>
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </>
                  ) : (
                    <>
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </>
                  )}
                </svg>
                <span>{expanded ? "Standard" : "Très large"}</span>
              </button>
            )}

            {/* Bouton pour ancrer à droite (volet) ou centrer */}
            <button
              type="button"
              className={`mi-modal-peek-btn ${docked ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setDocked(!docked);
              }}
              title={docked ? "Centrer la fiche" : "Ancrer à droite comme un volet pour voir tout le tableau à gauche"}
              aria-label={docked ? "Centrer la fiche" : "Ancrer à droite"}
            >
              {docked ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                  <span>Centrer</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                  </svg>
                  <span>Volet</span>
                </>
              )}
            </button>

            <Suspense>
              <FilterSelect
                name="vs"
                label="Comparer avec"
                options={[{ value: "", label: "Personne (fiche seule)" },
                  ...o.companies.filter((c) => c.id !== company).map((c) => ({ value: c.id, label: c.name }))]}
              />
            </Suspense>

            <Link href={close} scroll={false} className="mi-modal-close" title="Fermer (Échap)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mi-modal-body">
          {rival ? (
            <DuelView id={marketId} a={company} b={rival} embedded
              hrefFor={(a, b) => `/?m=${marketId}&c=${a}&vs=${b}`} />
          ) : (
            <CompanyDetail id={company} market={marketId} embedded />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
