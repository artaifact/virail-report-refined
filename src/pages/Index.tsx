import React, { useState, useEffect } from 'react';
import './Index.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Info, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, Clock, Target, TrendingUp, CheckCircle, Circle, PlayCircle, Pause, RotateCcw, Sparkles, Zap, Award, Bookmark, MessageSquare, MoreVertical, X, Check } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useReport, useReports } from '@/hooks/useReports';
import type { FullReportData } from '@/lib/api';
import { listCompetitorAnalyses, getCompetitorAnalysisById, extractDomain, CompetitorAnalysisResponse } from '@/services/competitorAnalysisService';

// === CONSTANTES ===
const modelLogos: Record<string, string> = {
  'openai': '/prompt-model-openai-for-light.svg',
  'chatgpt': '/prompt-model-openai-for-light.svg',
  'gpt': '/prompt-model-openai-for-light.svg',
  'perplexity': '/prompt-model-perplexity.svg',
  'gemini': '/prompt-model-gemini.svg',
  'google': '/prompt-model-gemini.svg',
  'ai overview': '/prompt-model-gemini.svg',
  'claude': '/prompt-model-claude.svg',
  'anthropic': '/prompt-model-claude.svg',
  'mistral': '/Mistral.png',
};

/**
 * Récupère le logo d'un modèle avec une recherche par mot-clé
 */
const getModelLogo = (modelName: string): string | null => {
  if (!modelName) return null;
  const name = modelName.toLowerCase();
  
  for (const [key, path] of Object.entries(modelLogos)) {
    if (name.includes(key)) return path;
  }
  return null;
};

// === SOUS-COMPOSANTS ===


/**
 * Graphique circulaire SVG affichant les citations
 * Design multicolore avec segments orange, vert et accents colorés
 */
function CitationsChart({ reportData }: { reportData: FullReportData | null }) {
  // Calculer le nombre total de citations depuis les analyses
  const getTotalCitations = () => {
    // Utiliser les données de citation explicites si disponibles
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }

    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return 0; // Pas de données = 0 citations
    }
    
    // Essayer d'extraire les citations depuis les modules
    const totalFromApi = reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);

    // Si on a trouvé des citations dans l'API, on les utilise
    if (totalFromApi > 0) {
      return totalFromApi;
    }

    return 0;
  };

  const totalCitations = getTotalCitations();
  const citationsByModel = (reportData?.analyse_citation?.citations_by_model || {}) as Record<string, number>;
  
  // Déterminer la couleur selon le nombre de citations
  let circleColor = '#EF4444'; // Rouge par défaut (0 citation)
  if (totalCitations >= 5) {
    circleColor = '#10B981'; // Vert (5+ citations)
  } else if (totalCitations >= 1) {
    circleColor = '#F97316'; // Orange (1-4 citations)
  }

  const radius = 110;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="citations-chart">
      <svg width="280" height="280" viewBox="0 0 280 280">
        <circle 
          cx="140" 
          cy="140" 
          r={radius}
          fill="none" 
          stroke="#F5F6F7" 
          strokeWidth="30"
        />
        <circle 
          cx="140" 
          cy="140" 
          r={radius}
          fill="none" 
          stroke={circleColor}
          strokeWidth="30"
          strokeDasharray={circumference}
          strokeDashoffset="0"
          transform="rotate(-90 140 140)" 
          strokeLinecap="round"
        />
        <text x="140" y="130" textAnchor="middle" className="chart-number">
          {totalCitations}
        </text>
        <text x="140" y="160" textAnchor="middle" className="chart-label">
          Citations
        </text>
      </svg>
    </div>
  );
}

/**
 * Boutons de navigation entre les deux vues principales
 * Gère les états actif/inactif avec styles différenciés
 */
function NavigationButtons({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) {
  const handleViewChange = (view: string) => {
    onViewChange(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="navigation-buttons">
      <button 
        className={`nav-btn ${activeView === 'details' ? 'nav-btn-primary' : ''}`}
        onClick={() => handleViewChange('details')}
      >
        Infos détaillées
      </button>
      
      <button 
        className={`nav-btn ${activeView === 'ameliorer' ? 'nav-btn-primary' : ''}`}
        onClick={() => handleViewChange('ameliorer')}
      >
        Améliorer
      </button>
    </div>
  );
}

/**
 * Section haute du dashboard - Fixe
 * Contient le graphique de citations et les boutons de navigation
 */
function TopSection({ activeView, onViewChange, reportData }: { activeView: string, onViewChange: (view: string) => void, reportData: FullReportData | null }) {
  return (
    <div className="top-section">
      <CitationsChart reportData={reportData} />
      <NavigationButtons 
        activeView={activeView}
        onViewChange={onViewChange}
      />
    </div>
  );
}

/**
 * Tableau des recommandations SEO avec barres de progression
 */
function RecommendationsTable({ reportData }: { reportData: FullReportData | null }) {
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Extraire les recommandations depuis les données de l'API (plan_action_geo)
  const getRecommendationsFromAPI = (): any[] => {
    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return [];
    }

    // Chercher les données d'audit GEO dans toutes les analyses
    let auditGeoData = null;
    for (const analysis of reportData.analyses) {
      if (analysis.modules?.audit_geo?.plan_action_geo && Array.isArray(analysis.modules.audit_geo.plan_action_geo)) {
        auditGeoData = analysis.modules.audit_geo;
        break;
      }
    }

    if (!auditGeoData?.plan_action_geo || !Array.isArray(auditGeoData.plan_action_geo) || auditGeoData.plan_action_geo.length === 0) {
      return [];
    }

    const planAction = auditGeoData.plan_action_geo;

    // Mapper toutes les actions du plan_action_geo vers les recommandations (sans limite)
    return planAction.map((action: string, index: number) => {
      // Extraire l'élément principal de l'action (premier mot ou phrase avant ":")
      const elementMatch = action.match(/^([^:]+?):/);
      let element = elementMatch ? elementMatch[1].trim() : '';
      
      // Si pas de ":", essayer d'extraire le premier mot significatif
      if (!element) {
        const words = action.split(/\s+/).filter(w => w.length > 3);
        element = words[0] || `Action ${index + 1}`;
      }
      
      // Déterminer la priorité basée sur le contenu et la position
      let priority = 'Moyenne';
      let status = 'orange';
      let progress = 50;
      
      const actionLower = action.toLowerCase();
      
      // Priorité haute pour les actions critiques
      if (
        index < 3 || 
        actionLower.includes('refondre') || 
        actionLower.includes('implémenter') || 
        actionLower.includes('ajouter') ||
        actionLower.includes('créer') ||
        actionLower.includes('déployer') ||
        actionLower.includes('priorité') ||
        actionLower.includes('critique') ||
        actionLower.includes('urgent')
      ) {
        priority = 'Haute';
        status = 'red';
        progress = 25;
      } 
      // Priorité basse pour les optimisations
      else if (
        actionLower.includes('optimiser') ||
        actionLower.includes('améliorer') ||
        actionLower.includes('renforcer') ||
        actionLower.includes('optionnel')
      ) {
        priority = 'Basse';
        status = 'green';
        progress = 75;
      }

      // Extraire les étapes depuis l'action (séparer par virgules, points, ou points-virgules)
      const steps = action
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 15 && !s.match(/^[a-z]/)) // Filtrer les phrases trop courtes et les fragments
        .slice(0, 4);

      // Si pas assez d'étapes, créer des étapes génériques basées sur l'action
      const finalSteps = steps.length > 0 ? steps : [
        `Analyser l'état actuel pour : ${element}`,
        `Planifier l'implémentation`,
        `Mettre en œuvre la solution`,
        `Valider et tester`
      ];

      // Déterminer le temps estimé basé sur la complexité
      let estimatedTime = '1-2 heures';
      let difficulty = 'Facile';
      
      if (actionLower.includes('refondre') || actionLower.includes('restructurer') || actionLower.includes('implémenter schema')) {
        estimatedTime = '3-4 heures';
        difficulty = 'Moyenne';
      } else if (actionLower.includes('créer') || actionLower.includes('déployer') || actionLower.includes('ajouter json-ld')) {
        estimatedTime = '2-3 heures';
        difficulty = 'Moyenne';
      }

      // Extraire les ressources mentionnées dans l'action
      const resources: any[] = [];
      if (actionLower.includes('schema.org')) {
        resources.push({ name: 'Documentation Schema.org', url: 'https://schema.org/' });
      }
      if (actionLower.includes('google') || actionLower.includes('search console')) {
        resources.push({ name: 'Google Search Console', url: 'https://search.google.com/search-console' });
      }
      if (actionLower.includes('robots.txt') || actionLower.includes('sitemap')) {
        resources.push({ name: 'Google Sitemap Guidelines', url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview' });
      }

      return {
        element: element || `Action ${index + 1}`,
        action: action.length > 30 ? action.substring(0, 30) + '...' : action,
        progress,
        status,
        priority,
        details: action,
        steps: finalSteps,
        estimatedTime,
        difficulty,
        resources
      };
    });
  };

  // Utiliser uniquement les données de l'API
  const allRecommendations = getRecommendationsFromAPI();
  
  if (allRecommendations.length === 0) {
    return (
      <div className="recommendations-table" style={{ boxShadow: 'none', border: '1px solid #F1F5F9', padding: '24px', borderRadius: '16px' }}>
        <div style={{ textAlign: 'center', color: '#64748B', padding: '40px' }}>
          Aucune recommandation disponible pour ce rapport.
        </div>
      </div>
    );
  }
  
  // Limiter l'affichage initial à 5 recommandations
  const initialLimit = 5;
  const hasMore = allRecommendations.length > initialLimit;
  const recommendations = showAll ? allRecommendations : allRecommendations.slice(0, initialLimit);

  const handleRowClick = (rec: any) => {
    setSelectedRec(rec);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'red': return '#EF4444';
      case 'orange': return '#F97316';
      case 'green': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Haute': return '#EF4444';
      case 'Moyenne': return '#F97316';
      case 'Basse': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <>
      <div className="recommendations-table" style={{ boxShadow: 'none', border: '1px solid #F1F5F9', padding: '24px', borderRadius: '16px' }}>
        
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
          <thead>
            <tr>
              <th style={{ padding: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>ÉLÉMENT</th>
              <th style={{ padding: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>ACTION RECOMMANDÉE</th>
              <th style={{ padding: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>PRIORITÉ</th>
              <th style={{ padding: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid #F1F5F9' }}>STATUT ACTUEL</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec, index) => (
              <tr 
                key={index}
                onClick={() => handleRowClick(rec)}
                style={{ cursor: 'pointer', transition: 'background 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <td style={{ padding: '20px 0', fontSize: '15px', color: '#334155', fontWeight: 500, borderBottom: index === recommendations.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rec.element}
                    <Info size={14} style={{ color: '#94A3B8' }} />
                  </div>
                </td>
                <td style={{ padding: '20px 0', fontSize: '15px', color: '#64748B', borderBottom: index === recommendations.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {rec.action}
                    <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                  </div>
                </td>
                <td style={{ padding: '20px 0', fontSize: '14px', borderBottom: index === recommendations.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    background: rec.progress <= 90 ? '#EF444415' : `${getPriorityColor(rec.priority)}15`,
                    color: rec.progress <= 90 ? '#EF4444' : getPriorityColor(rec.priority)
                  }}>
                    {rec.priority}
                  </span>
                </td>
                <td style={{ padding: '20px 0', width: '30%', borderBottom: index === recommendations.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="progress-bar" style={{ flex: 1, height: '6px', background: '#F8FAFC', borderRadius: '999px' }}>
                      <div 
                        className={`progress-fill progress-${rec.status}`}
                        style={{ 
                          width: `${rec.progress}%`, 
                          borderRadius: '999px', 
                          height: '100%',
                          background: rec.progress <= 90 ? '#EF4444' : undefined
                        }}
                      />
                    </div>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: rec.progress <= 90 ? '#EF4444' : '#334155', 
                      minWidth: '40px' 
                    }}>
                      {rec.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {hasMore && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                padding: '10px 24px',
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
            >
              {showAll ? (
                <>
                  Afficher moins
                  <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                </>
              ) : (
                <>
                  Afficher plus ({allRecommendations.length - initialLimit} autres)
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRec && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  {selectedRec.element} - Détails de l'optimisation
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
                  {selectedRec.action}
                </DialogDescription>
              </DialogHeader>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
                {/* Métriques clés */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Priorité</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 700, 
                      color: selectedRec.progress <= 90 ? '#EF4444' : getPriorityColor(selectedRec.priority) 
                    }}>
                      {selectedRec.priority}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Temps estimé</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} />
                      {selectedRec.estimatedTime}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Difficulté</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                      {selectedRec.difficulty}
                    </div>
                  </div>
                </div>

                {/* Impact */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <TrendingUp size={18} style={{ color: '#3B82F6' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Impact attendu</h3>
                  </div>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                    {selectedRec.impact}
                  </p>
                </div>

                {/* Description détaillée */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Description</h3>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                    {selectedRec.details}
                  </p>
                </div>

                {/* Étapes d'implémentation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Target size={18} style={{ color: '#3B82F6' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>Étapes d'implémentation</h3>
                  </div>
                  <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedRec.steps.map((step: string, idx: number) => (
                      <li key={idx} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#475569' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: '#3B82F6', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ lineHeight: '1.6' }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Ressources */}
                {selectedRec.resources && selectedRec.resources.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', marginBottom: '12px' }}>Ressources utiles</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedRec.resources.map((resource: any, idx: number) => (
                        <a 
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '12px',
                            background: '#F8FAFC',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#3B82F6',
                            fontSize: '14px',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#F8FAFC'}
                        >
                          <ExternalLink size={16} />
                          {resource.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barre de progression */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Progression actuelle</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: selectedRec.progress <= 90 ? '#EF4444' : '#334155' 
                    }}>
                      {selectedRec.progress}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px', background: '#F8FAFC', borderRadius: '999px', width: '100%' }}>
                    <div 
                      className={`progress-fill progress-${selectedRec.status}`}
                      style={{ 
                        width: `${selectedRec.progress}%`, 
                        borderRadius: '999px', 
                        height: '100%',
                        background: selectedRec.progress <= 90 ? '#EF4444' : undefined
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Composant Accordéon réutilisable
 */
function AccordionItem({ id, title, isOpen, onToggle, children }: { id: string, title: string, isOpen: boolean, onToggle: (id: string) => void, children?: React.ReactNode }) {
  return (
    <div 
      className={`accordion-item ${isOpen ? 'accordion-open' : ''}`} 
      style={{ 
        border: `1px solid ${isOpen ? '#CBD5F5' : '#E2E8F0'}`, 
        borderRadius: '10px', 
        background: isOpen ? '#FFFFFF' : '#F7F9FC',
        overflow: 'hidden'
      }}
    >
      <button
        className="accordion-header"
        onClick={() => onToggle(id)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: isOpen ? '#FFFFFF' : '#F7F9FC',
          border: 'none',
          outline: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s ease'
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', textAlign: 'left' }}>{title}</span>
        <span className="accordion-icon" style={{ fontSize: '12px', color: '#94A3B8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
      </button>
      
      {isOpen && children && (
        <div 
          className="accordion-content" 
          style={{ 
            padding: '0 20px 20px 20px', 
            background: '#FFFFFF', 
            borderTop: '1px solid #E2E8F0' 
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Composant de carte d'étape dynamique et interactive
 */
function DynamicStepCard({ 
  etape, 
  idx, 
  stepId, 
  stepStatus, 
  updateStepStatus, 
  toggleAction, 
  updateStepNotes, 
  getPriorityColor 
}: { 
  etape: any; 
  idx: number; 
  stepId: string; 
  stepStatus: any; 
  updateStepStatus: (stepId: string, status: string) => void;
  toggleAction: (stepId: string, actionIndex: number, totalActionsCount: number) => void;
  updateStepNotes: (stepId: string, notes: string) => void;
  getPriorityColor: (priority: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [notesInput, setNotesInput] = useState(stepStatus.notes || '');
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Animation de célébration quand une étape est terminée
  useEffect(() => {
    if (stepStatus.progress === 100 && stepStatus.status === 'Terminé') {
      setIsCelebrating(true);
      const timer = setTimeout(() => setIsCelebrating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [stepStatus.progress, stepStatus.status]);

  const progressColor = stepStatus.progress === 100 ? '#10B981' : stepStatus.progress >= 50 ? '#F97316' : '#EF4444';
  const StatusIcon = stepStatus.status === 'Terminé' ? CheckCircle : stepStatus.status === 'En cours' ? PlayCircle : Circle;
  
  // Calculer le nombre d'actions cochées
  const checkedActions = stepStatus.checkedActions || {};
  const totalActions = etape.actions?.length || 0;
  const completedActions = Object.values(checkedActions).filter(Boolean).length;
  const actionsProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div 
      style={{ 
        padding: '12px 14px', 
        background: '#FFFFFF',
        borderRadius: '6px', 
        border: '1px solid #E2E8F0',
        boxShadow: isExpanded ? '0 1px 3px rgba(0,0,0,0.04)' : '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Effet de confettis pour la célébration */}
      {isCelebrating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10,
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          animation: 'pulse 0.6s ease-out'
        }} />
      )}

      {/* En-tête de l'étape avec badge de numéro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Badge numéro avec icône de statut */}
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            fontWeight: 600,
            fontSize: '12px',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            position: 'relative'
          }}>
            {stepStatus.status === 'Terminé' ? (
              <CheckCircle size={14} style={{ color: '#64748B' }} />
            ) : (
              <span>{idx + 1}</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
                {etape.titre || `Étape ${idx + 1}`}
              </h4>
            </div>
            {stepStatus.startedAt && (
              <div style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={14} />
                Commencé le {new Date(stepStatus.startedAt).toLocaleDateString('fr-FR')}
                {stepStatus.completedAt && (
                  <> • Terminé le {new Date(stepStatus.completedAt).toLocaleDateString('fr-FR')}</>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {etape.priorite && (
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              fontWeight: 500,
              background: `${getPriorityColor(etape.priorite)}15`,
              color: getPriorityColor(etape.priorite)
            }}>
              {etape.priorite}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '4px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#94A3B8'
            }}
          >
            <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Description */}
          <p style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', lineHeight: '1.7' }}>
            {etape.description || ''}
          </p>
          
          {/* Contrôles de statut avec animations */}
          <div style={{ marginBottom: '12px' }}>
            {/* Boutons rapides de statut - À droite, petits et groupés */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'Non commencé')}
                style={{ 
                  height: '32px',
                  padding: '0 14px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: stepStatus.status === 'Non commencé' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'Non commencé' ? 1 : 0.6
                }}
              >
                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                Non commencé
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'En cours')}
                style={{ 
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '13px',
                  background: 'transparent',
                  color: stepStatus.status === 'En cours' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'En cours' ? 1 : 0.6
                }}
              >
                <PlayCircle size={14} style={{ marginRight: '6px' }} />
                En cours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStepStatus(stepId, 'Terminé')}
                style={{ 
                  height: '30px',
                  padding: '0 12px',
                  fontSize: '13px',
                  background: 'transparent',
                  color: stepStatus.status === 'Terminé' ? '#1E293B' : '#64748B',
                  borderColor: '#E2E8F0',
                  borderWidth: '1px',
                  opacity: stepStatus.status === 'Terminé' ? 1 : 0.6
                }}
              >
                <CheckCircle size={14} style={{ marginRight: '6px' }} />
                Terminé
              </Button>
            </div>
          </div>

          {/* Checklist interactive des actions */}
          {etape.actions && etape.actions.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={16} style={{ color: '#475569' }} />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>
                    Actions ({completedActions}/{totalActions})
                  </span>
                </div>
                {actionsProgress > 0 && (
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
                    {actionsProgress}%
                  </span>
                )}
              </div>
              <div style={{ 
                padding: '8px', 
                background: '#F8FAFC', 
                borderRadius: '6px', 
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {etape.actions.map((action: string, aIdx: number) => {
                  const isChecked = checkedActions[aIdx] || false;
                  return (
                    <label
                      key={aIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '8px',
                        padding: '6px 8px',
                        background: isChecked ? '#F8FAFC' : '#FFFFFF',
                        borderRadius: '4px',
                        border: `1px solid #E2E8F0`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.7 : 1
                      }}
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {isChecked ? (
                          <CheckCircle size={16} style={{ color: '#475569' }} />
                        ) : (
                          <Circle size={16} style={{ color: '#CBD5E1' }} />
                        )}
                      </div>
                      <span 
                        style={{ 
                          fontSize: '15px', 
                          color: isChecked ? '#64748B' : '#475569', 
                          lineHeight: '1.6',
                          flex: 1,
                          userSelect: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleAction(stepId, aIdx, totalActions);
                        }}
                      >
                        {action}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Impact GEO */}
          {etape.impact_geo && (
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <TrendingUp size={16} style={{ color: '#475569' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Impact GEO</div>
              </div>
              <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                {etape.impact_geo}
              </div>
            </div>
          )}

          {/* Notes et commentaires */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setShowNotes(!showNotes)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: showNotes ? '#EFF6FF' : '#F8FAFC',
                border: `1px solid ${showNotes ? '#BFDBFE' : '#E2E8F0'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s ease'
              }}
            >
              <MessageSquare size={16} style={{ color: '#64748B' }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
                {stepStatus.notes ? 'Modifier notes' : 'Ajouter notes'}
              </span>
            </button>
            {showNotes && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onBlur={() => updateStepNotes(stepId, notesInput)}
                  placeholder="Notes..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    background: '#FFFFFF'
                  }}
                />
                {stepStatus.notes && (
                  <div style={{ marginTop: '6px', fontSize: '14px', color: '#64748B', display: 'flex', justifyContent: 'flex-end' }}>
                    <span>✓ Sauvegardé</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outils recommandés */}
          {etape.outils_recommandes && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ExternalLink size={16} />
                Outils recommandés
              </div>
              {Array.isArray(etape.outils_recommandes) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {etape.outils_recommandes.map((outil: string, oIdx: number) => (
                    <span 
                      key={oIdx}
                      style={{ 
                        padding: '8px 12px',
                        background: '#F1F5F9',
                        color: '#475569',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        border: '1px solid #E2E8F0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={14} />
                      {outil}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                  {etape.outils_recommandes}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Guide d'implémentation avec système d'accordéons
 * Affiche le score actuel vs cible et les sections repliables
 */
function ImplementationGuide({ reportData }: { reportData: FullReportData | null }) {
  const [openAccordion, setOpenAccordion] = useState<string | null>('monitoring');
  
  // Clé unique pour le localStorage basée sur l'ID du rapport
  const storageKey = reportData?.report?.id 
    ? `implementation-guide-progress-${reportData.report.id}` 
    : 'implementation-guide-progress-default';
  
  // Initialiser l'état depuis localStorage avec plus de données
  const [stepProgress, setStepProgress] = useState<Record<string, { 
    status: string; 
    progress: number;
    checkedActions?: Record<number, boolean>;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fonction pour mettre à jour le statut d'une étape
  const updateStepStatus = (stepId: string, status: string) => {
    const progressMap: Record<string, number> = {
      'Non commencé': 0,
      'En cours': 50,
      'Terminé': 100
    };
    
    const currentStep: { status?: string; progress?: number; checkedActions?: Record<number, boolean>; notes?: string; startedAt?: string; completedAt?: string } = stepProgress[stepId] || {};
    const now = new Date().toISOString();
    
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        status,
        progress: progressMap[status] || 0,
        startedAt: status !== 'Non commencé' && !currentStep.startedAt ? now : (currentStep.startedAt || undefined),
        completedAt: status === 'Terminé' ? now : (currentStep.completedAt || undefined)
      }
    };
    
    setStepProgress(newProgress);
    
    // Sauvegarder dans localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  };

  // Fonction pour obtenir le statut d'une étape
  const getStepStatus = (stepId: string): { 
    status: string; 
    progress: number;
    checkedActions?: Record<number, boolean>;
    notes?: string;
    startedAt?: string;
    completedAt?: string;
  } => {
    return stepProgress[stepId] || { status: 'Non commencé', progress: 0 };
  };

  // Fonction pour cocher/décocher une action
  const toggleAction = (stepId: string, actionIndex: number) => {
    const currentStep = getStepStatus(stepId);
    const checkedActions = currentStep.checkedActions || {};
    const newCheckedActions = {
      ...checkedActions,
      [actionIndex]: !checkedActions[actionIndex]
    };
    
    // Calculer la progression basée sur les actions cochées
    const totalActions = Object.keys(newCheckedActions).length;
    const completedActions = Object.values(newCheckedActions).filter(Boolean).length;
    const actionProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : currentStep.progress;
    
    // Si toutes les actions sont cochées, mettre le statut à "Terminé"
    let newStatus = currentStep.status;
    if (completedActions === totalActions && totalActions > 0) {
      newStatus = 'Terminé';
    } else if (completedActions > 0 && currentStep.status === 'Non commencé') {
      newStatus = 'En cours';
    }
    
    const progressMap: Record<string, number> = {
      'Non commencé': 0,
      'En cours': Math.max(50, actionProgress),
      'Terminé': 100
    };
    
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        checkedActions: newCheckedActions,
        status: newStatus,
        progress: progressMap[newStatus] || actionProgress
      }
    };
    
    setStepProgress(newProgress);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Fonction pour ajouter/modifier des notes
  const updateStepNotes = (stepId: string, notes: string) => {
    const currentStep = getStepStatus(stepId);
    const newProgress = {
      ...stepProgress,
      [stepId]: {
        ...currentStep,
        notes
      }
    };
    
    setStepProgress(newProgress);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Calculer la progression globale
  const calculateGlobalProgress = () => {
    const steps = Object.values(stepProgress);
    if (steps.length === 0) return 0;
    const totalProgress = steps.reduce((sum, step) => sum + step.progress, 0);
    return Math.round(totalProgress / steps.length);
  };

  // Extraire les données du guide depuis l'API
  const getGuideData = () => {
    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return {
        scoreActuel: 58,
        scoreCible: 83,
        guide: null
      };
    }

    const auditGeoData = reportData.analyses.find(analysis => 
      analysis.modules?.audit_geo?.package_optimisation_geo?.implementation_guide
    )?.modules?.audit_geo;

    if (!auditGeoData?.package_optimisation_geo?.implementation_guide) {
      return {
        scoreActuel: auditGeoData?.score_global_geo || 58,
        scoreCible: auditGeoData?.package_optimisation_geo?.package_metadata?.estimated_improvement?.score_estime || 83,
        guide: null
      };
    }

    const guide = auditGeoData.package_optimisation_geo.implementation_guide;
    return {
      scoreActuel: guide.score_geo_actuel || auditGeoData.score_global_geo || 58,
      scoreCible: guide.score_geo_cible || 83,
      guide
    };
  };

  const guideData = getGuideData();

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  // Fonction pour obtenir la couleur de la priorité (cohérente avec RecommendationsTable)
  const getPriorityColor = (priority: string) => {
    if (!priority) return '#6B7280';
    const priorityLower = priority.toLowerCase();
    // Vérifier les variantes possibles de "Haute"
    if (priorityLower.includes('haute') || priorityLower.includes('high') || priorityLower === 'haute') return '#EF4444';
    // Vérifier les variantes possibles de "Moyenne"
    if (priorityLower.includes('moyenne') || priorityLower.includes('medium') || priorityLower.includes('moyen') || priorityLower === 'moyenne') return '#F97316';
    // Vérifier les variantes possibles de "Basse"
    if (priorityLower.includes('basse') || priorityLower.includes('low') || priorityLower === 'basse') return '#10B981';
    return '#6B7280';
  };

  // Fonction pour télécharger le contenu
  const downloadContent = (content: any, filename: string, type: string) => {
    if (!content) return;
    const blob = new Blob([typeof content === 'object' ? JSON.stringify(content, null, 2) : content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const globalProgress = calculateGlobalProgress();
  const totalSteps = guideData.guide?.etapes_implementation ? Object.keys(guideData.guide.etapes_implementation).length : 4;
  const completedSteps = Object.values(stepProgress).filter(s => s.status === 'Terminé').length;
  const inProgressSteps = Object.values(stepProgress).filter(s => s.status === 'En cours').length;

  return (
    <div className="implementation-guide" style={{ boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', background: '#FFFFFF' }}>
      {/* En-tête avec scores et progression globale */}
      <div className="guide-header" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {guideData.guide?.titre || 'Guide d\'Implémentation - Package d\'Optimisation GEO'}
          </h2>
          
        </div>

        {/* Barre de progression globale dynamique */}
        <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Progression</span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{globalProgress}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            backgroundColor: '#E2E8F0', 
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{ 
              width: `${globalProgress}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '10px'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} style={{ color: '#10B981' }} />
              <span><strong style={{ color: '#1E293B' }}>{completedSteps}</strong> terminée{completedSteps > 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PlayCircle size={14} style={{ color: '#F97316' }} />
              <span><strong style={{ color: '#1E293B' }}>{inProgressSteps}</strong> en cours</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Circle size={14} style={{ color: '#CBD5E1' }} />
              <span><strong style={{ color: '#1E293B' }}>{totalSteps - completedSteps - inProgressSteps}</strong> à faire</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Accordéons */}
        <AccordionItem
          id="etapes"
          title={`Étapes d'implémentation (${guideData.guide?.etapes_implementation ? Object.keys(guideData.guide.etapes_implementation).length : 4})`}
          isOpen={openAccordion === 'etapes'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {guideData.guide?.etapes_implementation ? Object.values(guideData.guide.etapes_implementation).map((etape: any, idx: number) => {
                const stepId = `etape-${idx}-${etape.titre || `step-${idx}`}`;
                const stepStatus = getStepStatus(stepId);
                
                return (
                  <DynamicStepCard
                    key={idx}
                    etape={etape}
                    idx={idx}
                    stepId={stepId}
                    stepStatus={stepStatus}
                    updateStepStatus={updateStepStatus}
                    toggleAction={toggleAction}
                    updateStepNotes={updateStepNotes}
                    getPriorityColor={getPriorityColor}
                  />
                );
              }) : (
                [
                  { 
                    step: '1. Préparation et audit', 
                    description: 'Analyser l\'état actuel de votre site, identifier les pages prioritaires et préparer les ressources nécessaires.',
                    duration: '2-3 heures',
                    deliverables: ['Rapport d\'audit', 'Liste des pages prioritaires', 'Plan d\'action']
                  },
                  { 
                    step: '2. Implémentation technique', 
                    description: 'Mettre en place les schémas structurés, optimiser les métadonnées et améliorer la structure HTML.',
                    duration: '4-6 heures',
                    deliverables: ['Schémas JSON-LD', 'Métadonnées optimisées', 'Structure HTML améliorée']
                  },
                  { 
                    step: '3. Tests et validation', 
                    description: 'Valider toutes les implémentations avec les outils de Google et vérifier la conformité.',
                    duration: '1-2 heures',
                    deliverables: ['Rapport de validation', 'Corrections si nécessaire']
                  },
                  { 
                    step: '4. Déploiement et suivi', 
                    description: 'Mettre en production les changements et configurer le monitoring de performance.',
                    duration: '1 heure',
                    deliverables: ['Déploiement validé', 'Dashboard de monitoring configuré']
                  }
                ].map((item, idx) => {
                  const stepId = `etape-default-${idx}-${item.step}`;
                  const stepStatus = getStepStatus(stepId);
                  const progressColor = stepStatus.progress === 100 ? '#10B981' : stepStatus.progress === 50 ? '#F97316' : '#EF4444';
                  
                  return (
                  <div key={idx} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A' }}>{item.step}</h4>
                      <span style={{ fontSize: '14px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} />
                        {item.duration}
                      </span>
                    </div>
                    <p style={{ fontSize: '16px', color: '#475569', marginBottom: '16px', lineHeight: '1.7' }}>
                      {item.description}
                    </p>
                    
                    {/* Select de statut et barre de progression */}
                    <div style={{ marginBottom: '16px', padding: '16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                          Statut de l'étape :
                        </label>
                        <select
                          value={stepStatus.status}
                          onChange={(e) => updateStepStatus(stepId, e.target.value)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            fontSize: '14px',
                            color: '#334155',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            minWidth: '160px'
                          }}
                        >
                          <option value="Non commencé">Non commencé</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Progression</span>
                          <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>{stepStatus.progress}%</span>
                        </div>
                        <div style={{ 
                          width: '100%', 
                          height: '8px', 
                          backgroundColor: '#E2E8F0', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${stepStatus.progress}%`, 
                            height: '100%', 
                            backgroundColor: progressColor,
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                            borderRadius: '4px'
                          }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '10px' }}>Livrables :</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {item.deliverables.map((deliverable, dIdx) => (
                          <span key={dIdx} style={{ 
                            padding: '6px 12px', 
                            background: '#EFF6FF', 
                            color: '#3B82F6', 
                            borderRadius: '6px', 
                            fontSize: '14px',
                            fontWeight: 500
                          }}>
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="fichiers"
          title="Fichiers Fournis"
          isOpen={openAccordion === 'fichiers'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                // 1. Collecter les fichiers API
                const apiFiles: any[] = [];
                reportData?.analyses?.forEach((analysis, idx) => {
                  const geoData = analysis.modules?.audit_geo;
                  if (!geoData) return;
                  
                  const modelName = analysis.llm_name || `Modèle ${idx + 1}`;
                  
                  const downloadables = [
                    { key: 'schema_org_json', label: 'Schema.org JSON', type: 'application/json', ext: 'json', desc: 'Données structurées Schema.org générées par l\'IA' },
                    { key: 'llms_txt_content', label: 'LLMs.txt', type: 'text/plain', ext: 'txt', desc: 'Fichier de configuration standardisé pour les agents IA' },
                    { key: 'robots_txt_content', label: 'Robots.txt', type: 'text/plain', ext: 'txt', desc: 'Règles d\'indexation optimisées pour les crawlers IA' },
                    { key: 'meta_tags_snippet', label: 'Meta Tags HTML', type: 'text/html', ext: 'html', desc: 'Snippet HTML de métadonnées à insérer dans le <head>' },
                    { key: 'open_graph_tags', label: 'Open Graph Tags', type: 'text/html', ext: 'html', desc: 'Balises Open Graph pour l\'affichage social et IA' }
                  ];

                  downloadables.forEach(item => {
                    if (geoData[item.key]) {
                      apiFiles.push({
                        name: item.label,
                        type: item.ext.toUpperCase(),
                        model: modelName,
                        description: item.desc,
                        content: geoData[item.key],
                        mime: item.type,
                        filename: `${item.key}_${modelName.replace(/\s+/g, '_')}.${item.ext}`
                      });
                    }
                  });
                });

                // 2. Collecter les fichiers statiques du guide (en filtrant les en-têtes de modèles)
                const staticFiles = guideData.guide?.fichiers_fournis 
                  ? Object.entries(guideData.guide.fichiers_fournis)
                      .filter(([key]) => !key.toLowerCase().includes('ressources_générées') && !key.toLowerCase().includes('ressources générées'))
                      .map(([key, file]: [string, any]) => ({
                        name: key.replace(/_/g, '-'),
                        type: file.localisation?.split('.').pop()?.toUpperCase() || 'FILE',
                        description: file.description || '',
                        isStatic: true
                      }))
                  : (apiFiles.length === 0 ? [
                      { name: 'schema-faq.json', type: 'JSON', description: 'Schéma FAQ structuré pour les pages principales', isStatic: true },
                      { name: 'metadata-template.html', type: 'HTML', description: 'Template de métadonnées Open Graph et Twitter Cards', isStatic: true },
                      { name: 'sitemap-optimized.xml', type: 'XML', description: 'Sitemap XML optimisé avec priorités et fréquences', isStatic: true },
                      { name: 'robots-optimized.txt', type: 'TXT', description: 'Fichier robots.txt optimisé pour le crawling IA', isStatic: true },
                      { name: 'implementation-guide.pdf', type: 'PDF', description: 'Guide complet d\'implémentation avec exemples', isStatic: true }
                    ] : []);

                // 3. Fusionner et afficher
                const allFiles = [...apiFiles, ...staticFiles];

                if (allFiles.length === 0) {
                  return <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '16px' }}>Aucun fichier disponible pour le moment.</div>;
                }

                return allFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      cursor: file.content ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (file.content) {
                        downloadContent(file.content, file.filename, file.mime);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.background = '#FFFFFF';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A' }}>{file.name}</span>
                        {file.model && (
                          <span style={{ 
                            padding: '4px 10px', 
                            background: '#F0F9FF', 
                            color: '#0284C7', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 600,
                            border: '1px solid #BAE6FD'
                          }}>
                            {file.model}
                          </span>
                        )}
                        <span style={{ 
                          padding: '4px 10px', 
                          background: '#EFF6FF', 
                          color: '#3B82F6', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {file.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', color: '#64748B' }}>{file.description}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {file.content && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: '#3B82F6', 
                          fontSize: '14px', 
                          fontWeight: 600 
                        }}>
                          <ExternalLink size={16} />
                          Télécharger
                        </div>
                      )}
                     
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="monitoring"
          title="Monitoring Performance"
          isOpen={openAccordion === 'monitoring'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div className="monitoring-section" style={{ marginBottom: '24px' }}>
              <h4 className="section-subtitle" style={{ color: '#2563EB', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>KPI à Suivre</h4>
              <ul className="kpi-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Score de visibilité dans les moteurs génératifs', 'Taux d\'indexation par les crawlers IA', 'Qualité des données structurées', 'Performance d\'accessibilité', 'Score de conformité GEO'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155', lineHeight: '1.6' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="monitoring-section" style={{ marginBottom: '28px' }}>
              <h4 className="section-subtitle" style={{ color: '#2563EB', fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Outils Monitoring</h4>
              <ul className="tools-list" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Google Search Console', 'Bing Webmaster Tools', 'Schema.org Validator', 'Lighthouse Performance'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155', lineHeight: '1.6' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563EB' }}></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="monitoring-frequency" style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '8px', fontSize: '15px', color: '#64748B', lineHeight: '1.6' }}>
              <strong style={{ color: '#0F172A', marginRight: '6px', fontSize: '16px' }}>Fréquence:</strong> Hebdomadaire les 4 premières semaines, puis mensuel
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem
          id="support"
          title="Support & Contact"
          isOpen={openAccordion === 'support'}
          onToggle={toggleAccordion}
        >
          <div style={{ padding: '20px 4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2563EB', marginBottom: '14px' }}>Support technique</h4>
                <p style={{ fontSize: '16px', color: '#475569', marginBottom: '18px', lineHeight: '1.7' }}>
                  Notre équipe est disponible pour vous accompagner dans l'implémentation de ces optimisations. 
                  Nous offrons un support prioritaire pendant les 30 premiers jours suivant l'achat.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                   
                    {/* <span>Support par email : <strong>support@solocal.com</strong></span> */}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    <span>Réponse sous 24h en jours ouvrés</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#334155' }}>
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                    <span>Assistance téléphonique pour les clients Premium</span>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '18px', background: '#F0F7FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <AlertCircle size={22} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1E40AF', marginBottom: '6px' }}>
                      Besoin d'aide immédiate ?
                    </div>
                    <div style={{ fontSize: '15px', color: '#1E3A8A', lineHeight: '1.6' }}>
                      Consultez notre centre d'aide avec plus de 50 articles et tutoriels vidéo pour vous guider pas à pas.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}

/**
 * Vue "Infos détaillées"
 * Affiche le tableau de recommandations et le guide d'implémentation
 */
function InfosDetailleesView({ reportData }: { reportData: FullReportData | null }) {
  return (
    <div className="view-content">
      {/* Tableau des recommandations SEO */}
      <RecommendationsTable reportData={reportData} />
      
      {/* Guide d'implémentation avec accordéons */}
      <ImplementationGuide reportData={reportData} />
    </div>
  );
}

/**
 * Graphique linéaire d'évolution du Score GEO
 */
function GeoScoreChart({ reportData }: { reportData: FullReportData | null }) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Extraire les données depuis l'API
  const getDataFromAPI = () => {
    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return [];
    }

    return reportData.analyses
      .filter(analysis => analysis.modules?.audit_geo?.score_global_geo !== undefined)
      .map(analysis => {
        const score = analysis.modules.audit_geo.score_global_geo;
        const modelName = analysis.llm_name || 'Modèle inconnu';
        
        // Priorité aux données de citation explicites
        let citations = 0;
        if (reportData.analyse_citation?.citations_by_model && reportData.analyse_citation.citations_by_model[modelName] !== undefined) {
          citations = reportData.analyse_citation.citations_by_model[modelName];
        } else {
          // Fallback sur les données du module audit_geo
          citations = analysis.modules.audit_geo.citations || analysis.modules.audit_geo.mentions || 0;
        }
        
        return {
          model: modelName,
          score: Math.round(score),
          trend: '+0%',
          citations: citations,
          visibility: Math.round(score),
          lastUpdate: analysis.created_at || new Date().toISOString(),
          details: analysis.modules.audit_geo.resume_executif_geo || 'Données d\'analyse disponibles'
        };
      });
  };

  const data = getDataFromAPI();
  
  if (data.length === 0) {
    return (
      <div className="chart-card chart-card-wide" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Évolution Score GEO</h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          Aucune donnée d'analyse disponible pour ce rapport.
        </div>
      </div>
    );
  }

  // Vérifier si toutes les citations sont à 0 (données API)
  const allCitationsZero = data.length > 0 && data.every(item => item.citations === 0);
  const isApiData = data.length > 0;
  
  // Calculer le total des citations
  const totalCitations = data.reduce((sum, item) => sum + item.citations, 0);

  return (
    <div className="chart-card chart-card-wide" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Évolution Score GEO</h3>
      </div>
      
      {allCitationsZero && isApiData && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#FEE2E2', 
          borderRadius: '12px', 
          border: '1px solid #FCA5A5',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <AlertCircle size={20} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
               Aucune citation détectée 
            </div>
            <div style={{ fontSize: '13px', color: '#7F1D1D', lineHeight: '1.5' }}>
              Votre site n'est <strong>absolument pas cité</strong> dans les réponses dans les moteurs génératifs. 
              Vous perdez actuellement des opportunités de visibilité face à vos concurrents. 
              <strong>Agissez immédiatement</strong> en consultant les recommandations GEO pour éviter de prendre encore plus de retard dans les moteurs génératifs.
            </div>
          </div>
        </div>
      )}
      
      {totalCitations === 1 && isApiData && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#FFF7ED', 
          borderRadius: '12px', 
          border: '1px solid #FED7AA',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <CheckCircle2 size={20} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#9A3412', marginBottom: '4px' }}>
              Bravo ! Tu es cité une fois
            </div>
            <div style={{ fontSize: '13px', color: '#7C2D12', lineHeight: '1.5' }}>
              Votre site est cité <strong>1 fois</strong> dans les moteurs génératifs. 
              C'est un bon début ! Continue à optimiser votre contenu pour augmenter votre visibilité.
            </div>
          </div>
        </div>
      )}
      
      {totalCitations >= 5 && isApiData && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: '#F0FDF4', 
          borderRadius: '12px', 
          border: '1px solid #86EFAC',
          display: 'flex',
          alignItems: 'start',
          gap: '12px'
        }}>
          <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#166534', marginBottom: '4px' }}>
              Excellent ! Vous êtes bien cité
            </div>
            <div style={{ fontSize: '13px', color: '#14532D', lineHeight: '1.5' }}>
              Votre site est cité <strong>{totalCitations} fois</strong> dans les moteurs génératifs. 
              Félicitations ! Vous avez une bonne visibilité. Continuez sur cette lancée pour maintenir et améliorer votre positionnement.
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full overflow-x-auto">
        <table className="domains-table">
          <thead>
            <tr>
              <th>Modèle</th>
              <th>Citations</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr 
                key={index}
                onClick={() => {
                  setSelectedModel(item.model);
                  setIsModalOpen(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getModelLogo(item.model) ? (
                      <img src={getModelLogo(item.model)!} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <Zap size={14} className="text-blue-500" />
                    )}
                    <span className="font-medium">{item.model}</span>
                    <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                  </div>
                </td>
               
                <td>
                  {item.citations === 0 && isApiData ? (
                    <span style={{ fontSize: '13px', color: '#F59E0B', fontStyle: 'italic' }}>
                      Non cité
                    </span>
                  ) : item.citations >= 5 ? (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>{item.citations}</span>
                  ) : item.citations === 1 ? (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#F97316' }}>{item.citations}</span>
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.citations}</span>
                  )}
                </td>
              
  
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'analyse détaillée */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedModel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                  {getModelLogo(selectedModel) && (
                    <img src={getModelLogo(selectedModel)!} alt="" className="w-6 h-6 object-contain" />
                  )}
                  Analyse détaillée - {selectedModel}
                </DialogTitle>
                <DialogDescription style={{ fontSize: '14px', color: '#64748B', marginTop: '8px' }}>
                  Informations détaillées sur les citations et la visibilité
                </DialogDescription>
              </DialogHeader>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Analyse</div>
                  <div style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>
                    {data.find(d => d.model === selectedModel)?.details}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Citations</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                      {data.find(d => d.model === selectedModel)?.citations || 0}
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>Dernière mise à jour</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                      {data.find(d => d.model === selectedModel)?.lastUpdate || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Analyse concurrentielle avec Top 5 et sélecteur de modèle
 */
function CompetitorAnalysis({ reportData }: { reportData: FullReportData | null }) {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysisResponse | null>(null);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);

  // Extraire les modèles disponibles depuis l'API
  const availableModels = reportData?.analyses?.map(a => a.llm_name).filter(Boolean) || [];
  
  // Charger l'analyse concurrentielle correspondante à l'URL du rapport
  useEffect(() => {
    const loadCompetitorAnalysis = async () => {
      if (!reportData?.report?.url) return;
      
      try {
        setLoadingCompetitors(true);
        // Lister toutes les analyses pour trouver celle correspondante à l'URL
        const analyses = await listCompetitorAnalyses();
        const matchingAnalysis = analyses.find(analysis => {
          const reportUrl = reportData.report.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
          const analysisUrl = analysis.url?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') || '';
          return reportUrl === analysisUrl || reportUrl.includes(analysisUrl) || analysisUrl.includes(reportUrl);
        });

        if (matchingAnalysis) {
          // Charger les détails complets de l'analyse
          const fullAnalysis = await getCompetitorAnalysisById(matchingAnalysis.analysis_id);
          setCompetitorAnalysis(fullAnalysis);
          
          // Définir le modèle par défaut si disponible
          if (fullAnalysis.models_analysis && fullAnalysis.models_analysis.length > 0) {
            const firstModel = fullAnalysis.models_analysis[0].model_info?.display_name || 
                              fullAnalysis.models_analysis[0].model_info?.model_name || '';
            if (firstModel && !selectedModel) {
              setSelectedModel(firstModel);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'analyse concurrentielle:', error);
      } finally {
        setLoadingCompetitors(false);
      }
    };

    loadCompetitorAnalysis();
  }, [reportData?.report?.url, selectedModel]);

  // Mettre à jour le modèle sélectionné si nécessaire
  useEffect(() => {
    if (competitorAnalysis?.models_analysis && competitorAnalysis.models_analysis.length > 0) {
      const modelNames = competitorAnalysis.models_analysis.map(m => 
        m.model_info?.display_name || m.model_info?.model_name || ''
      ).filter(Boolean);
      
      if (modelNames.length > 0 && !modelNames.includes(selectedModel)) {
        setSelectedModel(modelNames[0]);
      }
    } else if (availableModels.length > 0 && !availableModels.includes(selectedModel)) {
      setSelectedModel(availableModels[0]);
    }
  }, [competitorAnalysis, availableModels, selectedModel]);

  // Extraire les concurrents depuis les données de l'API
  const getCompetitorsFromAPI = () => {
    if (!competitorAnalysis) return [];

    // Priorité à consolidated_competitors si disponible
    if (competitorAnalysis.consolidated_competitors && competitorAnalysis.consolidated_competitors.length > 0) {
      return competitorAnalysis.consolidated_competitors
        .slice(0, 5) // Top 5
        .map((comp, index) => ({
          name: comp.name,
          domain: extractDomain(comp.primary_url),
          score: Math.round(comp.average_score * 100),
          confidence: Math.round(comp.consensus_level * 100),
          status: comp.average_score >= 0.7 ? 'green' : comp.average_score >= 0.5 ? 'orange' : 'red',
          citations: 0, // Non disponible dans consolidated_competitors
          visibility: Math.round(comp.average_score * 100),
          keywords: 0, // Non disponible dans consolidated_competitors
          strengths: comp.competitive_themes || comp.common_features || [],
          weaknesses: [],
          modelScores: comp.model_scores || {},
          globalRank: comp.global_rank
        }));
    }

    // Fallback vers models_analysis si consolidated_competitors n'est pas disponible
    if (competitorAnalysis.models_analysis && selectedModel) {
      const selectedModelAnalysis = competitorAnalysis.models_analysis.find(m => {
        const displayName = m.model_info?.display_name || m.model_info?.model_name || '';
        return displayName === selectedModel || m.model_info?.model_name === selectedModel;
      });

      if (selectedModelAnalysis?.competitors) {
        return selectedModelAnalysis.competitors
          .slice(0, 5) // Top 5
          .map((comp, index) => ({
            name: comp.name,
            domain: extractDomain(comp.url),
            score: Math.round(comp.similarity_score * 100),
            confidence: Math.round(comp.confidence_level * 100),
            status: comp.similarity_score >= 0.7 ? 'green' : comp.similarity_score >= 0.5 ? 'orange' : 'red',
            citations: 0,
            visibility: Math.round(comp.similarity_score * 100),
            keywords: comp.mentioned_features?.length || 0,
            strengths: comp.competitive_advantages || [],
            weaknesses: [],
            reasoning: comp.reasoning,
            mentionedFeatures: comp.mentioned_features || []
          }));
      }
    }

    return [];
  };

  const competitors = getCompetitorsFromAPI();

  // Calculer le score moyen
  const averageScore = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.score, 0) / competitors.length)
    : 0;

  if (competitors.length === 0 && !loadingCompetitors) {
    return (
      <div className="chart-card competitor-card">
        <div className="card-header-with-selector">
          <h3 className="text-8xl font-bold text-slate-900">Analyse concurrentielle</h3>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
          Aucune analyse concurrentielle disponible pour ce modèle.
        </div>
      </div>
    );
  }

  // Obtenir les modèles disponibles depuis l'analyse concurrentielle
  const competitorModels = competitorAnalysis?.models_analysis?.map(m => 
    m.model_info?.display_name || m.model_info?.model_name || ''
  ).filter(Boolean) || availableModels;

  return (
    <div className="chart-card competitor-card">
      <div className="card-header-with-selector">
        <h3 className="text-8xl font-bold text-slate-900">Analyse concurrentielle</h3>
        <div className="model-selector">
          <span className="selector-label">Modèle:</span>
          <Select 
            value={selectedModel} 
            onValueChange={setSelectedModel}
            disabled={loadingCompetitors || competitorModels.length === 0}
          >
            <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              {competitorModels.length > 0 ? (
                competitorModels.map(model => (
                  <SelectItem key={model} value={model}>
                    <div className="flex items-center gap-2">
                      {getModelLogo(model) ? (
                        <img src={getModelLogo(model)!} alt={model} className="w-5 h-5 object-contain" />
                      ) : (
                        <Zap size={16} className="text-blue-500" />
                      )}
                      <span>{model}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Aucun modèle disponible</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="competitors-list">
        {loadingCompetitors ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
            Chargement de l'analyse concurrentielle...
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="subtitle-section">
                Top 5 Concurrents {selectedModel ? `- ${selectedModel}` : ''}
              </div>
            </div>
        
        {competitors.map((competitor, index) => (
          <div 
            key={index} 
            className="competitor-item"
            onClick={() => setSelectedCompetitor(selectedCompetitor === competitor.domain ? null : competitor.domain)}
            style={{ cursor: 'pointer' }}
          >
            <div className="competitor-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="competitor-name">{competitor.name}</div>
                {selectedCompetitor === competitor.domain && <ChevronRight size={14} style={{ color: '#3B82F6' }} />}
              </div>
              <div className="competitor-domain">{competitor.domain}</div>
            </div>
          </div>
        ))}
        
        {selectedCompetitor && (
          <div style={{ 
            marginTop: '16px', 
            padding: '16px', 
            background: '#F0F7FF', 
            borderRadius: '12px', 
            border: '1px solid #BFDBFE' 
          }}>
            {(() => {
              const comp = competitors.find(c => c.domain === selectedCompetitor);
              if (!comp) return null;
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Score</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{comp.score}/100</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>Mots-clés</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{comp.keywords}</div>
                    </div>
                  </div>
                  {comp.strengths && comp.strengths.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', marginBottom: '6px' }}>Points forts</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {comp.strengths.map((strength: string, idx: number) => (
                          <div key={idx} style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={12} style={{ color: '#10B981' }} />
                            {strength}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {comp.weaknesses && comp.weaknesses.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#F97316', marginBottom: '6px' }}>Points faibles</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {comp.weaknesses.map((weakness: string, idx: number) => (
                          <div key={idx} style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={12} style={{ color: '#F97316' }} />
                            {weakness}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(comp as any).reasoning && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6', marginBottom: '6px' }}>Analyse</div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                        {(comp as any).reasoning}
                      </div>
                    </div>
                  )}
                  {(comp as any).mentionedFeatures && (comp as any).mentionedFeatures.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Fonctionnalités mentionnées</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(comp as any).mentionedFeatures.map((feature: string, idx: number) => (
                          <span key={idx} style={{ 
                            padding: '4px 8px', 
                            background: '#F1F5F9', 
                            color: '#475569', 
                            borderRadius: '4px', 
                            fontSize: '11px' 
                          }}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        
            <button className="btn-full-analysis">
              → Voir l'analyse concurrentielle complète
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Tableau des domaines avec badges de type
 */
function DomainsTable({ reportData }: { reportData: FullReportData | null }) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  
  // Calculer le total des citations depuis l'API
  const getTotalCitationsFromAPI = () => {
    // Utiliser les données de citation explicites si disponibles (6 dans votre JSON)
    if (reportData?.analyse_citation?.total_citations !== undefined) {
      return reportData.analyse_citation.total_citations;
    }

    if (!reportData?.analyses || reportData.analyses.length === 0) {
      return 0;
    }
    
    return reportData.analyses.reduce((sum, analysis) => {
      const geoData = analysis.modules?.audit_geo;
      const citations = geoData?.citations || geoData?.mentions || 0;
      return sum + Number(citations);
    }, 0);
  };

  const totalCitationsFromAPI = getTotalCitationsFromAPI();
  const hasApiData = reportData?.analyses && reportData.analyses.length > 0;
  
  // Extraire les domaines cités depuis l'analyse de citation (sources réelles)
  const getDomainsFromAPI = () => {
    if (!reportData?.analyse_citation?.detailed_results) return [];
    
    const sourcesMap: Record<string, any> = {};
    const totalCalls = reportData.analyse_citation.total_llm_calls || 1;
    
    // Parcourir tous les résultats détaillés pour extraire les sources
    reportData.analyse_citation.detailed_results.forEach((result: any) => {
      if (result.sources && Array.isArray(result.sources)) {
        result.sources.forEach((source: any) => {
          try {
            const domain = extractDomain(source.url);
            if (!sourcesMap[domain]) {
              sourcesMap[domain] = {
                domain: domain,
                title: source.title || domain,
                mentions: 0,
                urls: new Set(),
                isClient: domain.includes('amundi') || domain.includes(extractDomain(reportData.report.url))
              };
            }
            sourcesMap[domain].mentions += 1;
            sourcesMap[domain].urls.add(source.url);
          } catch (e) {
            // Ignorer les URLs invalides
          }
        });
      }
    });
    
    return Object.values(sourcesMap).map((s: any) => ({
      icon: s.isClient ? '✓' : '🔗',
      domain: s.domain,
      used: `${Math.round((s.mentions / totalCalls) * 100)} %`,
      citations: s.mentions.toString(),
      type: s.isClient ? 'you' : 'corporate',
      label: s.isClient ? 'Your Site' : 'Source',
      pages: s.urls.size,
      lastSeen: new Date().toLocaleDateString('fr-FR'),
      description: `Source identifiée. Apparaît dans les réponses générées par les modèles d'IA.`,
      highlight: s.isClient,
      sourceDetails: Array.from(s.urls).map(url => {
        // Retrouver le titre pour cette URL
        let title = s.title;
        reportData.analyse_citation.detailed_results.forEach((res: any) => {
          const match = res.sources?.find((src: any) => src.url === url);
          if (match && match.title) title = match.title;
        });
        return { url, title };
      })
    })).sort((a: any, b: any) => parseFloat(b.citations) - parseFloat(a.citations));
  };

  const domains = getDomainsFromAPI();

  if (domains.length === 0) {
    return (
      <div className="domains-table-card" style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0', overflow: 'hidden', background: '#FFFFFF' }}>
        <div style={{ padding: '20px 26px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Domaines les plus cités</h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>Sources citées</p>
        </div>
        <div style={{ padding: '40px 26px', textAlign: 'center', background: '#FFFFFF' }}>
          Aucune source citée détectée pour ce rapport.
        </div>
      </div>
    );
  }

  return (
    <div className="domains-table-card" style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ padding: '20px 26px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Domaines les plus cités</h3>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>Sources citées</p>
      </div>
      
      {/* Message si aucune citation trouvée dans l'API */}
      {hasApiData && totalCitationsFromAPI === 0 ? (
        <div style={{ 
          padding: '40px 26px', 
          textAlign: 'center',
          background: '#FFFFFF'
        }}>
          <div style={{ 
            padding: '24px', 
            background: '#FEE2E2', 
            borderRadius: '12px', 
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'start',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <AlertCircle size={24} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#991B1B', marginBottom: '8px' }}>
                Aucune citation trouvée
              </div>
              <div style={{ fontSize: '14px', color: '#7F1D1D', lineHeight: '1.6' }}>
                Il n'y a pas de citation trouvée car vous n'êtes pas cité dans les moteurs génératifs. 
                Consultez les recommandations pour améliorer votre visibilité et augmenter vos chances d'être cité par les IA.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <table className="domains-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', background: '#F8FAFC' }}>
                <th style={{ padding: '14px 26px', borderBottom: '1px solid #E2E8F0' }}>Domain</th>
                <th style={{ padding: '14px 26px', borderBottom: '1px solid #E2E8F0' }}>Used</th>
                <th style={{ padding: '14px 26px', borderBottom: '1px solid #E2E8F0' }}>Pages</th>
                <th style={{ padding: '14px 26px', borderBottom: '1px solid #E2E8F0' }}>Avg. Citations</th>
                <th style={{ padding: '14px 26px', borderBottom: '1px solid #E2E8F0', textAlign: 'right' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain, index) => (
                <tr 
                  key={index} 
                  className={domain.highlight ? 'table-row-highlight' : ''} 
                  onClick={() => setSelectedDomain(selectedDomain === domain.domain ? null : domain.domain)}
                  style={{ 
                    background: domain.highlight ? '#E8F4FF' : '#FFFFFF',
                    borderBottom: index === domains.length - 1 ? 'none' : '1px solid #F1F5F9',
                    transition: 'background 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!domain.highlight) e.currentTarget.style.background = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    if (!domain.highlight) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  <td style={{ padding: '18px 26px' }}>
                    <div className="domain-cell" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: '#0F172A', fontWeight: domain.highlight ? 600 : 500 }}>
                      <span className="domain-icon" style={{ fontSize: '18px' }}>{domain.icon}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{domain.domain}</span>
                        {selectedDomain === domain.domain && <ChevronRight size={14} style={{ color: '#3B82F6' }} />}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '18px 26px', fontSize: '14px', color: '#475569', fontWeight: 600 }}>{domain.used}</td>
                  <td style={{ padding: '18px 26px', fontSize: '14px', color: '#475569' }}>{domain.pages}</td>
                  <td style={{ padding: '18px 26px', fontSize: '14px', color: '#475569', fontWeight: 600 }}>{domain.citations}</td>
                  <td style={{ padding: '18px 26px', textAlign: 'right' }}>
                    <span className={`badge badge-${domain.type}`} style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', padding: '4px 12px', background: domain.type === 'you' ? 'rgba(74, 222, 128, 0.15)' : undefined }}>
                      {domain.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {selectedDomain && (
            <div style={{ 
              padding: '20px 26px', 
              background: '#F0F7FF', 
              borderTop: '1px solid #BFDBFE',
              borderBottom: selectedDomain === domains[domains.length - 1].domain ? 'none' : '1px solid #BFDBFE'
            }}>
              {(() => {
                const dom = domains.find(d => d.domain === selectedDomain);
                if (!dom) return null;
                return (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E40AF', marginBottom: '8px' }}>
                      Informations détaillées - {dom.domain}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: '1.6', marginBottom: '12px' }}>
                      {dom.description}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                      <span>Pages citées : <strong style={{ color: '#0F172A' }}>{dom.pages}</strong></span>
                      <span>Dernière vue : <strong style={{ color: '#0F172A' }}>{dom.lastSeen}</strong></span>
                    </div>
                    
                    {dom.sourceDetails && dom.sourceDetails.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>URLs sources identifiées :</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dom.sourceDetails.map((src: any, idx: number) => (
                            <div key={idx} style={{ padding: '8px 12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>{src.title}</div>
                              <a 
                                href={src.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ fontSize: '11px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                {src.url} <ExternalLink size={10} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Vue "Améliorer"
 * Affiche les analyses, graphiques et tableaux de performance
 */
function AmeliorerView({ reportData }: { reportData: FullReportData | null }) {
  return (
    <div className="view-content">
      {/* Section avec les deux graphiques côte à côte */}
      <div className="analytics-section">
        <GeoScoreChart reportData={reportData} />
        <CompetitorAnalysis reportData={reportData} />
      </div>
      
      {/* Tableau des domaines */}
      <DomainsTable reportData={reportData} />
    </div>
  );
}

// === COMPOSANT PRINCIPAL ===

/**
 * Composant principal du Dashboard GEO Solocal
 * Gère l'état global et la navigation entre les vues
 */
const Index = () => {
  // État pour gérer la vue active ('details' ou 'ameliorer')
  const [activeView, setActiveView] = useState('details');
  
  // Récupérer le reportId depuis le state de navigation (prioritaire) ou les paramètres d'URL
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const explicitReportId = location.state?.selectedReportId || searchParams.get('reportId');
  
  // Récupérer la liste des rapports pour le fallback si aucun ID n'est fourni
  const { reports, loading: reportsLoading } = useReports();
  
  // Déterminer l'ID final à utiliser : celui fourni explicitement, ou le plus récent de la liste
  // On prend le dernier rapport de la liste (le plus récemment créé selon l'ordre de l'API)
  const reportId = explicitReportId || (reports.length > 0 ? reports[reports.length - 1].id : null);
  
  // Debug: afficher le reportId dans la console
  useEffect(() => {
    if (explicitReportId) {
      console.log('📋 ReportId trouvé (explicite):', explicitReportId);
    } else if (reportId) {
      console.log('📋 ReportId trouvé (fallback):', reportId);
    } else {
      console.log('⚠️ Aucun reportId disponible (ni URL/State, ni liste)');
    }
  }, [explicitReportId, reportId]);
  
  // Charger les données du rapport depuis l'API
  const { report: reportData, loading: reportLoading, error } = useReport(reportId);
  
  const loading = reportsLoading || reportLoading;

  return (
    <div className="ux-dashboard-body">
      <div className="dashboard-container ux-dashboard">
        {/* Section haute avec le graphique de citations */}
        <TopSection 
          activeView={activeView}
          onViewChange={setActiveView}
          reportData={reportData}
        />
        
        {/* Section basse avec contenu dynamique */}
        <div className="bottom-section">
          {loading && reportId ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              Chargement des données...
            </div>
          ) : error && reportId ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
              <div style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
                Erreur lors du chargement
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '12px' }}>
                Vérifiez que le reportId est correct dans l'URL (ex: ?reportId=1)
              </div>
            </div>
          ) : (
            <>
              {/* Vue Infos détaillées - Affiche le contenu d'Améliorer */}
              {activeView === 'details' && <AmeliorerView reportData={reportData} />}
              
              {/* Vue Améliorer - Affiche le contenu d'Infos détaillées */}
              {activeView === 'ameliorer' && <InfosDetailleesView reportData={reportData} />}
            </>
          )}
          {/* Message informatif si aucun reportId */}
          {!reportId && !loading && (
            <div style={{ 
              padding: '20px', 
              margin: '20px', 
              background: '#F0F7FF', 
              borderRadius: '8px', 
              border: '1px solid #BFDBFE',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#1E40AF', marginBottom: '8px', fontWeight: 600 }}>
                💡 Aucun rapport sélectionné
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                Ajoutez <code style={{ background: '#E0E7FF', padding: '2px 6px', borderRadius: '4px', color: '#4338CA' }}>?reportId=1</code> à l'URL pour charger un rapport spécifique
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
