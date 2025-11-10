// 🧪 Test avec les données réelles de votre API

// Données réelles de votre API
const realApiData = {
    "analysis_id": 15,
    "url": "https://alan.com",
    "title": "Alan - Votre partenaire santé qui prévient, assure et accompagne au quotidien",
    "description": "Alan permet à chacun d'agir sur sa santé physique et mentale, en alliant le meilleur de la prévention et de l'assurance, le tout au sein d'une expérience unique.",
    "competitors": [
        {
            "name": "Groupama",
            "url": "https://www.groupama.fr",
            "urls": ["https://www.groupama.fr"],
            "average_score": 0.8,
            "mentions": 1,
            "sources": ["gpt-4o"],
            "score_details": {}
        },
        {
            "name": "Generali",
            "url": "https://www.generali.fr/",
            "urls": ["https://www.generali.fr/"],
            "average_score": 0.65,
            "mentions": 1,
            "sources": ["gemini-pro"],
            "score_details": {}
        },
        {
            "name": "SwissLife France",
            "url": "https://www.swisslife.fr",
            "urls": ["https://www.swisslife.fr"],
            "average_score": 0.85,
            "mentions": 1,
            "sources": ["gpt-4o"],
            "score_details": {}
        },
        {
            "name": "Insify",
            "url": "https://www.insify.fr",
            "urls": ["https://www.insify.fr"],
            "average_score": 0.9,
            "mentions": 1,
            "sources": ["sonar"],
            "score_details": {}
        },
        {
            "name": "Malakoff Humanis",
            "url": "https://www.malakoffhumanis.com",
            "urls": ["https://www.malakoffhumanis.com/", "https://www.malakoffhumanis.com"],
            "average_score": 0.86,
            "mentions": 2,
            "sources": ["gemini-pro", "gpt-4o", "sonar"],
            "score_details": {}
        },
        {
            "name": "MGEN",
            "url": "https://www.mgen.fr",
            "urls": ["https://www.mgen.fr"],
            "average_score": 0.75,
            "mentions": 1,
            "sources": ["sonar", "gpt-4o", "mixtral-8x7b"],
            "score_details": {}
        },
        {
            "name": "Stello",
            "url": "https://www.stello.fr",
            "urls": ["https://www.stello.fr"],
            "average_score": 0.85,
            "mentions": 1,
            "sources": ["sonar"],
            "score_details": {}
        },
        {
            "name": "Acheel",
            "url": "https://www.acheel.fr",
            "urls": ["https://www.acheel.fr"],
            "average_score": 0.8,
            "mentions": 1,
            "sources": ["sonar"],
            "score_details": {}
        },
        {
            "name": "Harmonie Mutuelle",
            "url": "https://www.harmonie-mutuelle.fr",
            "urls": ["https://www.harmonie-mutuelle.fr", "https://www.harmoniemutuelle.fr/"],
            "average_score": 0.79,
            "mentions": 3,
            "sources": ["gemini-pro", "gpt-4o", "sonar"],
            "score_details": {}
        },
        {
            "name": "April",
            "url": "https://www.april.fr",
            "urls": ["https://www.april.fr", "https://www.april.fr/"],
            "average_score": 0.76,
            "mentions": 2,
            "sources": ["gemini-pro", "gpt-4o"],
            "score_details": {}
        },
        {
            "name": "Axa",
            "url": "https://www.axa.fr/",
            "urls": ["https://www.axa.fr/"],
            "average_score": 0.75,
            "mentions": 1,
            "sources": ["gemini-pro"],
            "score_details": {}
        }
    ],
    "stats": {
        "total_mentions": 15,
        "unique_competitors": 11,
        "models_used": ["gpt-4o", "claude-3-sonnet", "gemini-pro", "mixtral-8x7b", "sonar"]
    },
    "created_at": "2025-08-18T23:07:23.053832"
};

// Test de mapping des données
function testRealDataMapping() {
   //console.log('🧪 Test du mapping avec les données réelles de votre API');
   //console.log('📊 Données d\'entrée:', realApiData);
    
    // Simuler le mapping (vous pouvez copier la logique de mapApiAnalysisToResult ici pour tester)
    const mappedData = {
        id: `comp_${realApiData.analysis_id}`,
        timestamp: realApiData.created_at,
        userSite: {
            url: realApiData.url,
            domain: 'alan.com',
            report: {
                url: realApiData.url,
                total_score: 75, // Score estimé pour Alan
                grade: "Bien optimisé",
                credibility_authority: { score: 20 },
                structure_readability: { score: 18 },
                contextual_relevance: { score: 20 },
                technical_compatibility: { score: 13 }
            }
        },
        competitors: realApiData.competitors.map(comp => ({
            url: comp.url,
            domain: comp.url.replace('https://', '').replace('www.', '').split('/')[0],
            report: {
                url: comp.url,
                total_score: Math.round(comp.average_score * 100),
                grade: comp.average_score >= 0.8 ? "Très bien optimisé" : "Bien optimisé",
                credibility_authority: { score: Math.round(comp.average_score * 20) },
                structure_readability: { score: Math.round(comp.average_score * 20) },
                contextual_relevance: { score: Math.round(comp.average_score * 20) },
                technical_compatibility: { score: Math.round(comp.average_score * 20) }
            }
        })),
        summary: {
            userRank: 7, // Position estimée d'Alan parmi les concurrents
            totalAnalyzed: realApiData.competitors.length + 1,
            strengthsVsCompetitors: [
                "Présence dans l'écosystème santé/assurance",
                "Positionnement concurrentiel analysé par IA"
            ],
            weaknessesVsCompetitors: [
                "Écart de 15 points avec le leader Insify",
                "7 concurrents ont un meilleur score LLMO"
            ],
            opportunitiesIdentified: [
                `Optimisation pour ${realApiData.stats.models_used.length} modèles d'IA différents`,
                "Benchmark des leaders: insify.fr, malakoffhumanis.com, swisslife.fr",
                "Amélioration du positionnement dans les réponses d'IA"
            ]
        }
    };
    
   //console.log('✅ Données mappées:', mappedData);
    
    // Vérifications
   //console.log('🔍 Vérifications:');
   //console.log(`- ID: ${mappedData.id}`);
   //console.log(`- URL utilisateur: ${mappedData.userSite.url}`);
   //console.log(`- Nombre de concurrents: ${mappedData.competitors.length}`);
   //console.log(`- Score utilisateur: ${mappedData.userSite.report.total_score}`);
   //console.log(`- Rang: ${mappedData.summary.userRank}/${mappedData.summary.totalAnalyzed}`);
    
    // Top 3 concurrents
    const top3 = mappedData.competitors
        .sort((a, b) => b.report.total_score - a.report.total_score)
        .slice(0, 3);
    
   //console.log('🏆 Top 3 concurrents:');
    top3.forEach((comp, idx) => {
       //console.log(`${idx + 1}. ${comp.domain} - ${comp.report.total_score}/100`);
    });
    
    return mappedData;
}

// Test de l'affichage des concurrents
function testCompetitorDisplay() {
   //console.log('🎨 Test de l\'affichage des concurrents');
    
    realApiData.competitors.forEach((comp, idx) => {
        const score = Math.round(comp.average_score * 100);
        const grade = score >= 90 ? "Excellemment optimisé" :
                     score >= 80 ? "Très bien optimisé" :
                     score >= 70 ? "Bien optimisé" :
                     score >= 60 ? "Moyennement optimisé" : "Peu optimisé";
        
       //console.log(`${idx + 1}. ${comp.name}`);
       //console.log(`   URL: ${comp.url}`);
       //console.log(`   Score: ${score}/100 (${grade})`);
       //console.log(`   Sources: ${comp.sources.join(', ')}`);
       //console.log(`   Mentions: ${comp.mentions}`);
       //console.log('');
    });
}

// Test des statistiques
function testStatsDisplay() {
   //console.log('📊 Test de l\'affichage des statistiques');
   //console.log(`- Total mentions: ${realApiData.stats.total_mentions}`);
   //console.log(`- Concurrents uniques: ${realApiData.stats.unique_competitors}`);
   //console.log(`- Modèles utilisés: ${realApiData.stats.models_used.join(', ')}`);
   //console.log(`- Date d'analyse: ${new Date(realApiData.created_at).toLocaleString('fr-FR')}`);
}

// Exporter les fonctions pour utilisation dans la console
window.testRealAPI = {
    testRealDataMapping,
    testCompetitorDisplay,
    testStatsDisplay,
    realApiData
};

console.log('🧪 Tests avec données réelles chargés ! Utilisez:');
console.log('- testRealAPI.testRealDataMapping() pour tester le mapping');
console.log('- testRealAPI.testCompetitorDisplay() pour voir les concurrents');
console.log('- testRealAPI.testStatsDisplay() pour voir les statistiques');
console.log('- testRealAPI.realApiData pour voir les données brutes');
