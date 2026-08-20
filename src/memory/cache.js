// ═══════════════════════════════════════════════════════════════
// 💾 Novarito Discord Bot — In-Memory High-Speed Cache
// ═══════════════════════════════════════════════════════════════

export class RAMMemoryCache {
  constructor(maxSizePerCategory = 500) {
    this.maxSize = maxSizePerCategory;
    this.users = new Map();
    this.guilds = new Map();
    this.topics = new Map();
    this.recentChat = new Map();
    this.assets = new Map();
  }

  getUser(userId) {
    return this.users.get(userId) || null;
  }

  setUser(userId, data) {
    if (this.users.size >= this.maxSize) {
      const firstKey = this.users.keys().next().value;
      this.users.delete(firstKey);
    }
    this.users.set(userId, { ...data, updatedAt: new Date().toISOString() });
  }

  appendUserFact(userId, fact) {
    const user = this.getUser(userId) || { facts: [], preferences: [], nicknames: [] };
    if (!user.facts) user.facts = [];
    if (!user.facts.includes(fact)) {
      user.facts.push(fact);
      if (user.facts.length > 40) user.facts.shift();
    }
    this.setUser(userId, user);
  }

  getGuild(guildId) {
    return this.guilds.get(guildId) || null;
  }

  setGuild(guildId, data) {
    if (this.guilds.size >= this.maxSize) {
      const firstKey = this.guilds.keys().next().value;
      this.guilds.delete(firstKey);
    }
    this.guilds.set(guildId, { ...data, updatedAt: new Date().toISOString() });
  }

  addRecentMessage(contextKey, role, content, authorName = '') {
    if (!this.recentChat.has(contextKey)) {
      this.recentChat.set(contextKey, []);
    }
    const list = this.recentChat.get(contextKey);
    list.push({ role, content, authorName, timestamp: Date.now() });
    if (list.length > 15) list.shift();
  }

  getRecentMessages(contextKey) {
    return this.recentChat.get(contextKey) || [];
  }

  addAsset(userId, asset) {
    if (!this.assets.has(userId)) {
      this.assets.set(userId, []);
    }
    this.assets.get(userId).push({
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...asset,
      createdAt: new Date().toISOString(),
    });
  }

  getAssets(userId, type = null) {
    const list = this.assets.get(userId) || [];
    if (type) {
      return list.filter(a => a.type === type);
    }
    return list;
  }

  clear() {
    this.users.clear();
    this.guilds.clear();
    this.topics.clear();
    this.recentChat.clear();
    this.assets.clear();
  }
}

export default RAMMemoryCache;
