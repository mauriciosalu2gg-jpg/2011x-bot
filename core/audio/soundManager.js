// ═══════════════════════════════════════════════════════════════
// 🔊 2011X Sound Manager — Catálogo Local de Audios y SFX Nativos
// Auto-provisionador de archivos WAV de alta fidelidad (44.1kHz PCM)
// ═══════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOUNDS_DIR = path.resolve(__dirname, '../../assets/sounds');

// Asegurar directorio
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

function createWavHeader(sampleRate, numChannels, bitsPerSample, numSamples) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = (numSamples * numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function generateSoundFile(filename, durationSec, generator) {
  const outPath = path.join(SOUNDS_DIR, filename);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) return;

  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataBuffer = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generator(t, i, numSamples);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
    dataBuffer.writeInt16LE(intSample, i * 2);
  }

  const header = createWavHeader(sampleRate, 1, 16, numSamples);
  const finalBuffer = Buffer.concat([header, dataBuffer]);
  fs.writeFileSync(outPath, finalBuffer);
}

// Inicializar provisionamiento de audios al inicio
export function ensureSoundAssets() {
  try {
    generateSoundFile('2011X_Risa_Sadica.wav', 2.8, (t) => {
      const burst = Math.sin(t * 14 * Math.PI) * 0.5 + 0.5;
      const pitch = 160 + Math.sin(t * 8) * 60;
      const noise = (Math.random() * 2 - 1) * 0.15;
      return (Math.sin(2 * Math.PI * pitch * t) * 0.7 + noise) * burst * Math.exp(-t * 0.6);
    });

    generateSoundFile('2011X_Rage_Activation.wav', 2.5, (t) => {
      const roarPitch = 90 + Math.sin(t * 30) * 40;
      const distortion = (Math.random() * 2 - 1) * 0.45;
      const sub = Math.sin(2 * Math.PI * 45 * t);
      return (Math.sin(2 * Math.PI * roarPitch * t) * 0.5 + sub * 0.3 + distortion) * Math.min(1, t * 8) * Math.exp(-t * 0.5);
    });

    generateSoundFile('2011X_Stunned_Hit.wav', 0.8, (t) => {
      const hitFreq = Math.max(40, 300 * Math.exp(-t * 15));
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);
      return (Math.sin(2 * Math.PI * hitFreq * t) * 0.7 + noise * 0.5) * Math.exp(-t * 4);
    });

    generateSoundFile('2011X_Found_You.wav', 2.0, (t) => {
      const stinger = t < 0.4 ? Math.sin(2 * Math.PI * 650 * t) * Math.exp(-t * 8) : 0;
      const drone = Math.sin(2 * Math.PI * 110 * t) * 0.4;
      const whisperNoise = (Math.random() * 2 - 1) * 0.15 * Math.sin(t * 6);
      return (stinger * 0.6 + drone + whisperNoise) * Math.exp(-t * 0.7);
    });

    generateSoundFile('2011X_Gotcha.wav', 1.4, (t) => {
      const freq = 450 + Math.sin(t * 25) * 120;
      return (Math.sin(2 * Math.PI * freq * t) * 0.6 + (Math.random() * 2 - 1) * 0.2) * Math.exp(-t * 2.5);
    });

    generateSoundFile('2011X_Execution_Kill.wav', 1.8, (t) => {
      const impact = Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 6);
      const slash = (Math.random() * 2 - 1) * Math.exp(-t * 12);
      return (impact * 0.7 + slash * 0.5);
    });

    generateSoundFile('OutcomeMemories_GreenRing_Spawn.wav', 2.2, (t) => {
      const bell1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 1.8);
      const bell2 = Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 2.5) * 0.5;
      const bell3 = Math.sin(2 * Math.PI * 2640 * t) * Math.exp(-t * 3.5) * 0.3;
      return (bell1 + bell2 + bell3) * 0.7;
    });

    generateSoundFile('2011X_Distorsion_Vacio.wav', 1.8, (t) => {
      const staticNoise = (Math.random() * 2 - 1);
      const pulse = Math.sin(t * 40 * Math.PI) > 0 ? 0.8 : 0.1;
      return staticNoise * pulse * Math.exp(-t * 0.8);
    });

    generateSoundFile('2011X_Theme_HERE_I_COME.wav', 4.5, (t) => {
      const beat = (Math.floor(t * 4) % 2 === 0) ? 1.0 : 0.2;
      const bass = Math.sin(2 * Math.PI * (55 + (Math.floor(t * 8) % 4) * 20) * t);
      const lead = Math.sin(2 * Math.PI * 220 * t) * Math.sin(t * 12);
      const grit = (Math.random() * 2 - 1) * 0.15;
      return (bass * 0.5 * beat + lead * 0.3 + grit) * Math.min(1, t * 2) * Math.min(1, (4.5 - t) * 2);
    });

    generateSoundFile('OutcomeMemories_Theme_OVERTIME.wav', 4.5, (t) => {
      const pulse = Math.sin(2 * Math.PI * 3.5 * t);
      const darkArp = Math.sin(2 * Math.PI * (110 + (Math.floor(t * 12) % 4) * 44) * t);
      const sub = Math.sin(2 * Math.PI * 40 * t) * 0.4;
      return (darkArp * 0.4 + sub + pulse * 0.2) * Math.min(1, t * 2) * Math.min(1, (4.5 - t) * 2);
    });

    generateSoundFile('2011X_Chase_TIME_OVER.wav', 4.5, (t) => {
      const tempo = 6;
      const kick = Math.sin(2 * Math.PI * 60 * t) * Math.exp(-(t % (1/tempo)) * 20);
      const synth = Math.sin(2 * Math.PI * (180 + (Math.floor(t * tempo * 2) % 6) * 35) * t) * 0.4;
      return (kick * 0.6 + synth * 0.4) * Math.min(1, t * 2) * Math.min(1, (4.5 - t) * 2);
    });
  } catch (err) {
    console.warn('[soundManager] Advertencia auto-provisionando sonidos:', err.message);
  }
}

// Ejecutar auto-provisionamiento
ensureSoundAssets();

export const SOUND_EFFECTS = {
  rage_music: {
    key: 'rage_music',
    name: '2011X_Theme_HERE_I_COME.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Theme_HERE_I_COME.wav'),
    description: 'Tema musical oficial de Modo Furia: "HERE I COME"'
  },
  lms_music: {
    key: 'lms_music',
    name: 'OutcomeMemories_Theme_OVERTIME.wav',
    filePath: path.join(SOUNDS_DIR, 'OutcomeMemories_Theme_OVERTIME.wav'),
    description: 'Tema musical oficial de LMS / Last Life: "OVERTIME"'
  },
  chase_music: {
    key: 'chase_music',
    name: '2011X_Chase_TIME_OVER.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Chase_TIME_OVER.wav'),
    description: 'Tema musical oficial de persecución: "TIME OVER"'
  },
  rage_start: {
    key: 'rage_start',
    name: '2011X_Rage_Activation.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Rage_Activation.wav'),
    description: 'Sonido inicial de activación de Furia (Rugido y estática)'
  },
  stunned: {
    key: 'stunned',
    name: '2011X_Stunned_Hit.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Stunned_Hit.wav'),
    description: 'Quejido de impacto / Daño recibido (¡Agh!)'
  },
  found_you: {
    key: 'found_you',
    name: '2011X_Found_You.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Found_You.wav'),
    description: 'Voiceline: "Found You!"'
  },
  gotcha: {
    key: 'gotcha',
    name: '2011X_Gotcha.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Gotcha.wav'),
    description: 'Voiceline: "Gotcha!"'
  },
  kill: {
    key: 'kill',
    name: '2011X_Execution_Kill.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Execution_Kill.wav'),
    description: 'Sonido de impacto de ejecución letal'
  },
  green_ring: {
    key: 'green_ring',
    name: 'OutcomeMemories_GreenRing_Spawn.wav',
    filePath: path.join(SOUNDS_DIR, 'OutcomeMemories_GreenRing_Spawn.wav'),
    description: 'Campana del Anillo Verde a las 1:20'
  },
  glitch: {
    key: 'glitch',
    name: '2011X_Distorsion_Vacio.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Distorsion_Vacio.wav'),
    description: 'Distorsión estática del Vacío'
  },
  laugh: {
    key: 'laugh',
    name: '2011X_Risa_Sadica.wav',
    filePath: path.join(SOUNDS_DIR, '2011X_Risa_Sadica.wav'),
    description: 'Risa sádica y demoníaca de 2011X'
  }
};

SOUND_EFFECTS.rage = SOUND_EFFECTS.rage_start;
SOUND_EFFECTS.overtime = SOUND_EFFECTS.lms_music;
SOUND_EFFECTS.time_over = SOUND_EFFECTS.chase_music;
SOUND_EFFECTS.hit = SOUND_EFFECTS.stunned;
SOUND_EFFECTS.peekaboo = SOUND_EFFECTS.gotcha;
SOUND_EFFECTS.there_you_are = SOUND_EFFECTS.found_you;

/**
 * Detecta y extrae la etiqueta [AUDIO:nombre] del texto generado.
 */
export function extractAudioTag(text) {
  if (!text) return { cleanText: text, sound: null };

  const match = text.match(/\[AUDIO:([a-zA-Z0-9_-]+)\]/i);
  if (!match) {
    return { cleanText: text, sound: null };
  }

  const soundKey = match[1].toLowerCase().replace(/-/g, '_');
  const soundConfig = SOUND_EFFECTS[soundKey] || null;
  const cleanText = text.replace(/\[AUDIO:[a-zA-Z0-9_-]+\]/gi, '').trim();

  let sound = null;
  if (soundConfig && fs.existsSync(soundConfig.filePath)) {
    sound = {
      name: soundConfig.name,
      attachment: soundConfig.filePath
    };
  }

  return { cleanText, sound };
}

export default { SOUND_EFFECTS, extractAudioTag, ensureSoundAssets };
