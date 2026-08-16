// ═══════════════════════════════════════════════════════════════
// 🩸 2011X Discord Bot — Main Entry Point
// ═══════════════════════════════════════════════════════════════

import dns from 'node:dns';
// Forzar IPv4 prioritario para evitar cuelgues de red en Render/Docker
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import { Client, GatewayIntentBits, Partials, REST, Routes, ChannelType } from 'discord.js';
import config from './config.js';
import { startWebServer } from './server.js';
import { buildSystemPromptWithContext } from './prompt.js';
import { generateChatResponse } from './services/ai/chatEngine.js';
import { getFullDistributedMemory, appendConversationMessage } from './core/memory/realtimeMemory.js';
import { processMessageInMemoryAsync } from './core/memory/memoryProcessor.js';
import { registerCommands, handleCommandInteraction } from './interactions/commands.js';
import { initFirebase } from './database/firebase.js';
import { extractAudioTag, extractAudioTagAsync, ensureSoundAssets } from './core/audio/soundManager.js';
import { processRageFromMessage } from './core/state/rageManager.js';

// Inicializar conexión a Firebase (Realtime Database + Firestore)
initFirebase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
  // Configuración de reconexión y timeouts de Gateway
  ws: {
    large_threshold: 50,
  }
});

// Iniciar servidor web de inmediato para que Render apruebe el puerto $PORT
startWebServer(client, config.port);

// ── Eventos de Gateway y Diagnóstico ───────────────────────────
client.on('shardConnecting', (id) => console.log(`[discord] ⏳ Conectando WebSocket Shard #${id}...`));
client.on('shardReady', (id) => console.log(`[discord] ✓ WebSocket Shard #${id} lista y autenticada.`));
client.on('shardReconnecting', (id) => console.log(`[discord] 🔄 Reconectando WebSocket Shard #${id}...`));
client.on('shardDisconnect', (event, id) => console.warn(`[discord] ⚠️ Shard #${id} desconectada:`, event));
client.on('shardError', (err) => console.error('[discord] ❌ Error en WebSocket Shard:', err));
client.on('error', (err) => console.error('[discord] ❌ Error en el cliente de Discord:', err));
client.on('warn', (warning) => console.warn('[discord] ⚠️ Advertencia de Discord:', warning));

// ── Evento Ready ───────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`[2011x] 🩸 Entidad 2011X manifestada en Discord como: ${client.user.tag}`);
  console.log(`[2011x] Servidores conectados: ${client.guilds.cache.size}`);

  client.user.setPresence({
    activities: [{ name: '2011X | X', type: 0 }],
    status: 'dnd',
  });

  registerCommands(client).catch(err => {
    console.warn('[2011x] Advertencia al registrar comandos slash:', err.message);
  });
});

// ── Slash Commands ─────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  try {
    await handleCommandInteraction(interaction);
  } catch (err) {
    console.error('[interactionCreate] Error manejando interacción:', err);
  }
});

// ── Sanitizador Estricto: Cero comillas dobles, Cero asteriscos, Cero roleplay teatral ──
function sanitizeBotResponse(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\*[^*]+\*/g, '') // Elimina acciones narrativas entre asteriscos (*sonríe*, etc.)
    .replace(/_([^_]+)_/g, '$1') // Quita itálicas
    .replace(/\([^)]*(?:sonríe|mira|desaparece|estática|vacío|risas?|suspiro|camina|observa)[^)]*\)/gi, '') // Quita narraciones teatrales entre paréntesis
    .replace(/"/g, '') // Quita todas las comillas dobles
    .replace(/“|”/g, '') // Quita comillas tipográficas
    .replace(/^[\s\.\,\:\;\-]+/, '') // Quita signos residuales al inicio
    .replace(/\s{2,}/g, ' ') // Quita espacios duplicados
    .trim();
}

// ── Cálculo de Fragmentos de Escritura Fluida (Por Palabras Completas) ──
function getTypingChunks(text) {
  if (!text || text.length <= 45) return [text];

  const words = text.split(' ');
  if (words.length <= 4) return [text];

  // Divide en 3 etapas naturales sin cortar palabras a la mitad
  const step1Count = Math.max(2, Math.floor(words.length * 0.35));
  const step2Count = Math.max(step1Count + 2, Math.floor(words.length * 0.70));

  const chunk1 = words.slice(0, step1Count).join(' ') + ' ▌';
  const chunk2 = words.slice(0, step2Count).join(' ') + ' ▌';
  const chunkFinal = text;

  if (chunk1 === chunk2) return [chunk1, chunkFinal];
  return [chunk1, chunk2, chunkFinal];
}

// ── Función de Envío con Animación de Escritura Fluida en Discord ──
async function sendBotMessage(message, fullText, sound = null) {
  const cleanedText = sanitizeBotResponse(fullText);
  const soundFile = sound ? [{ attachment: sound.attachment || sound.url, name: sound.name }] : [];

  if (!cleanedText) return;

  const finalContent = cleanedText.slice(0, 1950);
  const chunks = getTypingChunks(finalContent);

  // Si el mensaje es corto (1 solo chunk), enviar directo sin parpadeos innecesarios
  if (chunks.length === 1) {
    const payload = { content: finalContent, allowedMentions: { repliedUser: false } };
    if (soundFile.length > 0) payload.files = soundFile;
    try {
      await message.reply(payload);
    } catch (err) {
      await message.channel.send(payload).catch(() => {});
    }
    return;
  }

  // Paso 1: Enviar primer fragmento fluido con cursor parpadeante (▌) y archivo de audio
  const initialPayload = {
    content: chunks[0],
    allowedMentions: { repliedUser: false }
  };
  if (soundFile.length > 0) {
    initialPayload.files = soundFile;
  }

  let sentMsg = null;
  try {
    sentMsg = await message.reply(initialPayload);
  } catch (err) {
    try {
      sentMsg = await message.channel.send(initialPayload);
    } catch (sendErr) {
      console.error('[discord] ❌ Error enviando mensaje inicial:', sendErr.message);
      return;
    }
  }

  if (!sentMsg) return;

  // Paso 2: Si hay paso intermedio (~70% de palabras), editar fluidamente
  if (chunks.length === 3) {
    await new Promise(r => setTimeout(r, 400));
    try {
      await sentMsg.edit({ content: chunks[1] });
    } catch (e) {
      // Ignorar si el mensaje fue borrado o hay rate limit menor
    }
  }

  // Paso 3: Revelar texto completo final sin cursor
  await new Promise(r => setTimeout(r, 420));
  await sentMsg.edit({ content: finalContent }).catch(() => {});
}

// ── Procesamiento de Mensajes y Deduplicación ──────────────────
const processedMessageIds = new Set();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Deduplicación estricta por ID de mensaje
  if (processedMessageIds.has(message.id)) return;
  processedMessageIds.add(message.id);
  setTimeout(() => processedMessageIds.delete(message.id), 120000);

  // 1. REGLA ESTRICTA: Ignorar totalmente menciones masivas (@everyone / @here)
  if (message.mentions.everyone || /@(?:everyone|here)\b/.test(message.content)) {
    return;
  }

  // 2. REGLA ESTRICTA: Ignorar canales de anuncios, noticias, reglas y paneles protegidos
  if (message.guild && message.channel) {
    const isAnnouncementType = message.channel.type === ChannelType.GuildAnnouncement;
    const isProtectedName = /^(?:anuncios|avisos|noticias|reglas|rules|announcements|bienvenida|welcome|changelog|importante|info-|transcripts)/i.test(message.channel.name);
    
    if (isAnnouncementType || isProtectedName) {
      return;
    }
  }

  const isDM = !message.guild;
  const isDirectlyMentioned = message.mentions.users.has(client.user.id);
  
  // Optimización de comprobación de referencia a mensaje previo (usar caché primero)
  let isRepliedToBot = false;
  if (message.reference?.messageId) {
    const cachedMsg = message.channel.messages.cache.get(message.reference.messageId);
    if (cachedMsg) {
      isRepliedToBot = cachedMsg.author?.id === client.user.id;
    } else {
      const fetchedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
      isRepliedToBot = fetchedMsg?.author?.id === client.user.id;
    }
  }

  const isPrefix = /^!(?:2011x|x)\b/i.test(message.content);
  const isNameCall = /\b(?:2011x|2011-x|2011\s*x|2011)\b/i.test(message.content);

  // Responder si es DM, si lo mencionaron con @, si le respondieron, si usaron prefijo, O si dijeron su nombre ("2011X" o "2011")
  if (!isDM && !isDirectlyMentioned && !isRepliedToBot && !isPrefix && !isNameCall) {
    return;
  }

  let cleanContent = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '')
    .replace(/^!(?:2011x|x)\s*/i, '')
    .trim();

  if (!cleanContent) {
    await message.reply('¿Acaso te quedaste mudo? Habla o no me hagas perder el tiempo.').catch(() => {});
    return;
  }

  const userId = message.author.id;
  const username = message.author.username;
  const displayName = message.member?.displayName || message.author.globalName || username;
  const guildId = message.guild?.id || null;

  console.log(`[messageCreate] 📨 Mensaje de ${displayName} (${userId}) en servidor ${guildId || 'DM'}: "${cleanContent}"`);

  // Mantener indicador de escritura en Discord mientras procesa la IA
  await message.channel.sendTyping().catch(() => {});
  const typingInterval = setInterval(() => {
    message.channel.sendTyping().catch(() => {});
  }, 8000);

  try {
    // 1. Obtener memoria distribuida completa desde Realtime Database
    const memory = await getFullDistributedMemory(userId, guildId).catch(err => {
      console.warn('[memory] Error obteniendo memoria, usando fallback:', err.message);
      return { facts: [], preferences: [], topics: [], messages: [] };
    });

    // 2. Procesar medidor interno de furia
    const rageState = await processRageFromMessage(userId, cleanContent, guildId);

    // 3. Determinar longitud dinámica de respuesta
    const roll = Math.random();
    let lengthMode = 'medium';
    if (cleanContent.length < 35 || cleanContent.split(/\s+/).length <= 5) {
      lengthMode = 'short';
    } else {
      if (roll < 0.35) {
        lengthMode = 'short';
      } else if (roll > 0.80) {
        lengthMode = 'long';
      }
    }

    const isRage = /c[aá]llate|tonto|est[uú]pido|in[uú]til|eres malo|te gano|perdedor/i.test(cleanContent);
    const combinedFacts = [
      ...(memory.facts || []),
      ...(memory.preferences || []).map(p => `Gusto/Preferencia: ${p}`),
      ...(memory.topics || []).map(t => `Tema hablado: ${t.title}`),
    ];

    const systemPrompt = buildSystemPromptWithContext({
      userFacts: combinedFacts,
      mood: (isRage || rageState.isRageActive) ? 'rage' : 'normal',
      responseLength: lengthMode,
      ragePercentage: rageState.ragePercentage,
      isRageActive: rageState.isRageActive,
    });

    // 4. Estructurar historial conversacional continuo optimizado (últimos 8 mensajes)
    const history = [
      ...(memory.messages || []).slice(-8).map(m => ({
        role: m.role,
        content: m.role === 'user' ? (m.username ? `${m.username}: ${m.content}` : m.content) : m.content
      })),
      { role: 'user', content: `${displayName || username}: ${cleanContent}` }
    ];

    // 5. Generar respuesta con la IA Principal
    const aiResult = await generateChatResponse(history, systemPrompt);
    const rawResponseText = aiResult.text;

    // Extraer etiquetas de audio con resolución asíncrona
    const { cleanText: responseText, sound } = await extractAudioTagAsync(rawResponseText);

    // 6. Guardar en Realtime Database el historial de conversación con nombres
    await appendConversationMessage(userId, 'user', cleanContent, guildId, displayName || username);
    await appendConversationMessage(userId, 'assistant', responseText, guildId, '2011X');

    // Limpiar intervalo de typing antes de enviar
    clearInterval(typingInterval);

    // 7. Enviar respuesta limpia y con animación fluida
    await sendBotMessage(message, responseText, sound);

    // 8. Extraer hechos, temas y gustos en segundo plano
    processMessageInMemoryAsync(userId, cleanContent, { username, displayName });

  } catch (err) {
    clearInterval(typingInterval);
    if (err.message === 'RATE_LIMIT_ALL_PROVIDERS' || err.message?.includes('Rate limit') || err.message?.includes('429')) {
      await sendBotMessage(message, 'Hay demasiada saturación en las conexiones ahora mismo. Vuelve a intentarlo en un momento.');
    } else {
      console.error('[messageCreate] Error procesando respuesta de 2011X:', err);
      await sendBotMessage(message, 'Ocurrió un error inesperado al procesar eso. Habla de nuevo.');
    }
  }
});

// ── Manejo Global de Excepciones ───────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[process] Uncaught Exception:', err);
});

// ── Iniciar Sesión en Discord ──────────────────────────────────
const rawToken = config.discord.token;
if (!rawToken) {
  console.error('[fatal] ❌ Ni DISCORD_TOKEN ni BOT_TOKEN fueron encontrados en el entorno.');
  process.exit(1);
}

const token = String(rawToken).replace(/["']/g, '').trim();

// Validación HTTP ligera y sin bloqueo (timeout 5s)
(async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      console.log(`[discord] ✓ Token válido para el bot: ${data.username}#${data.discriminator || '0'} (ID: ${data.id})`);
    } else {
      const errBody = await res.json().catch(() => ({}));
      if (res.status === 429) {
        console.error(`[discord] ⚠️ HTTP 429 (Rate Limit por IP de Render): Discord ha bloqueado temporalmente la IP pública compartida de este servidor. Reintenta en ${errBody.retry_after || 'unos'}s o cambia la región de Render.`);
      } else if (res.status === 401) {
        console.error(`[discord] ❌ HTTP 401 (No autorizado): El token configurado en DISCORD_TOKEN es incorrecto o fue revocado.`);
      } else {
        console.error(`[discord] ❌ Error HTTP ${res.status}:`, errBody.message || JSON.stringify(errBody));
      }
    }
  } catch (err) {
    console.warn(`[discord] Diagnóstico HTTP (${err.name === 'AbortError' ? 'Timeout 5s' : err.message}). Continuando con WebSocket Gateway...`);
  }
})();

console.log(`[discord] 🔐 Conectando cliente al WebSocket Gateway...`);
client.login(token).then(() => {
  console.log('[discord] 🔑 Token aceptado por Discord Gateway.');
}).catch(err => {
  console.error('[fatal] ❌ Error conectando a Discord Gateway:', err);
  if (err.message?.includes('disallowed intents') || err.message?.includes('Privileged')) {
    console.error('[fatal] 💡 SOLUCIÓN: Activa los "Privileged Gateway Intents" (Message Content, Server Members) en Discord Developer Portal > Bot.');
  }
});
