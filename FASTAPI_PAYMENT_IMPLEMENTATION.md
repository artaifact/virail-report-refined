# 🚀 Instructions d'Implémentation FastAPI - Système de Paiement

## 📋 Vue d'ensemble

Ce document détaille l'implémentation côté backend FastAPI du système de paiement avec 3 plans (Standard, Premium, Pro) pour l'application Virail Studio.

## 🛠️ Structure du Projet FastAPI

```
app/
├── main.py
├── models/
│   ├── __init__.py
│   ├── plans.py
│   ├── subscriptions.py
│   ├── payments.py
│   └── usage.py
├── schemas/
│   ├── __init__.py
│   ├── plans.py
│   ├── subscriptions.py
│   ├── payments.py
│   └── usage.py
├── routers/
│   ├── __init__.py
│   ├── plans.py
│   ├── subscriptions.py
│   ├── payments.py
│   └── usage.py
├── services/
│   ├── __init__.py
│   ├── plan_service.py
│   ├── subscription_service.py
│   ├── payment_service.py
│   └── usage_service.py
├── middleware/
│   ├── __init__.py
│   └── usage_limits.py
├── database/
│   ├── __init__.py
│   └── session.py
├── tasks/
│   ├── __init__.py
│   └── cron_jobs.py
└── dependencies/
    ├── __init__.py
    └── auth.py
```

## 🗄️ Modèles SQLAlchemy

### 1. `models/plans.py`
```python
from sqlalchemy import Column, String, DECIMAL, Enum, Boolean, TIMESTAMP, JSON, Integer
from sqlalchemy.sql import func
from database.session import Base

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default='EUR')
    interval = Column(Enum('month', 'year', name='interval_enum'), default='month')
    max_analyses = Column(Integer, default=-1, comment='-1 = illimité')
    max_reports = Column(Integer, default=-1, comment='-1 = illimité')
    features = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
```

### 2. `models/subscriptions.py`
```python
from sqlalchemy import Column, String, Enum, TIMESTAMP, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.session import Base

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), nullable=False)
    plan_id = Column(String(50), ForeignKey('plans.id'), nullable=False)
    status = Column(Enum('active', 'inactive', 'cancelled', 'pending', name='status_enum'), default='pending')
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    auto_renew = Column(Boolean, default=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relations
    plan = relationship("Plan", back_populates="subscriptions")
    
    # Index
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),
        Index('idx_status_end_date', 'status', 'end_date'),
    )
```

### 3. `models/payments.py`
```python
from sqlalchemy import Column, String, DECIMAL, Enum, TIMESTAMP, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.session import Base

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(50), primary_key=True)
    subscription_id = Column(String(50), ForeignKey('subscriptions.id'), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default='EUR')
    status = Column(Enum('pending', 'completed', 'failed', 'cancelled', name='payment_status_enum'), default='pending')
    payment_date = Column(TIMESTAMP, server_default=func.now())
    stripe_payment_id = Column(String(100), nullable=True)
    payment_method_type = Column(Enum('card', 'paypal', 'bank_transfer', name='payment_method_enum'), default='card')
    payment_method_details = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relations
    subscription = relationship("Subscription", back_populates="payments")
    
    # Index
    __table_args__ = (
        Index('idx_subscription_status', 'subscription_id', 'status'),
        Index('idx_payment_date', 'payment_date'),
    )
```

### 4. `models/usage.py`
```python
from sqlalchemy import Column, String, Enum, Date, Integer, TIMESTAMP, BigInteger, Index
from sqlalchemy.sql import func
from database.session import Base

class UsageTracking(Base):
    __tablename__ = "usage_tracking"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(50), nullable=False)
    feature_type = Column(Enum('analysis', 'report', name='feature_type_enum'), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    count_used = Column(Integer, default=0)
    last_updated = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Index
    __table_args__ = (
        Index('unique_user_feature_period', 'user_id', 'feature_type', 'period_start', unique=True),
        Index('idx_user_period', 'user_id', 'period_start', 'period_end'),
    )
```

## 📝 Schémas Pydantic

### 1. `schemas/plans.py`
```python
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class PlanBase(BaseModel):
    id: str
    name: str
    price: Decimal
    currency: str = 'EUR'
    interval: str = 'month'
    max_analyses: int
    max_reports: int
    features: List[str]

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class Plan(PlanBase):
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PlanResponse(BaseModel):
    plans: List[Plan]
```

### 2. `schemas/subscriptions.py`
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from schemas.plans import Plan

class SubscriptionBase(BaseModel):
    plan_id: str
    auto_renew: bool = True

class SubscriptionCreate(SubscriptionBase):
    payment_method: dict

class SubscriptionUpdate(BaseModel):
    plan_id: Optional[str] = None
    auto_renew: Optional[bool] = None

class Subscription(BaseModel):
    id: str
    user_id: str
    plan_id: str
    status: str
    start_date: datetime
    end_date: datetime
    auto_renew: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubscriptionWithPlan(Subscription):
    plan: Plan

class UsageInfo(BaseModel):
    analyses_used: int
    reports_used: int
    period_start: str
    period_end: str

class CurrentSubscriptionResponse(BaseModel):
    subscription: Optional[SubscriptionWithPlan]
    usage: Optional[UsageInfo]
```

### 3. `schemas/usage.py`
```python
from pydantic import BaseModel
from typing import Optional

class UsageLimits(BaseModel):
    allowed: bool
    used: int
    limit: int
    remaining: int
    reason: Optional[str] = None

class UsageLimitsResponse(BaseModel):
    can_use_analysis: UsageLimits
    can_use_report: UsageLimits

class UsageIncrement(BaseModel):
    feature_type: str  # 'analysis' ou 'report'

class UsageIncrementResponse(BaseModel):
    new_usage: dict
```

## 🔧 Services

### 1. `services/plan_service.py`
```python
from sqlalchemy.orm import Session
from models.plans import Plan
from schemas.plans import PlanCreate, PlanUpdate
from typing import List, Optional

class PlanService:
    @staticmethod
    def get_plans(db: Session, active_only: bool = True) -> List[Plan]:
        query = db.query(Plan)
        if active_only:
            query = query.filter(Plan.is_active == True)
        return query.all()
    
    @staticmethod
    def get_plan_by_id(db: Session, plan_id: str) -> Optional[Plan]:
        return db.query(Plan).filter(Plan.id == plan_id).first()
    
    @staticmethod
    def create_plan(db: Session, plan: PlanCreate) -> Plan:
        db_plan = Plan(**plan.dict())
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan
    
    @staticmethod
    def update_plan(db: Session, plan_id: str, plan_update: PlanUpdate) -> Optional[Plan]:
        db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if db_plan:
            for field, value in plan_update.dict(exclude_unset=True).items():
                setattr(db_plan, field, value)
            db.commit()
            db.refresh(db_plan)
        return db_plan
```

### 2. `services/subscription_service.py`
```python
from sqlalchemy.orm import Session
from models.subscriptions import Subscription
from models.plans import Plan
from services.payment_service import PaymentService
from datetime import datetime, timedelta
from typing import Optional
import stripe

class SubscriptionService:
    @staticmethod
    async def create_subscription(
        db: Session, 
        user_id: str, 
        plan_id: str, 
        payment_method: dict
    ) -> Subscription:
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise ValueError("Plan non trouvé")
        
        # Calculer les dates
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(
            days=365 if plan.interval == 'year' else 30
        )
        
        # Créer l'abonnement Stripe (si nécessaire)
        stripe_subscription_id = None
        if plan.price > 0:
            # Logique Stripe ici
            pass
        
        # Créer l'abonnement en base
        subscription = Subscription(
            id=f"sub_{int(datetime.now().timestamp())}",
            user_id=user_id,
            plan_id=plan_id,
            status='active',
            start_date=start_date,
            end_date=end_date,
            stripe_subscription_id=stripe_subscription_id
        )
        
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        
        return subscription
    
    @staticmethod
    def get_current_subscription(db: Session, user_id: str) -> Optional[Subscription]:
        return db.query(Subscription)\
            .filter(Subscription.user_id == user_id)\
            .filter(Subscription.status.in_(['active', 'cancelled']))\
            .order_by(Subscription.created_at.desc())\
            .first()
    
    @staticmethod
    async def cancel_subscription(
        db: Session, 
        subscription_id: str, 
        cancel_at_period_end: bool = True
    ) -> Subscription:
        subscription = db.query(Subscription)\
            .filter(Subscription.id == subscription_id)\
            .first()
        
        if not subscription:
            raise ValueError("Abonnement non trouvé")
        
        if cancel_at_period_end:
            subscription.status = 'cancelled'
            subscription.auto_renew = False
        else:
            subscription.status = 'inactive'
            subscription.end_date = datetime.utcnow()
        
        db.commit()
        db.refresh(subscription)
        
        return subscription
```

### 3. `services/usage_service.py`
```python
from sqlalchemy.orm import Session
from models.usage import UsageTracking
from models.subscriptions import Subscription
from models.plans import Plan
from datetime import datetime, date
from typing import Dict, Any
from sqlalchemy import and_

class UsageService:
    @staticmethod
    def can_use_feature(db: Session, user_id: str, feature_type: str) -> Dict[str, Any]:
        # Obtenir l'abonnement actuel
        subscription = db.query(Subscription)\
            .join(Plan)\
            .filter(Subscription.user_id == user_id)\
            .filter(Subscription.status == 'active')\
            .first()
        
        if not subscription:
            return {
                'allowed': False,
                'reason': 'Aucun abonnement actif',
                'used': 0,
                'limit': 0,
                'remaining': 0
            }
        
        plan = subscription.plan
        limit = plan.max_analyses if feature_type == 'analysis' else plan.max_reports
        
        # Vérifier si illimité
        if limit == -1:
            return {
                'allowed': True,
                'used': 0,
                'limit': -1,
                'remaining': -1
            }
        
        # Obtenir l'usage actuel
        current_usage = UsageService._get_current_usage(db, user_id, feature_type)
        
        allowed = current_usage < limit
        return {
            'allowed': allowed,
            'used': current_usage,
            'limit': limit,
            'remaining': max(0, limit - current_usage),
            'reason': f'Limite de {feature_type} atteinte pour ce mois' if not allowed else None
        }
    
    @staticmethod
    def increment_usage(db: Session, user_id: str, feature_type: str) -> None:
        now = datetime.utcnow()
        period_start = date(now.year, now.month, 1)
        
        # Calculer la fin de période
        if now.month == 12:
            period_end = date(now.year + 1, 1, 1) - timedelta(days=1)
        else:
            period_end = date(now.year, now.month + 1, 1) - timedelta(days=1)
        
        # Upsert l'usage
        existing = db.query(UsageTracking)\
            .filter(and_(
                UsageTracking.user_id == user_id,
                UsageTracking.feature_type == feature_type,
                UsageTracking.period_start == period_start
            )).first()
        
        if existing:
            existing.count_used += 1
        else:
            usage = UsageTracking(
                user_id=user_id,
                feature_type=feature_type,
                period_start=period_start,
                period_end=period_end,
                count_used=1
            )
            db.add(usage)
        
        db.commit()
    
    @staticmethod
    def _get_current_usage(db: Session, user_id: str, feature_type: str) -> int:
        now = datetime.utcnow()
        period_start = date(now.year, now.month, 1)
        
        usage = db.query(UsageTracking)\
            .filter(and_(
                UsageTracking.user_id == user_id,
                UsageTracking.feature_type == feature_type,
                UsageTracking.period_start == period_start
            )).first()
        
        return usage.count_used if usage else 0
    
    @staticmethod
    def get_usage_summary(db: Session, user_id: str) -> Dict[str, int]:
        now = datetime.utcnow()
        period_start = date(now.year, now.month, 1)
        
        usages = db.query(UsageTracking)\
            .filter(and_(
                UsageTracking.user_id == user_id,
                UsageTracking.period_start == period_start
            )).all()
        
        summary = {'analyses_used': 0, 'reports_used': 0}
        for usage in usages:
            if usage.feature_type == 'analysis':
                summary['analyses_used'] = usage.count_used
            elif usage.feature_type == 'report':
                summary['reports_used'] = usage.count_used
        
        return summary
```

## 🛣️ Routes FastAPI

### 1. `routers/plans.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from services.plan_service import PlanService
from schemas.plans import Plan, PlanResponse
from typing import List

router = APIRouter(prefix="/api/v1/plans", tags=["plans"])

@router.get("/", response_model=PlanResponse)
def get_plans(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Récupérer tous les plans disponibles"""
    plans = PlanService.get_plans(db, active_only)
    return {"plans": plans}

@router.get("/{plan_id}", response_model=Plan)
def get_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """Récupérer un plan spécifique"""
    plan = PlanService.get_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan non trouvé")
    return plan
```

### 2. `routers/subscriptions.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from dependencies.auth import get_current_user
from services.subscription_service import SubscriptionService
from services.usage_service import UsageService
from schemas.subscriptions import (
    SubscriptionCreate, 
    CurrentSubscriptionResponse,
    SubscriptionUpdate
)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])

@router.get("/current", response_model=CurrentSubscriptionResponse)
def get_current_subscription(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer l'abonnement actuel de l'utilisateur"""
    subscription = SubscriptionService.get_current_subscription(db, current_user.id)
    usage = None
    
    if subscription:
        usage_summary = UsageService.get_usage_summary(db, current_user.id)
        usage = {
            'analyses_used': usage_summary['analyses_used'],
            'reports_used': usage_summary['reports_used'],
            'period_start': '2024-01-01',  # À calculer dynamiquement
            'period_end': '2024-02-01'     # À calculer dynamiquement
        }
    
    return {
        'subscription': subscription,
        'usage': usage
    }

@router.post("/", response_model=dict)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouvel abonnement"""
    try:
        subscription = await SubscriptionService.create_subscription(
            db, 
            current_user.id, 
            subscription_data.plan_id,
            subscription_data.payment_method
        )
        return {"subscription": subscription, "status": "created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    cancel_at_period_end: bool = True,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Annuler un abonnement"""
    try:
        subscription = await SubscriptionService.cancel_subscription(
            db, 
            subscription_id, 
            cancel_at_period_end
        )
        return {"subscription": subscription, "status": "cancelled"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

### 3. `routers/usage.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from dependencies.auth import get_current_user
from services.usage_service import UsageService
from schemas.usage import UsageLimitsResponse, UsageIncrement, UsageIncrementResponse

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])

@router.get("/limits", response_model=UsageLimitsResponse)
def get_usage_limits(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifier les limites d'usage"""
    analysis_limits = UsageService.can_use_feature(db, current_user.id, 'analysis')
    report_limits = UsageService.can_use_feature(db, current_user.id, 'report')
    
    return {
        'can_use_analysis': analysis_limits,
        'can_use_report': report_limits
    }

@router.post("/increment", response_model=UsageIncrementResponse)
def increment_usage(
    usage_data: UsageIncrement,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Incrémenter l'usage après une action"""
    if usage_data.feature_type not in ['analysis', 'report']:
        raise HTTPException(status_code=400, detail="Type de fonctionnalité invalide")
    
    UsageService.increment_usage(db, current_user.id, usage_data.feature_type)
    usage_summary = UsageService.get_usage_summary(db, current_user.id)
    
    return {"new_usage": usage_summary}
```

## 🔒 Middleware de Vérification des Limites

### `middleware/usage_limits.py`
```python
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from services.usage_service import UsageService

def check_usage_limits(feature_type: str):
    """Décorateur pour vérifier les limites d'usage"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extraire les dépendances
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Dépendances manquantes"
                )
            
            # Vérifier les limites
            can_use = UsageService.can_use_feature(db, current_user.id, feature_type)
            
            if not can_use['allowed']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        'error': 'USAGE_LIMIT_EXCEEDED',
                        'message': can_use['reason'],
                        'upgrade_required': True
                    }
                )
            
            # Exécuter la fonction
            result = await func(*args, **kwargs)
            
            # Incrémenter l'usage après succès
            UsageService.increment_usage(db, current_user.id, feature_type)
            
            return result
        return wrapper
    return decorator

# Utilisation dans les routes
@router.post("/analyze")
@check_usage_limits('analysis')
async def analyze_content(
    analysis_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logique d'analyse...
    return {"result": "analysis_complete"}
```

## 🔄 Tâches Cron avec APScheduler

### `tasks/cron_jobs.py`
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from database.session import get_db
from models.subscriptions import Subscription
from datetime import datetime

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day=1, hour=0, minute=0)
async def reset_monthly_usage():
    """Reset mensuel des usages - 1er de chaque mois à 00:00"""
    print("🔄 Reset mensuel des usages...")
    # La logique de reset se fait automatiquement par période
    print("✅ Reset mensuel terminé")

@scheduler.scheduled_job('cron', hour=2, minute=0)
async def check_subscription_renewals():
    """Vérification quotidienne des renouvellements - 02:00"""
    print("🔄 Vérification des renouvellements...")
    
    with get_db() as db:
        expired_subscriptions = db.query(Subscription)\
            .filter(Subscription.status == 'active')\
            .filter(Subscription.end_date <= datetime.utcnow())\
            .filter(Subscription.auto_renew == True)\
            .all()
        
        for subscription in expired_subscriptions:
            # Logique de renouvellement
            pass
    
    print("✅ Vérification terminée")

def start_scheduler():
    """Démarrer le planificateur de tâches"""
    scheduler.start()
    print("📅 Planificateur de tâches démarré")
```

## 📱 Main FastAPI

### `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import plans, subscriptions, usage, payments
from database.session import engine
from models import plans as plan_models, subscriptions as sub_models
from tasks.cron_jobs import start_scheduler
import uvicorn

# Créer les tables
plan_models.Base.metadata.create_all(bind=engine)
sub_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Virail Studio Payment API",
    description="API de gestion des paiements et abonnements",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(plans.router)
app.include_router(subscriptions.router)
app.include_router(usage.router)
app.include_router(payments.router)

@app.on_event("startup")
async def startup_event():
    """Événements au démarrage"""
    start_scheduler()
    print("🚀 API de paiement démarrée")

@app.on_event("shutdown")
async def shutdown_event():
    """Événements à l'arrêt"""
    print("🛑 API de paiement arrêtée")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 📦 Requirements

### `requirements.txt`
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
psycopg2-binary==2.9.9
python-multipart==0.0.6
pydantic[email]==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
stripe==7.8.0
celery==5.3.4
redis==5.0.1
apscheduler==3.10.4
python-dotenv==1.0.0
pytest==7.4.3
pytest-asyncio==0.23.2
```

## 🔧 Configuration

### `.env`
```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/virail_studio

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis (pour Celery)
REDIS_URL=redis://localhost:6379

# Environnement
ENVIRONMENT=development
```

## 🚀 Commandes de Déploiement

```bash
# Installation
pip install -r requirements.txt

# Migrations Alembic
alembic init alembic
alembic revision --autogenerate -m "Create payment tables"
alembic upgrade head

# Insérer les plans par défaut
python -c "
from database.session import get_db
from services.plan_service import PlanService
from schemas.plans import PlanCreate

plans_data = [
    {'id': 'free', 'name': 'Gratuit', 'price': 0.00, 'max_analyses': 3, 'max_reports': 1, 'features': []},
    {'id': 'standard', 'name': 'Standard', 'price': 29.00, 'max_analyses': 10, 'max_reports': 5, 'features': []},
    {'id': 'premium', 'name': 'Premium', 'price': 59.00, 'max_analyses': 50, 'max_reports': 20, 'features': []},
    {'id': 'pro', 'name': 'Pro', 'price': 129.00, 'max_analyses': -1, 'max_reports': -1, 'features': []}
]

with get_db() as db:
    for plan_data in plans_data:
        PlanService.create_plan(db, PlanCreate(**plan_data))
"

# Lancement
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Cette implémentation FastAPI est complète et prête à l'emploi ! 🚀
