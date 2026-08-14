// ═══════════════════════════════════════════════════════════════
// 🔊 2011X Sound Manager — Audios, SFX y OST Reales y Originales
// Archivos OGG originales extraídos de Sonic.EXE y Outcome Memories
// ═══════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOUNDS_DIR = path.resolve(__dirname, '../../assets/sounds');

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

export const SOUND_EFFECTS = {
  // ── MÚSICAS Y SOUNDTRACK OFICIAL REAL ────────────────────────
  rage_music: {
    key: 'rage_music',
    name: '2011X_Theme_HERE_I_COME.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Theme_HERE_I_COME.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/songs/execution/Inst.ogg',
    description: 'Tema musical oficial de Modo Furia: "HERE I COME"'
  },
  lms_music: {
    key: 'lms_music',
    name: 'OutcomeMemories_Theme_OVERTIME.ogg',
    filePath: path.join(SOUNDS_DIR, 'OutcomeMemories_Theme_OVERTIME.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/songs/endless/Inst.ogg',
    description: 'Tema musical oficial de Last Man Standing: "OVERTIME"'
  },
  chase_music: {
    key: 'chase_music',
    name: '2011X_Chase_TIME_OVER.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Chase_TIME_OVER.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/songs/too-slow/Inst.ogg',
    description: 'Tema musical oficial de persecución: "TIME OVER"'
  },

  // ── SFX Y VOICELINES ORIGINALES REALES ───────────────────────
  rage_start: {
    key: 'rage_start',
    name: '2011X_Rage_Activation.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Rage_Activation.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/exe/sounds/jumpscare.ogg',
    description: 'Rugido original de activación de Furia / Jumpscare'
  },
  laugh: {
    key: 'laugh',
    name: '2011X_Risa_Sadica.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Risa_Sadica.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/shared/sounds/laugh1.ogg',
    description: 'Risa sádica demoníaca original de 2011X'
  },
  found_you: {
    key: 'found_you',
    name: '2011X_Found_You.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Found_You.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/exe/sounds/firstLOOK.ogg',
    description: 'Sonido y voiceline de persecución / Found You'
  },
  gotcha: {
    key: 'gotcha',
    name: '2011X_Gotcha.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Gotcha.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/exe/sounds/secondLOOK.ogg',
    description: 'Sonido y voiceline de intercepción / Gotcha'
  },
  stunned: {
    key: 'stunned',
    name: '2011X_Stunned_Hit.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Stunned_Hit.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/exe/sounds/flatBONK.ogg',
    description: 'Sonido de golpe recibido / Stun'
  },
  kill: {
    key: 'kill',
    name: '2011X_Execution_Kill.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Execution_Kill.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/shared/sounds/SNAP.ogg',
    description: 'Sonido de ejecución / Muerte letal'
  },
  green_ring: {
    key: 'green_ring',
    name: 'OutcomeMemories_GreenRing_Spawn.ogg',
    filePath: path.join(SOUNDS_DIR, 'OutcomeMemories_GreenRing_Spawn.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/shared/sounds/ring.ogg',
    description: 'Sonido original del Ring a las 1:20'
  },
  glitch: {
    key: 'glitch',
    name: '2011X_Distorsion_Vacio.ogg',
    filePath: path.join(SOUNDS_DIR, '2011X_Distorsion_Vacio.ogg'),
    remoteUrl: 'https://cdn.jsdelivr.net/gh/Gabe030210/Sonic.exe-source-1.5@master/assets/shared/sounds/staticBUZZ.ogg',
    description: 'Distorsión estática y glitch del Vacío'
  }
};

// Aliases
SOUND_EFFECTS.rage = SOUND_EFFECTS.rage_start;
SOUND_EFFECTS.overtime = SOUND_EFFECTS.lms_music;
SOUND_EFFECTS.time_over = SOUND_EFFECTS.chase_music;
SOUND_EFFECTS.hit = SOUND_EFFECTS.stunned;
SOUND_EFFECTS.peekaboo = SOUND_EFFECTS.gotcha;
SOUND_EFFECTS.there_you_are = SOUND_EFFECTS.found_you;

/**
 * Descarga en segundo plano cualquier archivo de audio faltante para garantizar reproducción local.
 */
export async function ensureSoundAssets() {
  for (const sound of Object.values(SOUND_EFFECTS)) {
    if (!fs.existsSync(sound.filePath) || fs.statSync(sound.filePath).size < 1000) {
      if (sound.remoteUrl) {
        try {
          await new Promise((resolve, reject) => {
            https.get(sound.remoteUrl, (res) => {
              if (res.statusCode === 200) {
                const stream = fs.createWriteStream(sound.filePath);
                res.pipe(stream);
                stream.on('finish', () => { stream.close(); resolve(); });
              } else {
                resolve();
              }
            }).on('error', () => resolve());
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }
}

// Iniciar auto-verificación de audios
ensureSoundAssets();

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
  if (soundConfig && fs.existsSync(soundConfig.filePath) && fs.statSync(soundConfig.filePath).size > 1000) {
    sound = {
      name: soundConfig.name,
      attachment: soundConfig.filePath
    };
  } else if (soundConfig && soundConfig.remoteUrl) {
    // Si aún se está descargando, usar la URL remota como respaldo
    sound = {
      name: soundConfig.name,
      attachment: soundConfig.remoteUrl
    };
  }

  return { cleanText, sound };
}

export default { SOUND_EFFECTS, extractAudioTag, ensureSoundAssets };
