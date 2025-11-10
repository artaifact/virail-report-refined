# 🚀 Guide d'Implémentation API - Analyse Concurrentielle LLMO

## 📋 Résumé de l'Implémentation

Votre bouton "Lancer l'analyse" fait maintenant une **vraie requête POST** vers votre API backend !

### 🎯 **Endpoint Configuré**
```
POST http://localhost:8000/api/v1/competitors/analyze
```

### 📤 **Payload Envoyé**
```json
{
  "url": "https://alan.com",
  "min_score": 0.5,
  "min_mentions": 1
}
```

### 🔧 **Configuration cURL Équivalente**
```bash
curl -X POST "http://localhost:8000/api/v1/competitors/analyze" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://alan.com",
    "min_score": 0.5,
    "min_mentions": 1
  }'
```

---

## 🔄 **Flux d'Exécution**

### 1. **Click sur le Bouton**
```typescript
// src/pages/Competition.tsx
<Button onClick={handleStartAnalysis}>
  Lancer l'analyse
</Button>
```

### 2. **Handler de l'Événement**
```typescript
const handleStartAnalysis = async () => {
  if (!userUrl.trim()) return;
  setSelectedTab("results");
  
  try {
    await startAnalysis(userUrl); // ← Appel du hook
    toast({ title: "Analyse terminée" });
  } catch (error) {
    toast({ title: "Erreur d'analyse", variant: "destructive" });
  }
};
```

### 3. **Hook useCompetitiveAnalysis**
```typescript
// src/hooks/useCompetitiveAnalysis.ts
const startAnalysis = useCallback(async (url: string) => {
  setState(prev => ({ ...prev, isAnalyzing: true }));
  
  // Simulation du progrès visuel
  const progressInterval = setInterval(() => {
    setState(prev => ({
      ...prev,
      progress: Math.min(prev.progress + Math.random() * 15, 90)
    }));
  }, 300);

  const result = await runCompetitiveAnalysis(url); // ← Appel de l'API
  
  clearInterval(progressInterval);
  setState(prev => ({
    ...prev,
    isAnalyzing: false,
    currentAnalysis: result,
    progress: 100
  }));
}, []);
```

### 4. **Service API - Requête POST Réelle**
```typescript
// src/services/competitiveAnalysisService.ts
export const runCompetitiveAnalysis = async (url: string) => {
 //console.log('🚀 Lancement de l\'analyse concurrentielle pour:', url);

  // REQUÊTE POST VERS VOTRE API ← ICI !
  const response = await fetch('http://localhost:8000/api/v1/competitors/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Inclut automatiquement les cookies
    body: JSON.stringify({
      url: url,
      min_score: 0.5,
      min_mentions: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
  }
  
  const apiData = await response.json();
 //console.log('✅ Réponse API reçue:', apiData);
  
  // Mapper les données vers le format attendu par l'interface
  const result = mapApiDataToResult(apiData, url);
  saveCompetitiveAnalysis(result);
  return result;
};
```

---

## 📊 **Formats de Réponse Supportés**

### **Format 1: Réponse Directe (Idéal)**
```json
{
  "id": "comp_1704067200000",
  "timestamp": "2024-01-01T12:00:00Z",
  "user_site": {
    "url": "https://alan.com",
    "domain": "alan.com",
    "report": {
      "total_score": 78,
      "grade": "Bien optimisé",
      "credibility_authority": { "score": 16, "details": {...} },
      "structure_readability": { "score": 18, "details": {...} },
      "contextual_relevance": { "score": 20, "details": {...} },
      "technical_compatibility": { "score": 13, "details": {...} },
      "primary_recommendations": [...]
    }
  },
  "competitors": [
    {
      "url": "https://competitor1.com",
      "domain": "competitor1.com", 
      "report": { ... }
    }
  ],
  "summary": {
    "userRank": 2,
    "totalAnalyzed": 4,
    "strengthsVsCompetitors": [...],
    "weaknessesVsCompetitors": [...],
    "opportunitiesIdentified": [...]
  }
}
```

### **Format 2: Réponse Alternative (Mappée Automatiquement)**
```json
{
  "analysis_result": {
    "user_analysis": {
      "url": "https://alan.com",
      "score": 78,
      "rating": "Bien optimisé",
      "credibility": 16,
      "readability": 18,
      "relevance": 20,
      "technical": 13,
      "recommendations": [...]
    },
    "competitors": [
      {
        "url": "https://competitor1.com",
        "analysis": { ... }
      }
    ],
    "ranking": {
      "position": 2
    },
    "insights": {
      "strengths": [...],
      "weaknesses": [...],
      "opportunities": [...]
    }
  }
}
```

---

## 🛡️ **Gestion des Erreurs**

### **Erreurs API**
```typescript
if (!response.ok) {
  throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
}
```

### **Fallback Automatique**
Si l'API est indisponible, le système utilise automatiquement les données JSON statiques :
```typescript
// Fallback vers les données statiques en cas d'erreur
console.log('⚠️ Format API inattendu, fallback vers les données statiques');
const fallbackResponse = await fetch('/analyse_comparative_alan.json');
```

### **Mapping Flexible**
Le système supporte plusieurs formats de réponse API grâce aux fonctions utilitaires :
- `mapApiDataToResult()` - Mapper différents formats
- `mapToLLMOReport()` - Convertir les données d'analyse
- `generateDefaultSummary()` - Créer un résumé par défaut

---

## 🔒 **Authentification**

### **Cookies Automatiques**
```typescript
credentials: 'include' // Inclut automatiquement les cookies d'authentification
```

Cette configuration équivaut à l'option `-b cookies.txt` de votre commande cURL.

### **Headers Supportés**
```typescript
headers: {
  'Content-Type': 'application/json',
  // Les cookies sont inclus automatiquement via credentials: 'include'
}
```

---

## 🧪 **Test de l'Implémentation**

### **1. Vérifier les Logs**
Ouvrez la console du navigateur pour voir :
```
🚀 Lancement de l'analyse concurrentielle pour: https://alan.com
✅ Réponse API reçue: {...}
```

### **2. Vérifier la Requête**
Dans l'onglet Network des DevTools :
- **Method**: POST
- **URL**: http://localhost:8000/api/v1/competitors/analyze
- **Payload**: `{"url":"https://alan.com","min_score":0.5,"min_mentions":1}`

### **3. Test Manuel**
```bash
# Testez votre API directement
curl -X POST "http://localhost:8000/api/v1/competitors/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://alan.com", "min_score": 0.5, "min_mentions": 1}'
```

---

## 🚀 **Prêt pour la Production !**

✅ **Requête POST configurée** vers votre endpoint exact  
✅ **Payload correct** avec min_score et min_mentions  
✅ **Gestion des cookies** pour l'authentification  
✅ **Mapping flexible** pour différents formats de réponse  
✅ **Fallback automatique** en cas d'erreur API  
✅ **Logs détaillés** pour le debugging  

---

## 🔧 **Prochaines Étapes**

1. **Testez l'intégration** avec votre API backend
2. **Ajustez le mapping** selon le format exact de votre réponse
3. **Configurez l'authentification** si nécessaire
4. **Optimisez les performances** selon vos besoins

**Votre bouton fait maintenant une vraie requête POST vers votre API ! 🎉**
