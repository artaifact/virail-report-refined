import { Link } from "../compat";
import { CHANNEL_INFO, COMPONENT_INFO, LEVEL_INFO } from "../lib/labels";

export default function HelpPage() {
  return (
    <main className="page" style={{ maxWidth: 860 }}>
      <div>
        <h1>Comment ça marche ?</h1>
        <p className="subtitle">Tout ce qu'il faut pour lire l'outil, sans jargon.</p>
      </div>

      <section className="card essentials">
        <h2 style={{ margin: 0 }}>L'idée en trois phrases</h2>
        <ul>
          <li>Les assistants IA (ChatGPT, Claude…) ne se contentent plus de répondre : ils commencent à <strong>agir</strong> à la place
            des utilisateurs, par exemple créer un contact dans un CRM ou réserver un hôtel.</li>
          <li>Pour cela, ils ont besoin que l'outil leur ouvre un <strong>accès</strong>. Certains éditeurs le font, d'autres non.</li>
          <li>Cet outil mesure, pour chaque acteur d'un marché, <strong>par où</strong> un agent peut entrer et <strong>ce qu'il peut
            y faire</strong>, et suit l'évolution jour après jour.</li>
        </ul>
      </section>

      <section className="card">
        <h2>Les accès possibles pour un agent</h2>
        <table>
          <tbody>
            {Object.entries(CHANNEL_INFO).filter(([k]) => k !== "COMMERCE_PROTOCOL").map(([k, v]) => (
              <tr key={k}>
                <td style={{ width: 200 }}><strong>{v.name}</strong></td>
                <td>{v.help}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          <strong>Officiel ou tiers ?</strong> Un accès est officiel s'il est publié par l'éditeur lui-même. Des développeurs
          indépendants publient aussi des accès : ils sont montrés à part et ne comptent pas dans la note.
        </p>
      </section>

      <section className="card">
        <h2>La note « prêt pour les agents »</h2>
        <p>Une note sur 100, qui compare les acteurs d'un même marché. Elle additionne :</p>
        <table style={{ marginTop: 8 }}>
          <tbody>
            {Object.values(COMPONENT_INFO).map((c) => (
              <tr key={c.name}><td style={{ width: 200 }}><strong>{c.name}</strong></td><td>{c.help}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          Moins de 40 : en retard. De 40 à 69 : intermédiaire. 70 et plus : avancé.
        </p>
      </section>

      <section className="card">
        <h2>Peut-on se fier aux chiffres ?</h2>
        <table>
          <tbody>
            {Object.values(LEVEL_INFO).map((l) => (
              <tr key={l.name}><td style={{ width: 200 }}><strong>{l.name}</strong></td><td>{l.help}</td></tr>
            ))}
            <tr><td><strong>Probable</strong></td><td>L'éditeur ne cite pas l'action une par une, mais propose un outil
              « toutes les fiches » (par exemple « gérer les enregistrements »). Un agent peut donc très probablement l'utiliser pour les
              contacts, entreprises et opportunités.</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          Chaque information a une source : cliquez sur une action ou sur « source » pour voir d'où elle vient.
        </p>
      </section>

      <section className="card">
        <h2>Buzz : fait-il parler de lui ?</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Faute de chiffres financiers publics, l'attention et l'adoption servent d'indicateurs de succès. Elles restent à part de la note sur 100.
        </p>
        <table>
          <tbody>
            <tr><td style={{ width: 200 }}><strong>Buzz</strong></td><td>L'évolution des 30 derniers jours comparée à la moyenne des 3 mois précédents, sur les audiences
              de l'acteur : pages vues Wikipédia, votes Hacker News, étoiles GitHub, téléchargements npm et PyPI de ses paquets officiels.
              Un signal trop faible ne compte pas.</td></tr>
            <tr><td><strong>Viral</strong></td><td>Un article à la une de Hacker News (100 votes ou plus), ou un pic d'audience très au-dessus
              de l'habitude de l'acteur, ces 14 derniers jours.</td></tr>
            <tr><td><strong>Bad buzz</strong></td><td>À la une pour de mauvaises raisons (panne, fuite de données, procès, licenciements…).
              Montré, mais jamais compté comme un succès.</td></tr>
            <tr><td><strong>Notoriété</strong></td><td>Le rang moyen de l'acteur dans son marché, audience par audience (0 à 100).</td></tr>
            <tr><td><strong>Buzz du marché</strong></td><td>La tendance médiane de ses acteurs : chacun pèse autant, un géant ne masque pas le reste.</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          Chaque compte (article, dépôt, paquet) est rattaché à l'acteur par son site officiel : une filiale n'hérite pas de l'audience de sa
          maison mère, et un nom courant comme « Square » n'est jamais cherché seul dans des titres.
        </p>
      </section>

      <section className="card">
        <h2>Les pages d'un marché</h2>
        <table>
          <tbody>
            <tr><td style={{ width: 200 }}><strong>Vue d'ensemble</strong></td><td>L'essentiel en quelques phrases, le classement, les derniers mouvements.</td></tr>
            <tr><td><strong>Qui sait faire quoi</strong></td><td>Pour chaque sujet (contacts, opportunités…), les actions possibles chez chaque acteur.</td></tr>
            <tr><td><strong>Historique</strong></td><td>Chaque changement repéré, daté, avec sa source.</td></tr>
            <tr><td><strong>Vocabulaire</strong></td><td>Réglage avancé : les sujets suivis et les mots qui les désignent.</td></tr>
          </tbody>
        </table>
      </section>

      <p><Link href="/" style={{ color: "var(--accent)" }}>← Retour aux marchés</Link></p>
    </main>
  );
}
