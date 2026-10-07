import type { ReactNode } from "react";
import { Link, refreshData, type Loaded } from "./compat";

export function NotFoundView() {
  return (
    <main className="page mi-fade">
      <span className="eyebrow">Introuvable</span>
      <h1>Cette page n'existe pas</h1>
      <p className="subtitle">Le marché ou l'acteur demandé n'est pas suivi (ou son adresse a changé).</p>
      <Link href="/" className="btn primary" style={{ alignSelf: "flex-start" }}>← Tous les marchés</Link>
    </main>
  );
}

export function ErrorView({ error }: { error: Error }) {
  return (
    <main className="page mi-fade">
      <span className="eyebrow">Erreur</span>
      <h1>Les données ne sont pas disponibles</h1>
      <p className="subtitle">
        L'API n'a pas répondu ou a échoué{error?.message ? ` (${error.message})` : ""}. Vérifiez votre connexion, puis réessayez.
      </p>
      <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={refreshData}>Réessayer</button>
    </main>
  );
}

/** Skeleton complet de l'espace de travail (initial load quand le rail n'est pas encore prêt) */
export function LoadingView() {
  return (
    <div className="ws mi-fade" aria-busy="true" aria-live="polite">
      <nav className="rail" aria-label="Marchés">
        <div style={{ padding: "0 4px 12px" }}>
          <div className="mi-shimmer" style={{ height: 32, borderRadius: 8, marginBottom: 12 }} />
          <div className="mi-shimmer" style={{ height: 16, width: "50%", borderRadius: 4 }} />
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i} className="mi-shimmer" style={{ height: 30, borderRadius: 8 }} />
          ))}
        </ul>
      </nav>
      <main className="ws-main">
        <LandscapeSkeleton />
      </main>
    </div>
  );
}

/** Skeleton de la vue d'ensemble Landscape (liste de tous les marchés) */
export function LandscapeSkeleton() {
  return (
    <div className="mi-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div className="mi-shimmer" style={{ height: 36, width: 320, borderRadius: 8 }} />
        <div className="mi-shimmer" style={{ height: 20, width: 280, borderRadius: 6 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card mi-shimmer" style={{ height: 110, borderRadius: 12 }} />
        ))}
      </div>
      <div className="card mi-shimmer" style={{ height: 340, borderRadius: 12 }} />
    </div>
  );
}

/** Skeleton quand un marché précis est sélectionné dans le rail (garde le rail intact) */
export function MarketContentSkeleton() {
  return (
    <div className="mi-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* En-tête du marché */}
      <header className="ws-head col" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="mi-shimmer" style={{ height: 34, width: 240, borderRadius: 8 }} />
          <div className="mi-shimmer" style={{ height: 24, width: 90, borderRadius: 999 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div className="card mi-shimmer" style={{ height: 75, borderRadius: 10 }} />
          <div className="card mi-shimmer" style={{ height: 75, borderRadius: 10 }} />
          <div className="card mi-shimmer" style={{ height: 75, borderRadius: 10 }} />
        </div>
      </header>

      {/* Cartouche À retenir */}
      <div className="card mi-shimmer" style={{ height: 90, borderRadius: 10 }} />

      {/* Grille tableau + side feed */}
      <div className="ws-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div className="card mi-shimmer" style={{ height: 420, borderRadius: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card mi-shimmer" style={{ height: 180, borderRadius: 12 }} />
          <div className="card mi-shimmer" style={{ height: 220, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

/** Skeleton pour les pages complètes (Catalogues, Fiabilité, Paramètres, etc.) */
export function PageLoadingView() {
  return (
    <main className="page mi-fade" aria-busy="true" aria-live="polite">
      <div className="page-head" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="mi-shimmer" style={{ height: 14, width: 90, borderRadius: 4 }} />
          <div className="mi-shimmer" style={{ height: 32, width: 340, borderRadius: 6 }} />
          <div className="mi-shimmer" style={{ height: 18, width: 560, maxWidth: "100%", borderRadius: 4 }} />
        </div>
      </div>
      <div className="card mi-shimmer" style={{ height: 50, borderRadius: 10, marginBottom: 16 }} />
      <div className="card mi-shimmer" style={{ height: 380, borderRadius: 12 }} />
    </main>
  );
}

/** Vue à afficher à la place de la page tant que les données ne sont pas là ; null sinon. */
export function guard<T>(state: Loaded<T>, variant: "page" | "ws" = "page"): ReactNode | null {
  if (state.notFound) return <NotFoundView />;
  if (state.error && !state.data) return <ErrorView error={state.error} />;
  if (!state.data) return variant === "ws" ? <LoadingView /> : <PageLoadingView />;
  return null;
}
