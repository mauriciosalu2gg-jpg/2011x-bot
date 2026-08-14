// ═══════════════════════════════════════════════════════════════
// 🧠 Chat Engine: Dynamic Multi-Provider AI Cascade
// Cascada Ultra-Rápida con Modelos Pequeños y Fallback entre API Keys
// ═══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
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

async function tryGroqModel(apiKey, model, messages, systemPrompt, temperature = 0.75) {
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
        max_tokens: 500,
      })
    }, 9000);

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

async function tryOpenRouterModel(apiKey, model, messages, systemPrompt, temperature = 0.75) {
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
        max_tokens: 500,
      })
    }, 10000);

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
  // Lista de modelos pequeños y rápidos de Groq
  const groqModels = [
    config.ai.primaryGroqModel || 'llama-3.1-8b-instant',
    config.ai.fallbackGroqModel || 'gemma2-9b-it',
    config.ai.secondaryGroqModel || 'llama-3.3-70b-versatile',
  ];

  const groqKeys = [config.ai.groqApiKey, config.ai.memoryGroqKey].filter(Boolean);

  // 1. Probar cada modelo de Groq con la clave primaria y de respaldo
  for (const key of groqKeys) {
    for (const model of groqModels) {
      const result = await tryGroqModel(key, model, messages, systemPrompt, temperature);
      if (result) {
        console.log(`[chatEngine] ⚡ Proveedor seleccionado con éxito: ${result.provider}`);
        return result;
      }
    }
  }

  // 2. OpenRouter Cascada de Modelos Gratuitos (100% Free Tier)
  const freeModels = config.ai.openRouterFreeModels || [
    'openrouter/free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
    'qwen/qwen-2.5-7b-instruct:free'
  ];

  const openRouterKeys = [config.ai.openRouterApiKey, config.ai.memoryOpenRouterKey].filter(Boolean);

  for (const key of openRouterKeys) {
    for (const freeModel of freeModels) {
      const openRouterResult = await tryOpenRouterModel(key, freeModel, messages, systemPrompt, temperature);
      if (openRouterResult) {
        console.log(`[chatEngine] ⚡ Proveedor seleccionado (OpenRouter): ${openRouterResult.provider}`);
        return openRouterResult;
      }
    }
  }

  console.error('[chatEngine] ❌ Todos los proveedores (Groq y OpenRouter) agotaron su cuota o fallaron.');
  throw new Error('RATE_LIMIT_ALL_PROVIDERS');
}

export default { generateChatResponse };
