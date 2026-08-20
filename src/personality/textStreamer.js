// ═══════════════════════════════════════════════════════════════
// ✍️ Novarito Discord Bot — Progressive Text Streamer & Chunked Buffer
// ═══════════════════════════════════════════════════════════════

export class TextStreamer {
  constructor(statusManager, options = {}) {
    this.statusManager = statusManager;
    this.maxEdits = options.maxEdits || 3;
    this.minDirectLength = options.minDirectLength || 45;
    this.intervalMs = options.intervalMs || 700;
  }

  async streamText(fullText, options = {}) {
    if (!fullText || fullText.length < this.minDirectLength) {
      await this.statusManager.finalize(fullText, options);
      return;
    }

    this.statusManager.stopAll();

    const words = fullText.split(' ');
    const stepSize = Math.max(1, Math.floor(words.length / (this.maxEdits + 1)));

    for (let step = 1; step <= this.maxEdits; step++) {
      const partialWordCount = Math.min(words.length, step * stepSize);
      if (partialWordCount >= words.length) break;

      const partialText = words.slice(0, partialWordCount).join(' ') + ' ▌';
      this.statusManager.queueEdit(partialText);
      await new Promise(r => setTimeout(r, this.intervalMs));
    }

    await this.statusManager.finalize(fullText, options);
  }
}

export default TextStreamer;
