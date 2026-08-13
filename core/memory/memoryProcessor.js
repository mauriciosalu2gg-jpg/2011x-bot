// ═══════════════════════════════════════════════════════════════
// ⚙️ Memory Processor: Asynchronous Background Memory Worker
// ═══════════════════════════════════════════════════════════════

import { extractFactsWithAI } from '../../services/ai/memoryEngine.js';
import { appendUserFacts } from './realtimeMemory.js';

const pendingProcessing = new Set();

/**
 * Procesa el mensaje del usuario en segundo plano para extraer hechos y guardarlos en Realtime Database.
 */
export function processMessageInMemoryAsync(userId, userMessage, username = 'Usuario') {
  if (pendingProcessing.has(userId)) return;
  pendingProcessing.add(userId);

  setTimeout(async () => {
    try {
      const extractedFacts = await extractFactsWithAI(userMessage, username);
      if (extractedFacts.length > 0) {
        await appendUserFacts(userId, extractedFacts);
      }
    } catch (err) {
      console.warn(`[memoryProcessor] Error procesando memoria en background para ${userId}:`, err.message);
    } finally {
      pendingProcessing.delete(userId);
    }
  }, 50);
}

export default { processMessageInMemoryAsync };
