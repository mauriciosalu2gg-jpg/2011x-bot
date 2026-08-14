// ═══════════════════════════════════════════════════════════════
// 🩸 2011X Rage Meter System — Medidor de Furia Invisible (0% a 100%)
// - Se llena más rápido si varias personas lo atacan/insultan en grupo
// - Al llegar al 100%, activa el Modo Furia
// - La Furia dura exactamente 1 minuto (60s) y se descarga a 0% para reiniciar
// ═══════════════════════════════════════════════════════════════

import { rtdb } from '../../database/firebase.js';

const rageRamStore = new Map();
// Registro de atacantes recientes por canal/servidor en los últimos 2 minutos
const recentAttackersWindow = new Map(); // key: scope -> Map<userId, timestamp>

/**
 * Obtiene el estado actual de furia para un scope (usuario o servidor).
 */
export async function getUserRageState(scopeId) {
  if (rtdb) {
    try {
      const snapshot = await rtdb.ref(`memory/rage/${scopeId}`).once('value');
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (err) {
      // fallback a RAM
    }
  }

  if (!rageRamStore.has(scopeId)) {
    rageRamStore.set(scopeId, {
      percentage: 0,
      rageActive: false,
      rageExpiresAt: 0,
      lastUpdated: Date.now()
    });
  }
  return rageRamStore.get(scopeId);
}

/**
 * Calcula el multiplicador de grupo según cuántos usuarios distintos han atacado recientemente.
 */
function getGroupMultiplier(scopeId, userId) {
  const now = Date.now();
  if (!recentAttackersWindow.has(scopeId)) {
    recentAttackersWindow.set(scopeId, new Map());
  }

  const attackersMap = recentAttackersWindow.get(scopeId);
  attackersMap.set(userId, now);

  // Limpiar atacantes de hace más de 2 minutos
  for (const [id, time] of attackersMap.entries()) {
    if (now - time > 120000) {
      attackersMap.delete(id);
    }
  }

  const activeCount = attackersMap.size;
  if (activeCount >= 3) return 2.0; // 3 o más personas: 200% de velocidad de carga
  if (activeCount === 2) return 1.5; // 2 personas: 150% de velocidad de carga
  return 1.0; // 1 persona: velocidad estándar
}

/**
 * Procesa el mensaje del usuario y actualiza el medidor de furia internamente.
 * Retorna { ragePercentage, isRageJustTriggered, isRageActive, secondsLeft }
 */
export async function processRageFromMessage(userId, messageContent, guildId = null) {
  const scopeId = guildId || userId;
  const state = await getUserRageState(scopeId);
  const now = Date.now();
  const text = (messageContent || '').toLowerCase();

  // 1. Verificar si el Modo Furia está activo y si ya pasó el minuto (60 segundos)
  if (state.rageActive) {
    if (now >= state.rageExpiresAt) {
      // Pasó el minuto: Se apaga la furia y la barra regresa a 0%
      state.rageActive = false;
      state.percentage = 0;
      state.rageExpiresAt = 0;
      state.lastUpdated = now;
      await saveRageState(scopeId, state);

      return {
        ragePercentage: 0,
        isRageJustTriggered: false,
        isRageActive: false,
        secondsLeft: 0
      };
    }

    // Aún está dentro del minuto de Furia
    const secondsLeft = Math.max(1, Math.round((state.rageExpiresAt - now) / 1000));
    return {
      ragePercentage: 100,
      isRageJustTriggered: false,
      isRageActive: true,
      secondsLeft
    };
  }

  // 2. Detección de disparadores de ira
  const isAttack = /\*(?:le\s+|te\s+)?(?:pega|golpea|dispara|acuchilla|apuñala|patea|tira|empuja|ataca|daña|corta|quema|revienta|parte|martillazo)\*|te\s+(?:pego|golpeo|disparo|apuesto|mato|parto)|drop\s*dash|spindash|martillo|chaos\s*spear/i.test(text);
  const isHeavyInsult = /c[aá]llate|est[uú]pido|in[uú]til|idiota|pendejo|mierda|puto|puta|perra|maldito|imb[eé]cil|tarado|asqueroso|basura|mu[eé]rete/i.test(text);
  const isTaunt = /eres\s+(?:d[eé]bil|malo|falso|in[uú]til)|no\s+puedes|te\s+gano|le\s+dir[eé]\s+a|miedoso|cobarde/i.test(text);

  let baseRage = 0;
  if (isAttack) baseRage += 35; // Golpes llenan base 35%
  if (isHeavyInsult) baseRage += 30; // Insultos base 30%
  if (isTaunt) baseRage += 15; // Provocaciones base 15%

  if (baseRage > 0) {
    // Aplicar multiplicador por grupo (más personas = barra se llena más rápido)
    const multiplier = getGroupMultiplier(scopeId, userId);
    const finalAdded = Math.round(baseRage * multiplier);
    state.percentage = Math.min(100, (state.percentage || 0) + finalAdded);
  } else {
    // Enfriamiento natural si no hubo ataques en 5 minutos
    const elapsedMinutes = (now - (state.lastUpdated || now)) / 60000;
    if (elapsedMinutes > 5) {
      state.percentage = Math.max(0, (state.percentage || 0) - 15);
    }
  }

  // 3. Comprobar si llegó al 100% para activar Modo Furia por 1 minuto (60s)
  let isRageJustTriggered = false;
  if (state.percentage >= 100) {
    state.rageActive = true;
    state.percentage = 100;
    state.rageExpiresAt = now + 60000; // 1 minuto exacto (60 segundos)
    isRageJustTriggered = true;
  }

  state.lastUpdated = now;
  await saveRageState(scopeId, state);

  const secondsLeft = state.rageActive ? Math.max(1, Math.round((state.rageExpiresAt - now) / 1000)) : 0;

  return {
    ragePercentage: state.percentage,
    isRageJustTriggered,
    isRageActive: state.rageActive,
    secondsLeft
  };
}

async function saveRageState(scopeId, state) {
  rageRamStore.set(scopeId, state);
  if (rtdb) {
    try {
      await rtdb.ref(`memory/rage/${scopeId}`).set(state);
    } catch (err) {
      // ignore rtdb errors
    }
  }
}

export default { getUserRageState, processRageFromMessage };
