// ═══════════════════════════════════════════════════════════════
// 🛡️ Novarito Discord Bot — AI Rate Limiter & Circuit Breaker
// ═══════════════════════════════════════════════════════════════

import Logger from '../core/logger.js';

export class CircuitBreaker {
  constructor(providerName, options = {}) {
    this.name = providerName;
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownDurationMs = options.cooldownDurationMs || 60000;
    this.cooldownUntil = 0;
    this.consecutiveFailures = 0;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.state = 'CLOSED';
    this.onStateChange = options.onStateChange || null;
  }

  isAvailable() {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now >= this.cooldownUntil) {
        this.state = 'HALF_OPEN';
        Logger.info('CircuitBreaker', `[${this.name}] Cooldown terminado. Estado: HALF_OPEN.`);
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.totalRequests++;
    this.consecutiveFailures = 0;
    if (this.state !== 'CLOSED') {
      this.state = 'CLOSED';
      Logger.info('CircuitBreaker', `[${this.name}] Proveedor restablecido. Estado: CLOSED.`);
      if (this.onStateChange) this.onStateChange(this.name, 'CLOSED');
    }
  }

  recordFailure(err = null, isRateLimit = false) {
    this.totalRequests++;
    this.totalFailures++;
    this.consecutiveFailures++;

    const is429 = isRateLimit || (err && (err.status === 429 || String(err.message).includes('429')));

    if (is429 || this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      const duration = is429 ? this.cooldownDurationMs : Math.min(this.cooldownDurationMs * this.consecutiveFailures, 180000);
      this.cooldownUntil = Date.now() + duration;

      Logger.warn(
        'CircuitBreaker',
        `[${this.name}] Circuit Breaker ABIERTO por ${duration / 1000}s (Causa: ${is429 ? 'HTTP 429 Rate Limit' : 'Fallos consecutivos'}).`
      );

      if (this.onStateChange) {
        this.onStateChange(this.name, 'OPEN', { duration, reason: is429 ? '429' : 'threshold' });
      }
    }
  }

  getRemainingCooldownMs() {
    return Math.max(0, this.cooldownUntil - Date.now());
  }

  reset() {
    this.state = 'CLOSED';
    this.cooldownUntil = 0;
    this.consecutiveFailures = 0;
  }
}

export default CircuitBreaker;
