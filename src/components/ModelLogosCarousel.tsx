import React from 'react';

/** Map des logos des modèles LLM (partagé avec Index pour getModelLogo) */
export const modelLogos: Record<string, string> = {
  'openai': '/prompt-model-openai-for-light.svg',
  'chatgpt': '/prompt-model-openai-for-light.svg',
  'gpt': '/prompt-model-openai-for-light.svg',
  'perplexity': '/prompt-model-perplexity.svg',
  'gemini': '/prompt-model-gemini.svg',
  'google': '/prompt-model-gemini.svg',
  'ai overview': '/prompt-model-gemini.svg',
  'claude': '/prompt-model-claude.svg',
  'anthropic': '/prompt-model-claude.svg',
  'mistral': '/Mistral.png',
  'mixtral': '/Mistral.png',
  'sonar': '/prompt-model-perplexity.svg',
  'deepseek': '/prompt-model-deepseek.svg',
  'qwen': '/prompt-model-qwen.svg',
  'llama': '/prompt-model-llama.svg',
  'meta': '/prompt-model-llama.svg',
  'grok': '/prompt-model-grok.svg',
};

/**
 * Carrousel animé des logos des modèles LLM (défilement infini).
 * Utilisable sur le dashboard (Index) et dans le dialog Nouvelle Analyse (Analyses).
 */
export function ModelLogosCarousel({ className }: { className?: string }) {
  const logoEntries = Object.entries(modelLogos);
  return (
    <div className={`model-logos-carousel-wrapper ${className ?? ''}`} style={{ overflow: 'hidden', width: '100%', padding: '12px 0' }}>
      <div className="model-logos-carousel" style={{ display: 'flex', gap: '24px', width: 'max-content', animation: 'model-logos-scroll 40s linear infinite' }}>
        {[...logoEntries, ...logoEntries].map(([key, src], i) => (
          <div key={`${key}-${i}`} className="model-logo-item" style={{ flexShrink: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={src} alt={key} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
