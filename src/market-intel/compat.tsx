// Couche d'adaptation entre le moteur Agentic Market Intelligence (écrit pour Next.js) et l'application virail
// (Vite + React Router) : liens, navigation, chargement des données, appels API authentifiés par cookie.

import { useCallback, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router-dom";

/** Préfixe des pages dans virail et de l'API (voir virail_ranking/api/routes/market_intelligence_routes.py). */
export const MI_BASE = "/market-intelligence";
// En développement, chemin relatif : le proxy Vite (VITE_API_PROXY_TARGET) route vers le backend choisi.
// En production, le front (nginx) ne relaie pas /api : on appelle directement l'API, comme le reste de l'application.
const API_ORIGIN = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_BASE_URL || "https://api.viraill.com");
export const MI_API = `${API_ORIGIN}/api/v1/market-intelligence`;

export class NotFoundError extends Error {
  constructor(message = "introuvable") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Équivalent de next/navigation `notFound()` : la page affiche alors sa vue « introuvable ». */
export function notFound(): never {
  throw new NotFoundError();
}

/** fetch vers l'API du moteur, avec le cookie de session de virail. */
export function miFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${MI_API}${path}`, { credentials: "include", cache: "no-store", ...init });
}

// --- Liens et navigation ------------------------------------------------------------------------------------------

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; children?: ReactNode };

/** `href` s'écrit comme dans le moteur (/markets/crm-smb/matrix) ; le préfixe virail est ajouté ici. */
export function Link({ href, children, ...rest }: LinkProps) {
  if (/^(https?:|mailto:)/.test(href)) {
    return <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>{children}</a>;
  }
  return <RouterLink to={`${MI_BASE}${href === "/" ? "" : href}`} {...rest}>{children}</RouterLink>;
}

export function usePathname(): string {
  const { pathname } = useLocation();
  return pathname.startsWith(MI_BASE) ? pathname.slice(MI_BASE.length) || "/" : pathname;
}

export { useParams } from "react-router-dom";

export function useSearchParams(): URLSearchParams {
  return useRouterSearchParams()[0];
}

// --- Rechargement des données (équivalent de router.refresh()) -----------------------------------------------------

let version = 0;
const listeners = new Set<() => void>();

export function refreshData(): void {
  version += 1;
  listeners.forEach((fn) => fn());
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(`${MI_BASE}${path === "/" ? "" : path}`),
    refresh: refreshData,
  };
}

export interface Loaded<T> {
  data: T | null;
  error: Error | null;
  notFound: boolean;
  loading: boolean;
}

/**
 * Charge les données d'une page. Elles sont rechargées quand `deps` change ou après `router.refresh()` ; les anciennes
 * restent affichées pendant le rechargement (pas de clignotement après une action).
 */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [state, setState] = useState<Loaded<T>>({ data: null, error: null, notFound: false, loading: true });
  const [tick, setTick] = useState(version);
  const latest = useRef(0);

  useEffect(() => {
    const onRefresh = () => setTick(version);
    listeners.add(onRefresh);
    return () => void listeners.delete(onRefresh);
  }, []);

  const run = useCallback(load, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true }));
    run().then(
      (data) => id === latest.current && setState({ data, error: null, notFound: false, loading: false }),
      (error: Error) => id === latest.current &&
        setState({ data: null, error, notFound: error instanceof NotFoundError, loading: false }),
    );
  }, [run, tick]);

  return state;
}
