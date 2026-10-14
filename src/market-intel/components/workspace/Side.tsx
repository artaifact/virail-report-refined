import { Link } from "../../compat";
import { CollectButton } from "../Actions";
import { Logo } from "../Fun";
import type { MarketEvent, Overview } from "../../lib/api";
import { describeEvent, eventDate } from "../../lib/format";
import { eventTone } from "../../lib/fun";

/** Une seule carte à droite : ce qui bouge. Le buzz est déjà dans le tableau, les stores aussi. */
export default function Side({ o, events, marketId }: { o: Overview; events: MarketEvent[]; marketId: string }) {
  const logoOf = new Map(o.companies.map((c) => [c.id, c.domain]));
  return (
    <aside className="ws-side">
      <section className="ws-card">
        <div className="ws-card-head"><h2>Ce qui a bougé</h2></div>
        {events.length === 0 ? (
          <p className="quiet-note">Rien de neuf depuis le premier relevé.</p>
        ) : (
          <ul className="news">
            {events.slice(0, 6).map((e) => (
              <li key={e.id}>
                <Logo name={e.company} domain={logoOf.get(e.company_id)} size={24} />
                <span>
                  <span className={`dot dot-${eventTone(e.type)}`} aria-hidden="true" />
                  <strong>{e.company}</strong> {describeEvent(e)}
                  <span className="meta" style={{ display: "block" }}>{eventDate(e)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/markets/${marketId}/activity`} className="more">Tout l&apos;historique →</Link>
      </section>
      <CollectButton marketId={marketId} />
    </aside>
  );
}
