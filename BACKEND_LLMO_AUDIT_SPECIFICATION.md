# 🚀 Spécification Backend - Audit LLMO

## 📋 Vue d'ensemble

Ce document décrit l'implémentation backend pour la fonctionnalité d'audit LLMO (Large Language Model Optimization) qui permet d'analyser et d'optimiser les sites web pour une meilleure compréhension par les LLMs.

### 🎯 Objectifs
- Analyser la structure sémantique des sites web
- Calculer des scores LLMO pour différents aspects
- Générer des recommandations d'optimisation prioritaires
- Fournir une checklist exécutable pour les améliorations

---

## 🏗️ Architecture Technique

### Stack Recommandée
```yaml
Backend Framework: FastAPI
Database: PostgreSQL + SQLAlchemy
Task Queue: Celery + Redis
LLM Providers: OpenAI, Anthropic Claude, Google Gemini
Web Scraping: BeautifulSoup4, Selenium
Monitoring: Prometheus + Grafana
```

### Diagramme d'Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    FastAPI       │    │   PostgreSQL    │
│   (React)       │◄──►│    Backend       │◄──►│   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Celery Queue   │
                       │   (Redis)        │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   LLM Services   │
                       │ OpenAI/Claude/   │
                       │ Gemini           │
                       └──────────────────┘
```

---

## 🗄️ Modèles de Données

### 1. LLMOAudit (Modèle Principal)
```python
class LLMOAudit(BaseModel):
    id: UUID
    user_id: UUID
    website_url: str
    status: str  # pending, processing, completed, failed
    created_at: datetime
    updated_at: datetime
    
    # Scores principaux
    global_score: float  # Score global sur 100
    llmo_score: float    # Score LLMO spécifique
    semantic_score: float # Score sémantique
    technical_score: float # Score technique
    
    # Métadonnées d'analyse
    analysis_version: str
    processing_time_seconds: float
    llm_providers_used: List[str]
    
    # Relations
    metrics: Optional[AuditMetrics]
    recommendations: Optional[List[Recommendation]]
    actionable_tasks: Optional[List[ActionableTask]]
```

### 2. AuditMetrics (Métriques Détaillées)
```python
class AuditMetrics(BaseModel):
    id: UUID
    audit_id: UUID
    
    # Scores par catégorie (0-100)
    schema_org_score: float
    heading_structure_score: float
    metadata_completeness_score: float
    content_freshness_score: float
    llm_readability_score: float
    
    # Détails techniques
    missing_schema_org: List[str]
    heading_issues: List[HeadingIssue]
    metadata_gaps: List[MetadataGap]
    content_issues: List[ContentIssue]
    
    # Analyse de structure
    html_structure_analysis: Dict[str, Any]
    semantic_markup_analysis: Dict[str, Any]
```

### 3. Recommendation (Recommandations)
```python
class Recommendation(BaseModel):
    id: UUID
    audit_id: UUID
    category: str  # schema_org, headings, metadata, content, etc.
    title: str
    description: str
    impact_score: float  # 0-100
    effort_score: float  # 0-100
    priority: str  # critical, high, medium, low
    category_type: str  # quick_win, major_project, fill_in, avoid
    
    # Détails techniques
    technical_details: Dict[str, Any]
    implementation_guide: str
    estimated_time: str  # "30 minutes", "2 hours", etc.
    difficulty_level: str  # beginner, intermediate, advanced
```

### 4. ActionableTask (Tâches Exécutables)
```python
class ActionableTask(BaseModel):
    id: UUID
    audit_id: UUID
    recommendation_id: UUID
    
    title: str
    description: str
    status: str  # pending, in_progress, completed, cancelled
    completed_at: Optional[datetime]
    notes: Optional[str]
    
    # Métadonnées
    estimated_time: str
    difficulty: str
    owner: Optional[str]  # SEO, Dev, Marketing, etc.
    dependencies: List[str]  # IDs des tâches dépendantes
```

---

## 🔌 API Endpoints

### Base URL: `/api/v1/llmo-audit`

#### 1. Créer un nouvel audit
```http
POST /api/v1/llmo-audit/
Content-Type: application/json

{
    "website_url": "https://example.com",
    "include_optimization": true,
    "priority_analysis": true,
    "llm_providers": ["openai", "claude", "gemini"]
}

Response 201:
{
    "audit_id": "uuid",
    "status": "pending",
    "estimated_completion_time": "5-10 minutes",
    "webhook_url": "/api/v1/llmo-audit/{audit_id}/status"
}
```

#### 2. Récupérer un audit complet
```http
GET /api/v1/llmo-audit/{audit_id}

Response 200:
{
    "id": "uuid",
    "website_url": "https://example.com",
    "status": "completed",
    "global_score": 60.5,
    "created_at": "2024-01-15T10:30:00Z",
    "processing_time_seconds": 245.7,
    
    "metrics": {
        "schema_org_score": 30.0,
        "heading_structure_score": 65.0,
        "metadata_completeness_score": 75.0,
        "content_freshness_score": 55.0,
        "llm_readability_score": 70.0
    },
    
    "recommendations": [
        {
            "category": "schema_org",
            "title": "Ajouter JSON-LD Schema.org",
            "impact_score": 85.0,
            "effort_score": 25.0,
            "priority": "critical",
            "category_type": "quick_win"
        }
    ],
    
    "actionable_tasks": [
        {
            "title": "Ajouter JSON-LD 'SoftwareApplication'",
            "status": "pending",
            "estimated_time": "30 minutes",
            "difficulty": "beginner"
        }
    ]
}
```

#### 3. Statut d'un audit en cours
```http
GET /api/v1/llmo-audit/{audit_id}/status

Response 200:
{
    "status": "processing",
    "progress_percentage": 65,
    "current_step": "Analyzing with Claude",
    "estimated_remaining_time": "2 minutes"
}
```

#### 4. Lister les audits d'un utilisateur
```http
GET /api/v1/llmo-audit/user/{user_id}?page=1&limit=20

Response 200:
{
    "audits": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 150,
        "pages": 8
    }
}
```

#### 5. Mettre à jour une tâche
```http
PUT /api/v1/llmo-audit/{audit_id}/tasks/{task_id}
Content-Type: application/json

{
    "status": "completed",
    "notes": "Implémenté JSON-LD Schema.org sur toutes les pages",
    "completed_at": "2024-01-15T14:30:00Z"
}
```

#### 6. Évolution des scores (historique)
```http
GET /api/v1/llmo-audit/{audit_id}/trends?period=30d

Response 200:
{
    "trends": [
        {
            "date": "2024-01-01",
            "global_score": 55.0,
            "schema_org_score": 25.0,
            "heading_score": 60.0
        },
        {
            "date": "2024-01-15",
            "global_score": 60.5,
            "schema_org_score": 30.0,
            "heading_score": 65.0
        }
    ]
}
```

---

## ⚙️ Services Backend

### 1. LLMOAnalysisService
```python
class LLMOAnalysisService:
    """Service principal pour l'analyse LLMO"""
    
    def __init__(self):
        self.content_extractor = ContentExtractionService()
        self.llm_analyzer = MultiLLMAnalyzer()
        self.scoring_service = LLMOScoringService()
        self.recommendation_engine = RecommendationEngine()
    
    async def analyze_website(self, url: str, options: AnalysisOptions) -> LLMOAuditResult:
        """Point d'entrée principal pour l'analyse"""
        
        # 1. Extraction du contenu
        content = await self.content_extractor.extract_website_content(url)
        
        # 2. Analyse avec multiples LLMs
        llm_results = await self.llm_analyzer.analyze_with_all_llms(
            content, 
            providers=options.llm_providers
        )
        
        # 3. Calcul des scores
        scores = await self.scoring_service.calculate_comprehensive_scores(
            content, 
            llm_results
        )
        
        # 4. Génération des recommandations
        recommendations = await self.recommendation_engine.generate_recommendations(
            content, 
            scores
        )
        
        # 5. Création des tâches actionables
        tasks = await self.recommendation_engine.create_actionable_tasks(
            recommendations
        )
        
        return LLMOAuditResult(
            global_score=scores.global_score,
            metrics=scores,
            recommendations=recommendations,
            actionable_tasks=tasks
        )
```

### 2. ContentExtractionService
```python
class ContentExtractionService:
    """Service d'extraction et d'analyse du contenu web"""
    
    async def extract_website_content(self, url: str) -> WebsiteContent:
        """Extrait et analyse le contenu d'un site web"""
        
        # 1. Scraping HTML
        html_content = await self.scrape_html(url)
        
        # 2. Extraction des métadonnées
        metadata = self.extract_metadata(html_content)
        
        # 3. Analyse de la structure
        structure = self.analyze_html_structure(html_content)
        
        # 4. Extraction du contenu textuel
        text_content = self.extract_text_content(html_content)
        
        # 5. Analyse des images et médias
        media_analysis = self.analyze_media_content(html_content)
        
        return WebsiteContent(
            url=url,
            html_content=html_content,
            metadata=metadata,
            structure=structure,
            text_content=text_content,
            media_analysis=media_analysis
        )
    
    def extract_metadata(self, html_content: str) -> Metadata:
        """Extrait les métadonnées importantes"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        return Metadata(
            title=soup.find('title').text if soup.find('title') else None,
            description=self.get_meta_content(soup, 'description'),
            keywords=self.get_meta_content(soup, 'keywords'),
            open_graph=self.extract_open_graph(soup),
            twitter_cards=self.extract_twitter_cards(soup),
            schema_org=self.extract_schema_org(soup),
            canonical_url=self.get_canonical_url(soup),
            robots_meta=self.get_robots_meta(soup)
        )
```

### 3. MultiLLMAnalyzer
```python
class MultiLLMAnalyzer:
    """Analyse avec plusieurs fournisseurs LLM"""
    
    def __init__(self):
        self.openai_client = OpenAI()
        self.anthropic_client = Anthropic()
        self.google_client = genai.GenerativeModel('gemini-pro')
    
    async def analyze_with_all_llms(self, content: WebsiteContent, providers: List[str]) -> Dict[str, LLMResult]:
        """Analyse le contenu avec tous les LLMs spécifiés"""
        
        tasks = []
        
        if 'openai' in providers:
            tasks.append(self.analyze_with_openai(content))
        
        if 'claude' in providers:
            tasks.append(self.analyze_with_claude(content))
            
        if 'gemini' in providers:
            tasks.append(self.analyze_with_gemini(content))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            provider: result for provider, result in zip(providers, results)
            if not isinstance(result, Exception)
        }
    
    async def analyze_with_openai(self, content: WebsiteContent) -> LLMResult:
        """Analyse avec OpenAI GPT-4"""
        prompt = self.build_llmo_analysis_prompt(content)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        return self.parse_llm_response(response.choices[0].message.content)
```

### 4. LLMOScoringService
```python
class LLMOScoringService:
    """Service de calcul des scores LLMO"""
    
    def __init__(self):
        self.weights = {
            'schema_org': 0.25,
            'heading_structure': 0.20,
            'metadata_completeness': 0.20,
            'content_freshness': 0.15,
            'llm_readability': 0.20
        }
    
    async def calculate_comprehensive_scores(self, content: WebsiteContent, llm_results: Dict[str, LLMResult]) -> LLMOScores:
        """Calcule tous les scores LLMO"""
        
        # Scores individuels
        schema_score = self.calculate_schema_org_score(content.metadata.schema_org)
        heading_score = self.calculate_heading_structure_score(content.structure)
        metadata_score = self.calculate_metadata_score(content.metadata)
        freshness_score = self.calculate_content_freshness_score(content)
        readability_score = self.calculate_llm_readability_score(llm_results)
        
        # Score global pondéré
        global_score = self.calculate_global_score({
            'schema_org': schema_score,
            'heading_structure': heading_score,
            'metadata_completeness': metadata_score,
            'content_freshness': freshness_score,
            'llm_readability': readability_score
        })
        
        return LLMOScores(
            global_score=global_score,
            schema_org_score=schema_score,
            heading_structure_score=heading_score,
            metadata_completeness_score=metadata_score,
            content_freshness_score=freshness_score,
            llm_readability_score=readability_score
        )
    
    def calculate_global_score(self, scores: Dict[str, float]) -> float:
        """Calcule le score global pondéré"""
        weighted_score = sum(
            scores[metric] * weight 
            for metric, weight in self.weights.items()
        )
        return round(weighted_score, 1)
```

---

## 🤖 Prompts LLM

### Prompt Principal d'Analyse LLMO
```python
LLMO_ANALYSIS_PROMPT = """
Tu es un expert en optimisation LLMO (Large Language Model Optimization). 
Analyse ce site web et évalue sa capacité à être bien compris par les LLMs.

INFORMATIONS DU SITE:
- URL: {url}
- Titre: {title}
- Description: {description}
- Contenu principal: {content_sample}
- Structure HTML: {structure_summary}
- Métadonnées: {metadata_summary}

ÉVALUE LES ASPECTS SUIVANTS (sur 100):

1. STRUCTURE SÉMANTIQUE (Schema.org, microdata)
2. HIÉRARCHIE DES TITRES (H1, H2, H3, etc.)
3. MÉTADONNÉES (meta tags, Open Graph, etc.)
4. FRAÎCHEUR DU CONTENU (dates, mise à jour)
5. LISIBILITÉ LLM (clarté, contexte, structure)

RETOURNE UN JSON STRUCTURÉ:
{{
    "scores": {{
        "schema_org": 85,
        "heading_structure": 70,
        "metadata_completeness": 60,
        "content_freshness": 45,
        "llm_readability": 75
    }},
    "issues": [
        {{
            "category": "schema_org",
            "severity": "high",
            "description": "Manque de JSON-LD Schema.org",
            "impact": "Les LLMs ne peuvent pas identifier le type de contenu"
        }}
    ],
    "recommendations": [
        {{
            "priority": "critical",
            "category": "schema_org",
            "title": "Ajouter JSON-LD Schema.org",
            "description": "Implémenter des balises JSON-LD pour améliorer la compréhension sémantique",
            "estimated_effort": "30 minutes",
            "impact_score": 85,
            "effort_score": 25
        }}
    ],
    "overall_assessment": "Le site a un bon contenu mais manque de structure sémantique pour les LLMs"
}}
"""
```

---

## 📊 Système de Queue (Celery)

### Configuration Celery
```python
# celery_app.py
from celery import Celery
from celery.schedules import crontab

app = Celery('llmo_audit')
app.config_from_object('celery_config')

# Configuration Redis
app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)
```

### Tâche Principale
```python
@app.task(bind=True, max_retries=3)
def process_llmo_audit(self, audit_id: str):
    """Tâche principale de traitement d'audit LLMO"""
    
    try:
        # 1. Récupérer l'audit depuis la DB
        audit = get_audit_by_id(audit_id)
        if not audit:
            raise ValueError(f"Audit {audit_id} not found")
        
        # 2. Marquer comme "processing"
        update_audit_status(audit_id, "processing", progress=0)
        
        # 3. Extraction du contenu (20% du progress)
        content = extract_website_content(audit.website_url)
        update_audit_status(audit_id, "processing", progress=20)
        
        # 4. Analyse avec LLMs (60% du progress)
        llm_results = analyze_with_llms(content, audit.options)
        update_audit_status(audit_id, "processing", progress=80)
        
        # 5. Calcul des scores et recommandations (100% du progress)
        scores = calculate_llmo_scores(content, llm_results)
        recommendations = generate_recommendations(content, scores)
        tasks = create_actionable_tasks(recommendations)
        
        # 6. Sauvegarder les résultats
        save_audit_results(audit_id, scores, recommendations, tasks)
        update_audit_status(audit_id, "completed", progress=100)
        
        # 7. Notification (webhook, email, etc.)
        send_completion_notification(audit_id)
        
    except Exception as exc:
        logger.error(f"Audit {audit_id} failed: {str(exc)}")
        update_audit_status(audit_id, "failed", error=str(exc))
        
        # Retry avec backoff exponentiel
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## 🗃️ Base de Données (SQLAlchemy)

### Modèles SQLAlchemy
```python
# models.py
from sqlalchemy import Column, String, Float, DateTime, JSON, UUID, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid

Base = declarative_base()

class LLMOAudit(Base):
    __tablename__ = "llmo_audits"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    website_url = Column(String, nullable=False)
    status = Column(String, default="pending", index=True)
    
    # Scores principaux
    global_score = Column(Float)
    llmo_score = Column(Float)
    semantic_score = Column(Float)
    technical_score = Column(Float)
    
    # Métadonnées
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processing_time_seconds = Column(Float)
    analysis_version = Column(String, default="1.0")
    llm_providers_used = Column(JSON)
    
    # Résultats détaillés
    detailed_results = Column(JSON)
    error_message = Column(Text)

class AuditMetrics(Base):
    __tablename__ = "audit_metrics"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    
    # Scores détaillés
    schema_org_score = Column(Float)
    heading_structure_score = Column(Float)
    metadata_completeness_score = Column(Float)
    content_freshness_score = Column(Float)
    llm_readability_score = Column(Float)
    
    # Détails techniques
    missing_schema_org = Column(JSON)
    heading_issues = Column(JSON)
    metadata_gaps = Column(JSON)
    content_issues = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    impact_score = Column(Float)
    effort_score = Column(Float)
    priority = Column(String, index=True)
    category_type = Column(String, index=True)
    
    # Détails techniques
    technical_details = Column(JSON)
    implementation_guide = Column(Text)
    estimated_time = Column(String)
    difficulty_level = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ActionableTask(Base):
    __tablename__ = "actionable_tasks"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(PGUUID(as_uuid=True), nullable=False, index=True)
    recommendation_id = Column(PGUUID(as_uuid=True), index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending", index=True)
    completed_at = Column(DateTime)
    notes = Column(Text)
    
    # Métadonnées
    estimated_time = Column(String)
    difficulty = Column(String)
    owner = Column(String)
    dependencies = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Migrations Alembic
```python
# alembic/versions/001_create_llmo_audit_tables.py
"""Create LLMO audit tables

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create llmo_audits table
    op.create_table('llmo_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('website_url', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('global_score', sa.Float(), nullable=True),
        sa.Column('llmo_score', sa.Float(), nullable=True),
        sa.Column('semantic_score', sa.Float(), nullable=True),
        sa.Column('technical_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('processing_time_seconds', sa.Float(), nullable=True),
        sa.Column('analysis_version', sa.String(), nullable=True),
        sa.Column('llm_providers_used', sa.JSON(), nullable=True),
        sa.Column('detailed_results', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_llmo_audits_user_id'), 'llmo_audits', ['user_id'], unique=False)
    op.create_index(op.f('ix_llmo_audits_status'), 'llmo_audits', ['status'], unique=False)
    
    # Create other tables...
```

---

## 📈 Monitoring et Analytics

### Métriques Prometheus
```python
# monitoring.py
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge

# Métriques principales
audit_requests_total = Counter(
    'llmo_audit_requests_total', 
    'Total number of audit requests',
    ['status', 'user_type']
)

audit_duration = Histogram(
    'llmo_audit_duration_seconds',
    'Time spent processing audits',
    buckets=[10, 30, 60, 120, 300, 600, 1800]
)

llm_api_calls = Counter(
    'llm_api_calls_total',
    'Total LLM API calls',
    ['provider', 'model', 'status']
)

llm_api_duration = Histogram(
    'llm_api_duration_seconds',
    'LLM API call duration',
    ['provider', 'model']
)

audit_scores = Histogram(
    'llmo_audit_scores',
    'Distribution of audit scores',
    buckets=[0, 20, 40, 60, 80, 100]
)

active_audits = Gauge(
    'llmo_active_audits',
    'Number of audits currently being processed'
)

# Middleware pour collecter les métriques
class MetricsMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()
            
            await self.app(scope, receive, send)
            
            duration = time.time() - start_time
            audit_duration.observe(duration)
```

### Dashboard Analytics
```python
# analytics_service.py
class LLMOAnalyticsService:
    async def get_user_analytics(self, user_id: str) -> UserAnalytics:
        """Génère des analytics pour un utilisateur"""
        
        # Statistiques de base
        total_audits = await self.count_user_audits(user_id)
        completed_audits = await self.count_completed_audits(user_id)
        average_score = await self.get_average_score(user_id)
        
        # Tendance d'amélioration
        improvement_trend = await self.calculate_improvement_trend(user_id)
        
        # Top issues
        top_issues = await self.get_most_common_issues(user_id)
        
        # Performance par catégorie
        category_performance = await self.get_category_performance(user_id)
        
        return UserAnalytics(
            total_audits=total_audits,
            completed_audits=completed_audits,
            average_score=average_score,
            improvement_trend=improvement_trend,
            top_issues=top_issues,
            category_performance=category_performance
        )
    
    async def get_system_analytics(self) -> SystemAnalytics:
        """Analytics système pour monitoring"""
        
        return SystemAnalytics(
            total_audits_processed=await self.count_total_audits(),
            average_processing_time=await self.get_average_processing_time(),
            success_rate=await self.get_success_rate(),
            llm_usage_stats=await self.get_llm_usage_stats(),
            popular_issues=await self.get_most_common_system_issues()
        )
```

---

## 🚀 Déploiement et Configuration

### Variables d'Environnement
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/llmo_audit
REDIS_URL=redis://localhost:6379/0

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Application
SECRET_KEY=your-secret-key
ENVIRONMENT=production
LOG_LEVEL=INFO

# Monitoring
PROMETHEUS_PORT=8001
GRAFANA_URL=http://localhost:3000

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: llmo_audit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/llmo_audit
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  celery-worker:
    build: .
    command: celery -A app.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/llmo_audit
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  celery-beat:
    build: .
    command: celery -A app.celery beat --loglevel=info
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/llmo_audit
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

---

## 📋 Roadmap d'Implémentation

### Phase 1 - MVP (2-3 semaines)
- [ ] Setup FastAPI + PostgreSQL + SQLAlchemy
- [ ] Modèles de base (LLMOAudit, AuditMetrics)
- [ ] Service d'extraction de contenu basique
- [ ] Intégration OpenAI GPT-4
- [ ] API endpoints principaux (POST, GET)
- [ ] Système de scoring simple
- [ ] Tests unitaires de base

### Phase 2 - Multi-LLM (2-3 semaines)
- [ ] Intégration Claude + Gemini
- [ ] Service de scoring avancé avec pondération
- [ ] Génération de recommandations intelligentes
- [ ] Matrice Impact/Effort
- [ ] Checklist exécutable avec tâches
- [ ] Webhooks pour notifications

### Phase 3 - Queue et Analytics (2-3 semaines)
- [ ] Configuration Celery + Redis
- [ ] Tâches asynchrones avec retry
- [ ] Tracking temporel des scores
- [ ] Comparaisons benchmark
- [ ] Export des résultats (PDF, JSON, CSV)
- [ ] Monitoring Prometheus

### Phase 4 - Optimisation (1-2 semaines)
- [ ] Cache Redis pour les résultats
- [ ] Optimisation des prompts LLM
- [ ] Tests de performance et load testing
- [ ] Documentation API complète
- [ ] Dashboard d'administration

---

## 💰 Estimation des Coûts

### Coûts LLM (mensuel pour 1000 audits)
```yaml
OpenAI GPT-4:
  - Requêtes: ~3000 (3 LLMs par audit)
  - Coût: ~$200-300/mois

Anthropic Claude:
  - Requêtes: ~3000
  - Coût: ~$150-250/mois

Google Gemini:
  - Requêtes: ~3000
  - Coût: ~$100-150/mois

Total LLM: $450-700/mois
```

### Infrastructure
```yaml
PostgreSQL (managed):
  - Instance: $50-100/mois

Redis (managed):
  - Instance: $30-50/mois

Celery Workers (2x instances):
  - Compute: $100-200/mois

Monitoring (Prometheus + Grafana):
  - Managed service: $50/mois

Total Infrastructure: $230-400/mois
```

### **Total Estimé: $680-1100/mois pour 1000 audits**

---

## 🎯 Critères de Succès

### Métriques Techniques
- **Temps de traitement**: < 5 minutes par audit
- **Taux de succès**: > 95%
- **Disponibilité API**: > 99.5%
- **Précision des scores**: Validation avec experts SEO

### Métriques Business
- **Adoption utilisateur**: > 80% des utilisateurs utilisent la fonctionnalité
- **Rétention**: > 70% des utilisateurs refont un audit dans les 30 jours
- **Satisfaction**: Score NPS > 50

---

## 📞 Support et Maintenance

### Documentation
- [ ] Guide d'installation et configuration
- [ ] Documentation API complète (OpenAPI/Swagger)
- [ ] Guide de développement pour l'équipe
- [ ] Procédures de monitoring et alerting

### Maintenance
- [ ] Mise à jour régulière des prompts LLM
- [ ] Monitoring des coûts LLM
- [ ] Optimisation des performances
- [ ] Backup et disaster recovery

---

**Contact**: Pour toute question sur cette spécification, contacter l'équipe backend.

**Version**: 1.0  
**Date**: Janvier 2024  
**Auteur**: Équipe Frontend/Product
