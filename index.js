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
    activities: [{ name: 'Outcome Memories | I\'m 2011X, play my games.', type: 0 }],
    status: 'dnd',
  });

  // Asegurar restauración de audios en Render
  ensureSoundAssets().catch(() => {});

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

// ── Sanitizador Estricto: Cero comillas dobles, Cero asteriscos y Cero puntos al inicio ──
function sanitizeBotResponse(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/\*[^*]+\*/g, '') // Elimina *sonríe sádicamente*, *se llena de energía...*
    .replace(/_([^_]+)_/g, '$1') // Quita itálicas narrativas
    .replace(/["“”«»]/g, '') // Quita todas las comillas
    .replace(/^[\s\.\,\:\;\-\_]+/, '') // Quita puntos, comas o guiones al INICIO
    .replace(/\s{2,}/g, ' ') // Quita espacios duplicados
    .trim();
}

// ── Función de Envío Directo y Fiable en Discord ──
async function sendBotMessage(message, fullText, sound = null) {
  const cleanedText = sanitizeBotResponse(fullText);
  const soundFile = sound ? [{ attachment: sound.attachment || sound.url, name: sound.name }] : [];

  if (!cleanedText) return;

  const payload = {
    content: cleanedText.slice(0, 1950),
    allowedMentions: { repliedUser: false }
  };

  if (soundFile.length > 0) {
    payload.files = soundFile;
  }

  try {
    await message.reply(payload);
    console.log(`[discord] ✓ Respuesta enviada exitosamente a ${message.author.username}: "${cleanedText.slice(0, 60)}..."`);
  } catch (err) {
    console.warn(`[discord] Reply falló (${err.message}), intentando channel.send...`);
    try {
      await message.channel.send(payload);
      console.log(`[discord] ✓ Enviado por channel.send.`);
    } catch (sendErr) {
      console.error(`[discord] ❌ Error total enviando mensaje:`, sendErr.message);
    }
  }
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
  const isRepliedToBot = Boolean(
    message.reference && 
    (await message.channel.messages.fetch(message.reference.messageId).catch(() => null))?.author?.id === client.user.id
  );
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

  try {
    await message.channel.sendTyping().catch(() => {});

    // 1. Obtener memoria distribuida completa desde Realtime Database
    const memory = await getFullDistributedMemory(userId, guildId).catch(err => {
      console.warn('[memory] Error obteniendo memoria, usando fallback:', err.message);
      return { facts: [], preferences: [], topics: [], messages: [] };
    });

    // 2. Procesar medidor interno e invisible de furia (0% a 100%, boost grupal y duración de 1 min)
    const rageState = await processRageFromMessage(userId, cleanContent, guildId);

    // 3. Determinar longitud dinámica de respuesta (50% medio, 25% corto, 25% largo)
    const roll = Math.random();
    let lengthMode = 'medium'; // 50% chance
    if (cleanContent.length < 35 || cleanContent.split(/\s+/).length <= 5) {
      lengthMode = 'short'; // Mensajes cortos del usuario reciben respuesta corta y directa
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
      mood: (isRage || rageState.isRageActive) ? 'rage' : 'sadistic',
      responseLength: lengthMode,
      ragePercentage: rageState.ragePercentage,
      isRageActive: rageState.isRageActive,
    });

    // 3. Estructurar historial conversacional continuo optimizado (últimos 8 mensajes para ahorrar tokens)
    const history = [
      ...(memory.messages || []).slice(-8).map(m => ({
        role: m.role,
        content: m.role === 'user' ? (m.username ? `${m.username}: ${m.content}` : m.content) : m.content
      })),
      { role: 'user', content: `${displayName || username}: ${cleanContent}` }
    ];

    // 4. Generar respuesta con la IA Principal
    const aiResult = await generateChatResponse(history, systemPrompt);
    const rawResponseText = aiResult.text;

    // Extraer etiquetas de audio con resolución asíncrona garantizada desde Firebase RTDB
    const { cleanText: responseText, sound } = await extractAudioTagAsync(rawResponseText);

    // 5. Guardar en Realtime Database el historial de conversación con nombres
    await appendConversationMessage(userId, 'user', cleanContent, guildId, displayName || username);
    await appendConversationMessage(userId, 'assistant', responseText, guildId, '2011X');

    // 6. Enviar respuesta limpia y directa en Discord
    await sendBotMessage(message, responseText, sound);

    // 7. Extraer hechos, temas, gustos y roles en segundo plano en Realtime Database
    processMessageInMemoryAsync(userId, cleanContent, { username, displayName });

  } catch (err) {
    if (err.message === 'RATE_LIMIT_ALL_PROVIDERS' || err.message?.includes('Rate limit') || err.message?.includes('429')) {
      const { cleanText: vanishText, sound: glitchSound } = await extractAudioTagAsync('(Una distorsión estática resuena en el aire y la presencia de 2011X se desvanece temporalmente entre las sombras del Vacío...) [AUDIO:glitch]');
      await sendBotMessage(message, vanishText, glitchSound);
    } else {
      console.error('[messageCreate] Error procesando respuesta de 2011X:', err);
      const { cleanText: vanishText, sound: glitchSound } = await extractAudioTagAsync('(El canal se distorsiona con estática y la presencia de 2011X desaparece en la oscuridad...) [AUDIO:glitch]');
      await sendBotMessage(message, vanishText, glitchSound);
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
