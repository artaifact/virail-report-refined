import { Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ArrowLeft, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Documentation interne — endpoints admin abonnements (alignée backend).
 * Base API : /admin/subscriptions (hors /api/v1).
 */
export default function AdminSubscriptionDocs() {
  usePageTitle("Admin — Doc abonnements");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/admin/waitlist">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour admin
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex items-start gap-3">
          <div className="mt-1 rounded-lg bg-primary/10 p-2">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Documentation front — gestion des abonnements (admin)
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Endpoints réservés aux administrateurs (<code className="rounded bg-muted px-1 py-0.5 text-xs">is_admin = true</code>)
              pour lister, créer et modifier des abonnements sans passer par Stripe Checkout ni le portail client.
              Utile pour un panneau d&apos;administration interne.
            </p>
          </div>
        </div>

        <div className="space-y-10 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Authentification
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Même mécanisme que le reste de l&apos;API : cookie{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">access_token</code>{" "}
                (JWT cookie bearer côté backend).
              </li>
              <li>
                L&apos;utilisateur doit avoir <strong className="text-foreground">is_admin === true</strong>, sinon{" "}
                <strong className="text-foreground">403</strong> avec un message du type{" "}
                <em>« Accès refusé - Admin requis »</em>.
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">
              <strong className="text-foreground">Préfixe des routes</strong> : le routeur est monté tel quel dans
              l&apos;application — base <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">/admin/subscriptions</code>{" "}
              (pas sous <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/api/v1</code>).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Vue d&apos;ensemble des endpoints</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-semibold">Méthode</th>
                    <th className="px-3 py-2 font-semibold">Chemin</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["GET", "/admin/subscriptions/", "Liste paginée + filtres"],
                    ["GET", "/admin/subscriptions/stats", "Statistiques globales"],
                    ["GET", "/admin/subscriptions/{subscription_id}", "Détail d'un abonnement"],
                    ["PUT", "/admin/subscriptions/{subscription_id}/force-activate", "Activer manuellement"],
                    ["PUT", "/admin/subscriptions/{subscription_id}/force-cancel", "Annuler immédiatement"],
                    ["PUT", "/admin/subscriptions/{subscription_id}/extend", "Prolonger la période"],
                    ["POST", "/admin/subscriptions/{user_id}/create", "Créer un abonnement pour un utilisateur"],
                  ].map(([m, path, desc]) => (
                    <tr key={path} className="border-b border-border/80 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-foreground">{m}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs sm:text-sm">{path}</td>
                      <td className="px-3 py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Implémentation backend typique : <code className="rounded bg-muted px-1 py-0.5">api/routes/admin_subscription_routes.py</code>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">1. Liste des abonnements</h2>
            <p className="mb-2 font-mono text-xs text-foreground sm:text-sm">GET /admin/subscriptions/</p>
            <p className="mb-2 text-muted-foreground">Query :</p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-semibold">Paramètre</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Défaut</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["page", "int", "1", "Numéro de page (≥ 1)"],
                    ["per_page", "int", "20", "Taille de page (1–100)"],
                    ["status", "string", "—", "Filtre : active, inactive, cancelled, pending…"],
                    ["plan_id", "string", "—", "Filtre par id de plan"],
                    ["user_id", "int", "—", "Filtre par utilisateur"],
                  ].map(([a, b, c, d]) => (
                    <tr key={a} className="border-b border-border/80 last:border-0">
                      <td className="px-3 py-2 font-mono text-foreground">{a}</td>
                      <td className="px-3 py-2">{b}</td>
                      <td className="px-3 py-2">{c}</td>
                      <td className="px-3 py-2">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-muted-foreground">
              Réponse (<code className="rounded bg-muted px-1 text-xs">SubscriptionListResponse</code>) :{" "}
              <code className="rounded bg-muted px-1 text-xs">subscriptions[]</code>, <code className="rounded bg-muted px-1 text-xs">total</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">page</code>, <code className="rounded bg-muted px-1 text-xs">per_page</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">total_pages</code>.
            </p>
            <p className="mt-2 text-muted-foreground">
              Chaque élément contient notamment : <code className="rounded bg-muted px-1 text-xs">id</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">user_id</code>, <code className="rounded bg-muted px-1 text-xs">plan_id</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">status</code>, dates,{" "}
              <code className="rounded bg-muted px-1 text-xs">stripe_customer_id</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">stripe_subscription_id</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">user_username</code>, <code className="rounded bg-muted px-1 text-xs">user_email</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">plan_name</code>, <code className="rounded bg-muted px-1 text-xs">plan_price</code>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">2. Statistiques</h2>
            <p className="mb-2 font-mono text-xs text-foreground sm:text-sm">GET /admin/subscriptions/stats</p>
            <p className="text-muted-foreground">
              Réponse (<code className="rounded bg-muted px-1 text-xs">SubscriptionStatsResponse</code>) :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1 text-xs">total_subscriptions</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">active_subscriptions</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">inactive_subscriptions</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">cancelled_subscriptions</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 text-xs">subscriptions_by_plan</code> : map nom de plan → nombre
                d&apos;abonnements <strong className="text-foreground">actifs</strong>
              </li>
              <li>
                <code className="rounded bg-muted px-1 text-xs">monthly_revenue</code> : somme des prix de plan des
                abonnements actifs (agrégat simplifié)
              </li>
              <li>
                <code className="rounded bg-muted px-1 text-xs">total_revenue</code> : somme des montants en table{" "}
                <code className="rounded bg-muted px-1 text-xs">Payment</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1 text-xs">avg_subscription_duration_days</code> : moyenne en
                jours depuis <code className="rounded bg-muted px-1 text-xs">start_date</code> pour les actifs
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">3. Détail d&apos;un abonnement</h2>
            <p className="font-mono text-xs text-foreground sm:text-sm">GET /admin/subscriptions/{"{subscription_id}"}</p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1 text-xs">subscription_id</code> : identifiant string (ex. préfixe{" "}
                <code className="rounded bg-muted px-1 text-xs">sub_...</code>).
              </li>
              <li>
                <strong className="text-foreground">404</strong> si introuvable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">4. Activer de force</h2>
            <p className="font-mono text-xs text-foreground sm:text-sm">
              PUT /admin/subscriptions/{"{subscription_id}"}/force-activate
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Passe le statut à <code className="rounded bg-muted px-1 text-xs">active</code>, met à jour <code className="rounded bg-muted px-1 text-xs">updated_at</code>.</li>
              <li>
                Si <code className="rounded bg-muted px-1 text-xs">end_date</code> est absente ou dans le passé :{" "}
                <code className="rounded bg-muted px-1 text-xs">end_date</code> = maintenant + 30 jours.
              </li>
            </ul>
            <Alert className="mt-3 border-amber-200 bg-amber-50/80 dark:bg-amber-950/30">
              <AlertTitle className="text-amber-900 dark:text-amber-100">Stripe</AlertTitle>
              <AlertDescription className="text-amber-800/90 dark:text-amber-200/90">
                Pas d&apos;appel Stripe dans ce handler : cohérence facturation à gérer manuellement si l&apos;utilisateur a aussi un abonnement Stripe.
              </AlertDescription>
            </Alert>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">5. Annuler de force</h2>
            <p className="font-mono text-xs text-foreground sm:text-sm">
              PUT /admin/subscriptions/{"{subscription_id}"}/force-cancel
            </p>
            <p className="mt-2 text-muted-foreground">
              Query optionnelle : <code className="rounded bg-muted px-1 text-xs">reason</code> (string).
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Statut → <code className="rounded bg-muted px-1 text-xs">cancelled</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">end_date</code> → maintenant,{" "}
                <code className="rounded bg-muted px-1 text-xs">auto_renew</code> → <code className="rounded bg-muted px-1 text-xs">false</code>.
              </li>
            </ul>
            <p className="mt-2 text-muted-foreground">Idem : pas de synchronisation Stripe automatique dans ce flux.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">6. Prolonger la période</h2>
            <p className="font-mono text-xs text-foreground sm:text-sm">
              PUT /admin/subscriptions/{"{subscription_id}"}/extend
            </p>
            <p className="mt-2 text-muted-foreground">Corps JSON (<code className="rounded bg-muted px-1 text-xs">SubscriptionExtend</code>) :</p>
            <pre className="mt-2 overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs text-foreground">
{`{ "days": 30 }`}
            </pre>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Ajoute <code className="rounded bg-muted px-1 text-xs">days</code> à <code className="rounded bg-muted px-1 text-xs">end_date</code> (ou part de maintenant si pas de{" "}
                <code className="rounded bg-muted px-1 text-xs">end_date</code>).
              </li>
              <li>
                <strong className="text-foreground">400</strong> si <code className="rounded bg-muted px-1 text-xs">days</code> absent ou ≤ 0.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">7. Créer un abonnement pour un utilisateur</h2>
            <p className="font-mono text-xs text-foreground sm:text-sm">POST /admin/subscriptions/{"{user_id}"}/create</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1 text-xs">user_id</code> : identifiant numérique de l&apos;utilisateur cible (segment URL).
              </li>
            </ul>
            <p className="mt-3 text-muted-foreground">Corps (<code className="rounded bg-muted px-1 text-xs">AdminSubscriptionCreate</code>) :</p>
            <div className="mt-2 overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-semibold">Champ</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Défaut</th>
                    <th className="px-3 py-2 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["user_id", "int", "requis", "Identique au segment URL (ex. POST .../123/create ⇒ user_id: 123)"],
                    ["plan_id", "string", "requis", "Id du plan en base"],
                    ["auto_renew", "bool", "true", ""],
                    ["duration_days", "int", "30", "Durée de la période"],
                  ].map(([a, b, c, d]) => (
                    <tr key={a} className="border-b border-border/80 last:border-0">
                      <td className="px-3 py-2 font-mono text-foreground">{a}</td>
                      <td className="px-3 py-2">{b}</td>
                      <td className="px-3 py-2">{c}</td>
                      <td className="px-3 py-2">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-muted-foreground">Comportement :</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Vérifie que l&apos;utilisateur et le plan existent.</li>
              <li>
                <strong className="text-foreground">400</strong> si l&apos;utilisateur a déjà un abonnement{" "}
                <code className="rounded bg-muted px-1 text-xs">status === &apos;active&apos;</code>.
              </li>
              <li>
                Crée un abonnement <code className="rounded bg-muted px-1 text-xs">active</code> avec un{" "}
                <code className="rounded bg-muted px-1 text-xs">id</code> généré côté serveur (ex. préfixe{" "}
                <code className="rounded bg-muted px-1 text-xs">sub_admin_...</code>), dates calculées, sans{" "}
                <code className="rounded bg-muted px-1 text-xs">stripe_customer_id</code> /{" "}
                <code className="rounded bg-muted px-1 text-xs">stripe_subscription_id</code> (création locale).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">8. Plans (catalogue)</h2>
            <p className="text-muted-foreground">
              Pour les listes déroulantes admin : réutiliser l&apos;API publique{" "}
              <code className="rounded bg-muted px-1 text-xs">GET /api/v1/plans/</code> (champ{" "}
              <code className="rounded bg-muted px-1 text-xs">stripe_price_id</code> en référence optionnelle).
            </p>
            <p className="mt-2 text-muted-foreground">
              Création / mise à jour des définitions de plans :{" "}
              <code className="rounded bg-muted px-1 text-xs">POST /api/v1/plans/</code> et{" "}
              <code className="rounded bg-muted px-1 text-xs">PUT /api/v1/plans/{"{plan_id}"}</code> avec un compte{" "}
              <code className="rounded bg-muted px-1 text-xs">require_admin</code> (voir routes paiement backend).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">9. Ne pas confondre</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[480px] border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 font-semibold">Besoin</th>
                    <th className="px-3 py-2 font-semibold">Endpoint</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/80">
                    <td className="px-3 py-2">Gestion interne (support, promo, correction)</td>
                    <td className="px-3 py-2 font-mono text-xs text-foreground">
                      /admin/subscriptions/...
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Utilisateur final (Stripe, portail)</td>
                    <td className="px-3 py-2">
                      <code className="rounded bg-muted px-1 text-xs">/api/v1/subscriptions/</code>, Checkout, portail — doc Stripe front dédiée
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Card className="mt-4 border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Synchronisation Stripe</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Les actions admin ci-dessus ne mettent pas à jour Stripe automatiquement ; si le client a un{" "}
                <code className="rounded bg-muted px-1 text-xs">stripe_subscription_id</code>, les opérations Stripe
                (annulation, changement de prix) restent à faire dans le dashboard Stripe ou via une évolution future du backend.
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
