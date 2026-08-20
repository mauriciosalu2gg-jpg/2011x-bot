// ═══════════════════════════════════════════════════════════════
// 🎭 Novarito Discord Bot — 5 Canonical Moods & Emotion Engine
// ═══════════════════════════════════════════════════════════════

import { Humanizer } from './humanizer.js';
import { PromptBuilder } from './promptBuilder.js';

export const Mood = {
  NEUTRAL: 'neutral',
  CALM: 'calm',
  HAPPY: 'happy',
  PLAYFUL: 'playful',
  CONCERNED: 'concerned',
  CURIOUS: 'curious',
};

export class MoodEngine {
  constructor() {
    this.currentMood = Mood.CALM;
    this.moodHistory = [];
  }

  detectMood(userMessageText, isError = false) {
    if (isError) {
      this.currentMood = Mood.CONCERNED;
      return this.currentMood;
    }

    if (!userMessageText || typeof userMessageText !== 'string' || !userMessageText.trim()) {
      this.currentMood = Mood.CALM;
      return this.currentMood;
    }

    const text = String(userMessageText).toLowerCase();

    if (/(jaja|xd|lol|meme|broma|chiste|divertido|gracioso)/i.test(text)) {
      this.currentMood = Mood.PLAYFUL;
    } else if (/(gracias|genial|excelente|increible|funciono|perfecto|bien hecho|te quiero)/i.test(text)) {
      this.currentMood = Mood.HAPPY;
    } else if (/(por que|como funciona|explica|que es|investiga|curiosidad|sabias que|dime mas)/i.test(text)) {
      this.currentMood = Mood.CURIOUS;
    } else if (/(error|fallo|rompio|bug|no funciona|ayuda|problema|triste|mal|auxilio)/i.test(text)) {
      this.currentMood = Mood.CONCERNED;
    } else {
      this.currentMood = Mood.CALM;
    }

    this.moodHistory.push({ mood: this.currentMood, timestamp: Date.now() });
    if (this.moodHistory.length > 20) this.moodHistory.shift();

    return this.currentMood;
  }

  getMoodStyle() {
    switch (this.currentMood) {
      case Mood.HAPPY:
        return 'Tu tono es alegre, motivador, cálido y enérgico.';
      case Mood.PLAYFUL:
        return 'Tu tono es casual, ingenioso, con chispa y ligeramente bromista sin perder precisión.';
      case Mood.CONCERNED:
        return 'Tu tono es empático, enfocado en solucionar el problema, paciente y comprensivo.';
      case Mood.CURIOUS:
        return 'Tu tono es intrigado, analítico, detallista y con interés genuino por explorar la idea.';
      case Mood.CALM:
      case Mood.NEUTRAL:
      default:
        return 'Tu tono es balanceado, perspicaz, objetivo y cordial.';
    }
  }

  setMood(mood) {
    if (Object.values(Mood).includes(mood)) {
      this.currentMood = mood;
    }
  }

  applyHumanization(text, isTechnical = false) {
    return Humanizer.applyHumanization(text, isTechnical);
  }

  getSystemInstructions(memoryContext = '', serverContext = '') {
    return PromptBuilder.buildSystemPrompt(this, memoryContext, serverContext);
  }
}

export default MoodEngine;
