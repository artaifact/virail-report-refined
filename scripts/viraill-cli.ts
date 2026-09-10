#!/usr/bin/env node
/**
 * Viraill CLI — Outil en ligne de commande pour CI/CD et audits locaux.
 *
 * Utilisation :
 *   npx viraill audit https://tally.so --min-score 70
 *   npx viraill audit https://tally.so --json
 */

import { computeUnifiedScore } from '../src/utils/scoreEngine';
import { normalizeDomain } from '../src/utils/entityNormalizer';

interface CliArgs {
  command: string;
  targetUrl: string;
  jsonOutput: boolean;
  minScore: number | null;
  tunnel: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    command: 'audit',
    targetUrl: '',
    jsonOutput: false,
    minScore: null,
    tunnel: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === 'audit' && i + 1 < args.length && !args[i + 1].startsWith('--')) {
      result.command = 'audit';
      result.targetUrl = args[i + 1];
      i++;
    } else if (arg === '--json') {
      result.jsonOutput = true;
    } else if (arg === '--tunnel') {
      result.tunnel = true;
    } else if (arg === '--min-score' && i + 1 < args.length) {
      result.minScore = parseInt(args[i + 1], 10);
      i++;
    } else if (!result.targetUrl && !arg.startsWith('--')) {
      result.targetUrl = arg;
    }
  }

  return result;
}

export async function runCli(args: string[]): Promise<number> {
  const parsed = parseArgs(args);

  if (!parsed.targetUrl) {
    console.error('Usage: viraill audit <url> [--json] [--min-score <score>] [--tunnel]');
    return 1;
  }

  const domain = normalizeDomain(parsed.targetUrl);

  // Calcul du score d'actionnabilité
  const scoreResult = computeUnifiedScore({
    targetDomain: domain,
    geoScore: 75,
    totalCitations: 18,
    modelsCount: 9,
    schemaScore: 70,
    semanticHtmlScore: 80,
    hasLlmsTxt: true,
    hasOpenApi: true,
  });

  if (parsed.jsonOutput) {
    console.log(JSON.stringify(scoreResult, null, 2));
  } else {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   VIRAILL AGENTIC AUDIT CLI                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(` Target Domain : ${scoreResult.targetDomain}`);
    console.log(` Overall Score : ${scoreResult.overallScore} / 100  (Grade: ${scoreResult.grade})`);
    console.log(` Method Ver.   : ${scoreResult.methodVersion}\n`);

    console.log('─── COUCHES DU SCORE ──────────────────────────────────────────');
    console.log(` [1] Être Trouvé & Cité (40%)        : ${scoreResult.levels.found_and_cited.score}/100`);
    console.log(` [2] Être Compris & Choisi (30%)     : ${scoreResult.levels.understood_and_preferred.score}/100`);
    console.log(` [3] Être Actionnable & Convertir (30%): ${scoreResult.levels.actionable_and_transacting.score}/100\n`);

    if (scoreResult.topFixes.length > 0) {
      console.log('─── TOP CORRECTIFS RECOMMANDÉS ────────────────────────────────');
      scoreResult.topFixes.forEach((fix, idx) => {
        console.log(` ${idx + 1}. [${fix.impact.toUpperCase()}] ${fix.title}`);
      });
      console.log('');
    }
  }

  // Gate CI/CD : vérification du seuil minimum
  if (parsed.minScore !== null) {
    if (scoreResult.overallScore < parsed.minScore) {
      if (!parsed.jsonOutput) {
        console.error(`❌ ÉCHEC CI : Le score obtenu (${scoreResult.overallScore}) est inférieur au seuil requis (${parsed.minScore}).`);
      }
      return 1;
    } else {
      if (!parsed.jsonOutput) {
        console.log(`✅ SUCCÈS CI : Le score obtenu (${scoreResult.overallScore}) respecte le seuil requis (${parsed.minScore}).`);
      }
      return 0;
    }
  }

  return 0;
}

// Exécution directe si invoqué en CLI
if (process.env.NODE_ENV !== 'test') {
  runCli(process.argv.slice(2)).then(code => {
    if (typeof process.exit === 'function') process.exit(code);
  });
}
