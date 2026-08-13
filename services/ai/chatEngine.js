// ═══════════════════════════════════════════════════════════════
// 🧠 Chat Engine: Primary AI for Discord Conversations
// Prioridad: Groq (Llama 3.3 70B) -> Fallback: OpenRouter
// ═══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function askGroq(messages, systemPrompt, temperature = 0.75) {
  const apiKey = config.ai.groqApiKey;
  if (!apiKey) throw new Error('GROQ_API_KEY no está configurada');

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.ai.defaultChatModel || 'llama-3.3-70b-versatile',
      messages: fullMessages,
      temperature,
      max_tokens: 1024,
    })
  }, 12000);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq API Error HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Groq devolvió una respuesta vacía');

  return { text, provider: 'Groq', model: config.ai.defaultChatModel };
}

async function askOpenRouter(messages, systemPrompt, temperature = 0.75) {
  const apiKey = config.ai.openRouterApiKey;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY no está configurada');

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/mauriciosalu2gg-jpg/2011x-bot',
      'X-Title': '2011X Discord Bot',
    },
    body: JSON.stringify({
      model: config.ai.fallbackChatModel || 'meta-llama/llama-3.3-70b-instruct',
      messages: fullMessages,
      temperature,
      max_tokens: 1024,
    })
  }, 15000);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter API Error HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenRouter devolvió una respuesta vacía');

  return { text, provider: 'OpenRouter', model: config.ai.fallbackChatModel };
}

/**
 * Consulta a la IA principal con fallback automático.
 */
export async function generateChatResponse(messages, systemPrompt, temperature = 0.75) {
  // 1. Intentar con Groq (alta velocidad, baja latencia)
  if (config.ai.groqApiKey) {
    try {
      return await askGroq(messages, systemPrompt, temperature);
    } catch (err) {
      console.warn(`[chatEngine] Fallo en Groq (${err.message}). Reintentando con OpenRouter...`);
    }
  }

  // 2. Fallback a OpenRouter
  if (config.ai.openRouterApiKey) {
    try {
      return await askOpenRouter(messages, systemPrompt, temperature);
    } catch (err) {
      console.error(`[chatEngine] Fallo en OpenRouter (${err.message})`);
      throw err;
    }
  }

  throw new Error('No hay proveedores de IA disponibles (configura GROQ_API_KEY u OPENROUTER_API_KEY)');
}

export default { generateChatResponse };
