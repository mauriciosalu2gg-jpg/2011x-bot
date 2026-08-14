// ═══════════════════════════════════════════════════════════════
// 🩸 2011X Discord Bot — Main Entry Point
// ═══════════════════════════════════════════════════════════════

import dns from 'node:dns';
// Forzar IPv4 prioritario para evitar cuelgues de red en Render/Docker
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import { Client, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import config from './config.js';
import { startWebServer } from './server.js';
import { buildSystemPromptWithContext } from './prompt.js';
import { generateChatResponse } from './services/ai/chatEngine.js';
import { getFullDistributedMemory, appendConversationMessage } from './core/memory/realtimeMemory.js';
import { processMessageInMemoryAsync } from './core/memory/memoryProcessor.js';
import { registerCommands, handleCommandInteraction } from './interactions/commands.js';
import { initFirebase } from './database/firebase.js';

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

// ── Función de Envío con Animación de Escritura (Terminal Typewriter) ──
async function sendAnimatedTypewriterMessage(message, fullText) {
  if (!fullText || fullText.length > 1950) {
    const chunks = (fullText || '').match(/[\s\S]{1,1900}/g) || [fullText];
    for (const chunk of chunks) {
      await message.channel.send(chunk).catch(() => {});
    }
    return;
  }

  // Textos muy cortos: 2 pasos rápidos
  if (fullText.length < 25) {
    const sent = await message.reply({
      content: fullText.slice(0, Math.max(3, Math.floor(fullText.length / 2))) + ' ▌',
      allowedMentions: { repliedUser: false }
    }).catch(() => null);

    if (!sent) {
      await message.channel.send(fullText).catch(() => {});
      return;
    }

    await new Promise(r => setTimeout(r, 260));
    await sent.edit(fullText).catch(() => {});
    return;
  }

  // 3 pasos fluidos de terminal tipo máquina de escribir (28% -> 68% -> 100%)
  const step1 = fullText.slice(0, Math.max(6, Math.floor(fullText.length * 0.28))) + ' ▌';
  const step2 = fullText.slice(0, Math.floor(fullText.length * 0.68)) + ' ▌';

  const sent = await message.reply({
    content: step1,
    allowedMentions: { repliedUser: false }
  }).catch(() => null);

  if (!sent) {
    await message.channel.send(fullText).catch(() => {});
    return;
  }

  await new Promise(r => setTimeout(r, 300));
  await sent.edit(step2).catch(() => {});

  await new Promise(r => setTimeout(r, 300));
  await sent.edit(fullText).catch(() => {});
}

// ── Procesamiento de Mensajes ──────────────────────────────────
const activeUsers = new Set();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const isDM = !message.guild;
  const isMentioned = message.mentions.has(client.user) || 
    (message.reference && (await message.channel.messages.fetch(message.reference.messageId).catch(() => null))?.author?.id === client.user.id);
  const isPrefix = /^!(?:2011x|x)\b/i.test(message.content);

  if (!isDM && !isMentioned && !isPrefix) {
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

  if (activeUsers.has(userId)) {
    await message.reply('¡No me satures! Espera tu turno antes de volver a escribir.').catch(() => {});
    return;
  }

  activeUsers.add(userId);
  const timeoutGuard = setTimeout(() => activeUsers.delete(userId), 30000);

  try {
    await message.channel.sendTyping().catch(() => {});

    // 1. Obtener memoria distribuida completa desde Realtime Database
    const memory = await getFullDistributedMemory(userId, guildId);

    // 2. Construir System Prompt con la personalidad 2011X, hechos, gustos y temas
    const isRage = /c[aá]llate|tonto|est[uú]pido|in[uú]til|eres malo|te gano|perdedor/i.test(cleanContent);
    const combinedFacts = [
      ...(memory.facts || []),
      ...(memory.preferences || []).map(p => `Gusto/Preferencia: ${p}`),
      ...(memory.topics || []).map(t => `Tema hablado: ${t.title}`),
    ];

    const systemPrompt = buildSystemPromptWithContext({
      userFacts: combinedFacts,
      mood: isRage ? 'rage' : 'sadistic',
    });

    // 3. Estructurar el historial conversacional continuo con nombres para coherencia total
    const history = [
      ...(memory.messages || []).slice(-20).map(m => ({
        role: m.role,
        content: m.role === 'user' ? (m.username ? `${m.username}: ${m.content}` : m.content) : m.content
      })),
      { role: 'user', content: `${displayName || username}: ${cleanContent}` }
    ];

    // 4. Generar respuesta con la IA Principal
    const aiResult = await generateChatResponse(history, systemPrompt);
    const responseText = aiResult.text;

    // 5. Guardar en Realtime Database el historial de conversación con nombres
    await appendConversationMessage(userId, 'user', cleanContent, guildId, displayName || username);
    await appendConversationMessage(userId, 'assistant', responseText, guildId, '2011X');

    // 6. Enviar respuesta animada con efecto de escritura de terminal
    await sendAnimatedTypewriterMessage(message, responseText);

    // 7. Extraer hechos, temas, gustos y roles en segundo plano en Realtime Database
    processMessageInMemoryAsync(userId, cleanContent, { username, displayName });

  } catch (err) {
    console.error('[messageCreate] Error procesando respuesta de 2011X:', err);
    await message.reply(`Ocurrió un error cósmico inesperado: \`${err.message.slice(0, 100)}\``).catch(() => {});
  } finally {
    clearTimeout(timeoutGuard);
    activeUsers.delete(userId);
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
