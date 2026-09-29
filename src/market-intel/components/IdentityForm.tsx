import { useRouter, miFetch } from "../compat";
import { useState } from "react";
import type { Identity } from "../lib/api";

const lines = (v: FormDataEntryValue | null) => String(v ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

// Identité technique d'une company : c'est elle qui permet aux collecteurs de la trouver
// et de distinguer ses canaux officiels des canaux communautaires.
export default function IdentityForm({ companyId, identity }: { companyId: string; identity: Identity }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "saved" | string>("idle");

  return (
    <details className="fold card">
      <summary>Réglages avancés <span className="meta">— où chercher cet acteur</span></summary>
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
        Ces informations permettent aux collecteurs de trouver l'acteur et de distinguer ses canaux officiels de ceux publiés par des
        tiers. Laissez vide ce que vous ne connaissez pas.
      </p>
      <form
        className="stacked"
        style={{ marginTop: 12 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setState("saving");
          const f = new FormData(e.currentTarget);
          const docs = lines(f.get("docs_urls")).map((l) => {
            const [channel, url] = l.includes(" ") ? l.split(/\s+/, 2) : ["MCP", l];
            const known = identity.docs_urls.find((d) => d.url === url && d.channel === channel);
            return known ?? { channel, url, name: `${channel} docs` }; // nom et endpoint déjà réglés sont conservés
          });
          const res = await miFetch(`/companies/${companyId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              domain: f.get("domain"),
              github_orgs: lines(f.get("github_orgs")),
              mcp_namespaces: lines(f.get("mcp_namespaces")),
              match_patterns: lines(f.get("match_patterns")),
              product_patterns: lines(f.get("product_patterns")),
              docs_urls: docs,
              openapi_url: f.get("openapi_url"),
              zapier_slug: f.get("zapier_slug"),
              claude_connector_slug: f.get("claude_connector_slug"),
              aliases: lines(f.get("aliases")),
            }),
          });
          if (res.ok) {
            setState("saved");
            router.refresh();
          } else {
            setState(`Erreur : ${await res.text()}`);
          }
        }}
      >
        <div className="grid grid-2">
          <label>Domaine<input name="domain" defaultValue={identity.domain ?? ""} placeholder="attio.com" /></label>
          <label>Alias (noms dans les réponses LLM)<input name="aliases" defaultValue={identity.aliases.join(", ")} /></label>
          <label>Orgs GitHub officielles<input name="github_orgs" defaultValue={identity.github_orgs.join(", ")} /></label>
          <label>Namespaces MCP officiels<input name="mcp_namespaces" defaultValue={identity.mcp_namespaces.join(", ")} placeholder="com.attio" /></label>
          <label>Spec OpenAPI<input name="openapi_url" defaultValue={identity.openapi_url ?? ""} /></label>
          <label>Slug Zapier<input name="zapier_slug" defaultValue={identity.zapier_slug ?? ""} /></label>
          <label>Slug connecteur Claude<input name="claude_connector_slug" defaultValue={identity.claude_connector_slug ?? ""} /></label>
          <label>Regex produit (éditeur multi-produits : seuls les accès qui correspondent comptent)<input name="product_patterns" defaultValue={(identity.product_patterns ?? []).join(", ")} placeholder="\\bbookings\\b" /></label>
          <label>Regex de correspondance (annuaires)<input name="match_patterns" defaultValue={identity.match_patterns.join(", ")} placeholder="\battio\b" /></label>
        </div>
        <label>
          Pages de doc de canaux agent (une par ligne : TYPE URL)
          <textarea
            name="docs_urls"
            rows={3}
            defaultValue={identity.docs_urls.map((d) => `${d.channel} ${d.url}`).join("\n")}
            placeholder="MCP https://docs.exemple.com/mcp"
          />
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={state === "saving"}>Enregistrer</button>
          <span className="muted" style={{ fontSize: 12 }}>
            {state === "saved" ? "Enregistré. Prise en compte à la prochaine collecte." : state.startsWith("Erreur") ? state : ""}
          </span>
        </div>
      </form>
    </details>
  );
}
