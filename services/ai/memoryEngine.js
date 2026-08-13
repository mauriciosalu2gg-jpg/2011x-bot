// ═══════════════════════════════════════════════════════════════
// 🧠 Memory Engine: Dedicated AI for Extracting Facts & Summaries
// Ejecución asíncrona en segundo plano
// ═══════════════════════════════════════════════════════════════

import config from '../../config.js';

async function queryMemoryAI(prompt, systemInstruction = 'Eres un sintetizador de memoria contextual para un bot de Discord.') {
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
          max_tokens: 500,
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
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 500,
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
 * Extrae hechos relevantes, gustos o datos que el usuario haya revelado en su mensaje.
 */
export async function extractFactsWithAI(userMessage, username = 'Usuario') {
  if (!userMessage || userMessage.length < 6) return [];
  
  const prompt = `Analiza el siguiente mensaje enviado por "${username}" a un bot de Discord:\n"${userMessage}"\n\nExtrae únicamente hechos reales sobre ${username} (gustos, juegos que juega, datos personales, opiniones, nombre, personalidad, etc.).\nSi no hay hechos relevantes o es solo una pregunta/saludo genérico, responde exactamente: "NINGUNO".\nSi hay hechos, lista cada hecho como una sola línea comenzando con "• ". Máximo 3 hechos.`;

  try {
    const raw = await queryMemoryAI(prompt, 'Eres un extractor de hechos concisos en JSON/texto plano.');
    if (!raw || raw.includes('NINGUNO')) return [];

    return raw
      .split('\n')
      .map(line => line.replace(/^[-*•\d\.\s]+/, '').trim())
      .filter(line => line.length > 4 && !/ninguno|no hay/i.test(line));
  } catch {
    return [];
  }
}

/**
 * Resume una conversación larga cuando se superan los límites de mensajes.
 */
export async function summarizeHistoryWithAI(messages = []) {
  if (messages.length === 0) return '';
  const conversationText = messages.map(m => `${m.role === 'user' ? 'Usuario' : '2011X'}: ${m.content}`).join('\n');

  const prompt = `Resume de forma ultra compacta los puntos clave tratados en esta conversación anterior entre un usuario y 2011X:\n\n${conversationText}\n\nResumen conciso (máximo 3 oraciones):`;

  try {
    const summary = await queryMemoryAI(prompt, 'Eres un resumidor experto.');
    return summary || '';
  } catch {
    return '';
  }
}

export default { extractFactsWithAI, summarizeHistoryWithAI };
