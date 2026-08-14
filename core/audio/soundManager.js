// ═══════════════════════════════════════════════════════════════
// 🔊 2011X Sound Manager — Catálogo Maestro Oficial de Outcome Memories
// Auto-sincronizado desde Firebase Cloud Storage y Realtime Database
// ═══════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rtdb } from '../../database/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOUNDS_DIR = path.resolve(__dirname, '../../assets/sounds');

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

export const SOUND_EFFECTS = {
  // ── 🎵 TEMAS Y MÚSICAS DE 2011X ──────────────────────────────
  rage_music: {
    key: 'rage_music',
    name: '2011X_Modo_Furia_Theme1.mp3',
    file: 'ragemode1theme.mp3',
    description: 'Tema oficial de Modo Furia de 2011X (Rage Mode 1)'
  },
  ragemode2: {
    key: 'ragemode2',
    name: '2011X_Modo_Furia_Theme2.mp3',
    file: 'ragemode2theme.mp3',
    description: 'Tema alternativo de Modo Furia de 2011X (Rage Mode 2)'
  },
  chase_music: {
    key: 'chase_music',
    name: '2011X_Chase_Theme.mp3',
    file: '2011xchase.mp3',
    description: 'Tema oficial de persecución de 2011X'
  },
  chase_lastlife: {
    key: 'chase_lastlife',
    name: '2011X_Chase_LastLife.mp3',
    file: '2011xchaselastlife.mp3',
    description: 'Tema de persecución de 2011X en Last Life / LMS'
  },
  terror_radius: {
    key: 'terror_radius',
    name: '2011X_Terror_Radius.mp3',
    file: '2011xterrorradious.mp3',
    description: 'Radio de terror y proximidad de 2011X'
  },
  win_round: {
    key: 'win_round',
    name: '2011X_Round_Won.mp3',
    file: '2011xwinround.mp3',
    description: 'Tema de victoria de ronda de 2011X'
  },
  choking: {
    key: 'choking',
    name: '2011X_Choking_Theme.mp3',
    file: 'ChokingTheme.mp3',
    description: 'Tema de asfixia y ejecución de 2011X'
  },

  // ── 🎼 TEMAS LMS Y SUPERVIVIENTES DE OUTCOME MEMORIES ────────
  cream_lms: {
    key: 'cream_lms',
    name: 'Cream_LMS_Theme.mp3',
    file: 'creamLMS.mp3',
    description: 'Tema Last Man Standing de Cream'
  },
  dont_blink: {
    key: 'dont_blink',
    name: 'Sonic_DontBlink_Theme.mp3',
    file: 'DontBlinkFULL.mp3',
    description: 'Tema oficial "Don\'t Blink" de Sonic en Outcome Memories'
  },
  fist_of_fire: {
    key: 'fist_of_fire',
    name: 'Blaze_FistOfFire_Theme.mp3',
    file: 'FISTOFFIREFULL.mp3',
    description: 'Tema oficial "Fist of Fire" de Blaze / Knuckles'
  },
  friends_no_more: {
    key: 'friends_no_more',
    name: 'Tails_FriendsNoMore_Theme.mp3',
    file: 'FriendsNoMoreROUND2.mp3',
    description: 'Tema oficial "Friends No More Round 2" de Tails'
  },
  wilted_blossom: {
    key: 'wilted_blossom',
    name: 'Amy_WiltedBlossom_Theme.mp3',
    file: 'WiltedBlossomHQ.mp3',
    description: 'Tema oficial "Wilted Blossom" de Amy Rose'
  },
  cracked_empire: {
    key: 'cracked_empire',
    name: 'Eggman_CrackedEmpire_Theme.mp3',
    file: 'CrackedEmpire.mp3',
    description: 'Tema oficial "Cracked Empire" de Dr. Eggman / Metal Sonic'
  },

  // ── 🎙️ LÍNEAS DE VOZ (VOICELINES DE 2011X) ──────────────────
  laugh: {
    key: 'laugh',
    name: '2011X_Evil_Laugh.mp3',
    file: 'evillaugh.mp3',
    description: 'Risa malévola oficial de 2011X'
  },
  down_giggle: {
    key: 'down_giggle',
    name: '2011X_Down_Giggle.mp3',
    file: 'Down_giggle.mp3',
    description: 'Risita sádica al derribar a un superviviente'
  },
  grab_laugh: {
    key: 'grab_laugh',
    name: '2011X_Grab_Laugh.mp3',
    file: 'Grab_gotcha_laugh.mp3',
    description: 'Risa demoníaca al agarrar a un superviviente'
  },
  found_you: {
    key: 'found_you',
    name: '2011X_Found_You.mp3',
    file: 'Found_you.mp3',
    description: 'Voiceline: "Found you."'
  },
  there_you_are: {
    key: 'there_you_are',
    name: '2011X_There_You_Are.mp3',
    file: 'There_you_are.mp3',
    description: 'Voiceline: "There you are."'
  },
  caught_you: {
    key: 'caught_you',
    name: '2011X_Caught_You.mp3',
    file: 'Caught_you.mp3',
    description: 'Voiceline: "Caught you."'
  },
  peekaboo: {
    key: 'peekaboo',
    name: '2011X_Peekaboo.mp3',
    file: 'Peekaboo.mp3',
    description: 'Voiceline: "Peekaboo!"'
  },
  boo: {
    key: 'boo',
    name: '2011X_Boo.mp3',
    file: 'Boo!.mp3',
    description: 'Voiceline: "Boo!"'
  },
  ready_or_not: {
    key: 'ready_or_not',
    name: '2011X_Ready_Or_Not.mp3',
    file: 'Ready_or_not_here_i_come.mp3',
    description: 'Voiceline: "Ready or not, here I come."'
  },
  right_behind_ya: {
    key: 'right_behind_ya',
    name: '2011X_Right_Behind_Ya.mp3',
    file: 'Right_behind_ya.mp3',
    description: 'Voiceline: "Right behind ya."'
  },
  pathetic: {
    key: 'pathetic',
    name: '2011X_Your_Struggle_Is_Pathetic.mp3',
    file: 'Your_struggle_is_pathetic.mp3',
    description: 'Voiceline: "Your struggle is pathetic."'
  },
  better_luck: {
    key: 'better_luck',
    name: '2011X_Better_Luck_Next_Time.mp3',
    file: 'Better_luck_next_time.mp3',
    description: 'Voiceline: "Better luck next time."'
  },
  running_wont_get_you_far: {
    key: 'running_wont_get_you_far',
    name: '2011X_Running_Wont_Get_You_Far.mp3',
    file: 'Running_wont_get_you_far.mp3',
    description: 'Voiceline: "Running won\'t get you far."'
  },
  you_werent_outrunning_me: {
    key: 'you_werent_outrunning_me',
    name: '2011X_You_Werent_Outrunning_Me.mp3',
    file: 'You_werent_outrunning_me_anyway.mp3',
    description: 'Voiceline: "You weren\'t outrunning me anyway."'
  },
  stand_still: {
    key: 'stand_still',
    name: '2011X_Stand_Still.mp3',
    file: 'Stand_still.mp3',
    description: 'Voiceline: "Stand still."'
  },
  stop_moving: {
    key: 'stop_moving',
    name: '2011X_Stop_Moving.mp3',
    file: 'Stop_moving,_you_might_trip.mp3',
    description: 'Voiceline: "Stop moving, you might trip."'
  },
  keep_this_interesting: {
    key: 'keep_this_interesting',
    name: '2011X_Keep_This_Interesting.mp3',
    file: 'Keep_this_interesting_for_me.mp3',
    description: 'Voiceline: "Keep this interesting for me."'
  },
  close_your_eyes: {
    key: 'close_your_eyes',
    name: '2011X_Close_Your_Eyes.mp3',
    file: 'Close_your_eyes_let_it_happen.mp3',
    description: 'Voiceline: "Close your eyes, let it happen."'
  },
  fall: {
    key: 'fall',
    name: '2011X_Fall.mp3',
    file: 'Fall.mp3',
    description: 'Voiceline: "Fall."'
  },
  get_up: {
    key: 'get_up',
    name: '2011X_Get_Up.mp3',
    file: 'Get._up..mp3',
    description: 'Voiceline: "Get. up."'
  },
  your_life_is_mine: {
    key: 'your_life_is_mine',
    name: '2011X_YOUR_LIFE_IS_MINE.mp3',
    file: 'YOURLIFEISMINE.mp3',
    description: 'Grito: "YOUR LIFE IS MINE!"'
  },
  die_at_my_hands: {
    key: 'die_at_my_hands',
    name: '2011X_Youll_Die_At_My_Hands.mp3',
    file: 'youlldieatmihands.mp3',
    description: 'Grito: "You\'ll die at my hands!"'
  },

  // ── 💥 GRUÑIDOS DE DAÑO Y STUN (STUN GRUNTS) ─────────────────
  stunned: {
    key: 'stunned',
    name: '2011X_Stun_Grunt.mp3',
    file: 'Stun_grunt_1.mp3',
    description: 'Gruñido auténtico de daño/stun al recibir un golpe'
  },
  stun2: {
    key: 'stun2',
    name: '2011X_Stun_Grunt2.mp3',
    file: 'Stun_grunt_2.mp3',
    description: 'Gruñido 2 de daño/stun'
  },
  stun3: {
    key: 'stun3',
    name: '2011X_Stun_Grunt3.mp3',
    file: 'Stun_grunt_3.mp3',
    description: 'Gruñido 3 de daño/stun'
  },
  stun4: {
    key: 'stun4',
    name: '2011X_Stun_Grunt4.mp3',
    file: 'Stun_grunt_4.mp3',
    description: 'Gruñido 4 de daño/stun'
  },
  stun5: {
    key: 'stun5',
    name: '2011X_Stun_Grunt5.mp3',
    file: 'Stun_grunt_5.mp3',
    description: 'Gruñido 5 de daño/stun'
  }
};

// Aliases para máxima compatibilidad
SOUND_EFFECTS.rage = SOUND_EFFECTS.rage_music;
SOUND_EFFECTS.ragemode1 = SOUND_EFFECTS.rage_music;
SOUND_EFFECTS.rage_start = SOUND_EFFECTS.ready_or_not;
SOUND_EFFECTS.hit = SOUND_EFFECTS.stunned;
SOUND_EFFECTS.stun = SOUND_EFFECTS.stunned;
SOUND_EFFECTS.gotcha = SOUND_EFFECTS.caught_you;
SOUND_EFFECTS.chase = SOUND_EFFECTS.chase_music;
SOUND_EFFECTS.lms = SOUND_EFFECTS.chase_lastlife;
SOUND_EFFECTS.lms_music = SOUND_EFFECTS.chase_lastlife;
SOUND_EFFECTS.lastlife = SOUND_EFFECTS.chase_lastlife;
SOUND_EFFECTS.kill = SOUND_EFFECTS.pathetic;
SOUND_EFFECTS.ring = { key: 'ring', name: 'Sonic_Ring.ogg', file: 'OutcomeMemories_GreenRing_Spawn.ogg', description: 'Sonido de Ring' };
SOUND_EFFECTS.green_ring = SOUND_EFFECTS.ring;
SOUND_EFFECTS.glitch = { key: 'glitch', name: 'Static_Buzz.ogg', file: '2011X_Distorsion_Vacio.ogg', description: 'Distorsión estática' };

/**
 * Descarga y restaura cualquier archivo de audio faltante directamente desde Firebase RTDB.
 */
export async function ensureSoundAssets() {
  if (!rtdb) return;

  try {
    const snapshot = await rtdb.ref('assets/sounds').once('value');
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    let restoredCount = 0;

    for (const [key, item] of Object.entries(data)) {
      if (!item || !item.fileName) continue;
      const localPath = path.join(SOUNDS_DIR, item.fileName);

      if (!fs.existsSync(localPath) || fs.statSync(localPath).size < 100) {
        let b64 = '';
        if (item.chunks) {
          const total = item.totalChunks || Object.keys(item.chunks).length;
          for (let i = 0; i < total; i++) {
            b64 += item.chunks['c' + i] || '';
          }
        } else if (item.base64) {
          b64 = item.base64;
        }

        if (b64) {
          const buffer = Buffer.from(b64, 'base64');
          fs.writeFileSync(localPath, buffer);
          restoredCount++;
        }
      }
    }

    if (restoredCount > 0) {
      console.log(`[soundManager] 🔊 ${restoredCount} archivos de audio restaurados localmente desde Firebase RTDB.`);
    }
  } catch (err) {
    console.warn('[soundManager] Advertencia sincronizando audios de Firebase:', err.message);
  }
}

// Iniciar auto-restauración de audios en segundo plano al arrancar
setTimeout(() => ensureSoundAssets().catch(() => {}), 1500);

/**
 * Resuelve y garantiza el archivo de audio local listo para adjuntar a Discord.
 */
export async function resolveSoundAttachment(soundKey) {
  if (!soundKey) return null;
  const key = soundKey.toLowerCase().replace(/-/g, '_');
  const soundConfig = SOUND_EFFECTS[key] || null;
  if (!soundConfig) return null;

  const fullPath = path.join(SOUNDS_DIR, soundConfig.file);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 100) {
    return { name: soundConfig.name, attachment: fullPath };
  }

  // Si aún no está en disco local, restaurarlo bajo demanda desde Firebase en 100ms
  if (rtdb) {
    try {
      const safeKey = soundConfig.file.replace(/[\.#\$\/\[\]]/g, '_');
      const snap = await rtdb.ref('assets/sounds/' + safeKey).once('value');
      if (snap.exists()) {
        const item = snap.val();
        let b64 = '';
        if (item.chunks) {
          const total = item.totalChunks || Object.keys(item.chunks).length;
          for (let i = 0; i < total; i++) b64 += item.chunks['c' + i] || '';
        } else if (item.base64) {
          b64 = item.base64;
        }
        if (b64) {
          const buf = Buffer.from(b64, 'base64');
          fs.writeFileSync(fullPath, buf);
          return { name: soundConfig.name, attachment: fullPath };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

/**
 * Detecta y extrae la etiqueta [AUDIO:nombre] del texto generado.
 */
export async function extractAudioTagAsync(text) {
  if (!text) return { cleanText: text, sound: null };

  const match = text.match(/\[AUDIO:([a-zA-Z0-9_-]+)\]/i);
  if (!match) {
    return { cleanText: text, sound: null };
  }

  const soundKey = match[1];
  const cleanText = text.replace(/\[AUDIO:[a-zA-Z0-9_-]+\]/gi, '').trim();
  const sound = await resolveSoundAttachment(soundKey);

  return { cleanText, sound };
}

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
  if (soundConfig) {
    const fullPath = path.join(SOUNDS_DIR, soundConfig.file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 100) {
      sound = {
        name: soundConfig.name,
        attachment: fullPath
      };
    }
  }

  return { cleanText, sound };
}

export default { SOUND_EFFECTS, extractAudioTag, extractAudioTagAsync, resolveSoundAttachment, ensureSoundAssets };
