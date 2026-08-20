// ═══════════════════════════════════════════════════════════════
// ⏱️ Novarito Discord Bot — High Precision Elapsed Time Counter
// ═══════════════════════════════════════════════════════════════

import { EMOJIS } from './emojis.js';

export class ProcessingTimer {
  constructor() {
    this.startTime = 0;
    this.endTime = 0;
    this.isRunning = false;
  }

  start() {
    this.startTime = performance.now();
    this.endTime = 0;
    this.isRunning = true;
    return this;
  }

  stop() {
    if (this.isRunning) {
      this.endTime = performance.now();
      this.isRunning = false;
    }
    return this;
  }

  getElapsedMs() {
    const end = this.isRunning ? performance.now() : (this.endTime || performance.now());
    return Math.max(0, end - this.startTime);
  }

  getElapsedSeconds() {
    return (this.getElapsedMs() / 1000).toFixed(1);
  }

  formatSummary(isDeepThinking = false) {
    const sec = this.getElapsedSeconds();
    if (isDeepThinking) {
      return `${EMOJIS.pensamientoprofundo} *Pensó profundamente por ${sec} segundos*`;
    }
    return `${EMOJIS.pensar} *Pensó por ${sec} segundos*`;
  }
}

export default ProcessingTimer;
