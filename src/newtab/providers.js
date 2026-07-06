export const AI_PROVIDERS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    modelFamily: 'GPT-4o',
    icon: '<img src="src/assets/icons/chatgpt.png" width="16" height="16" alt="ChatGPT">',
    searchUrl: 'https://chatgpt.com/?q='
  },
  {
    id: 'gemini',
    name: 'Gemini',
    modelFamily: '1.5 Pro',
    icon: '<img src="src/assets/icons/gemini.png" width="16" height="16" alt="Gemini">',
    searchUrl: 'https://gemini.google.com/app?q='
  },
  {
    id: 'claude',
    name: 'Claude',
    modelFamily: 'Opus',
    icon: '<img src="src/assets/icons/claude.png" width="16" height="16" alt="Claude">',
    searchUrl: 'https://claude.ai/new?q='
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    modelFamily: 'Sonar',
    icon: '<img src="src/assets/icons/perplexity.png" width="16" height="16" alt="Perplexity">',
    searchUrl: 'https://www.perplexity.ai/?q='
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    modelFamily: 'Coder V2',
    icon: '<img src="src/assets/icons/deepseek.png" width="16" height="16" alt="DeepSeek">',
    searchUrl: 'https://chat.deepseek.com/?q='
  },
  {
    id: 'qwen',
    name: 'Qwen',
    modelFamily: 'Max',
    icon: '<img src="src/assets/icons/qwen.png" width="16" height="16" alt="Qwen">',
    searchUrl: 'https://chat.qwenlm.ai/?q='
  },
  {
    id: 'grok',
    name: 'Grok',
    modelFamily: 'Grok-1.5',
    icon: '<img src="src/assets/icons/grok.png" width="16" height="16" alt="Grok">',
    searchUrl: 'https://grok.com/?q='
  },
  {
    id: 'mistral',
    name: 'Mistral',
    modelFamily: 'Large',
    icon: '<img src="src/assets/icons/mistral.png" width="16" height="16" alt="Mistral">',
    searchUrl: 'https://chat.mistral.ai/chat?q='
  },
  {
    id: 'copilot',
    name: 'Copilot',
    modelFamily: 'GPT-4',
    icon: '<img src="src/assets/icons/copilot.png" width="16" height="16" alt="Copilot">',
    searchUrl: 'https://copilot.microsoft.com/?q='
  }
];

export function getProvider(id) {
  return AI_PROVIDERS.find(p => p.id === id) || AI_PROVIDERS[0];
}
