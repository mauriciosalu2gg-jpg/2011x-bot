// ═══════════════════════════════════════════════════════════════
// 🧠 Novarito Discord Bot — Dual Memory Engine
// ═══════════════════════════════════════════════════════════════

import { RAMMemoryCache } from './cache.js';
import { RealtimeDatabaseClient } from './realtimeDatabase.js';
import { MemoryProcessorQueue } from './memoryProcessor.js';
import Logger from '../core/logger.js';

export class MemoryEngine {
  constructor() {
    this.cache = new RAMMemoryCache();
    this.rtdb = new RealtimeDatabaseClient();
    this.processor = new MemoryProcessorQueue(this);
  }

  get localCache() {
    return this.cache;
  }

  addRecentMessage(channelId, role, content, authorName = '') {
    this.cache.addRecentMessage(channelId, role, content, authorName);
  }

  getRecentMessages(channelId) {
    return this.cache.getRecentMessages(channelId);
  }

  async recallMemory(userId, guildId = null, queryText = '') {
    const memoryLines = [];

    if (this.rtdb.isReady && userId) {
      try {
        const userData = await this.rtdb.getUser(userId);
        if (userData) {
          const factsObj = userData.facts || userData;
          for (const key of Object.keys(factsObj)) {
            if (key === 'updatedAt' || key === 'savedAt') continue;
            const f = factsObj[key];
            const factText = typeof f === 'object' && f !== null ? f.fact : f;
            if (factText && typeof factText === 'string') {
              const line = factText.startsWith('[Usuario]:') ? factText : `[Usuario]: ${factText}`;
              if (!memoryLines.includes(line)) memoryLines.push(line);
            }
          }
        }
      } catch (err) {
        Logger.debug('MemoryEngine', `Fallo al recuperar usuario de RTDB: ${err.message}`);
      }
    }

    const localUser = this.cache.getUser(userId);
    if (localUser) {
      const rawFacts = Array.isArray(localUser) ? localUser : (localUser.facts || []);
      for (const fact of rawFacts) {
        const factText = typeof fact === 'object' && fact !== null ? fact.fact : String(fact);
        if (factText) {
          const line = factText.startsWith('[Usuario]:') ? factText : `[Usuario]: ${factText}`;
          if (!memoryLines.includes(line)) {
            memoryLines.push(line);
          }
        }
      }
    }

    if (guildId) {
      if (this.rtdb.isReady) {
        try {
          const guildData = await this.rtdb.getGuild(guildId);
          if (guildData) {
            const factsObj = guildData.facts || guildData;
            for (const key of Object.keys(factsObj)) {
              if (key === 'updatedAt' || key === 'savedAt') continue;
              const f = factsObj[key];
              const factText = typeof f === 'object' && f !== null ? f.fact : f;
              if (factText && typeof factText === 'string') {
                const line = factText.startsWith('[Servidor]:') ? factText : `[Servidor]: ${factText}`;
                if (!memoryLines.includes(line)) memoryLines.push(line);
              }
            }
          }
        } catch (err) {
          Logger.debug('MemoryEngine', `Fallo al recuperar servidor de RTDB: ${err.message}`);
        }
      }
    }

    if (memoryLines.length === 0) return '';
    return memoryLines.slice(-10).join('\n');
  }

  async saveFact(userId, guildId, fact) {
    if (!fact) return;
    this.cache.appendUserFact(userId, fact);
    if (this.rtdb.isReady) {
      await this.rtdb.saveUserFact(userId, fact);
    }
  }

  queueMemoryExtraction(userId, guildId, userText, botResponse) {
    this.processor.enqueue(userId, guildId, userText, botResponse);
  }

  async saveAsset(userId, assetData) {
    this.cache.addAsset(userId, assetData);
    if (this.rtdb.isReady) {
      return await this.rtdb.saveAsset(userId, assetData);
    }
    return true;
  }

  async getAssets(userId, type = null) {
    if (this.rtdb.isReady) {
      const rtdbAssets = await this.rtdb.getAssets(userId, type);
      if (rtdbAssets && rtdbAssets.length > 0) return rtdbAssets;
    }
    return this.cache.getAssets(userId, type);
  }
}

export default MemoryEngine;
