// ═══════════════════════════════════════════════════════════════
// 🎬 Novarito Discord Bot — Visual Animation Engines
// System A (Dot Animator: . -> .. -> ...)
// System B (Deep Thinking Animator: Anim1 -> Anim2 -> Anim3)
// ═══════════════════════════════════════════════════════════════

import { EMOJIS } from './emojis.js';

// ─── SYSTEM A: DOT ANIMATOR ────────────────────────────────────
export class DotAnimator {
  constructor(updateCallback, intervalMs = 1000) {
    this.updateCallback = updateCallback;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.frameIndex = 0;
    this.dotFrames = ['.', '..', '...'];
    this.currentLabel = 'Pensando';
    this.currentEmoji = EMOJIS.pensar;
    this.isRunning = false;
  }

  start(emoji = EMOJIS.pensar, label = 'Pensando') {
    this.stop();
    this.currentEmoji = emoji;
    this.currentLabel = label;
    this.frameIndex = 0;
    this.isRunning = true;

    this._render();

    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.dotFrames.length;
      this._render();
    }, this.intervalMs);
  }

  updateLabel(emoji, label) {
    this.currentEmoji = emoji || this.currentEmoji;
    this.currentLabel = label || this.currentLabel;
    this._render();
  }

  _render() {
    if (!this.isRunning) return;
    const dots = this.dotFrames[this.frameIndex];
    const text = `${this.currentEmoji} ${this.currentLabel}${dots}`;
    this.updateCallback(text);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// ─── SYSTEM B: DEEP THINKING ANIMATOR ──────────────────────────
export class DeepThinkingAnimator {
  constructor(updateCallback, intervalMs = 500) {
    this.updateCallback = updateCallback;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.frameIndex = 0;
    this.dotIndex = 0;
    this.frames = [EMOJIS.Anim1, EMOJIS.Anim2, EMOJIS.Anim3];
    this.dotFrames = ['.', '..', '...'];
    this.label = '**Razonando profundamente**';
    this.isRunning = false;
  }

  start() {
    this.stop();
    this.frameIndex = 0;
    this.dotIndex = 0;
    this.isRunning = true;

    this._render();

    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.dotIndex = (this.dotIndex + 1) % this.dotFrames.length;
      this._render();
    }, this.intervalMs);
  }

  _render() {
    if (!this.isRunning) return;
    const currentFrame = this.frames[this.frameIndex];
    const dots = this.dotFrames[this.dotIndex];
    const text = `${EMOJIS.pensamientoprofundo} ${currentFrame} ${this.label}${dots}`;
    this.updateCallback(text);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export default { DotAnimator, DeepThinkingAnimator };
