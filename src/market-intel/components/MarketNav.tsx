import { Link } from "../compat";

type Current = "" | "/matrix" | "/activity" | "/ontology" | "/quality" | "/duel" | "/settings";

const TABS: { href: string; label: string; match: Current[] }[] = [
  { href: "", label: "Vue d'ensemble", match: [""] },
  { href: "/matrix", label: "Qui sait faire quoi", match: ["/matrix"] },
  { href: "/duel", label: "Duel", match: ["/duel"] },
  { href: "/activity", label: "Actus", match: ["/activity"] },
  { href: "/settings", label: "Réglages", match: ["/settings", "/ontology", "/quality"] },
];

export default function MarketNav({ marketId, current }: { marketId: string; current: Current }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <Link key={t.href} href={`/markets/${marketId}${t.href}`} className={t.match.includes(current) ? "active" : ""}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
