// ═══════════════════════════════════════════════════════════════
// 👤 Novarito Discord Bot — Code-Safe Conversational Humanizer
// ═══════════════════════════════════════════════════════════════

export class Humanizer {
  static applyHumanization(text, isTechnical = false) {
    if (!text || typeof text !== 'string' || isTechnical) {
      return text;
    }

    const protectedChunks = [];
    const placeholderPrefix = `__NOVARITO_SAFE_${Date.now()}_`;
    const protectedRegex = /(```[\s\S]*?```|`[^`]+`|https?:\/\/[^\s\)\>\]]+|<a?:[a-zA-Z0-9_]+:\d+>|<@[!&]?\d+>|<#\d+>)/g;

    let sanitized = text.replace(protectedRegex, (match) => {
      const idx = protectedChunks.length;
      protectedChunks.push(match);
      return `${placeholderPrefix}${idx}__`;
    });

    sanitized = sanitized.replace(/\{[\s\S]*?\}/g, (match) => {
      try {
        JSON.parse(match);
        const idx = protectedChunks.length;
        protectedChunks.push(match);
        return `${placeholderPrefix}${idx}__`;
      } catch {
        return match;
      }
    });

    sanitized = sanitized
      .replace(/^De nada\./gim, 'de nadaa')
      .replace(/^Sí\./gim, 'Sii')
      .replace(/^No\./gim, 'Noo')
      .replace(/\bPor supuesto\b/gi, 'Claro que sí')
      .replace(/\bEntendido\b/gi, 'Ahh, ya veo');

    for (let i = protectedChunks.length - 1; i >= 0; i--) {
      const placeholder = `${placeholderPrefix}${i}__`;
      sanitized = sanitized.split(placeholder).join(protectedChunks[i]);
    }

    let iterations = 0;
    while (sanitized.includes(placeholderPrefix) && iterations < 5) {
      iterations++;
      for (let i = protectedChunks.length - 1; i >= 0; i--) {
        const placeholder = `${placeholderPrefix}${i}__`;
        if (sanitized.includes(placeholder)) {
          sanitized = sanitized.split(placeholder).join(protectedChunks[i]);
        }
      }
    }

    return sanitized;
  }
}

export default Humanizer;
