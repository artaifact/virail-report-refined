import { useEffect, useState } from "react";
import { Link as RouterLink, Route, Routes, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { usePageTitle } from "@/hooks/usePageTitle";
import "@/market-intel/market-intel.css";
import { Link } from "@/market-intel/compat";
import { NotFoundView } from "@/market-intel/views";
import MarketsHome from "@/market-intel/pages/MarketsHome";
import CatalogPage from "@/market-intel/pages/CatalogPage";
import GlobalQualityPage from "@/market-intel/pages/GlobalQualityPage";
import MarketOverviewPage from "@/market-intel/pages/MarketOverviewPage";
import MatrixPage from "@/market-intel/pages/MatrixPage";
import DuelPage from "@/market-intel/pages/DuelPage";
import ActivityPage from "@/market-intel/pages/ActivityPage";
import SettingsPage from "@/market-intel/pages/SettingsPage";
import OntologyPage from "@/market-intel/pages/OntologyPage";
import QualityPage from "@/market-intel/pages/QualityPage";
import CompanyPage from "@/market-intel/pages/CompanyPage";
import HelpPage from "@/market-intel/pages/HelpPage";

/**
 * Agentic Market Intelligence : pour chaque marché, qui les agents IA découvrent, où ils peuvent accéder à chaque
 * produit et ce qu'ils peuvent y faire. Monté sous /market-intelligence/* ; l'API est /api/v1/market-intelligence.
 */
export default function MarketIntelligence() {
  const { pathname } = useLocation();
  const { setOpen, open } = useSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  usePageTitle("Market Intelligence");

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Réduire automatiquement le menu principal Virail en mode icônes compact
    // pour maximiser l'espace d'affichage des tableaux et dashboards
    const wasOpen = open;
    setOpen(false);

    return () => {
      if (wasOpen) {
        setOpen(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mi">
      <header className="topbar">
        <RouterLink to="/market-intelligence" className="brand">
          <span className="brand-full">Agentic Market Intelligence</span>
          <span className="brand-short">AMI</span>
        </RouterLink>

        <button
          type="button"
          className="topbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </>
            )}
          </svg>
        </button>

        {menuOpen && (
          <div
            className="topbar-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav className={`topbar-nav ${menuOpen ? "topbar-nav--open" : ""}`}>
          <Link href="/" className={`nav-link ${pathname === "/market-intelligence" || pathname === "/market-intelligence/" ? "active" : ""}`} onClick={() => setMenuOpen(false)}>Marchés</Link>
          <Link href="/catalog" className={`nav-link ${pathname.includes("/catalog") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>Catalogues</Link>
          <Link href="/qualite" className={`nav-link ${pathname.includes("/qualite") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>Fiabilité</Link>
          <Link href="/aide" className={`nav-help ${pathname.includes("/aide") ? "active" : ""}`} onClick={() => setMenuOpen(false)}>Comment ça marche ?</Link>
        </nav>
      </header>
      <Routes>
        <Route index element={<MarketsHome />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="qualite" element={<GlobalQualityPage />} />
        <Route path="aide" element={<HelpPage />} />
        <Route path="markets/:id" element={<MarketOverviewPage />} />
        <Route path="markets/:id/matrix" element={<MatrixPage />} />
        <Route path="markets/:id/duel" element={<DuelPage />} />
        <Route path="markets/:id/activity" element={<ActivityPage />} />
        <Route path="markets/:id/settings" element={<SettingsPage />} />
        <Route path="markets/:id/ontology" element={<OntologyPage />} />
        <Route path="markets/:id/quality" element={<QualityPage />} />
        <Route path="companies/:id" element={<CompanyPage />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </div>
  );
}

