// ═══════════════════════════════════════════════════════════════
// 🔊 2011X Sound Manager — SFX & Voicelines para Discord
// ═══════════════════════════════════════════════════════════════

export const SOUND_EFFECTS = {
  laugh: {
    key: 'laugh',
    name: '2011X_Risa_Sadica.mp3',
    url: 'https://www.myinstants.com/media/sounds/sonic-exe-laugh.mp3',
    description: 'Risa sádica y demoníaca de 2011X'
  },
  found_you: {
    key: 'found_you',
    name: '2011X_Found_You.mp3',
    url: 'https://www.myinstants.com/media/sounds/sonic-exe-found-you.mp3',
    description: 'Susurro / Grito sádico: "Found You!"'
  },
  rage: {
    key: 'rage',
    name: '2011X_Modo_Furia.mp3',
    url: 'https://www.myinstants.com/media/sounds/fnaf-1-scream-jumpscare.mp3',
    description: 'Rugido de furia e impacto distorsionado'
  },
  glitch: {
    key: 'glitch',
    name: '2011X_Distorsion_Vacio.mp3',
    url: 'https://www.myinstants.com/media/sounds/tv-static-sound-effect.mp3',
    description: 'Distorsión estática y glitch dimensional'
  },
  green_ring: {
    key: 'green_ring',
    name: 'OutcomeMemories_GreenRing.mp3',
    url: 'https://www.myinstants.com/media/sounds/sonic-ring-sound.mp3',
    description: 'Resonancia del Anillo Verde a las 1:20'
  }
};

/**
 * Detecta si el texto contiene una etiqueta de sonido [AUDIO:nombre]
 */
export function extractAudioTag(text) {
  if (!text) return { cleanText: text, sound: null };

  const match = text.match(/\[AUDIO:([a-zA-Z0-9_-]+)\]/i);
  if (!match) {
    return { cleanText: text, sound: null };
  }

  const soundKey = match[1].toLowerCase();
  const sound = SOUND_EFFECTS[soundKey] || null;
  const cleanText = text.replace(/\[AUDIO:[a-zA-Z0-9_-]+\]/gi, '').trim();

  return { cleanText, sound };
}

export default { SOUND_EFFECTS, extractAudioTag };
