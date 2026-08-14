// ═══════════════════════════════════════════════════════════════
// 🧠 Chat Engine: Dynamic Multi-Provider AI Cascade
// Cascada: Groq 70B -> Groq 8B Balanced -> OpenRouter Free Tier
// ═══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function fetchWithTimeout(url, options, timeoutMs = 12000) {
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

async function tryGroqModel(model, messages, systemPrompt, temperature = 0.75) {
  const apiKey = config.ai.groqApiKey;
  if (!apiKey) return null;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature,
        max_tokens: 600,
      })
    }, 10000);

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: `Groq (${model})` };
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[chatEngine] Groq (${model}) HTTP ${res.status}: ${errText.slice(0, 150)}`);
    }
  } catch (err) {
    console.warn(`[chatEngine] Groq (${model}) Error:`, err.message);
  }
  return null;
}

async function tryOpenRouterModel(model, messages, systemPrompt, temperature = 0.75) {
  const apiKey = config.ai.openRouterApiKey;
  if (!apiKey) return null;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  try {
    const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/mauriciosalu2gg-jpg/2011x-bot',
        'X-Title': '2011X Discord Bot',
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature,
        max_tokens: 600,
      })
    }, 12000);

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: `OpenRouter (${model})` };
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`[chatEngine] OpenRouter (${model}) HTTP ${res.status}: ${errText.slice(0, 150)}`);
    }
  } catch (err) {
    console.warn(`[chatEngine] OpenRouter (${model}) Error:`, err.message);
  }
  return null;
}

/**
 * Consulta dinámica con cascada automática multi-modelo y multi-proveedor.
 */
export async function generateChatResponse(messages, systemPrompt, temperature = 0.75) {
  // 1. Groq Principal (Llama 3.3 70B)
  const groqPrimary = await tryGroqModel(config.ai.primaryGroqModel || 'llama-3.3-70b-versatile', messages, systemPrompt, temperature);
  if (groqPrimary) return groqPrimary;

  // 2. Groq Balanceado / Rápido (Llama 3.1 8B Instantáneo)
  const groqBalanced = await tryGroqModel(config.ai.balancedGroqModel || 'llama-3.1-8b-instant', messages, systemPrompt, temperature);
  if (groqBalanced) return groqBalanced;

  // 3. OpenRouter Cascada de Modelos Gratuitos (100% Free Tier)
  const freeModels = config.ai.openRouterFreeModels || [
    'openrouter/free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2.5-7b-instruct:free'
  ];

  for (const freeModel of freeModels) {
    const openRouterResult = await tryOpenRouterModel(freeModel, messages, systemPrompt, temperature);
    if (openRouterResult) return openRouterResult;
  }

  throw new Error('Todos los proveedores de IA alcanzaron su límite temporal. Reintenta en unos momentos.');
}

export default { generateChatResponse };
