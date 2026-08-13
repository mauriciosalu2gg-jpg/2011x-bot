// ═══════════════════════════════════════════════════════════════
// 💾 Firebase Realtime Database Memory Manager
// Árbol Distribuido Categorizado Estilo Claude:
// ├── /memory/users/{userId}           (Perfil: nombres, apodos, hechos, gustos)
// ├── /memory/topics/{userId}          (Temas detectados y cerrados con resumen)
// ├── /memory/areas/{userId}           (Áreas de interés, proyectos, servidores)
// ├── /memory/historial/{userId_scope} (Historial de mensajes rotativo)
// └── /memory/identities/{userId}      (Mapeo de identidades y rol en la dimensión)
// ═══════════════════════════════════════════════════════════════

import { rtdb } from '../../database/firebase.js';

// Memoria de respaldo en RAM por si no hay conexión a Firebase
const memoryFallback = {
  users: new Map(),
  topics: new Map(),
  areas: new Map(),
  historial: new Map(),
  identities: new Map(),
};

function getLocalUserFallback(userId) {
  if (!memoryFallback.users.has(userId)) {
    memoryFallback.users.set(userId, {
      discordId: userId,
      names: [],
      nicknames: [],
      facts: [],
      preferences: [],
      updatedAt: new Date().toISOString()
    });
  }
  return memoryFallback.users.get(userId);
}

// ── 1. USUARIOS & PERFILES (/memory/users/{userId}) ───────────

export async function getUserProfile(userId) {
  if (!rtdb) return getLocalUserFallback(userId);

  try {
    const snapshot = await rtdb.ref(`memory/users/${userId}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        discordId: userId,
        names: Array.isArray(data.names) ? data.names : (data.names ? Object.values(data.names) : []),
        nicknames: Array.isArray(data.nicknames) ? data.nicknames : (data.nicknames ? Object.values(data.nicknames) : []),
        facts: Array.isArray(data.facts) ? data.facts : (data.facts ? Object.values(data.facts) : []),
        preferences: Array.isArray(data.preferences) ? data.preferences : (data.preferences ? Object.values(data.preferences) : []),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    return getLocalUserFallback(userId);
  } catch (err) {
    console.warn(`[memory/users] Error leyendo perfil de ${userId}:`, err.message);
    return getLocalUserFallback(userId);
  }
}

export async function updateUserProfile(userId, { name, nickname, newFacts = [], newPreferences = [] } = {}) {
  const profile = await getUserProfile(userId);

  if (name && !profile.names.includes(name)) profile.names.push(name);
  if (nickname && !profile.nicknames.includes(nickname)) profile.nicknames.push(nickname);

  for (const f of newFacts) {
    if (!profile.facts.some(ef => ef.toLowerCase() === f.toLowerCase())) {
      profile.facts.push(f);
    }
  }

  for (const p of newPreferences) {
    if (!profile.preferences.some(ep => ep.toLowerCase() === p.toLowerCase())) {
      profile.preferences.push(p);
    }
  }

  profile.facts = profile.facts.slice(-40);
  profile.preferences = profile.preferences.slice(-30);
  profile.updatedAt = new Date().toISOString();

  if (!rtdb) {
    memoryFallback.users.set(userId, profile);
    return profile;
  }

  try {
    await rtdb.ref(`memory/users/${userId}`).set(profile);
  } catch (err) {
    console.error(`[memory/users] Error guardando perfil de ${userId}:`, err.message);
  }
  return profile;
}

// ── 2. TEMAS (/memory/topics/{userId}) ────────────────────────

export async function getUserTopics(userId) {
  if (!rtdb) return memoryFallback.topics.get(userId) || [];

  try {
    const snapshot = await rtdb.ref(`memory/topics/${userId}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
    return [];
  } catch (err) {
    console.warn(`[memory/topics] Error leyendo topics de ${userId}:`, err.message);
    return [];
  }
}

export async function appendUserTopic(userId, topic) {
  if (!topic || !topic.title) return;
  const currentTopics = await getUserTopics(userId);
  const exists = currentTopics.some(t => t.title.toLowerCase() === topic.title.toLowerCase());
  
  const updatedList = exists
    ? currentTopics.map(t => t.title.toLowerCase() === topic.title.toLowerCase() ? { ...t, ...topic, updatedAt: new Date().toISOString() } : t)
    : [...currentTopics, { ...topic, createdAt: new Date().toISOString() }];

  const trimmed = updatedList.slice(-20);

  if (!rtdb) {
    memoryFallback.topics.set(userId, trimmed);
    return;
  }

  try {
    await rtdb.ref(`memory/topics/${userId}`).set(trimmed);
  } catch (err) {
    console.error(`[memory/topics] Error guardando tema para ${userId}:`, err.message);
  }
}

// ── 3. ÁREAS Y PROYECTOS (/memory/areas/{userId}) ──────────────

export async function getUserAreas(userId) {
  if (!rtdb) return memoryFallback.areas.get(userId) || [];

  try {
    const snapshot = await rtdb.ref(`memory/areas/${userId}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function appendUserArea(userId, area) {
  if (!area || !area.name) return;
  const currentAreas = await getUserAreas(userId);
  const exists = currentAreas.some(a => a.name.toLowerCase() === area.name.toLowerCase());
  const updatedList = exists
    ? currentAreas.map(a => a.name.toLowerCase() === area.name.toLowerCase() ? { ...a, ...area } : a)
    : [...currentAreas, { ...area, updatedAt: new Date().toISOString() }];

  const trimmed = updatedList.slice(-15);
  if (!rtdb) {
    memoryFallback.areas.set(userId, trimmed);
    return;
  }
  try {
    await rtdb.ref(`memory/areas/${userId}`).set(trimmed);
  } catch (err) {
    console.error(`[memory/areas] Error guardando área para ${userId}:`, err.message);
  }
}

// ── 4. HISTORIAL DE CONVERSACIÓN (/memory/historial/{scope}) ───

function getHistorialKey(userId, guildId) {
  return `${userId}_${guildId || 'direct'}`;
}

export async function getConversationHistory(userId, guildId = null) {
  const key = getHistorialKey(userId, guildId);
  if (!rtdb) return memoryFallback.historial.get(key) || [];

  try {
    const snapshot = await rtdb.ref(`memory/historial/${key}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Array.isArray(data) ? data : Object.values(data);
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function appendConversationMessage(userId, role, content, guildId = null) {
  const key = getHistorialKey(userId, guildId);
  const newMsg = {
    role,
    content,
    createdAt: new Date().toISOString()
  };

  const history = await getConversationHistory(userId, guildId);
  history.push(newMsg);
  const trimmed = history.slice(-25); // Últimos 25 mensajes

  if (!rtdb) {
    memoryFallback.historial.set(key, trimmed);
    return;
  }

  try {
    await rtdb.ref(`memory/historial/${key}`).set(trimmed);
  } catch (err) {
    console.error(`[memory/historial] Error guardando historial de ${key}:`, err.message);
  }
}

// ── 5. IDENTIDADES Y ROL (/memory/identities/{userId}) ──────────

export async function getUserIdentity(userId) {
  if (!rtdb) return memoryFallback.identities.get(userId) || null;

  try {
    const snapshot = await rtdb.ref(`memory/identities/${userId}`).once('value');
    return snapshot.exists() ? snapshot.val() : null;
  } catch (err) {
    return null;
  }
}

export async function updateUserIdentity(userId, { username, displayName, roleStatus = 'Juguete Mortal', threatLevel = 'Bajo' } = {}) {
  const existing = (await getUserIdentity(userId)) || {
    discordId: userId,
    usernames: [],
    displayNames: [],
    roleStatus,
    threatLevel,
    firstEncounter: new Date().toISOString()
  };

  if (username && !existing.usernames.includes(username)) existing.usernames.push(username);
  if (displayName && !existing.displayNames.includes(displayName)) existing.displayNames.push(displayName);
  existing.roleStatus = roleStatus || existing.roleStatus;
  existing.threatLevel = threatLevel || existing.threatLevel;
  existing.lastSeen = new Date().toISOString();

  if (!rtdb) {
    memoryFallback.identities.set(userId, existing);
    return existing;
  }

  try {
    await rtdb.ref(`memory/identities/${userId}`).set(existing);
  } catch (err) {
    console.error(`[memory/identities] Error guardando identidad de ${userId}:`, err.message);
  }
  return existing;
}

// ── CONSULTA INTEGRADA PARA EL MOTOR DE CHAT ───────────────────

export async function getFullDistributedMemory(userId, guildId = null) {
  const [profile, topics, areas, history, identity] = await Promise.all([
    getUserProfile(userId),
    getUserTopics(userId),
    getUserAreas(userId),
    getConversationHistory(userId, guildId),
    getUserIdentity(userId),
  ]);

  return {
    profile,
    topics,
    areas,
    messages: history,
    identity,
    facts: profile.facts || [],
    preferences: profile.preferences || []
  };
}

// ── PURGA DE MEMORIA (/memory/*/{userId}) ──────────────────────

export async function purgeEntireUserMemory(userId, guildId = null) {
  const histKey = getHistorialKey(userId, guildId);

  memoryFallback.users.delete(userId);
  memoryFallback.topics.delete(userId);
  memoryFallback.areas.delete(userId);
  memoryFallback.historial.delete(histKey);
  memoryFallback.identities.delete(userId);

  if (rtdb) {
    try {
      await Promise.all([
        rtdb.ref(`memory/users/${userId}`).remove(),
        rtdb.ref(`memory/topics/${userId}`).remove(),
        rtdb.ref(`memory/areas/${userId}`).remove(),
        rtdb.ref(`memory/historial/${histKey}`).remove(),
        rtdb.ref(`memory/identities/${userId}`).remove(),
      ]);
      return { success: true };
    } catch (err) {
      console.error(`[memory/purge] Error purgando memoria de ${userId}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: true };
}

export default {
  getUserProfile,
  updateUserProfile,
  getUserTopics,
  appendUserTopic,
  getUserAreas,
  appendUserArea,
  getConversationHistory,
  appendConversationMessage,
  getUserIdentity,
  updateUserIdentity,
  getFullDistributedMemory,
  purgeEntireUserMemory,
};
