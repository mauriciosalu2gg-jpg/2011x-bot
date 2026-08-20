// ═══════════════════════════════════════════════════════════════
// ⚡ Novarito Discord Bot — Rate Limiter & Circuit Breaker
// ═══════════════════════════════════════════════════════════════

import Logger from '../core/logger.js';

export class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownDurationMs = options.cooldownDurationMs || 60000;
    this.consecutiveFailures = 0;
    this.cooldownUntil = 0;
    this.state = 'CLOSED';
    this.onStateChange = options.onStateChange || null;
  }

  isAvailable() {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.cooldownUntil) {
        this._setState('HALF_OPEN');
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess() {
    if (this.state !== 'CLOSED') {
      this._setState('CLOSED');
    }
    this.consecutiveFailures = 0;
  }

  recordFailure(err = null, is429 = false) {
    this.consecutiveFailures++;
    const isRateLimit = is429 || (err && (err.status === 429 || String(err.message).includes('429')));

    if (isRateLimit || this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      const cooldown = isRateLimit ? this.cooldownDurationMs : Math.min(this.cooldownDurationMs * this.consecutiveFailures, 180000);
      this.cooldownUntil = Date.now() + cooldown;
      this._setState('OPEN');
      Logger.warn('CircuitBreaker', `[${this.name}] Circuito ABIERTO por ${cooldown / 1000}s (Fallos: ${this.consecutiveFailures}, 429: ${isRateLimit})`);
    }
  }

  getRemainingCooldownMs() {
    return Math.max(0, this.cooldownUntil - Date.now());
  }

  _setState(newState) {
    const oldState = this.state;
    this.state = newState;
    if (oldState !== newState && this.onStateChange) {
      this.onStateChange(this.name, newState, oldState);
    }
  }
}

export default CircuitBreaker;
