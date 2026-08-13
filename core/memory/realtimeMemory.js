// ═══════════════════════════════════════════════════════════════
// 💾 Firebase Realtime Database Memory Manager
// Ruta raíz: /memory/users/{userId} & /memory/guilds/{guildId}
// ═══════════════════════════════════════════════════════════════

import { rtdb } from '../../database/firebase.js';

// Memoria de respaldo en RAM por si no hay conexión a Firebase
const memoryFallback = new Map();

function getLocalFallback(userId) {
  if (!memoryFallback.has(userId)) {
    memoryFallback.set(userId, { messages: [], facts: [], summary: '', updatedAt: new Date().toISOString() });
  }
  return memoryFallback.get(userId);
}

/**
 * Obtiene la memoria completa de un usuario desde Realtime Database.
 */
export async function getUserMemory(userId, guildId = null) {
  if (!rtdb) {
    return getLocalFallback(userId);
  }

  try {
    const userRef = rtdb.ref(`memory/users/${userId}`);
    const snapshot = await userRef.once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        messages: Array.isArray(data.messages) ? data.messages : (data.messages ? Object.values(data.messages) : []),
        facts: Array.isArray(data.facts) ? data.facts : (data.facts ? Object.values(data.facts) : []),
        summary: data.summary || '',
        updatedAt: data.updatedAt || new Date().toISOString()
      };
    }
    return { messages: [], facts: [], summary: '', updatedAt: new Date().toISOString() };
  } catch (err) {
    console.warn(`[realtimeMemory] Error leyendo memoria de ${userId}:`, err.message);
    return getLocalFallback(userId);
  }
}

/**
 * Guarda o actualiza un mensaje en el historial del usuario.
 */
export async function appendUserMessage(userId, role, content, guildId = null) {
  const newMsg = {
    role,
    content,
    createdAt: new Date().toISOString(),
    guildId: guildId || 'direct'
  };

  if (!rtdb) {
    const mem = getLocalFallback(userId);
    mem.messages.push(newMsg);
    if (mem.messages.length > 25) mem.messages = mem.messages.slice(-25);
    return;
  }

  try {
    const userRef = rtdb.ref(`memory/users/${userId}`);
    const snapshot = await userRef.child('messages').once('value');
    let messages = [];
    if (snapshot.exists()) {
      const val = snapshot.val();
      messages = Array.isArray(val) ? val : Object.values(val);
    }
    messages.push(newMsg);
    if (messages.length > 30) {
      messages = messages.slice(-30);
    }

    await userRef.update({
      messages,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(`[realtimeMemory] Error guardando mensaje de ${userId}:`, err.message);
  }
}

/**
 * Guarda nuevos hechos extraídos en el perfil de memoria del usuario.
 */
export async function appendUserFacts(userId, newFacts = []) {
  if (!newFacts || newFacts.length === 0) return;

  if (!rtdb) {
    const mem = getLocalFallback(userId);
    for (const f of newFacts) {
      if (!mem.facts.some(existing => existing.toLowerCase() === f.toLowerCase())) {
        mem.facts.push(f);
      }
    }
    if (mem.facts.length > 40) mem.facts = mem.facts.slice(-40);
    return;
  }

  try {
    const userRef = rtdb.ref(`memory/users/${userId}`);
    const snapshot = await userRef.child('facts').once('value');
    let facts = [];
    if (snapshot.exists()) {
      const val = snapshot.val();
      facts = Array.isArray(val) ? val : Object.values(val);
    }

    for (const f of newFacts) {
      if (!facts.some(existing => existing.toLowerCase() === f.toLowerCase())) {
        facts.push(f);
      }
    }

    if (facts.length > 40) {
      facts = facts.slice(-40);
    }

    await userRef.update({
      facts,
      updatedAt: new Date().toISOString()
    });
    console.log(`[realtimeMemory] ✓ Hechos sincronizados en Realtime Database para ${userId}:`, newFacts);
  } catch (err) {
    console.error(`[realtimeMemory] Error guardando hechos de ${userId}:`, err.message);
  }
}

/**
 * Purga o reinicia la memoria de un usuario específico.
 */
export async function purgeUserMemory(userId) {
  memoryFallback.delete(userId);
  if (rtdb) {
    try {
      await rtdb.ref(`memory/users/${userId}`).remove();
      return { success: true };
    } catch (err) {
      console.error(`[realtimeMemory] Error purgando memoria de ${userId}:`, err.message);
      return { success: false, error: err.message };
    }
  }
  return { success: true };
}

export default { getUserMemory, appendUserMessage, appendUserFacts, purgeUserMemory };
