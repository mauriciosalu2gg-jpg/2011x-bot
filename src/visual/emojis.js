// ═══════════════════════════════════════════════════════════════
// 🎨 Novarito Discord Bot — Custom Emojis Registry
// Mapeo canónico oficial de 11 emojis de Discord y fallbacks
// ═══════════════════════════════════════════════════════════════

export const EMOJIS = {
  ANIM_1: '<:Anim1:1534830863764684940>',
  ANIM_2: '<:Anim2:1534830885285658645>',
  ANIM_3: '<:Anim3:1534830901526134804>',
  PENSAMIENTOPROFUNDO: '<:pensamientoprofundo:1534830807666131056>',
  PENSAR: '<:pensar:1527960192787025920>',
  RECUPERAR: '<:recuperar:1528121773764116651>',
  HOJITA: '<:hojita:1527960400975630436>',
  SERVIDOR: '<:servidor:1527959988184682506>',
  ACEPTAR: '<:aceptar:1527959750443012187>',
  EQUIS: '<:equis:1527958663485198386>',
  ADVERTENCIA: '<:advertencia:1527958443338633296>',

  FALLBACK: {
    ANIM_1: '✨',
    ANIM_2: '🌟',
    ANIM_3: '💫',
    PENSAMIENTOPROFUNDO: '🧠',
    PENSAR: '💭',
    RECUPERAR: '🔄',
    HOJITA: '📄',
    SERVIDOR: '🗄️',
    ACEPTAR: '✅',
    EQUIS: '❌',
    ADVERTENCIA: '⚠️',
  },
};

export function getEmoji(name) {
  const key = String(name).toUpperCase().replace(/[^A-Z0-9_]/g, '');
  return EMOJIS[key] || EMOJIS[name] || EMOJIS.FALLBACK[key] || '✨';
}

export default EMOJIS;
