// ═══════════════════════════════════════════════════════════════
// 🧠 Novarito Discord Bot — Asynchronous Memory Extraction Queue
// ═══════════════════════════════════════════════════════════════

import config from '../core/config.js';
import Logger from '../core/logger.js';

export class MemoryProcessorQueue {
  constructor(memoryEngine) {
    this.memoryEngine = memoryEngine;
    this.queue = [];
    this.isProcessing = false;
    this.pendingUserMap = new Map();
  }

  enqueue(userId, guildId, userText, botResponse) {
    if (!userText || userText.length < 10) return;

    this.pendingUserMap.set(userId, {
      userId,
      guildId,
      userText,
      botResponse,
      timestamp: Date.now(),
    });

    setTimeout(() => {
      if (this.pendingUserMap.has(userId)) {
        const item = this.pendingUserMap.get(userId);
        this.pendingUserMap.delete(userId);
        this.queue.push(item);
        this._processNext();
      }
    }, 1500);
  }

  async _processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift();

    try {
      await this.extractSemanticFact(item);
    } catch (err) {
      Logger.debug('MemoryProcessor', `Error procesando memoria para ${item.userId}: ${err.message}`);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this._processNext(), 500);
      }
    }
  }

  async extractSemanticFact(item) {
    const { userId, guildId, userText, botResponse } = item;

    const hasIntent = /(me llamo|mi nombre|tengo|me gusta|mi proyecto|trabajo en|soy|recorda|recuerda)/i.test(userText);
    if (!hasIntent && userText.length < 35) return;

    const apiKey = config.ai.groqMemoryApiKey || config.ai.groqApiKey || config.ai.openRouterMemoryApiKey || config.ai.openRouterApiKey;
    if (!apiKey) return;

    const prompt = `Analiza el siguiente diálogo y determina si el usuario reveló un dato fáctico duradero sobre sí mismo, sus preferencias, su proyecto o su entorno.\nSi hay un dato relevante, extráelo en una sola oración concisa en tercera persona (Ej: "El usuario desarrolla scripts para Roblox" o "Al usuario le gusta el café").\nSi NO hay datos persistentes dignos de recordar, responde únicamente "NINGUNO".\n\nUsuario: "${userText}"\nAsistente: "${botResponse.slice(0, 200)}"`;

    try {
      const endpoint = config.ai.groqMemoryApiKey || config.ai.groqApiKey
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';

      const model = config.ai.models.memoryAI || 'llama-3.1-8b-instant';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 80,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data.choices?.[0]?.message?.content?.trim();
        if (candidate && !candidate.toUpperCase().includes('NINGUNO') && candidate.length < 150) {
          Logger.info('MemoryProcessor', `✓ Hecho identificado para usuario ${userId}: "${candidate}"`);
          await this.memoryEngine.saveFact(userId, guildId, candidate);
        }
      }
    } catch (err) {
      Logger.debug('MemoryProcessor', `Extracción de memoria omitida: ${err.message}`);
    }
  }
}

export default MemoryProcessorQueue;
