// Familles de marchés pour le rail : 5 groupes au lieu d'une liste plate de 38 noms. Un marché inconnu (créé à la
// main ou à partir d'un simple nom) tombe dans « Autres » : rien ne disparaît.
export const FAMILIES: { name: string; ids: string[] }[] = [
  { name: "Vente et marketing", ids: ["crm-smb", "marketing", "social", "ecommerce", "analytics", "creative"] },
  { name: "Finance", ids: ["accounting", "payments", "banking", "expenses", "investing", "insurance"] },
  { name: "Équipes et travail", ids: ["hr", "recruiting", "support", "project", "docs", "scheduling", "esign", "video-meetings", "edtech", "automation", "legal", "erp"] },
  { name: "Infrastructure et sécurité", ids: ["database", "observability", "hosting", "security", "storage"] },
  { name: "Vie quotidienne et services", ids: ["food", "restaurant", "realestate", "mobility", "travel", "shipping", "ticketing", "health"] },
];

export function familyOf(marketId: string, marketName = ""): string {
  const known = FAMILIES.find((f) => f.ids.includes(marketId));
  if (known) return known.name;
  // marché créé par son seul nom : rattaché par ses mots, sinon « Autres »
  if (/vid[ée]o|design|cr[ée]ation/i.test(marketName)) return "Vente et marketing";
  return "Autres";
}
