# Viraill MCP Server (@viraill/mcp-server)

Le serveur MCP officiel de **Viraill** pour connecter vos agents autonomes et environnements de développement (Cursor, Windsurf, Claude Desktop, Antigravity) aux capacités d'audit d'éligibilité machine, de génération de correctifs techniques et de simulation de parcours réels.

## 🚀 Outils Exposés

| Outil | Description | Paramètres |
|---|---|---|
| `viraill_audit` | Audit d'éligibilité machine et visibilité agentique (score, grade, 5 piliers) | `url` (string) |
| `viraill_get_recommendations` | Recommandations techniques prioritaires (robots.txt, llms.txt, schema.org) | `url` (string) |
| `viraill_generate_patch` | Génère un diff unifié Git (`.patch`) prêt à merger | `domain` (string), `includeRobots`, `includeLlmsTxt`, `includeSchemas` |
| `viraill_run_journey` | Simule les étapes de raisonnement d'un agent autonome | `url` (string), `intent` (`discover` \| `compare` \| `pricing` \| `integrate` \| `action`) |

## 📦 Configuration Claude Desktop

Ajoutez dans votre `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "viraill": {
      "command": "npx",
      "args": ["-y", "@viraill/mcp-server"]
    }
  }
}
```

## 🛠️ Configuration Cursor / Windsurf

Dans les paramètres MCP de votre IDE :
- **Name**: `viraill`
- **Command**: `node`
- **Args**: `["./packages/mcp-server/dist/index.js"]`

## 💻 Utilisation Programmatique

```typescript
import { handleToolCall } from '@viraill/mcp-server';

const audit = await handleToolCall('viraill_audit', { url: 'https://tally.so' });
console.log(audit.score, audit.grade);
```
