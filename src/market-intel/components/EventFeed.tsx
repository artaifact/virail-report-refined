import { Link } from "../compat";
import type { MarketEvent } from "../lib/api";
import { describeEvent } from "../lib/format";
import { eventTone } from "../lib/fun";
import { levelName } from "../lib/labels";
import EvidenceLink from "./Evidence";

const monthOf = (e: MarketEvent) =>
  new Date(e.detected_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

const dayOf = (e: MarketEvent) =>
  e.subject.date_precision === "month" ? "" : new Date(e.detected_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

// Groupé par mois : la date n'est lue qu'une fois par groupe. Seul ce qui n'est pas vérifié est signalé.
export default function EventFeed({ events, marketId, showCompany = true }: {
  events: MarketEvent[];
  marketId: string;
  showCompany?: boolean;
}) {
  if (!events.length) return <p className="empty">Aucun changement depuis le premier relevé.</p>;
  const groups: [string, MarketEvent[]][] = [];
  for (const e of events) {
    const m = monthOf(e);
    if (groups[groups.length - 1]?.[0] !== m) groups.push([m, []]);
    groups[groups.length - 1][1].push(e);
  }
  return (
    <div>
      {groups.map(([month, items]) => (
        <div key={month} className="feed-group">
          <div className="feed-month">{month}</div>
          <ul className="feed">
            {items.map((e) => (
              <li key={e.id}>
                <span className="what">
                  <span className={`dot dot-${eventTone(e.type)}`} aria-hidden="true" />
                  {showCompany && (
                    <Link href={`/companies/${e.company_id}?market=${marketId}`}><strong>{e.company}</strong></Link>
                  )}{" "}
                  {describeEvent(e)}
                  {e.level !== "OBSERVED" && <span className="tag">{levelName(e.level).toLowerCase()}</span>}
                  {e.baseline && <span className="tag" style={{ color: "var(--muted)", background: "var(--surface-2)" }}>premier relevé</span>}
                </span>
                <span className="when">
                  {dayOf(e)} {dayOf(e) && "· "}<EvidenceLink id={e.evidence_ids[0]} label="source" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
