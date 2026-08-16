// ═══════════════════════════════════════════════════════════════
// 🧠 Memory Engine: Dedicated AI for Distributed Memory Extraction
// Clasifica en: Hechos, Gustos, Temas, Áreas y Rol de Usuario
// ═══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function queryMemoryAI(prompt, systemInstruction = 'Eres un extractor y sintetizador de memoria estructurada.') {
  const apiKey = config.ai.memoryGroqKey || config.ai.groqApiKey;
  if (apiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.ai.memoryModel || 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 600,
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (err) {
      console.warn('[memoryEngine] Error en Groq Memory:', err.message);
    }
  }

  const openRouterKey = config.ai.memoryOpenRouterKey || config.ai.openRouterApiKey;
  if (openRouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 600,
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      }
    } catch (err) {
      console.warn('[memoryEngine] Error en OpenRouter Memory:', err.message);
    }
  }

  return null;
}

/**
 * Analiza el mensaje del usuario y devuelve datos categorizados en formato JSON.
 */
export async function analyzeAndCategorizeMemory(userMessage, username = 'Usuario') {
  if (!userMessage || userMessage.length < 6) return null;

  const prompt = `Analiza el siguiente mensaje de "${username}" en Discord:
"${userMessage}"

Extrae información en formato JSON con la siguiente estructura estricta:
{
  "facts": ["hecho sobre el usuario 1", "hecho 2"],
  "preferences": ["gusto o disgusto mencionado"],
  "topic": "título corto del tema tratado (o null)",
  "area": "área de interés, pasatiempo o proyecto mencionado (o null)",
  "roleStatus": "Ocupación o rol de la persona (ej: Programador, Diseñador, Gamer, Amigo, Estudiante) o null"
}

Si el mensaje no contiene datos personales o de temas nuevos, devuelve: {"facts": [], "preferences": [], "topic": null, "area": null, "roleStatus": null}.
Devuelve SOLO el objeto JSON sin formato adicional.`;

  try {
    const raw = await queryMemoryAI(prompt, 'Responde exclusivamente con un JSON válido.');
    if (!raw) return null;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      facts: Array.isArray(parsed.facts) ? parsed.facts.filter(f => typeof f === 'string' && f.trim()) : [],
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences.filter(p => typeof p === 'string' && p.trim()) : [],
      topic: typeof parsed.topic === 'string' && parsed.topic.trim() ? parsed.topic.trim() : null,
      area: typeof parsed.area === 'string' && parsed.area.trim() ? parsed.area.trim() : null,
      roleStatus: typeof parsed.roleStatus === 'string' && parsed.roleStatus.trim() ? parsed.roleStatus.trim() : null,
    };
  } catch (err) {
    return null;
  }
}

export default { analyzeAndCategorizeMemory };
