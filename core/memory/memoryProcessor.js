// ═══════════════════════════════════════════════════════════════
// ⚙️ Memory Processor: Distributed Background Memory Worker
// ═══════════════════════════════════════════════════════════════

import { analyzeAndCategorizeMemory } from '../../services/ai/memoryEngine.js';
import {
  updateUserProfile,
  appendUserTopic,
  appendUserArea,
  updateUserIdentity
} from './realtimeMemory.js';

const pendingProcessing = new Set();

/**
 * Procesa el mensaje del usuario en segundo plano y distribuye la memoria en:
 * - Perfil (Hechos, gustos)
 * - Temas (Topics)
 * - Áreas (Projects, games)
 * - Identidades (Roles, apodos)
 */
export function processMessageInMemoryAsync(userId, userMessage, { username = 'Usuario', displayName = null } = {}) {
  if (pendingProcessing.has(userId)) return;
  pendingProcessing.add(userId);

  setTimeout(async () => {
    try {
      // 1. Actualizar siempre la identidad básica (nombres, apodos, actividad)
      await updateUserIdentity(userId, { username, displayName });

      // 2. Extraer categorización con la IA dedicada
      const analyzed = await analyzeAndCategorizeMemory(userMessage, displayName || username);
      if (!analyzed) return;

      // 3. Guardar hechos y preferencias en el perfil
      if ((analyzed.facts && analyzed.facts.length > 0) || (analyzed.preferences && analyzed.preferences.length > 0)) {
        await updateUserProfile(userId, {
          name: username,
          nickname: displayName,
          newFacts: analyzed.facts || [],
          newPreferences: analyzed.preferences || []
        });
      }

      // 4. Guardar tema si fue identificado
      if (analyzed.topic && analyzed.topic.length > 2) {
        await appendUserTopic(userId, {
          title: analyzed.topic,
          lastSnippet: userMessage.slice(0, 150),
          updatedAt: new Date().toISOString()
        });
      }

      // 5. Guardar área si fue mencionada
      if (analyzed.area && analyzed.area.length > 2) {
        await appendUserArea(userId, {
          name: analyzed.area,
          context: userMessage.slice(0, 150)
        });
      }

      // 6. Actualizar rol en la dimensión si se detectó
      if (analyzed.roleStatus) {
        await updateUserIdentity(userId, { roleStatus: analyzed.roleStatus });
      }

    } catch (err) {
      console.warn(`[memoryProcessor] Error procesando memoria distribuida para ${userId}:`, err.message);
    } finally {
      pendingProcessing.delete(userId);
    }
  }, 50);
}

export default { processMessageInMemoryAsync };
