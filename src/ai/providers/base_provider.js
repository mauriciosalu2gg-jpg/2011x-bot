// ═══════════════════════════════════════════════════════════════
// 🤖 Novarito Discord Bot — Base AI Provider Class
// ═══════════════════════════════════════════════════════════════

export class BaseProvider {
  constructor(name = 'BaseProvider', apiKey = null, options = {}) {
    this.name = name;
    this.apiKey = apiKey;
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownDurationMs = options.cooldownDurationMs || 60000;
    this.cooldownUntil = 0;
    this.consecutiveFailures = 0;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.state = 'CLOSED';
  }

  isReady() {
    return this.isAvailable();
  }

  isAvailable() {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.cooldownUntil) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  setCooldown(durationMs = 60000) {
    this.state = 'OPEN';
    this.consecutiveFailures++;
    this.cooldownUntil = Date.now() + durationMs;
  }

  resetCooldown() {
    this.reset();
  }

  reset() {
    this.state = 'CLOSED';
    this.cooldownUntil = 0;
    this.consecutiveFailures = 0;
  }

  recordSuccess() {
    this.totalRequests++;
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
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
    }
  }

  getRemainingCooldownMs() {
    return Math.max(0, this.cooldownUntil - Date.now());
  }
}

export default BaseProvider;
