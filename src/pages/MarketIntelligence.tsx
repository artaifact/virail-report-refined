import { useEffect } from "react";
import { Link as RouterLink, Route, Routes, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
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

  useEffect(() => {
    window.scrollTo(0, 0);
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
          Agentic Market Intelligence
        </RouterLink>
        <nav className="topbar-nav" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link href="/" className={`nav-link ${pathname === "/market-intelligence" || pathname === "/market-intelligence/" ? "active" : ""}`}>Marchés</Link>
          <Link href="/catalog" className={`nav-link ${pathname.includes("/catalog") ? "active" : ""}`}>Catalogues</Link>
          <Link href="/qualite" className={`nav-link ${pathname.includes("/qualite") ? "active" : ""}`}>Fiabilité</Link>
          <Link href="/aide" className={`nav-help ${pathname.includes("/aide") ? "active" : ""}`}>Comment ça marche ?</Link>
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
