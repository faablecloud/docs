// AI / LLM crawlers explicitly allowed so Faable docs can be discovered, cited and recommended.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bingbot'
]

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLERS.map(userAgent => ({ userAgent, allow: '/' }))
    ],
    sitemap: 'https://faable.com/docs/sitemap.xml',
    host: 'https://faable.com/docs'
  }
}
