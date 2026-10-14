// Aide contextuelle : un « ? » discret qui explique un terme au survol ou au focus clavier,
// et un encadré repliable « Comment lire » en tête de section.

export function Tip({ text }: { text: string }) {
  return (
    <span className="tip" tabIndex={0} aria-label={text}>
      ?<span className="tip-body" role="tooltip">{text}</span>
    </span>
  );
}

export function HowToRead({ children, title = "Comment lire cette section" }: { children: React.ReactNode; title?: string }) {
  return (
    <details className="howto">
      <summary>{title}</summary>
      <div className="howto-body">{children}</div>
    </details>
  );
}
