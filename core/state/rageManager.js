// ═══════════════════════════════════════════════════════════════
// 🩸 2011X Rage Meter System — Medidor Interno de Furia (0% a 100%)
// El porcentaje es INVISIBLE para el usuario; se llena con golpes e insultos
// Al llegar al 100%, desata el Modo Furia con defensa implacable y hostilidad
// ═══════════════════════════════════════════════════════════════

import { rtdb } from '../../database/firebase.js';

const rageRamStore = new Map();

/**
 * Obtiene el estado actual de furia para un usuario.
 */
export async function getUserRageState(userId) {
  if (rtdb) {
    try {
      const snapshot = await rtdb.ref(`memory/rage/${userId}`).once('value');
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (err) {
      // fallback a RAM
    }
  }

  if (!rageRamStore.has(userId)) {
    rageRamStore.set(userId, {
      percentage: 0,
      rageActive: false,
      rageTurnsLeft: 0,
      lastUpdated: Date.now()
    });
  }
  return rageRamStore.get(userId);
}

/**
 * Procesa el mensaje del usuario y actualiza el medidor de furia internamente.
 * Retorna { ragePercentage, isRageJustTriggered, isRageActive }
 */
export async function processRageFromMessage(userId, messageContent) {
  const state = await getUserRageState(userId);
  const text = (messageContent || '').toLowerCase();

  // Si el modo furia ya estaba activo, reducir turnos
  if (state.rageActive) {
    state.rageTurnsLeft = Math.max(0, (state.rageTurnsLeft || 1) - 1);
    if (state.rageTurnsLeft <= 0) {
      state.rageActive = false;
      state.percentage = 0; // Se enfría tras el desahogo
    }
    await saveRageState(userId, state);
    return {
      ragePercentage: state.percentage,
      isRageJustTriggered: false,
      isRageActive: state.rageActive
    };
  }

  // Detectar ataques en rol o daño físico
  const isAttack = /\*(?:le\s+|te\s+)?(?:pega|golpea|dispara|acuchilla|apuñala|patea|tira|empuja|ataca|daña|corta|quema|revienta|parte|martillazo)\*|te\s+(?:pego|golpeo|disparo|apuesto|mato|parto)|drop\s*dash|spindash|martillo|chaos\s*spear/i.test(text);

  // Detectar insultos o groserías
  const isHeavyInsult = /c[aá]llate|est[uú]pido|in[uú]til|idiota|pendejo|mierda|puto|puta|perra|maldito|imb[eé]cil|tarado|asqueroso|basura|mu[eé]rete/i.test(text);

  // Detectar provocaciones o desafíos
  const isTaunt = /eres\s+(?:d[eé]bil|malo|falso|in[uú]til)|no\s+puedes|te\s+gano|le\s+dir[eé]\s+a|miedoso|cobarde/i.test(text);

  let addedRage = 0;
  if (isAttack) addedRage += 35; // Golpes llenan mucho la barra
  if (isHeavyInsult) addedRage += 30; // Insultos llenan 30%
  if (isTaunt) addedRage += 15; // Provocaciones llenan 15%

  // Enfriamiento natural si no hubo provocaciones
  if (addedRage === 0) {
    const elapsedMinutes = (Date.now() - (state.lastUpdated || Date.now())) / 60000;
    if (elapsedMinutes > 5) {
      state.percentage = Math.max(0, state.percentage - 15);
    }
  } else {
    state.percentage = Math.min(100, (state.percentage || 0) + addedRage);
  }

  let isRageJustTriggered = false;
  if (state.percentage >= 100) {
    state.rageActive = true;
    state.rageTurnsLeft = 2; // Dura 2 turnos de furia extrema
    isRageJustTriggered = true;
  }

  state.lastUpdated = Date.now();
  await saveRageState(userId, state);

  return {
    ragePercentage: state.percentage,
    isRageJustTriggered,
    isRageActive: state.rageActive
  };
}

async function saveRageState(userId, state) {
  rageRamStore.set(userId, state);
  if (rtdb) {
    try {
      await rtdb.ref(`memory/rage/${userId}`).set(state);
    } catch (err) {
      // ignore rtdb errors
    }
  }
}

export default { getUserRageState, processRageFromMessage };
