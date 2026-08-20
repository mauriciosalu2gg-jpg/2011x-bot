// ═══════════════════════════════════════════════════════════════
// 🤗 Novarito Discord Bot — Hugging Face Inference Provider
// ═══════════════════════════════════════════════════════════════

import { CircuitBreaker } from '../services/rateLimiter.js';
import Logger from '../core/logger.js';

export class HuggingFaceProvider {
  constructor(apiKey, options = {}) {
    this.name = 'HuggingFace';
    this.apiKey = apiKey;
    this.endpoint = 'https://api-inference.huggingface.co/models/';
    this.circuitBreaker = new CircuitBreaker(this.name, {
      failureThreshold: 2,
      cooldownDurationMs: options.cooldownMs || 60000,
      onStateChange: options.onStateChange,
    });
  }

  isReady() {
    return Boolean(this.apiKey && this.circuitBreaker.isAvailable());
  }

  async generateChat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('HuggingFace API Key no configurada.');
    }
    if (!this.circuitBreaker.isAvailable()) {
      const rem = (this.circuitBreaker.getRemainingCooldownMs() / 1000).toFixed(0);
      throw new Error(`HuggingFace se encuentra en cooldown (${rem}s restantes).`);
    }

    const model = options.model || 'meta-llama/Meta-Llama-3-8B-Instruct';
    const timeoutMs = options.timeoutMs || 15000;
    const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + '\nASSISTANT:';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startMs = Date.now();

    try {
      const response = await fetch(`${this.endpoint}${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            return_full_text: false,
          },
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startMs;

      if (!response.ok) {
        const err = await response.text().catch(() => '');
        const status = response.status;
        this.circuitBreaker.recordFailure({ status, message: err }, status === 429);
        throw new Error(`HuggingFace error HTTP ${status}: ${err}`);
      }

      const data = await response.json();
      this.circuitBreaker.recordSuccess();

      const generated = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
      return {
        text: (generated || '').trim(),
        model,
        provider: 'HuggingFace',
        latencyMs,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        this.circuitBreaker.recordFailure(err);
        throw new Error(`HuggingFace Timeout tras ${timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default HuggingFaceProvider;
