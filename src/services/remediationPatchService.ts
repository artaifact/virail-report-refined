/**
 * Service de génération de Patches Git unifiés (.patch / .diff)
 * et de préparation de Pull Requests pour intégration directe dans le workflow développeur.
 */

export interface FileChange {
  path: string;
  originalContent: string;
  newContent: string;
}

/**
 * Génère un diff unifié au format Git standard
 */
export function generateUnifiedDiff(change: FileChange): string {
  const origLines = change.originalContent ? change.originalContent.split('\n') : [];
  const newLines = change.newContent ? change.newContent.split('\n') : [];

  const header = [
    `diff --git a/${change.path} b/${change.path}`,
    `--- a/${change.path}`,
    `+++ b/${change.path}`,
    `@@ -1,${origLines.length} +1,${newLines.length} @@`,
  ];

  const diffBody: string[] = [];

  // Si c'est un nouveau fichier
  if (origLines.length === 0) {
    for (const line of newLines) {
      diffBody.push(`+${line}`);
    }
  } else {
    // Diff simple ligne par ligne
    for (const line of origLines) {
      if (!newLines.includes(line)) {
        diffBody.push(`-${line}`);
      }
    }
    for (const line of newLines) {
      if (!origLines.includes(line)) {
        diffBody.push(`+${line}`);
      } else {
        diffBody.push(` ${line}`);
      }
    }
  }

  return [...header, ...diffBody].join('\n');
}

/**
 * Génère un fichier patch complet contenant l'ensemble des modifications de remédiation
 */
export function generateFullRemediationPatch(
  brand: string,
  changes: FileChange[]
): string {
  const dateStr = new Date().toUTCString();
  const commitMsg = `fix(agentic): viraill agent-readiness and GEO remediation for ${brand}`;

  const patchHeaders = [
    `From: Viraill Remediation Engine <bot@viraill.com>`,
    `Date: ${dateStr}`,
    `Subject: [PATCH] ${commitMsg}`,
    ``,
    `Optimisation automatique de l'éligibilité agentique et des données structurées :`,
    ...changes.map(c => `- ${c.path}`),
    `---`,
    ``,
  ];

  const diffs = changes.map(generateUnifiedDiff);

  return [...patchHeaders, ...diffs, `-- \n2.42.0\n`].join('\n\n');
}

/**
 * Prépare le payload pour ouvrir une Pull Request sur GitHub
 */
export function createPullRequestPayload(brand: string, changes: FileChange[]) {
  return {
    title: `[Viraill] Optimisation Agent-Readiness & Données Structurées (${brand})`,
    body: `## Résumé des améliorations Viraill
Ce patch applique les corrections prioritaires pour maximiser la visibilité dans les moteurs génératifs et l'accessibilité par les agents autonomes :

${changes.map(c => `- \`${c.path}\``).join('\n')}

> Généré automatiquement par **Viraill Studio**. Vérifiez et mergez pour lancer le re-scan de validation.`,
    head: `viraill/agent-readiness-${Date.now()}`,
    base: 'main',
    files: changes.map(c => ({
      path: c.path,
      content: c.newContent,
    })),
  };
}
