// ═══════════════════════════════════════════════════════════════
// 🌐 Novarito Discord Bot — OpenRouter AI Provider
// Multi-model fallback and free tier cascade provider
// ═══════════════════════════════════════════════════════════════

import { CircuitBreaker } from '../services/rateLimiter.js';
import Logger from '../core/logger.js';

export class OpenRouterProvider {
  constructor(apiKey, options = {}) {
    this.name = 'OpenRouter';
    this.apiKey = apiKey;
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
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
      throw new Error('OpenRouter API Key no configurada.');
    }
    if (!this.circuitBreaker.isAvailable()) {
      const rem = (this.circuitBreaker.getRemainingCooldownMs() / 1000).toFixed(0);
      throw new Error(`OpenRouter se encuentra temporalmente en cooldown (${rem}s restantes).`);
    }

    const model = options.model || 'meta-llama/llama-3.3-70b-instruct:free';
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
          'HTTP-Referer': 'https://discord.com',
          'X-Title': 'Novarito Discord Bot',
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
        throw new Error(`OpenRouter error HTTP ${status}: ${errBody}`);
      }

      const data = await response.json();
      this.circuitBreaker.recordSuccess();

      const choice = data.choices?.[0];
      return {
        text: choice?.message?.content || '',
        model: data.model || model,
        provider: 'OpenRouter',
        usage: data.usage || {},
        latencyMs,
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        this.circuitBreaker.recordFailure(err);
        throw new Error(`OpenRouter Timeout tras ${timeoutMs / 1000}s`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export default OpenRouterProvider;
