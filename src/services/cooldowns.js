// ═══════════════════════════════════════════════════════════════
// ⏱️ Novarito Discord Bot — User & Command Cooldowns Manager
// ═══════════════════════════════════════════════════════════════

export class CooldownsManager {
  constructor() {
    this.cooldowns = new Map();
  }

  checkCooldown(userId, action = 'chat', durationMs = 2000) {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const lastUsed = this.cooldowns.get(key) || 0;

    if (now - lastUsed < durationMs) {
      const remainingMs = durationMs - (now - lastUsed);
      return { onCooldown: true, remainingMs, remainingSec: (remainingMs / 1000).toFixed(1) };
    }

    this.cooldowns.set(key, now);
    return { onCooldown: false, remainingMs: 0, remainingSec: '0.0' };
  }

  reset(userId, action = null) {
    if (action) {
      this.cooldowns.delete(`${userId}:${action}`);
    } else {
      for (const k of this.cooldowns.keys()) {
        if (k.startsWith(`${userId}:`)) this.cooldowns.delete(k);
      }
    }
  }
}

export default CooldownsManager;
