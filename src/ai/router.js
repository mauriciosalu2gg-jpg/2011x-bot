// ═══════════════════════════════════════════════════════════════
// 🧭 Novarito Discord Bot — Resilient Multi-Provider AI Router
// Groq -> OpenRouter -> Hugging Face -> Local Fallback
// ═══════════════════════════════════════════════════════════════

import config from '../core/config.js';
import Logger from '../core/logger.js';
import { GroqProvider } from './groqProvider.js';
import { OpenRouterProvider } from './openRouterProvider.js';
import { HuggingFaceProvider } from './huggingFaceProvider.js';
import { LocalFallbackEngine } from './localFallback.js';

export const TaskType = {
  CASUAL: 'CASUAL',
  COMPLEX: 'COMPLEX',
  REASONING: 'REASONING',
  CODE: 'CODE',
};

export class AIRouter {
  constructor(options = {}) {
    this.groq = new GroqProvider(options.groqApiKey || config.ai.groqApiKey);
    this.openRouter = new OpenRouterProvider(options.openRouterApiKey || config.ai.openRouterApiKey);
    this.huggingFace = new HuggingFaceProvider(options.huggingFaceApiKey || config.ai.huggingFaceApiKey);
    this.localFallback = new LocalFallbackEngine();
    this.onFailover = options.onFailover || null;
  }

  classifyTask(userPrompt) {
    const text = String(userPrompt || '').toLowerCase();

    // Detección de razonamiento profundo o deducción matemática/lógica
    if (
      /(piensa profundamente|razona paso a paso|analisis exhaustivo|demuestra matematicamente|arquitectura de software avanzada|deep reasoning)/i.test(text) ||
      (text.length > 400 && /(diseña|compara en detalle|resuelve este enigma|calcula)/i.test(text))
    ) {
      return TaskType.REASONING;
    }

    // Detección de código y programación
    if (/(escribe un script|corrige este error|refactoriza|funcion en luau|codigo python|typescript|sql query|debuggea)/i.test(text)) {
      return TaskType.CODE;
    }

    // Tarea analítica compleja o texto largo
    if (text.length > 250 || /(explica la diferencia|resume este texto largo|guia completa|ensayo)/i.test(text)) {
      return TaskType.COMPLEX;
    }

    // Chat casual o normal
    return TaskType.CASUAL;
  }

  getExecutionChain(taskType) {
    const chain = [];

    if (taskType === TaskType.REASONING) {
      if (this.groq.isReady()) {
        chain.push({ provider: this.groq, model: config.ai.models.groqReasoning, isDeep: true });
        chain.push({ provider: this.groq, model: 'llama-3.3-70b-versatile', isDeep: true });
      }
      if (this.openRouter.isReady()) {
        chain.push({ provider: this.openRouter, model: config.ai.models.openRouterReasoning, isDeep: true });
        chain.push({ provider: this.openRouter, model: 'google/gemini-2.0-flash-exp:free', isDeep: true });
      }
      if (this.groq.isReady()) {
        chain.push({ provider: this.groq, model: 'llama3-70b-8192', isDeep: false });
        chain.push({ provider: this.groq, model: 'llama3-8b-8192', isDeep: false });
      }
      if (this.openRouter.isReady()) {
        chain.push({ provider: this.openRouter, model: 'meta-llama/llama-3.2-3b-instruct:free', isDeep: false });
      }
    } else if (taskType === TaskType.CODE || taskType === TaskType.COMPLEX) {
      if (this.groq.isReady()) {
        chain.push({ provider: this.groq, model: config.ai.models.primaryGroq, isDeep: false });
        chain.push({ provider: this.groq, model: 'llama3-70b-8192', isDeep: false });
      }
      if (this.openRouter.isReady()) {
        chain.push({ provider: this.openRouter, model: config.ai.models.openRouterCode || 'qwen/qwen-2.5-coder-32b-instruct:free', isDeep: false });
        chain.push({ provider: this.openRouter, model: config.ai.models.openRouterFast, isDeep: false });
        chain.push({ provider: this.openRouter, model: 'google/gemini-2.0-flash-exp:free', isDeep: false });
      }
      if (this.groq.isReady()) {
        chain.push({ provider: this.groq, model: 'llama3-8b-8192', isDeep: false });
      }
    } else {
      // Chat casual
      if (this.openRouter.isReady()) {
        chain.push({ provider: this.openRouter, model: config.ai.models.openRouterFast, isDeep: false });
        chain.push({ provider: this.openRouter, model: config.ai.models.openRouterLight, isDeep: false });
        chain.push({ provider: this.openRouter, model: 'meta-llama/llama-3.2-1b-instruct:free', isDeep: false });
      }
      if (this.groq.isReady()) {
        chain.push({ provider: this.groq, model: config.ai.models.primaryGroq, isDeep: false });
        chain.push({ provider: this.groq, model: 'llama3-8b-8192', isDeep: false });
        chain.push({ provider: this.groq, model: 'gemma2-9b-it', isDeep: false });
      }
      if (this.huggingFace.isReady()) {
        chain.push({ provider: this.huggingFace, model: config.ai.models.huggingFace, isDeep: false });
      }
    }

    // Siempre añadir LocalFallback como último recurso salvaguarda
    chain.push({ provider: this.localFallback, model: 'local-heuristic', isDeep: false });

    return chain;
  }

  async executeWithFallback(messages, statusManager = null, userPrompt = '') {
    const taskType = this.classifyTask(userPrompt);
    const chain = this.getExecutionChain(taskType);

    let lastError = null;

    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      const isFallback = i > 0;

      // Si conmutamos por fallo del anterior, actualizar UI a RECOVERING
      if (isFallback) {
        Logger.warn('AIRouter', `Failover activado: Conmutando a [${step.provider.name}] (${step.model})`);
        if (this.onFailover) {
          this.onFailover(chain[i - 1].provider.name, step.provider.name);
        }
        if (statusManager && typeof statusManager.setRecovering === 'function') {
          await statusManager.setRecovering(step.provider.name);
        }
      }

      // Configurar animación de estado inicial si no es fallback
      if (!isFallback && statusManager) {
        if (step.isDeep && typeof statusManager.setDeepThinking === 'function') {
          await statusManager.setDeepThinking();
        } else if (typeof statusManager.setThinking === 'function') {
          await statusManager.setThinking();
        }
      }

      try {
        Logger.debug('AIRouter', `Ejecutando [${step.provider.name}] con modelo ${step.model} (Paso ${i + 1}/${chain.length})`);
        const result = await step.provider.generateChat(messages, {
          model: step.model,
          timeoutMs: config.ai.timeoutMs,
        });

        if (result && result.text) {
          return {
            ...result,
            isDeep: step.isDeep,
            taskType,
            attempts: i + 1,
          };
        }
      } catch (err) {
        Logger.warn('AIRouter', `Fallo en proveedor ${step.provider.name} (${step.model}): ${err.message}`);
        lastError = err;
      }
    }

    // Si todo falla (incluso local), devolver mensaje de seguridad
    return {
      text: 'No pude procesar tu mensaje en este momento debido a saturación temporal de proveedores.',
      model: 'safety-fallback',
      provider: 'SafetyFallback',
      isDeep: false,
      taskType,
    };
  }
}

export default AIRouter;
