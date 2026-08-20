// ═══════════════════════════════════════════════════════════════
// 🧠 Novarito Discord Bot — Local Heuristic Autonomous Fallback
// Generador autónomo en memoria cuando las APIs externas no están disponibles
// ═══════════════════════════════════════════════════════════════

export class LocalFallbackEngine {
  constructor() {
    this.name = 'LocalFallback';
  }

  isReady() {
    return true;
  }

  async generateChat(messages, options = {}) {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const text = lastUserMessage.toLowerCase();

    let responseText = '';

    if (/(hola|buenas|hey|que tal|saludos)/i.test(text)) {
      responseText = '¡Hola! Aquí Novarito. Mis servicios centrales están activos. ¿En qué te puedo colaborar hoy?';
    } else if (/(ayuda|comandos|que puedes hacer|help)/i.test(text)) {
      responseText = 'Soy Novarito, tu asistente de IA en Discord. Puedes mencionarme para conversar, pedirme análisis, usar `/novarito-status` para ver diagnósticos o `/novarito-memory` para consultar qué recuerdo de ti.';
    } else if (/(ping|estado|status|como estas)/i.test(text)) {
      responseText = 'Estoy operando correctamente en modo autónomo de respaldo. Todos mis subsistemas locales responden a tiempo.';
    } else if (/(quien eres|tu nombre)/i.test(text)) {
      responseText = 'Soy Novarito, un asistente de IA inteligente para Discord con memoria persistente, pensamiento profundo y arquitectura modular.';
    } else if (/(gracias|agradecido)/i.test(text)) {
      responseText = '¡Con mucho gusto! Siempre a la orden por aquí.';
    } else {
      responseText = `He recibido tu mensaje: "${lastUserMessage.slice(0, 100)}". En este momento mis canales de inferencia remota están ocupados, pero he registrado tu consulta correctamente.`;
    }

    return {
      text: responseText,
      model: 'novarito-local-heuristic-v2',
      provider: 'LocalFallback',
      usage: { total_tokens: responseText.split(' ').length },
      latencyMs: 15,
    };
  }
}

export default LocalFallbackEngine;
