import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminService } from '@/services/adminService';
import { AdminPlan } from '@/types/admin';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Pencil,
  X,
  Save,
  CreditCard,
  RefreshCw,
  LayoutGrid,
} from 'lucide-react';

function PlanCard({ plan, onSaved }: { plan: AdminPlan; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState(plan.name);
  const [stripePriceId, setStripePriceId] = useState(plan.stripe_price_id ?? '');
  const [featuresRaw, setFeaturesRaw] = useState(plan.features.join('\n'));

  const reset = () => {
    setName(plan.name);
    setStripePriceId(plan.stripe_price_id ?? '');
    setFeaturesRaw(plan.features.join('\n'));
    setFeedback(null);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    const features = featuresRaw.split('\n').map(f => f.trim()).filter(Boolean);
    const result = await AdminService.updatePlan(plan.id, {
      name: name.trim(),
      stripe_price_id: stripePriceId.trim() || undefined,
      features,
    });
    setSaving(false);
    if (result.success) {
      setFeedback({ type: 'success', text: 'Plan mis à jour' });
      setEditing(false);
      onSaved();
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  return (
    <Card className={`border ${plan.is_active ? 'border-border' : 'border-dashed border-muted-foreground/30 opacity-60'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">{plan.id}</Badge>
            {!plan.is_active && (
              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">Inactif</Badge>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {editing ? (
              <Button variant="ghost" size="sm" onClick={reset} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground">
          {plan.price}€ / {plan.interval}
          <span className="text-xs font-normal text-muted-foreground ml-2">
            {plan.max_analyses === -1 ? '∞' : plan.max_analyses} analyses · {plan.max_reports === -1 ? '∞' : plan.max_reports} rapports
          </span>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {feedback.type === 'success'
              ? <CheckCircle className="h-4 w-4 shrink-0" />
              : <AlertCircle className="h-4 w-4 shrink-0" />}
            {feedback.text}
          </div>
        )}

        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nom affiché</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9 text-sm"
                placeholder="Nom du plan"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stripe Price ID</Label>
              <Input
                value={stripePriceId}
                onChange={e => setStripePriceId(e.target.value)}
                className="h-9 text-sm font-mono"
                placeholder="price_1Xxxxx..."
              />
              <p className="text-xs text-muted-foreground">
                Copier depuis Stripe Dashboard → Catalogue produits → Prix
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fonctionnalités (une par ligne)</Label>
              <Textarea
                value={featuresRaw}
                onChange={e => setFeaturesRaw(e.target.value)}
                className="text-sm font-normal resize-none"
                rows={4}
                placeholder="Analyse concurrentielle&#10;Support email&#10;..."
              />
            </div>

            <Button
              onClick={save}
              disabled={saving}
              className="w-full h-9 text-sm bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs font-mono text-muted-foreground break-all">
                {plan.stripe_price_id || (
                  <span className="text-rose-500 font-semibold">⚠ Aucun Price ID Stripe</span>
                )}
              </span>
            </div>
            {plan.features.length > 0 && (
              <ul className="space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPlans() {
  usePageTitle('Admin — Plans');
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminService.getPlans();
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/admin/waitlist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour admin
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-primary/10 p-2">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestion des plans
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez le nom, le Stripe Price ID et les fonctionnalités de chaque plan.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSaved={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
