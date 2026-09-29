import type { ReactNode } from "react";
import { Link, refreshData, type Loaded } from "./compat";

export function NotFoundView() {
  return (
    <main className="page">
      <span className="eyebrow">Introuvable</span>
      <h1>Cette page n'existe pas</h1>
      <p className="subtitle">Le marché ou l'acteur demandé n'est pas suivi (ou son adresse a changé).</p>
      <Link href="/" className="btn primary" style={{ alignSelf: "flex-start" }}>← Tous les marchés</Link>
    </main>
  );
}

export function ErrorView({ error }: { error: Error }) {
  return (
    <main className="page">
      <span className="eyebrow">Erreur</span>
      <h1>Les données ne sont pas disponibles</h1>
      <p className="subtitle">
        L'API n'a pas répondu ou a échoué{error?.message ? ` (${error.message})` : ""}. Vérifiez votre connexion, puis réessayez.
      </p>
      <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={refreshData}>Réessayer</button>
    </main>
  );
}

export function LoadingView() {
  return (
    <main className="page" aria-busy="true" aria-live="polite">
      <span className="meta">Chargement des données…</span>
    </main>
  );
}

/** Vue à afficher à la place de la page tant que les données ne sont pas là (ou en cas d'échec) ; null sinon. */
export function guard<T>(state: Loaded<T>): ReactNode | null {
  if (state.notFound) return <NotFoundView />;
  if (state.error && !state.data) return <ErrorView error={state.error} />;
  if (!state.data) return <LoadingView />;
  return null;
}
