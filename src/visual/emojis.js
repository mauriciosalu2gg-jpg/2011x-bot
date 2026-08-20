// ═══════════════════════════════════════════════════════════════
// 🎨 Novarito Discord Bot — Custom Emojis Registry
// ═══════════════════════════════════════════════════════════════

export const NOVARITO_EMOJIS = {
  Anim1: '<:Anim1:1534830863764684940>',
  Anim2: '<:Anim2:1534830885285658645>',
  Anim3: '<:Anim3:1534830901526134804>',
  pensamientoprofundo: '<:pensamientoprofundo:1534830807666131056>',
  recuperar: '<:recuperar:1528121773764116651>',
  hojita: '<:hojita:1527960400975630436>',
  pensar: '<:pensar:1527960192787025920>',
  servidor: '<:servidor:1527959988184682506>',
  aceptar: '<:aceptar:1527959750443012187>',
  equis: '<:equis:1527958663485198386>',
  advertencia: '<:advertencia:1527958443338633296>',
};

export const UNICODE_FALLBACKS = {
  Anim1: '✨',
  Anim2: '🌟',
  Anim3: '💫',
  pensamientoprofundo: '🧠',
  recuperar: '🔄',
  hojita: '📄',
  pensar: '💭',
  servidor: '🗄️',
  aceptar: '✅',
  equis: '❌',
  advertencia: '⚠️',
  ANIM_1: '✨',
  ANIM_2: '🌟',
  ANIM_3: '💫',
  PENSAMIENTOPROFUNDO: '🧠',
  RECUPERAR: '🔄',
  HOJITA: '📄',
  PENSAR: '💭',
  SERVIDOR: '🗄️',
  ACEPTAR: '✅',
  EQUIS: '❌',
  ADVERTENCIA: '⚠️',
};

export const EMOJIS = {
  ...NOVARITO_EMOJIS,
  ANIM_1: NOVARITO_EMOJIS.Anim1,
  ANIM_2: NOVARITO_EMOJIS.Anim2,
  ANIM_3: NOVARITO_EMOJIS.Anim3,
  PENSAMIENTOPROFUNDO: NOVARITO_EMOJIS.pensamientoprofundo,
  RECUPERAR: NOVARITO_EMOJIS.recuperar,
  HOJITA: NOVARITO_EMOJIS.hojita,
  PENSAR: NOVARITO_EMOJIS.pensar,
  SERVIDOR: NOVARITO_EMOJIS.servidor,
  ACEPTAR: NOVARITO_EMOJIS.aceptar,
  EQUIS: NOVARITO_EMOJIS.equis,
  ADVERTENCIA: NOVARITO_EMOJIS.advertencia,
  FALLBACK: UNICODE_FALLBACKS,
};

export function getEmoji(name, useFallback = false) {
  if (useFallback) {
    return UNICODE_FALLBACKS[name] || '✨';
  }
  return NOVARITO_EMOJIS[name] || EMOJIS[name] || UNICODE_FALLBACKS[name] || '✨';
}

export default EMOJIS;
