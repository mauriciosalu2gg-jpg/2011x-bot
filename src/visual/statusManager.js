// ═══════════════════════════════════════════════════════════════
// 🎭 Novarito Discord Bot — Central Status & Animation Manager
// ═══════════════════════════════════════════════════════════════

import { EMOJIS } from './emojis.js';
import { DotAnimator, DeepThinkingAnimator } from './animator.js';
import { ProcessingTimer } from './timer.js';
import Logger from '../core/logger.js';

export const StatusState = {
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  DEEP_THINKING: 'DEEP_THINKING',
  MEMORY_RECALL: 'MEMORY_RECALL',
  MEMORY_SAVE: 'MEMORY_SAVE',
  SERVER_CONTEXT: 'SERVER_CONTEXT',
  WEB_SEARCH: 'WEB_SEARCH',
  AI_SWITCH: 'AI_SWITCH',
  RECOVERING: 'RECOVERING',
  GENERATING: 'GENERATING',
  COMPLETED: 'COMPLETED',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
};

export class StatusManager {
  constructor(messageChannel, userMessage = null) {
    this.channel = messageChannel;
    this.userMessage = userMessage;
    this.statusMessage = null;
    this.currentState = StatusState.IDLE;

    this.timer = new ProcessingTimer();
    this.isDeepThinking = false;
    this._startedAt = null;

    this.lastEditContent = '';
    this.lastEditTime = 0;
    this.editPending = false;
    this.pendingContent = null;
    this.isDestroyed = false;

    this.dotAnimator = new DotAnimator((text) => this.queueEdit(text), 1000);
    this.deepAnimator = new DeepThinkingAnimator((text) => this.queueEdit(text), 500);
  }

  get startedAt() {
    return this._startedAt || (this.timer.startTime ? Date.now() - this.timer.getElapsedMs() : Date.now());
  }

  set startedAt(val) {
    this._startedAt = val;
    const elapsedMs = Math.max(0, Date.now() - val);
    this.timer.startTime = performance.now() - elapsedMs;
    this.timer.isRunning = true;
  }

  async init(initialEmoji = EMOJIS.pensar, initialLabel = 'Pensando') {
    try {
      this.timer.start();
      const initialText = `${initialEmoji} ${initialLabel}...`;
      if (this.userMessage && typeof this.userMessage.reply === 'function') {
        this.statusMessage = await this.userMessage.reply(initialText);
      } else if (this.channel && typeof this.channel.send === 'function') {
        this.statusMessage = await this.channel.send(initialText);
      }
      this.lastEditContent = initialText;
      this.lastEditTime = Date.now();
    } catch (err) {
      Logger.error('StatusManager', 'Error al enviar mensaje inicial de estado:', err);
    }
  }

  async setThinking() {
    this.currentState = StatusState.THINKING;
    this.isDeepThinking = false;
    this.deepAnimator.stop();
    this.dotAnimator.start(EMOJIS.pensar, 'Pensando');
  }

  async setDeepThinking() {
    this.currentState = StatusState.DEEP_THINKING;
    this.isDeepThinking = true;
    this.dotAnimator.stop();
    this.deepAnimator.start();
  }

  async setMemoryRecall(scope = 'global') {
    this.currentState = StatusState.MEMORY_RECALL;
    this.deepAnimator.stop();
    const emoji = scope === 'server' ? EMOJIS.servidor : EMOJIS.hojita;
    const label = scope === 'server' ? 'Consultando información del servidor' : 'Consultando memoria';
    this.dotAnimator.start(emoji, label);
  }

  async setMemorySave() {
    this.currentState = StatusState.MEMORY_SAVE;
    this.deepAnimator.stop();
    this.dotAnimator.start(EMOJIS.hojita, 'Guardando memoria');
  }

  async setServerContext() {
    this.currentState = StatusState.SERVER_CONTEXT;
    this.deepAnimator.stop();
    this.dotAnimator.start(EMOJIS.servidor, 'Consultando servidor');
  }

  async setWebSearch() {
    this.currentState = StatusState.WEB_SEARCH;
    this.deepAnimator.stop();
    this.dotAnimator.start(EMOJIS.pensar, 'Investigando');
  }

  async setRecovering(providerName = '') {
    this.currentState = StatusState.RECOVERING;
    this.deepAnimator.stop();
    const label = providerName ? `Reintentando con ${providerName}` : 'Reintentando';
    this.dotAnimator.start(EMOJIS.recuperar, label);
  }

  async setAiSwitch(targetModel = '') {
    this.currentState = StatusState.AI_SWITCH;
    this.deepAnimator.stop();
    const label = targetModel ? `Cambiando de IA (${targetModel})` : 'Cambiando de IA';
    this.dotAnimator.start(EMOJIS.recuperar, label);
  }

  async setWarning(warningText) {
    this.currentState = StatusState.WARNING;
    this.stopAll();
    await this.immediateEdit(`${EMOJIS.advertencia} ${warningText}`);
  }

  async setError(errorText = 'No pude completar la solicitud en este momento.') {
    this.currentState = StatusState.ERROR;
    this.stopAll();
    await this.immediateEdit(`${EMOJIS.equis} ${errorText}`);
  }

  getProcessingSummary() {
    if (this._startedAt) {
      const elapsedMs = Math.max(0, Date.now() - this._startedAt);
      const sec = (elapsedMs / 1000).toFixed(1);
      if (this.isDeepThinking) {
        return `${EMOJIS.pensamientoprofundo} *Pensó profundamente por ${sec} segundos*`;
      }
      return `${EMOJIS.pensar} *Pensó por ${sec} segundos*`;
    }
    return this.timer.formatSummary(this.isDeepThinking);
  }

  stopAll() {
    this.dotAnimator.stop();
    this.deepAnimator.stop();
  }

  queueEdit(newContent) {
    if (this.isDestroyed || !this.statusMessage) return;
    if (newContent === this.lastEditContent) return;

    this.pendingContent = newContent;
    if (this.editPending) return;

    const now = Date.now();
    const timeSinceLastEdit = now - this.lastEditTime;
    const minInterval = 800;

    if (timeSinceLastEdit >= minInterval) {
      this._executeEdit(newContent);
    } else {
      this.editPending = true;
      setTimeout(() => {
        this.editPending = false;
        if (this.pendingContent && this.pendingContent !== this.lastEditContent) {
          this._executeEdit(this.pendingContent);
        }
      }, minInterval - timeSinceLastEdit);
    }
  }

  async immediateEdit(content) {
    this.pendingContent = null;
    await this._executeEdit(content);
  }

  async _executeEdit(content) {
    if (!this.statusMessage || this.isDestroyed) return;
    try {
      this.lastEditContent = content;
      this.lastEditTime = Date.now();
      await this.statusMessage.edit(content);
    } catch (err) {
      if (err.code === 10008) {
        this.isDestroyed = true;
      } else {
        Logger.debug('StatusManager', 'Error menor al editar mensaje:', err.message);
      }
    }
  }

  async finalize(responseFinalText, options = {}) {
    this.stopAll();
    this.timer.stop();
    this.currentState = StatusState.COMPLETED;

    const summary = options.showSummary !== false ? `\n\n${this.getProcessingSummary()}` : '';
    const fullMessage = `${responseFinalText}${summary}`;

    if (fullMessage.length <= 2000) {
      await this.immediateEdit(fullMessage);
    } else {
      const firstChunk = responseFinalText.slice(0, 1850) + '...\n*(continúa)*';
      await this.immediateEdit(firstChunk);

      const remainder = responseFinalText.slice(1850);
      const chunks = remainder.match(/[\s\S]{1,1900}/g) || [];
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        const text = isLast ? `${chunks[i]}${summary}` : chunks[i];
        if (this.channel && typeof this.channel.send === 'function') {
          await this.channel.send(text);
        }
      }
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stopAll();
    this.timer.stop();
  }
}

export default StatusManager;
