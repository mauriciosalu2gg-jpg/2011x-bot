// ═══════════════════════════════════════════════════════════════
// ⚡ Novarito Discord Bot — Groq AI Provider
// Ultra-fast cloud inference provider
// ═══════════════════════════════════════════════════════════════

import { CircuitBreaker } from '../services/rateLimiter.js';
import Logger from '../core/logger.js';

export class GroqProvider {
  constructor(apiKey, options = {}) {
    this.name = 'Groq';
    this.apiKey = apiKey;
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    this.circuitBreaker = new CircuitBreaker(this.name, {
      failureThreshold: 2,
      cooldownDurationMs: options.cooldownMs || 60000,
      onStateChange: options.onStateChange,
    });
  }

  isReady() {
    return Boolean(this.apiKey && this.circuitBreaker.isAvailable());
  }

  get cooldownUntil() {
    return this.circuitBreaker.cooldownUntil;
  }

  async generateChat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Groq API Key no configurada.');
    }
    if (!this.circuitBreaker.isAvailable()) {
      const rem = (this.circuitBreaker.getRemainingCooldownMs() / 1000).toFixed(0);
      throw new Error(`Groq se encuentra temporalmente en cooldown (${rem}s restantes).`);
    }

    const model = options.model || 'llama-3.3-70b-versatile';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 1500;
    const timeoutMs = options.timeoutMs || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startMs = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startMs;

      if (!response.ok) {
        const status = response.status;
        const errBody = await response.text().catch(() => '');
        const is429 = status === 429;
        this.circuitBreaker.recordFailure({ status, message: errBody }, is429);
        if (is429) {
          throw new Error(`Groq 429 Rate Limit: HTTP ${status} - ${errBody}`);
        }
        throw new Error(`Groq error HTTP ${status}: ${errBody}`);
      }

      const data = await response.json();
      this.circuitBreaker.recordSuccess();

      const choice = data.choices?.[0];
      return {
        text: choice?.message?.content || '',
        model: data.model || model,
        provider: 'Groq',
        usage: data.usage || {},
        latencyMs,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        this.circuitBreaker.recordFailure(err);
        throw new Error(`Groq Timeout tras ${timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default GroqProvider;
