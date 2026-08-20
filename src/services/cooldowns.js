// ═══════════════════════════════════════════════════════════════
// ⏱️ Novarito Discord Bot — User & Channel Cooldowns Manager
// ═══════════════════════════════════════════════════════════════

import config from '../core/config.js';

export class CooldownsManager {
  constructor() {
    this.cooldowns = new Map();
  }

  _getKey(id, context = 'chat') {
    return `${context}:${id}`;
  }

  isOwner(userId) {
    return config.discord.ownerId && userId === config.discord.ownerId;
  }

  checkCooldown(userId, context = 'chat', durationMs = 2000) {
    if (this.isOwner(userId)) return { onCooldown: false, remainingMs: 0 };

    const key = this._getKey(userId, context);
    const now = Date.now();
    const expiresAt = this.cooldowns.get(key) || 0;

    if (now < expiresAt) {
      return {
        onCooldown: true,
        remainingMs: expiresAt - now,
        remainingSec: ((expiresAt - now) / 1000).toFixed(1),
      };
    }

    this.cooldowns.set(key, now + durationMs);
    return { onCooldown: false, remainingMs: 0 };
  }

  getRemainingMs(userId, context = 'chat') {
    const key = this._getKey(userId, context);
    const now = Date.now();
    const expiresAt = this.cooldowns.get(key) || 0;
    return Math.max(0, expiresAt - now);
  }

  clear(userId, context = null) {
    if (context) {
      this.cooldowns.delete(this._getKey(userId, context));
    } else {
      for (const k of this.cooldowns.keys()) {
        if (k.endsWith(`:${userId}`)) {
          this.cooldowns.delete(k);
        }
      }
    }
  }

  sweep() {
    const now = Date.now();
    for (const [key, expiresAt] of this.cooldowns.entries()) {
      if (now >= expiresAt) {
        this.cooldowns.delete(key);
      }
    }
  }
}

export default CooldownsManager;
