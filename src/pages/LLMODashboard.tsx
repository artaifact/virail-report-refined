import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown, Target, Zap, ArrowRight, ChevronDown, CheckCircle, Circle, Users, Download } from "lucide-react";
import { useReport } from "@/hooks/useReports";
import { mapApiDataToMatrix } from "@/services/matrixMapper";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from '@/components/ui/chart';

const LLMODashboard = () => {
  usePageTitle('Dashboard LLMO');
  const location = useLocation();
  const selectedReportId = location.state?.selectedReportId;
  const [activeTab, setActiveTab] = useState('Résumé');
  

  // Récupérer les données du rapport sélectionné
  const { report, loading: reportLoading } = useReport(selectedReportId);

  // État pour la checklist dynamique basée sur les données du rapport
  const [checklistItems, setChecklistItems] = useState<Array<{ id: number, text: string, completed: boolean }>>([]);
  
  // Fonction pour sauvegarder l'état de la checklist dans localStorage
  const saveChecklistState = (items: Array<{ id: number, text: string, completed: boolean }>) => {
    if (selectedReportId) {
      localStorage.setItem(`checklist_${selectedReportId}`, JSON.stringify(items));
    }
  };

  // Fonction pour charger l'état de la checklist depuis localStorage
  const loadChecklistState = (items: Array<{ id: number, text: string, completed: boolean }>) => {
    if (selectedReportId) {
      const saved = localStorage.getItem(`checklist_${selectedReportId}`);
      if (saved) {
        try {
          const savedItems = JSON.parse(saved);
          // Fusionner les données sauvegardées avec les nouveaux items
          return items.map(item => {
            const savedItem = savedItems.find((s: any) => s.id === item.id && s.text === item.text);
            return savedItem ? { ...item, completed: savedItem.completed } : item;
          });
        } catch (e) {
         //console.log('Erreur lors du chargement de la checklist:', e);
        }
      }
    }
    return items;
  };
  
  // État pour les recommandations de la matrice
  const [matrixRecommendations, setMatrixRecommendations] = useState<any[]>([]);

  // Initialiser la checklist avec les données du plan d'action GEO
  useEffect(() => {
    if (report && report.analyses && report.analyses.length > 0) {
     //console.log('🔍 Rapport chargé:', report);
     //console.log('🔍 Nombre d\'analyses:', report.analyses.length);

      // Chercher toutes les analyses avec un plan d'action GEO valide
      const analysesWithGeoPlan = report.analyses.filter(analysis =>
        analysis.modules?.audit_geo?.plan_action_geo &&
        Array.isArray(analysis.modules.audit_geo.plan_action_geo) &&
        analysis.modules.audit_geo.plan_action_geo.length > 0
      );

     //console.log('🔍 Analyses avec plan GEO trouvées:', analysesWithGeoPlan.length);

      // Prendre la première analyse avec le plan le plus complet
      const analysisWithGeoPlan = analysesWithGeoPlan.reduce((best, current) => {
        const currentLength = current.modules?.audit_geo?.plan_action_geo?.length || 0;
        const bestLength = best.modules?.audit_geo?.plan_action_geo?.length || 0;
        return currentLength > bestLength ? current : best;
      }, analysesWithGeoPlan[0]);

     //console.log('🔍 Analyse avec plan GEO trouvée:', analysisWithGeoPlan);

      if (analysisWithGeoPlan?.modules?.audit_geo?.plan_action_geo) {
       //console.log('🔍 Plan d\'action GEO:', analysisWithGeoPlan.modules.audit_geo.plan_action_geo);
       //console.log('🔍 Nombre d\'actions:', analysisWithGeoPlan.modules.audit_geo.plan_action_geo.length);

        const geoPlanItems = analysisWithGeoPlan.modules.audit_geo.plan_action_geo.map((item: string, index: number) => ({
          id: index + 1,
          text: item,
          completed: false // Les actions sont par défaut non complétées - l'utilisateur peut les marquer
        }));

       //console.log('🔍 Items de checklist générés:', geoPlanItems);
        // Charger l'état sauvegardé si disponible
        const itemsWithSavedState = loadChecklistState(geoPlanItems);
        setChecklistItems(itemsWithSavedState);
      } else {
       //console.log('⚠️ Aucun plan GEO trouvé, utilisation du fallback');
        // Fallback vers la checklist par défaut si pas de plan GEO
        const fallbackItems = [
          { id: 1, text: "Ajouter JSON-LD 'SoftwareApplication' sur /, /features, /pricing", completed: false },
          { id: 2, text: "Normaliser H1/H2 (1 H1/page, mots-clés)", completed: false },
          { id: 3, text: "Publier '/llms.txt' (routes & résumé produit)", completed: false },
          { id: 4, text: "Planifier 2 mises à jour/mois (changelog public)", completed: false },
          { id: 5, text: "Insérer 3 preuves chiffrées (cas client, % CTR)", completed: false }
        ];
        const fallbackWithSavedState = loadChecklistState(fallbackItems);
        setChecklistItems(fallbackWithSavedState);
      }
    }
  }, [report]);

  const completedCount = checklistItems.filter(item => item.completed).length;
  const progressPercentage = checklistItems.length > 0 ? (completedCount / checklistItems.length) * 100 : 0;

  // Sauvegarder l'état de la checklist quand elle change
  useEffect(() => {
    if (checklistItems.length > 0) {
      saveChecklistState(checklistItems);
    }
  }, [checklistItems, selectedReportId]);

  // Debug pour voir l'état de la checklist
  useEffect(() => {
   //console.log('🔍 Checklist items actuels:', checklistItems);
   //console.log('🔍 Nombre d\'items dans la checklist:', checklistItems.length);
   //console.log('🔍 Items complétés:', checklistItems.filter(item => item.completed).length);
  }, [checklistItems]);


  // Mapper les données API vers la matrice Impact/Effort
  useEffect(() => {
    if (report && report.analyses) {
      const recommendations = mapApiDataToMatrix(report.analyses);
      setMatrixRecommendations(recommendations);
     //console.log('📊 Matrice recommandations mappées:', recommendations);
    }
  }, [report]);

  // Debug avancé des données récupérées depuis l'API
  useEffect(() => {
    if (!report) return;
    try {
     //console.log('🛰️ [API] FullReportData brut:', report);
     //console.log('🛰️ [API] Métadonnées rapport:', report.report);
     //console.log('🛰️ [API] Nombre d\'analyses:', report.analyses?.length || 0);
      (report.analyses || []).forEach((a: any, idx: number) => {
        const llm = a?.llm_name || a?.['llm_utilisé'] || `llm#${idx}`;
        const moduleKeys = a?.modules ? Object.keys(a.modules) : [];
        const geoKeys = a?.modules?.audit_geo ? Object.keys(a.modules.audit_geo) : [];
        const detailed = a?.['rapport_détaillé'] || a?.rapport_detaille || a?.rapport;
        const detailedKeys = detailed && typeof detailed === 'object' ? Object.keys(detailed) : [];
       //console.log(`🛰️ [API] Analyse #${idx + 1} (${llm}) → modules:`, moduleKeys);
        if (geoKeys.length)//console.log(`🛰️ [API]  └─ audit_geo:`, geoKeys);
        if (detailedKeys.length)//console.log(`🛰️ [API]  └─ rapport_détaillé keys:`, detailedKeys);
        if (a?.modules?.audit_geo?.score_global_geo != null) {
         //console.log(`🛰️ [API]  └─ score_global_geo:`, a.modules.audit_geo.score_global_geo);
        }
      });
    } catch (e) {
     //console.log('[API][DEBUG] erreur lors du logging avancé', e);
    }
  }, [report]);

  const toggleChecklistItem = (id: number) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {(() => {
          // Helpers pour rechercher dynamiquement le guide d'implémentation dans la structure réelle
          // Deep search pour une clé type implementation_guide (avec alias possibles)
          function deepFindImplementationGuide(node: any): any | null {
            if (!node) return null;
            if (typeof node !== 'object') return null;
            if (Array.isArray(node)) {
              for (const item of node) {
                const res = deepFindImplementationGuide(item);
                if (res) return res;
              }
              return null;
            }
            const possibleKeys = [
              'implementation_guide',
              'implementationGuide',
              'guide_implementation',
              'guideImplementation',
              'implementation',
              'guide'
            ];
            for (const k of possibleKeys) {
              if (Object.prototype.hasOwnProperty.call(node, k)) {
                return (node as any)[k];
              }
            }
            for (const key of Object.keys(node)) {
              const res = deepFindImplementationGuide((node as any)[key]);
              if (res) return res;
            }
            return null;
          }

          // Trouver le module GEO (clé variable/tolérante) dans un conteneur donné
          function findGeoPackageModule(container: Record<string, any> | undefined | null, contextLabel: string): any | null {
            if (!container) return null;
            // 1) priorité à la clé exacte 7_package_optimisation_geo
            if ((container as any)['7_package_optimisation_geo']) {
             //console.log('[LLMO] GEO package trouvé (exact) dans', contextLabel, '→ 7_package_optimisation_geo');
              return (container as any)['7_package_optimisation_geo'];
            }
            // 2) alias courants
            const aliasCandidates = [
              'package_optimisation_geo',
              'geo_optimization_package',
              'audit_geo',
              'geo',
            ];
            for (const candidate of aliasCandidates) {
              if ((container as any)[candidate]) {
               //console.log('[LLMO] GEO module trouvé via alias dans', contextLabel + ':', candidate);
                return (container as any)[candidate];
              }
            }
            // 3) regex fallback
            const keys = Object.keys(container);
            const regexMatch = keys.find(k => /7\s*[_-]?\s*package.*optimisation.*geo/i.test(k) || /package.*optimisation.*geo/i.test(k) || /geo.*optim/i.test(k));
            if (regexMatch) {
             //console.log('[LLMO] GEO module trouvé via regex key dans', contextLabel + ':', regexMatch);
              return (container as any)[regexMatch];
            }
           //console.log('[LLMO] Aucun module GEO trouvé dans', contextLabel, '→ clés:', keys);
            return null;
          }

          // Trouver le module GEO en inspectant d'abord rapport_détaillé, puis modules
          function findGeoFromAnalysis(analysis: any): any | null {
            // 1) rapport_détaillé
            const detailed = (analysis as any)?.['rapport_détaillé'] || (analysis as any)?.rapport_detaille || (analysis as any)?.rapport;
            const fromDetailed = findGeoPackageModule(detailed, 'rapport_détaillé');
            if (fromDetailed) return fromDetailed;

            // 1b) si rapport_détaillé contient des sous-objets par modèle, tenter chaque entrée
            if (detailed && typeof detailed === 'object' && !Array.isArray(detailed)) {
              for (const key of Object.keys(detailed)) {
                const sub = (detailed as any)[key];
                const found = findGeoPackageModule(sub, `rapport_détaillé.${key}`);
                if (found) return found;
              }
            }
            if (Array.isArray(detailed)) {
              for (let i = 0; i < detailed.length; i++) {
                const found = findGeoPackageModule(detailed[i], `rapport_détaillé[${i}]`);
                if (found) return found;
              }
            }
            // 2) modules
            const fromModules = findGeoPackageModule((analysis as any)?.modules, 'modules');
            if (fromModules) return fromModules;
            return null;
          }

          // Recherche profonde d'une clé parmi plusieurs alias
          function deepFindKey(node: any, keyAliases: string[]): any | null {
            if (!node) return null;
            if (typeof node !== 'object') return null;
            if (Array.isArray(node)) {
              for (const item of node) {
                const res = deepFindKey(item, keyAliases);
                if (res != null) return res;
              }
              return null;
            }
            for (const alias of keyAliases) {
              if (Object.prototype.hasOwnProperty.call(node, alias)) {
                return (node as any)[alias];
              }
            }
            for (const key of Object.keys(node)) {
              const res = deepFindKey((node as any)[key], keyAliases);
              if (res != null) return res;
            }
            return null;
          }

          // Extrait une valeur GEO (ex: schema_org_json, meta_tags_snippet, llms_txt_content)
          function extractGeoValueFromAnalysis(analysis: any, aliases: string[]): any | null {
            if (!analysis) return null;
            const geoPackage = findGeoFromAnalysis(analysis);
            if (!geoPackage) return null;
            // Accès direct
            for (const a of aliases) {
              if ((geoPackage as any)[a] != null) return (geoPackage as any)[a];
            }
            // Parfois sous package_optimisation_geo
            const pkg = (geoPackage as any).package_optimisation_geo || (geoPackage as any)['7_package_optimisation_geo'];
            if (pkg) {
              for (const a of aliases) {
                if ((pkg as any)[a] != null) return (pkg as any)[a];
              }
            }
            // Recherche profonde
            return deepFindKey(geoPackage, aliases);
          }

          // Mise en forme: si string JSON valide → pretty-print, sinon retourne tel quel; objets → pretty JSON
          function formatForDisplay(raw: any): string {
            if (raw == null) return '';
            if (typeof raw === 'string') {
              const trimmed = raw.trim();
              try {
                const parsed = JSON.parse(trimmed);
                return JSON.stringify(parsed, null, 2);
              } catch {
                return raw;
              }
            }
            if (typeof raw === 'object') {
              try {
                return JSON.stringify(raw, null, 2);
              } catch {
                return String(raw);
              }
            }
            return String(raw);
          }

          // Extrait le guide pour une analyse donnée, avec source
          function extractGuideFromAnalysis(analysis: any): { guide: any, source: string } | null {
            if (!analysis) return null;
            const geoPackage = findGeoFromAnalysis(analysis);
            if (!geoPackage) {
             //console.log('[LLMO] Pas de GEO package pour analyse:', (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé']);
              return null;
            }
            let guide: any = null;
            if ((geoPackage as any).implementation_guide) {
             //console.log('[LLMO] implementation_guide trouvé direct dans GEO package');
              guide = (geoPackage as any).implementation_guide;
            }
            if (!guide) {
             //console.log('[LLMO] Recherche profonde du implementation_guide...');
              guide = deepFindImplementationGuide(geoPackage);
            }
            if (!guide) {
             //console.log('[LLMO] Aucun implementation_guide trouvé pour analyse:', (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé']);
              return null;
            }
            const source = (analysis as any)?.llm_name || (analysis as any)?.['llm_utilisé'] || 'inconnu';
            return { guide, source };
          }

          // Deep search pour "performance_impact" (alias possibles)
          function deepFindPerformanceImpact(node: any): any | null {
            if (!node) return null;
            if (typeof node !== 'object') return null;
            if (Array.isArray(node)) {
              for (const item of node) {
                const res = deepFindPerformanceImpact(item);
                if (res) return res;
              }
              return null;
            }
            const possibleKeys = ['performance_impact', 'impact_performance', 'impact', 'performance'];
            for (const k of possibleKeys) {
              if (Object.prototype.hasOwnProperty.call(node, k)) {
                return (node as any)[k];
              }
            }
            for (const key of Object.keys(node)) {
              const res = deepFindPerformanceImpact((node as any)[key]);
              if (res) return res;
            }
            return null;
          }

          // Extrait l'objet performance_impact depuis le module GEO (pas depuis implementation_guide)
          function extractPerformanceFromAnalysis(analysis: any): any | null {
            if (!analysis) return null;
            const geoPackage = findGeoFromAnalysis(analysis);
            if (!geoPackage) return null;
            // direct
            if ((geoPackage as any).performance_impact) return (geoPackage as any).performance_impact;
            // parfois inclus dans un package_metadata
            if ((geoPackage as any).package_metadata?.performance_impact) return (geoPackage as any).package_metadata.performance_impact;
            // deep
            return deepFindPerformanceImpact(geoPackage);
          }

          // Attacher les helpers au composant pour usage plus bas
          (LLMODashboard as any)._extractGuideFromAnalysis = extractGuideFromAnalysis;
          (LLMODashboard as any)._deepFindImplementationGuide = deepFindImplementationGuide;
          (LLMODashboard as any)._findGeoPackageModule = findGeoPackageModule;
          (LLMODashboard as any)._extractPerformanceFromAnalysis = extractPerformanceFromAnalysis;
          (LLMODashboard as any)._extractGeoValueFromAnalysis = extractGeoValueFromAnalysis;
          (LLMODashboard as any)._formatForDisplay = formatForDisplay;
          return null;
        })()}
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
          Analyse GEO
          </h1>

          {/* Affichage de l'ID de l'analyse sélectionnée */}
          {/* {selectedReportId && (
            <div className="mb-4">
              <Badge variant="outline" className="bg-muted/50 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
                Analyse sélectionnée: {selectedReportId}
              </Badge>
            </div>
          )} */}

          {/* Indicateur de chargement */}
          {reportLoading && (
            <div className="mb-4">
              <Badge variant="outline" className="bg-muted/50 text-yellow-700 border-yellow-200 px-4 py-2 text-sm font-medium">
                Chargement des données d'analyse...
              </Badge>
            </div>
          )}

          {/* Informations sur le plan d'action GEO */}
          {report && report.analyses && report.analyses.length > 0 && (
            <div className="mb-4">
              {(() => {
                const analysisWithGeoPlan = report.analyses.find(analysis =>
                  analysis.modules?.audit_geo?.plan_action_geo &&
                  analysis.modules.audit_geo.plan_action_geo.length > 0
                );

                if (analysisWithGeoPlan?.modules?.audit_geo) {
                  const geoData = analysisWithGeoPlan.modules.audit_geo;
                  return (
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline" className="bg-muted/50 text-green-700 border-green-200 px-3 py-1 text-xs">
                        Plan GEO: {geoData.plan_action_geo.length} actions
                      </Badge>
                      <Badge variant="outline" className="bg-muted/50 text-blue-700 border-blue-200 px-3 py-1 text-xs">
                        Score GEO: {geoData.score_global_geo}/100
                      </Badge>
                      <Badge variant="outline" className="bg-muted/50 text-purple-700 border-purple-200 px-3 py-1 text-xs">
                        Checklist: {checklistItems.length} items
                      </Badge>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Ligne de transition colorée */}
          <div className="relative mb-6">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto max-w-md"></div>
          </div>

          {/* Sous-titre */}
          <p className="text-lg text-muted-foreground text-center">
            Compréhension instantanée · Présentation actionnable · Focus sur l'impact
          </p>
        </div>

        {/* Cartes d'indicateurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Carte Score Global (progress circulaire) */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">SCORE GEO GLOBAL</span>
                <span className="text-xs text-muted-foreground">en direct</span>
              </div>
              {(() => {
                const val = (() => {
                  const a = report?.analyses?.find(an => an.modules?.audit_geo?.score_global_geo);
                  return a?.modules?.audit_geo?.score_global_geo || 0;
                })();
                const pct = Math.max(0, Math.min(100, val));
                return (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative h-24 w-24">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#16a34a ${pct * 3.6}deg, #e5e7eb 0deg)`
                        }}
                      />
                      <div className="absolute inset-1 bg-card rounded-full flex items-center justify-center border border-border">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{pct}</div>
                          <div className="text-xs text-muted-foreground">/100</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="mt-3 text-center text-sm text-muted-foreground">Performance générale</div>
            </CardContent>
          </Card>

          {/* Carte Top Gap (barre) */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">TOP GAP</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-lg font-semibold text-foreground">Schema.org</div>
              {(() => {
                const val = (() => {
                  const a = report?.analyses?.find(an => an.modules?.audit_geo?.donnees_score);
                  return a?.modules?.audit_geo?.donnees_score || 0;
                })();
                return (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${val}%` }} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Performance: {val}/100</div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Carte Gain Rapide */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">GAIN RAPIDE</span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-3 text-lg font-semibold text-foreground">Balises Hn</div>
              <div className="mt-1 text-sm text-muted-foreground">+ métadonnées</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-green-700 border-green-200">Effort faible</span>
                <span className="text-xs px-2 py-0.5 rounded-full border bg-muted/50 text-green-700 border-green-200">Impact moyen</span>
              </div>
            </CardContent>
          </Card>

          {/* Carte Action Immédiate */}
          <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">ACTION IMMÉDIATE</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-3 text-lg font-semibold text-foreground">llms.txt</div>
              <div className="mt-1 text-sm text-muted-foreground">+ sitemap</div>
            </CardContent>
          </Card>
        </div>


        {/* Menu de navigation */}
        <div className="mt-8 flex justify-center">
          <div className="bg-card rounded-xl p-2 shadow-lg border border-transparent inline-block relative">
            {/* Indicateur animé qui se déplace */}
            <div
              className="absolute top-2 bottom-2 bg-primary rounded-lg transition-all duration-300 ease-in-out"
              style={{
                width: 'calc(25% - 0.25rem)',
                left: '0.5rem',
                transform: activeTab === 'Résumé' ? 'translateX(0)' :
                  activeTab === 'Preuves' ? 'translateX(calc(100% + 0.25rem))' :
                    activeTab === 'Détails' ? 'translateX(calc(200% + 0.5rem))' :
                      activeTab === 'Action' ? 'translateX(calc(300% + 0.75rem))' :
                        'translateX(0)'
              }}
            ></div>

            <div className="relative flex items-center justify-center space-x-0 z-10">
              <button
                onClick={() => setActiveTab('Résumé')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Résumé' ? 'white' : '#6b7280' }}
              >
                Résumé
              </button>
              <button
                onClick={() => setActiveTab('Preuves')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Preuves' ? 'white' : '#6b7280' }}
              >
                Preuves
              </button>
              <button
                onClick={() => setActiveTab('Détails')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Détails' ? 'white' : '#6b7280' }}
              >
                Détails
              </button>
              <button
                onClick={() => setActiveTab('Action')}
                className="px-6 py-3 transition-all duration-300 font-medium rounded-lg border border-transparent relative z-20"
                style={{ color: activeTab === 'Action' ? 'white' : '#6b7280' }}
              >
                Action
              </button>
            </div>
          </div>
        </div>

        {/* Contenu conditionnel selon l'onglet actif */}
        {activeTab === 'Résumé' && (
          <div className="mt-8 space-y-6">
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground text-center text-xl">
                  Top 5 Priorités
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-foreground">#</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Priorité</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Impact</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Effort</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Pourquoi</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Prochaine action</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                          analysis.modules?.audit_geo?.plan_action_geo &&
                          Array.isArray(analysis.modules.audit_geo.plan_action_geo) &&
                          analysis.modules.audit_geo.plan_action_geo.length > 0
                        );

                        const geoData = analysisWithGeoPlan?.modules?.audit_geo;
                        const planActions = geoData?.plan_action_geo || [];

                        // Fonction pour calculer l'impact basé sur le score (plus le score est bas, plus l'impact est élevé)
                        const getImpact = (score: number) => {
                          if (score < 20) return 5; // Impact maximum - score très faible
                          if (score < 40) return 4; // Impact élevé - score faible
                          if (score < 60) return 3; // Impact moyen - score moyen
                          if (score < 80) return 2; // Impact faible - score bon
                          return 1; // Impact très faible - score excellent
                        };

                        // Fonction pour calculer l'effort basé sur le type d'action (plus c'est complexe, plus l'effort est élevé)
                        const getEffort = (action: string) => {
                          if (action.includes('JSON-LD') || action.includes('Schema.org') || action.includes('structurées')) return 5; // Effort maximum
                          if (action.includes('HTML') || action.includes('balises') || action.includes('hiérarchie')) return 4; // Effort élevé
                          if (action.includes('métadonnées') || action.includes('Open Graph')) return 3; // Effort moyen
                          if (action.includes('robots.txt') || action.includes('sitemap')) return 2; // Effort faible
                          if (action.includes('répétitions') || action.includes('lisibilité')) return 4; // Effort élevé pour le contenu
                          return 3; // Effort par défaut
                        };

                        // Fonction pour obtenir le statut basé sur le score
                        const getStatus = (score: number) => {
                          if (score < 20) return {
                            label: 'Critique',
                            color: 'bg-red-500 hover:bg-red-600',
                            description: 'Action urgente requise'
                          };
                          if (score < 40) return {
                            label: 'Urgent',
                            color: 'bg-red-400 hover:bg-red-500',
                            description: 'Priorité haute'
                          };
                          if (score < 60) return {
                            label: 'À améliorer',
                            color: 'bg-orange-500 hover:bg-orange-600',
                            description: 'Amélioration nécessaire'
                          };
                          if (score < 80) return {
                            label: 'Correct',
                            color: 'bg-muted/500 hover:bg-yellow-600',
                            description: 'Peut être optimisé'
                          };
                          return {
                            label: 'Excellent',
                            color: 'bg-primary hover:bg-primary',
                            description: 'Performance optimale'
                          };
                        };

                        // Priorités avec leurs données correspondantes
                        const priorities = [
                          {
                            id: 1,
                            name: 'Schema.org',
                            action: planActions[2] || 'Intégrer des données structurées Schema.org',
                            score: geoData?.donnees_score || 0,
                            why: 'LLM lisent mieux les données structurées'
                          },
                          {
                            id: 2,
                            name: 'Hn & sections',
                            action: planActions[1] || 'Ajouter une hiérarchie claire de titres',
                            score: geoData?.html_score || 0,
                            why: 'Structure claire pour les crawlers'
                          },
                          {
                            id: 3,
                            name: 'Métadonnées',
                            action: planActions[3] || 'Ajouter des métadonnées techniques',
                            score: geoData?.meta_score || 0,
                            why: 'Informations riches pour LLM'
                          },
                          {
                            id: 4,
                            name: 'Contenu',
                            action: planActions[4] || 'Éviter les répétitions inutiles',
                            score: geoData?.contenu_score || 0,
                            why: 'Qualité et pertinence du contenu'
                          },
                          {
                            id: 5,
                            name: 'Robots.txt & sitemap',
                            action: planActions[5] || 'Mettre en place robots.txt et sitemap.xml',
                            score: geoData?.crawlers_score || 0,
                            why: 'Crawl IA optimisé'
                          }
                        ];

                        return priorities.map((priority, index) => {
                          const impact = getImpact(priority.score);
                          const effort = getEffort(priority.action);
                          const status = getStatus(priority.score);

                          return (
                            <tr key={priority.id} className={index < priorities.length - 1 ? "border-b border-border" : ""}>
                              <td className="py-3 px-4 font-medium text-foreground">{priority.id}</td>
                              <td className="py-3 px-4 font-medium text-foreground">{priority.name}</td>
                              <td className="py-3 px-4">
                                {(() => {
                                  const level = impact >= 4 ? 'Haut' : impact >= 3 ? 'Moyen' : 'Faible';
                                  // Palette 100% verte (intensité croissante)
                                  const cls = level === 'Haut'
                                    ? 'bg-green-200 text-muted-foreground border-green-300'
                                    : level === 'Moyen'
                                      ? 'bg-muted text-green-700 border-green-200'
                                      : 'bg-muted/50 text-green-700 border-green-200';
                                  return (
                                    <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>
                                      {level}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-3 px-4">
                                {(() => {
                                  const e = Math.min(Math.max(effort, 1), 5);
                                  return (
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                          <div key={i} className={`h-2 w-2 rounded-full ${i < e ? 'bg-primary' : 'bg-muted'}`} />
                                        ))}
                                      </div>
                                      <span className="text-xs text-muted-foreground">{e}/5</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">{priority.why}</td>
                              <td className="py-3 px-4 text-muted-foreground">{priority.action}</td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={`${status.color} text-white font-medium px-3 py-1 rounded-full transition-all duration-200 shadow-sm hover:shadow-md cursor-default`}
                                  title={status.description}
                                >
                                  {status.label}
                                </Badge>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique Radar - Performance par Métriques */}
              <Card className="bg-card border border-border shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground text-xl">
                      Performance par Métriques
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">Analyse multidimensionnelle</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full relative overflow-hidden bg-card rounded-2xl border border-border p-4 shadow-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={(() => {
                          // Données par défaut si pas de rapport
                          if (!report?.analyses) {
                            return [
                              { metric: 'Schema.org', Score: 65 },
                              { metric: 'HTML sémantique', Score: 78 },
                              { metric: 'Métadonnées', Score: 82 },
                              { metric: 'Contenu', Score: 75 },
                              { metric: 'Accessibilité', Score: 88 },
                              { metric: 'Performance', Score: 85 }
                            ];
                          }

                          // Récupérer les scores depuis le rapport
                          const analysis = report.analyses.find(a => a.llm_name === 'gpt-5');
                          const auditGeo = analysis?.modules?.audit_geo;

                          return [
                            { 
                              metric: 'Schema.org', 
                              Score: auditGeo?.donnees_score || 65 
                            },
                            { 
                              metric: 'HTML sémantique', 
                              Score: auditGeo?.html_score || 78 
                            },
                            { 
                              metric: 'Métadonnées', 
                              Score: auditGeo?.meta_score || 82 
                            },
                            { 
                              metric: 'Contenu', 
                              Score: auditGeo?.contenu_score || 75 
                            },
                            { 
                              metric: 'Accessibilité', 
                              Score: auditGeo?.accessibilite_score || 88 
                            },
                            { 
                              metric: 'Performance', 
                              Score: auditGeo?.performance_score || 85 
                            }
                          ];
                        })()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <PolarGrid stroke="#e5e7eb" strokeOpacity={0.3} />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickCount={6}
                        />

                        {/* Radar principal */}
                        <Radar
                          name="Score"
                          dataKey="Score"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />

                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white/95 backdrop-blur-sm p-3 border border-neutral-300 rounded-xl shadow-2xl">
                                  <p className="font-semibold text-neutral-900 mb-2">{label}</p>
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center justify-between gap-3 py-0.5">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-sm"
                                          style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="text-sm text-neutral-700">Score</span>
                                      </div>
                                      <span className="font-bold text-neutral-900 text-sm">{entry.value}%</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Légende */}
                  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1">
                    {/* Colonne gauche */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">Schema.org</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">HTML sémantique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">Métadonnées</span>
                      </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">Contenu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">Accessibilité</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-foreground">Performance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist exécutable */}
              <Card className="bg-card border border-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-foreground text-xl">
                    Checklist exécutable
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">{completedCount}/{checklistItems.length} complétées</span>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {/* Barre de progression */}
                  <div className="mb-4">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center p-4 bg-card rounded-lg border border-border hover:border-neutral-300 transition-colors">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                        className="mr-4"
                      />
                      <span className={`text-sm flex-1 transition-all duration-300 ${item.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                        }`}>
                        {item.text}
                      </span>
                      {item.completed && (
                        <CheckCircle className="h-5 w-5 text-primary ml-2" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Section Preuves */}
        {activeTab === 'Preuves' && (
          <div className="mt-8">
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-normal text-foreground">Cartes métriques détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                  {/* Carte Schema.org */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gpt-5') && (
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground text-lg font-medium">Schema.org</h3>
                        <span className="text-sm font-bold text-blue-600">
                          {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.donnees_score || 0}/100
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-blue-100 rounded-full mb-4">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{
                            width: `${(report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.donnees_score || 0)}%`
                          }}
                        ></div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Pourquoi :</p>
                          <p className="text-sm text-muted-foreground">LLM indexent mieux les entités.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Gain attendu :</p>
                          <p className="text-sm text-muted-foreground">+10-15 pts visibilité.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Action :</p>
                          <p className="text-sm text-muted-foreground">
                            {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.plan_action_geo?.[2] ||
                              "Ajouter @type: SoftwareApplication en JSON-LD."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Carte HTML sémantique */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gpt-5') && (
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground text-lg font-medium">HTML sémantique</h3>
                        <span className="text-sm font-bold text-blue-600">
                          {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.html_score || 0}/100
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-blue-100 rounded-full mb-4">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{
                            width: `${(report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.html_score || 0)}%`
                          }}
                        ></div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Pourquoi :</p>
                          <p className="text-sm text-muted-foreground">Structure claire pour les crawlers.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Gain attendu :</p>
                          <p className="text-sm text-muted-foreground">+5-8 pts compréhension.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Action :</p>
                          <p className="text-sm text-muted-foreground">
                            {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.plan_action_geo?.[1] ||
                              "Normaliser H1/H2 + sections."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Carte Métadonnées */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gpt-5') && (
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground text-lg font-medium">Métadonnées</h3>
                        <span className="text-sm font-bold text-blue-600">
                          {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.meta_score || 0}/100
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-blue-100 rounded-full mb-4">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{
                            width: `${(report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.meta_score || 0)}%`
                          }}
                        ></div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Pourquoi :</p>
                          <p className="text-sm text-muted-foreground">Informations riches pour LLM.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Gain attendu :</p>
                          <p className="text-sm text-muted-foreground">+3-5 pts précision.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Action :</p>
                          <p className="text-sm text-muted-foreground">
                            {report.analyses.find(a => a.llm_name === 'gpt-4o')?.modules?.audit_geo?.plan_action_geo?.[3] ||
                              "Enrichir descriptions + OpenGraph."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Carte Contenu */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gpt-5') && (
                    <div className="bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-foreground text-lg font-medium">Contenu</h3>
                        <span className="text-sm font-bold text-blue-600">
                          {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.contenu_score || 0}/100
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-blue-100 rounded-full mb-4">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{
                            width: `${(report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.contenu_score || 0)}%`
                          }}
                        ></div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Pourquoi :</p>
                          <p className="text-sm text-muted-foreground">Qualité et pertinence du contenu.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Gain attendu :</p>
                          <p className="text-sm text-muted-foreground">+8-12 pts engagement.</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Action :</p>
                          <p className="text-sm text-muted-foreground">
                            {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.plan_action_geo?.[4] ||
                              "Améliorer la qualité du contenu."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

            {/* Sections Captures & exemples et Benchmarks concurrents */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8"> */}

              {/* Section Captures & exemples */}
              {/**
               * [COMMENTED OUT]
               * Captures & exemples section hidden per user request
               */}

              {/* Section Benchmarks concurrents */}
              {/**
               * [COMMENTED OUT]
               * Benchmarks concurrents section hidden per user request
               */}

            {/* </div> */}
          </div>
        )}

        {/* Section Détails */}
        {activeTab === 'Détails' && (
          <div className="mt-8 space-y-6">

            {/* Carte Détails des priorités */}
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-normal text-foreground">Détails des priorités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {/* Schema.org */}
                <div>
                  <div
                    className="flex items-center justify-between py-4 border-b border-border hover:bg-background cursor-pointer"
                    onClick={() => toggleExpanded('schema')}
                  >
                    <span className="font-medium text-foreground text-sm">Schema.org</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                          analysis.modules?.audit_geo?.donnees_score
                        );
                        const score = analysisWithGeoPlan?.modules?.audit_geo?.donnees_score || 0;
                        const impact = score < 30 ? 'high' : score < 60 ? 'medium' : 'low';
                        const effort = 'high'; // JSON-LD est toujours complexe

                        return (
                          <>
                            <Badge
                              variant={impact === 'high' ? 'destructive' : impact === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              Impact {impact === 'high' ? 'élevé' : impact === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Effort {effort === 'high' ? 'élevé' : effort === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                          </>
                        );
                      })()}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems.schema ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {expandedItems.schema && (
                    <div className="px-4 py-4 bg-background border-b border-border">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Responsable & Planning</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground"><strong>Owner:</strong> SEO</span>
                            <span className="text-sm text-muted-foreground"><strong>ETA:</strong> 0,5 j</span>
                            <span className="text-sm text-muted-foreground"><strong>Score actuel:</strong> {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.donnees_score
                              );
                              return `${analysisWithGeoPlan?.modules?.audit_geo?.donnees_score || 0}/100`;
                            })()}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Pages ciblées</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">/</Badge>
                            <Badge variant="outline" className="text-xs">/features</Badge>
                            <Badge variant="outline" className="text-xs">/pricing</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Action recommandée</h4>
                          <div className="bg-muted p-3 rounded-lg text-sm text-foreground mb-3">
                            {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.plan_action_geo
                              );
                              return analysisWithGeoPlan?.modules?.audit_geo?.plan_action_geo?.[2] ||
                                'Intégrer des données structurées Schema.org en JSON-LD';
                            })()}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Schema.org (depuis l'API)</h4>
                          {(() => {
                            const analyses = report?.analyses || [];
                            const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'];
                            let schemaVal: any = null;
                            for (const model of preferredModels) {
                              const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                              schemaVal = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['schema_org_json', 'schemaOrgJson', 'schema_json', 'json_ld', 'jsonld']);
                              if (schemaVal) break;
                            }
                            if (!schemaVal) {
                              for (const a of analyses) {
                                const tmp = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['schema_org_json', 'schemaOrgJson', 'schema_json', 'json_ld', 'jsonld']);
                                if (tmp) { schemaVal = tmp; break; }
                              }
                            }
                            // Pas de fallback: si absent, on affiche vide
                            const display = (LLMODashboard as any)._formatForDisplay?.(schemaVal) || (typeof schemaVal === 'string' ? schemaVal : (schemaVal ? JSON.stringify(schemaVal, null, 2) : ''));
                            const handleDownload = () => {
                              const blob = new Blob([display || ''], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'schema_org.json';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            };
                            return (
                              <div>
                                <div className="flex items-center justify-end mb-2">
                                  <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="w-3 h-3" />
                                    Télécharger (schema_org.json)
                                  </Button>
                                </div>
                                <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-md p-3 overflow-auto">
                                  {display}
                                </pre>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Balises Hn & sections */}
                <div>
                  <div
                    className="flex items-center justify-between py-4 border-b border-border hover:bg-background cursor-pointer"
                    onClick={() => toggleExpanded('balises')}
                  >
                    <span className="font-medium text-foreground text-sm">Balises Hn & sections</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                          analysis.modules?.audit_geo?.html_score
                        );
                        const score = analysisWithGeoPlan?.modules?.audit_geo?.html_score || 0;
                        const impact = score < 30 ? 'high' : score < 60 ? 'medium' : 'low';
                        const effort = 'high'; // HTML structure est complexe

                        return (
                          <>
                            <Badge
                              variant={impact === 'high' ? 'destructive' : impact === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              Impact {impact === 'high' ? 'élevé' : impact === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Effort {effort === 'high' ? 'élevé' : effort === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                          </>
                        );
                      })()}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems.balises ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {expandedItems.balises && (
                    <div className="px-4 py-4 bg-background border-b border-border">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Responsable & Planning</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground"><strong>Owner:</strong> Dev</span>
                            <span className="text-sm text-muted-foreground"><strong>ETA:</strong> 1 j</span>
                            <span className="text-sm text-muted-foreground"><strong>Score actuel:</strong> {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.html_score
                              );
                              return `${analysisWithGeoPlan?.modules?.audit_geo?.html_score || 0}/100`;
                            })()}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Pages ciblées</h4>
                          <Badge variant="outline" className="text-xs">Toutes les pages</Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Action recommandée</h4>
                          <div className="bg-muted p-3 rounded-lg text-sm text-foreground mb-3">
                            {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.plan_action_geo
                              );
                              return analysisWithGeoPlan?.modules?.audit_geo?.plan_action_geo?.[1] ||
                                'Ajouter une hiérarchie claire de titres (H1, H2, H3)';
                            })()}
                          </div>
                        </div>
                        {/* Exemples d'implémentation retirés */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Meta tags (depuis l'API)</h4>
                          {(() => {
                            const analyses = report?.analyses || [];
                            const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'];
                            let metaVal: any = null;
                            for (const model of preferredModels) {
                              const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                              metaVal = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['meta_tags_snippet', 'metaTagsSnippet', 'meta_tags']);
                              if (metaVal) break;
                            }
                            if (!metaVal) {
                              for (const a of analyses) {
                                const tmp = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['meta_tags_snippet', 'metaTagsSnippet', 'meta_tags']);
                                if (tmp) { metaVal = tmp; break; }
                              }
                            }
                            const display = (LLMODashboard as any)._formatForDisplay?.(metaVal) || (typeof metaVal === 'string' ? metaVal : (metaVal ? JSON.stringify(metaVal, null, 2) : ''));
                            const handleDownload = () => {
                              const blob = new Blob([display || ''], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'meta_tags_snippet.txt';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            };
                            return (
                              <div>
                                <div className="flex items-center justify-end mb-2">
                                  <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="w-3 h-3" />
                                    Télécharger (meta_tags_snippet.txt)
                                  </Button>
                                </div>
                                <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-md p-3 overflow-auto">
                                  {display || '— Aucun meta_tags_snippet trouvé dans les données.'}
                                </pre>
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Open Graph (depuis l'API)</h4>
                          {(() => {
                            const analyses = report?.analyses || [];
                            const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'];
                            let ogVal: any = null;
                            for (const model of preferredModels) {
                              const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                              ogVal = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['open_graph_tags', 'openGraphTags', 'og_tags']);
                              if (ogVal) break;
                            }
                            if (!ogVal) {
                              for (const a of analyses) {
                                const tmp = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['open_graph_tags', 'openGraphTags', 'og_tags']);
                                if (tmp) { ogVal = tmp; break; }
                              }
                            }
                            const display = (LLMODashboard as any)._formatForDisplay?.(ogVal) || (typeof ogVal === 'string' ? ogVal : (ogVal ? JSON.stringify(ogVal, null, 2) : ''));
                            const handleDownload = () => {
                              const blob = new Blob([display || ''], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'open_graph_tags.txt';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            };
                            return (
                              <div>
                                <div className="flex items-center justify-end mb-2">
                                  <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="w-3 h-3" />
                                    Télécharger (open_graph_tags.txt)
                                  </Button>
                                </div>
                                <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-md p-3 overflow-auto">
                                  {display || '— Aucun open_graph_tags trouvé dans les données.'}
                                </pre>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fraîcheur du contenu */}
                <div>
                  <div
                    className="flex items-center justify-between py-4 hover:bg-background cursor-pointer"
                    onClick={() => toggleExpanded('fraicheur')}
                  >
                    <span className="font-medium text-foreground text-sm">Fraîcheur du contenu</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                          analysis.modules?.audit_geo?.contenu_score
                        );
                        const score = analysisWithGeoPlan?.modules?.audit_geo?.contenu_score || 0;
                        const impact = score < 30 ? 'high' : score < 60 ? 'medium' : 'low';
                        const effort = 'high'; // Contenu est complexe

                        return (
                          <>
                            <Badge
                              variant={impact === 'high' ? 'destructive' : impact === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              Impact {impact === 'high' ? 'élevé' : impact === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Effort {effort === 'high' ? 'élevé' : effort === 'medium' ? 'moyen' : 'faible'}
                            </Badge>
                          </>
                        );
                      })()}
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems.fraicheur ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {expandedItems.fraicheur && (
                    <div className="px-4 py-4 bg-background">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Responsable & Planning</h4>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground"><strong>Owner:</strong> Content</span>
                            <span className="text-sm text-muted-foreground"><strong>ETA:</strong> Continu</span>
                            <span className="text-sm text-muted-foreground"><strong>Score actuel:</strong> {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.contenu_score
                              );
                              return `${analysisWithGeoPlan?.modules?.audit_geo?.contenu_score || 0}/100`;
                            })()}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Pages ciblées</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">/blog</Badge>
                            <Badge variant="outline" className="text-xs">/changelog</Badge>
                            <Badge variant="outline" className="text-xs">/updates</Badge>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Action recommandée</h4>
                          <div className="bg-muted p-3 rounded-lg text-sm text-foreground mb-3">
                            {(() => {
                              const analysisWithGeoPlan = report?.analyses?.find(analysis =>
                                analysis.modules?.audit_geo?.plan_action_geo
                              );
                              return analysisWithGeoPlan?.modules?.audit_geo?.plan_action_geo?.[4] ||
                                'Éviter les répétitions inutiles et améliorer la lisibilité';
                            })()}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">llms.txt (depuis l'API)</h4>
                          {(() => {
                            const analyses = report?.analyses || [];
                            const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet', 'gemini-2.5-pro', 'mixtral-3.1', 'sonar'];
                            let llmsVal: any = null;
                            for (const model of preferredModels) {
                              const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                              llmsVal = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['llms_txt_content', 'llmsTxtContent', 'llms']);
                              if (llmsVal) break;
                            }
                            if (!llmsVal) {
                              for (const a of analyses) {
                                const tmp = (LLMODashboard as any)._extractGeoValueFromAnalysis?.(a, ['llms_txt_content', 'llmsTxtContent', 'llms']);
                                if (tmp) { llmsVal = tmp; break; }
                              }
                            }
                            const display = (LLMODashboard as any)._formatForDisplay?.(llmsVal) || (typeof llmsVal === 'string' ? llmsVal : (llmsVal ? JSON.stringify(llmsVal, null, 2) : ''));
                            const handleDownload = () => {
                              const blob = new Blob([display || ''], { type: 'text/plain;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'llms.txt';
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            };
                            return (
                              <div>
                                <div className="flex items-center justify-end mb-2">
                                  <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="w-3 h-3" />
                                    Télécharger (llms.txt)
                                  </Button>
                                </div>
                                <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-md p-3 overflow-auto">
                                  {display || '— Aucun llms_txt_content trouvé dans les données.'}
                                </pre>
                              </div>
                            );
                          })()}
                        </div>
                        {/* Exemples d'implémentation retirés */}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Carte Analyses détaillées par LLM */}
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-normal text-foreground">Analyses détaillées par LLM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Section GPT */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gpt-5') && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-openai-for-light.svg"
                          alt="GPT-5"
                          className="w-8 h-8"
                        />
                        <span className="font-bold text-foreground">GPT-5</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.resume_executif_geo ||
                          "Manque de structure sémantique claire. Les balises H1/H2 ne suivent pas une hiérarchie logique. Recommande l'ajout de Schema.org pour améliorer la compréhension du contenu."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Durée: {report.analyses.find(a => a.llm_name === 'gpt-5')?.duree}s</span>
                        <span>•</span>
                        <span>Score GEO: {report.analyses.find(a => a.llm_name === 'gpt-5')?.modules?.audit_geo?.score_global_geo || 0}/100</span>
                      </div>
                    </div>
                  )}

                  {/* Section Claude */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'claude-4-sonnet') && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-claude.svg"
                          alt="Claude"
                          className="w-8 h-8"
                        />
                        <span className="font-bold text-foreground">Claude 4 Sonnet</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.analyses.find(a => a.llm_name === 'claude-4-sonnet')?.modules?.audit_geo?.resume_executif_geo ||
                          "Contenu de qualité mais présentation fragmentée. Suggère l'ajout de preuves chiffrées et de témoignages clients pour renforcer la crédibilité."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Durée: {report.analyses.find(a => a.llm_name === 'claude-4-sonnet')?.duree}s</span>
                        <span>•</span>
                        <span>Score GEO: {report.analyses.find(a => a.llm_name === 'claude-4-sonnet')?.modules?.audit_geo?.score_global_geo || 0}/100</span>
                      </div>
                    </div>
                  )}

                  {/* Section Gemini */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'gemini-2.5-pro') && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-gemini.svg"
                          alt="Gemini"
                          className="w-8 h-8"
                        />
                        <span className="font-bold text-foreground">Gemini 2.5 Pro</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.analyses.find(a => a.llm_name === 'gemini-2.5-pro')?.modules?.audit_geo?.resume_executif_geo ||
                          "Analyse technique approfondie avec focus sur l'optimisation SEO et l'accessibilité. Recommandations précises pour améliorer la visibilité."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Durée: {report.analyses.find(a => a.llm_name === 'gemini-2.5-pro')?.duree}s</span>
                        <span>•</span>
                        <span>Score GEO: {report.analyses.find(a => a.llm_name === 'gemini-2.5-pro')?.modules?.audit_geo?.score_global_geo || 0}/100</span>
                      </div>
                    </div>
                  )}

                  {/* Section Mixtral */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'mixtral-8x7b') && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/Mistral.png"
                          alt="Mistral"
                          className="w-8 h-8"
                        />
                        <span className="font-bold text-foreground">Mistral 3.1</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.analyses.find(a => a.llm_name === 'mixtral-8x7b')?.modules?.audit_geo?.resume_executif_geo ||
                          "Évaluation technique détaillée avec analyse des performances et recommandations d'optimisation pour les moteurs de recherche."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Durée: {report.analyses.find(a => a.llm_name === 'mixtral-8x7b')?.duree}s</span>
                        <span>•</span>
                        <span>Score GEO: {report.analyses.find(a => a.llm_name === 'mixtral-8x7b')?.modules?.audit_geo?.score_global_geo || 0}/100</span>
                      </div>
                    </div>
                  )}

                  {/* Section Sonar */}
                  {report && report.analyses && report.analyses.find(a => a.llm_name === 'sonar') && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/prompt-model-perplexity.svg"
                          alt="Perplexity"
                          className="w-8 h-8"
                        />
                        <span className="font-bold text-foreground">Perplexity Sonar</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {report.analyses.find(a => a.llm_name === 'sonar')?.modules?.audit_geo?.resume_executif_geo ||
                          "Analyse complète avec focus sur la qualité du contenu et l'optimisation pour les moteurs génératifs. Recommandations stratégiques."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Durée: {report.analyses.find(a => a.llm_name === 'sonar')?.duree}s</span>
                        <span>•</span>
                        <span>Score GEO: {report.analyses.find(a => a.llm_name === 'sonar')?.modules?.audit_geo?.score_global_geo || 0}/100</span>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Section Action */}
        {activeTab === 'Action' && (
          <div className="mt-8 space-y-6">

            {/* Checklist exécutable - en premier */}
            <Card className="bg-card border border-border shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-foreground text-xl">
                  Checklist exécutable
                </CardTitle>
                <span className="text-sm text-muted-foreground">{completedCount}/{checklistItems.length} complétées</span>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center p-4 bg-card rounded-lg border border-border hover:border-neutral-300 transition-colors">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="mr-4"
                    />
                    <span className={`text-sm flex-1 transition-all duration-300 ${item.completed
                        ? 'line-through text-muted-foreground'
                        : 'text-foreground'
                      }`}>
                      {item.text}
                    </span>
                    {item.completed && (
                      <CheckCircle className="h-5 w-5 text-primary ml-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>


            {/* Planning de déploiement et Métriques de suivi seront placés tout en bas */}

            {/* Guide d'implémentation GEO */}
            <Card className="bg-card border border-border shadow-lg">
              {/* <CardHeader>
                <CardTitle className="text-xl font-normal text-foreground">Guide d'implémentation (GEO)</CardTitle>
              </CardHeader> */}
              <CardContent>
                {(() => {
                  // Prioriser l'analyse Claude-4-Sonnet, puis claude-4-sonnet, sinon fallback sur la première disponible
                  const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet'];
                  const analyses = report?.analyses || [];

                  try {
                   //console.log('[LLMO][Action] Modèles présents:', analyses.map(a => (a as any)?.llm_name || (a as any)?.['llm_utilisé']));
                  } catch { }

                  // essaie d'abord les modèles préférés
                  let extracted: { guide: any, source: string } | null = null;
                  for (const model of preferredModels) {
                   //console.log('[LLMO][Action] Essai modèle préféré:', model);
                    const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                    extracted = (LLMODashboard as any)._extractGuideFromAnalysis?.(a);
                    if (extracted) break;
                  }
                  // sinon, essaie n'importe quelle analyse
                  if (!extracted) {
                   //console.log('[LLMO][Action] Aucun guide via préférés, test de toutes les analyses');
                    for (const a of analyses) {
                      const tmp = (LLMODashboard as any)._extractGuideFromAnalysis?.(a);
                      if (tmp) { extracted = tmp; break; }
                    }
                  }

                  if (!extracted) {
                   //console.log('[LLMO][Action] Aucun guide trouvé après exploration complète.');
                    return (
                      <div className="text-sm text-muted-foreground">
                        Aucun guide d'implémentation trouvé dans le paquet GEO.
                      </div>
                    );
                  }

                  const { guide, source } = extracted;
                  const formatGuideObject = (obj: any): string => {
                    if (!obj || typeof obj !== 'object') return '';
                    try {
                      const titre = obj.titre || obj.title || 'Guide d\'Implémentation (GEO)';
                      const version = obj.version ? `Version: ${obj.version}` : '';
                      const scoreActuel = obj.score_geo_actuel != null ? `Score GEO Actuel: ${obj.score_geo_actuel}` : '';
                      const scoreCible = obj.score_geo_cible != null ? `Score GEO Cible: ${obj.score_geo_cible}` : '';

                      let out: string[] = [];
                      out.push(`# ${titre}`);
                      if (version) out.push(version);
                      if (scoreActuel) out.push(scoreActuel);
                      if (scoreCible) out.push(scoreCible);

                      // Étapes d'implémentation
                      const steps = obj.etapes_implementation || obj.etapes || obj.steps;
                      if (steps && typeof steps === 'object') {
                        out.push('');
                        out.push('## Étapes d\'Implémentation');
                        const stepKeys = Object.keys(steps);
                       //console.log('[LLMO][Action] etapes_implementation keys:', stepKeys);
                        for (const key of stepKeys) {
                          const step = steps[key] || {};
                          const stitre = step.titre || step.title || key;
                          out.push(`### ${stitre}`);
                          if (step.description) out.push(step.description);
                          if (Array.isArray(step.actions)) {
                            out.push('Actions:');
                            for (const a of step.actions) out.push(`- ${a}`);
                          }
                          if (step.duree_estimee) out.push(`Durée Estimée: ${step.duree_estimee}`);
                          if (step.priorite) out.push(`Priorité: ${step.priorite}`);
                          if (Array.isArray(step.verification)) {
                            out.push('Vérification:');
                            for (const v of step.verification) out.push(`- ${v}`);
                          }
                          if (step.impact_geo) out.push(`Impact GEO: ${step.impact_geo}`);
                          if (Array.isArray(step.outils_recommandes)) {
                            out.push('Outils Recommandés:');
                            for (const o of step.outils_recommandes) out.push(`- ${o}`);
                          }
                          out.push('');
                        }
                      }

                      // Fichiers fournis
                      const files = obj.fichiers_fournis || obj.files || obj.assets;
                      if (files && typeof files === 'object') {
                        out.push('## Fichiers Fournis');
                        const fileKeys = Object.keys(files);
                       //console.log('[LLMO][Action] fichiers_fournis keys:', fileKeys);
                        for (const fkey of fileKeys) {
                          const f = files[fkey] || {};
                          out.push(`### ${fkey.replace(/_/g, ' ').toUpperCase()}`);
                          if (f.description) out.push(`Description: ${f.description}`);
                          if (f.localisation) out.push(`Localisation: ${f.localisation}`);
                          if (f.impact) out.push(`Impact: ${f.impact}`);
                          out.push('');
                        }
                      }

                      // Monitoring
                      const mon = obj.monitoring_performance || obj.monitoring || obj.kpi;
                      if (mon && typeof mon === 'object') {
                        out.push('## Monitoring Performance');
                        if (Array.isArray(mon.kpi_a_suivre)) {
                          out.push('KPI à Suivre:');
                          for (const k of mon.kpi_a_suivre) out.push(`- ${k}`);
                        }
                        if (Array.isArray(mon.outils_monitoring)) {
                          out.push('Outils Monitoring:');
                          for (const m of mon.outils_monitoring) out.push(`- ${m}`);
                        }
                        if (mon.frequence_controle) out.push(`Fréquence de Contrôle: ${mon.frequence_controle}`);
                        out.push('');
                      }

                      // Support / Contact
                      const sup = obj.support_contact || obj.support || obj.contact;
                      if (sup && typeof sup === 'object') {
                        out.push('## Support & Contact');
                        if (sup.documentation) out.push(`Documentation: ${sup.documentation}`);
                        if (sup.support_technique) out.push(`Support Technique: ${sup.support_technique}`);
                        if (sup.updates) out.push(`Mises à Jour: ${sup.updates}`);
                        out.push('');
                      }

                      return out.join('\n').trim();
                    } catch (e) {
                     //console.log('[LLMO][Action] Erreur formatage implementation_guide, fallback JSON', e);
                      return JSON.stringify(obj, null, 2);
                    }
                  };

                  const renderGuide = (value: any): string => {
                    if (value == null) return '';
                    if (typeof value === 'string') return value;
                    if (Array.isArray(value)) return value.map(v => (typeof v === 'string' ? v : JSON.stringify(v, null, 2))).join('\n');
                    return formatGuideObject(value);
                  };

                  try {
                    const t = typeof guide;
                    const len = t === 'string' ? (guide as string).length : Array.isArray(guide) ? guide.length : Object.keys(guide || {}).length;
                   //console.log('[LLMO][Action] Guide extrait depuis', source, '| type:', t, '| taille:', len);
                  } catch { }

                  // Si guide est un objet, on rend une UI structurée type "Détails des priorités"
                  if (guide && typeof guide === 'object' && !Array.isArray(guide)) {
                    const g: any = guide as any;
                    const titre = g.titre || g.title || 'Guide d\'Implémentation (GEO)';
                    const version = g.version;
                    const scoreActuel = g.score_geo_actuel;
                    const scoreCible = g.score_geo_cible;
                    const steps = g.etapes_implementation || g.etapes || g.steps || {};
                    const files = g.fichiers_fournis || g.files || g.assets || {};
                    const mon = g.monitoring_performance || g.monitoring || g.kpi || {};
                    const sup = g.support_contact || g.support || g.contact || {};

                    const stepKeys = Object.keys(steps);
                    const fileKeys = Object.keys(files);

                    return (
                      <div className="space-y-4">
                        {/* Titre et Scores */}
                        <div className="flex items-center justify-between flex-wrap gap-2 mt-3 mb-4 pt-1 pb-2 border-b border-border">
                          <div className="text-lg font-semibold text-foreground">{titre}</div>
                          <div className="flex items-center gap-2">
                            {scoreActuel != null ? <Badge variant="outline" className="text-xs">Actuel {scoreActuel}/100</Badge> : null}
                            {scoreCible != null ? <Badge variant="outline" className="text-xs">Cible {scoreCible}/100</Badge> : null}
                          </div>
                        </div>

                        {/* Étapes d'implémentation */}
                        <div className="mt-3">
                          <div
                            className="flex items-center justify-between py-3 border-b border-border hover:bg-background cursor-pointer"
                            onClick={() => toggleExpanded('guide_steps')}
                          >
                            <span className="font-medium text-foreground text-sm">Étapes d'Implémentation ({stepKeys.length})</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems['guide_steps'] ? 'rotate-180' : ''}`} />
                          </div>
                          {expandedItems['guide_steps'] && (
                            <div className="px-4 py-3 bg-background border-b border-border space-y-2">
                              {stepKeys.length === 0 && (
                                <div className="text-sm text-muted-foreground">Aucune étape fournie.</div>
                              )}
                              {stepKeys.map((key) => {
                                const step = steps[key] || {};
                                const stitre = step.titre || step.title || key;
                                const itemKey = `guide_step_${key}`;
                                // Mapping couleurs + badges (aligné sur Planning de déploiement)
                                const colorMap = (k: string) => {
                                  if (k.includes('1_preparation')) return { box: 'border-blue-200', header: 'hover:bg-muted/50', badge: 'bg-muted text-muted-foreground', week: 'Semaine 1', owner: 'SEO + Dev' };
                                  if (k.includes('2_fichiers')) return { box: 'border-purple-200', header: 'hover:bg-muted/50', badge: 'bg-muted text-muted-foreground', week: 'Semaine 2', owner: 'Dev' };
                                  if (k.includes('3_html')) return { box: 'border-blue-200', header: 'hover:bg-muted/50', badge: 'bg-muted text-muted-foreground', week: 'Semaine 1', owner: 'Dev' };
                                  if (k.includes('4_validation')) return { box: 'border-green-200', header: 'hover:bg-muted/50', badge: 'bg-muted text-muted-foreground', week: 'Semaine 3-4', owner: 'Marketing' };
                                  return { box: 'border-border', header: 'hover:bg-background', badge: 'bg-muted text-foreground', week: 'Semaine', owner: 'Equipe' };
                                };
                                const cm = colorMap(key);
                                return (
                                  <div key={key} className={`bg-card rounded-lg border ${cm.box}`}>
                                    <div
                                      className={`flex items-center justify-between py-3 px-3 ${cm.header} cursor-pointer`}
                                      onClick={() => toggleExpanded(itemKey)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground text-sm">{stitre}</span>
                                      </div>
                                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems[itemKey] ? 'rotate-180' : ''}`} />
                                    </div>
                                    {expandedItems[itemKey] && (
                                      <div className="px-4 py-3 space-y-2">
                                        {step.description && (
                                          <div className="text-sm text-foreground">{step.description}</div>
                                        )}
                                        {Array.isArray(step.actions) && step.actions.length > 0 && (
                                          <div>
                                            <div className="text-xs font-semibold text-muted-foreground mb-1">Actions</div>
                                            <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                              {step.actions.map((a: string, i: number) => (<li key={i}>{a}</li>))}
                                            </ul>
                                          </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-foreground">
                                          {step.duree_estimee && (<div className="bg-muted rounded px-2 py-1">Durée: {step.duree_estimee}</div>)}
                                          {step.priorite && (<div className="bg-muted rounded px-2 py-1">Priorité: {step.priorite}</div>)}
                                          {step.impact_geo && (<div className="bg-muted rounded px-2 py-1">Impact: {step.impact_geo}</div>)}
                                        </div>
                                        {Array.isArray(step.verification) && step.verification.length > 0 && (
                                          <div>
                                            <div className="text-xs font-semibold text-muted-foreground mb-1">Vérification</div>
                                            <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                              {step.verification.map((v: string, i: number) => (<li key={i}>{v}</li>))}
                                            </ul>
                                          </div>
                                        )}
                                        {Array.isArray(step.outils_recommandes) && step.outils_recommandes.length > 0 && (
                                          <div>
                                            <div className="text-xs font-semibold text-muted-foreground mb-1">Outils Recommandés</div>
                                            <ul className="list-disc pl-5 text-sm text-foreground space-y-1">
                                              {step.outils_recommandes.map((o: string, i: number) => (<li key={i}>{o}</li>))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Fichiers fournis */}
                        <div>
                          <div
                            className="flex items-center justify-between py-3 border-b border-border hover:bg-background cursor-pointer"
                            onClick={() => toggleExpanded('guide_files')}
                          >
                            <span className="font-medium text-foreground text-sm">Fichiers Fournis ({fileKeys.length})</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems['guide_files'] ? 'rotate-180' : ''}`} />
                          </div>
                          {expandedItems['guide_files'] && (
                            <div className="px-4 py-3 bg-background border-b border-border space-y-2">
                              {fileKeys.length === 0 && (
                                <div className="text-sm text-muted-foreground">Aucun fichier fourni.</div>
                              )}
                              {fileKeys.map((key) => {
                                const f = files[key] || {};
                                return (
                                  <div key={key} className="bg-card rounded-lg border border-border p-3">
                                    <div className="font-medium text-foreground text-sm mb-1">{key.replace(/_/g, ' ').toUpperCase()}</div>
                                    <div className="text-sm text-foreground space-y-1">
                                      {f.description && (<div>Description: {f.description}</div>)}
                                      {f.localisation && (<div>Localisation: {f.localisation}</div>)}
                                      {f.impact && (<div>Impact: {f.impact}</div>)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Monitoring Performance */}
                        <div>
                          <div
                            className="flex items-center justify-between py-3 border-b border-border hover:bg-background cursor-pointer"
                            onClick={() => toggleExpanded('guide_monitoring')}
                          >
                            <span className="font-medium text-foreground text-sm">Monitoring Performance</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems['guide_monitoring'] ? 'rotate-180' : ''}`} />
                          </div>
                          {expandedItems['guide_monitoring'] && (
                            <div className="px-4 py-3 bg-background border-b border-border space-y-2 text-sm text-foreground">
                              {Array.isArray(mon.kpi_a_suivre) && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">KPI à Suivre</div>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {mon.kpi_a_suivre.map((k: string, i: number) => (<li key={i}>{k}</li>))}
                                  </ul>
                                </div>
                              )}
                              {Array.isArray(mon.outils_monitoring) && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-1">Outils Monitoring</div>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {mon.outils_monitoring.map((m: string, i: number) => (<li key={i}>{m}</li>))}
                                  </ul>
                                </div>
                              )}
                              {mon.frequence_controle && (
                                <div className="bg-muted rounded px-2 py-1 inline-block text-xs">Fréquence: {mon.frequence_controle}</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Support & Contact */}
                        <div>
                          <div
                            className="flex items-center justify-between py-3 border-b border-border hover:bg-background cursor-pointer"
                            onClick={() => toggleExpanded('guide_support')}
                          >
                            <span className="font-medium text-foreground text-sm">Support & Contact</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedItems['guide_support'] ? 'rotate-180' : ''}`} />
                          </div>
                          {expandedItems['guide_support'] && (
                            <div className="px-4 py-3 bg-background border-b border-border space-y-2 text-sm text-foreground">
                              {sup.documentation && (<div>Documentation: {sup.documentation}</div>)}
                              {sup.support_technique && (<div>Support Technique: {sup.support_technique}</div>)}
                              {sup.updates && (<div>Mises à Jour: {sup.updates}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Fallback: rendu textuel formaté
                  return (
                    <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-md p-3 overflow-auto">
                      {renderGuide(guide)}
                    </pre>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Planning de déploiement et Métriques de suivi (tout en bas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Planning de déploiement (remplacé par informations générales d'impact) */}
              <Card className="bg-card border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-normal text-foreground">Impact - Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    // Récupérer directement performance_impact du module GEO
                    const analyses = report?.analyses || [];
                    const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet'];
                    let perf: any | null = null;
                    for (const model of preferredModels) {
                      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                      perf = (LLMODashboard as any)._extractPerformanceFromAnalysis?.(a);
                      if (perf) break;
                    }
                    if (!perf) {
                      for (const a of analyses) {
                        const tmp = (LLMODashboard as any)._extractPerformanceFromAnalysis?.(a);
                        if (tmp) { perf = tmp; break; }
                      }
                    }
                    const temps = perf?.temps_implementation || '—';
                    const roi = perf?.retour_investissement || '—';
                    const maintenance = perf?.maintenance_requise || '—';
                    return (
                      <>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-blue-200">
                          <div>
                            <h4 className="font-semibold text-foreground">Temps d'implémentation</h4>
                            <p className="text-sm text-muted-foreground">Durée estimée pour appliquer le package</p>
                          </div>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">{temps}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-purple-200">
                          <div>
                            <h4 className="font-semibold text-foreground">Retour sur investissement</h4>
                            <p className="text-sm text-muted-foreground">Délai pour percevoir les bénéfices</p>
                          </div>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">{roi}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-green-200">
                          <div>
                            <h4 className="font-semibold text-foreground">Maintenance requise</h4>
                            <p className="text-sm text-muted-foreground">Effort de maintien recommandé</p>
                          </div>
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">{maintenance}</Badge>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
              {/* Métriques de suivi (remplacé par amélioration estimée par axe) */}
              <Card className="bg-card border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-normal text-foreground">Impact - Améliorations estimées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const analyses = report?.analyses || [];
                    const preferredModels = ['gpt-5', 'gpt-4o', 'claude-4-sonnet', 'claude-4-sonnet'];
                    let perf: any | null = null;
                    for (const model of preferredModels) {
                      const a = analyses.find(x => (x as any).llm_name === model || (x as any)['llm_utilisé'] === model);
                      perf = (LLMODashboard as any)._extractPerformanceFromAnalysis?.(a);
                      if (perf) break;
                    }
                    if (!perf) {
                      for (const a of analyses) {
                        const tmp = (LLMODashboard as any)._extractPerformanceFromAnalysis?.(a);
                        if (tmp) { perf = tmp; break; }
                      }
                    }
                    const rows = [
                      { label: 'Visibilité moteurs génératifs', data: perf?.visibilite_moteurs_generatifs },
                      { label: 'Indexation IA', data: perf?.indexation_ia },
                      { label: 'Compréhension du contenu', data: perf?.comprehension_contenu },
                      { label: 'Autorité sémantique', data: perf?.autorite_semantique },
                    ];
                    return (
                      <div className="space-y-3">
                        {rows.map((row, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                            <div>
                              <h4 className="font-semibold text-foreground">{row.label}</h4>
                              <p className="text-sm text-muted-foreground">{row.data?.description || '—'}</p>
                            </div>
                            <Badge variant="secondary" className="bg-muted text-foreground">
                              {row.data?.amelioration_estimee || '—'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>


          </div>
        )}




      </div>
    </div>
  );
};

export default LLMODashboard;
