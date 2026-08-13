// ═══════════════════════════════════════════════════════════════
// 🩸 2011X Discord Bot — Main Entry Point
// ═══════════════════════════════════════════════════════════════

import { Client, GatewayIntentBits, Partials } from 'discord.js';
import config from './config.js';
import { startWebServer } from './server.js';
import { buildSystemPromptWithContext } from './prompt.js';
import { generateChatResponse } from './services/ai/chatEngine.js';
import { getUserMemory, appendUserMessage } from './core/memory/realtimeMemory.js';
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
});

// Iniciar servidor web de inmediato para que Render apruebe el puerto $PORT
startWebServer(client, config.port);

// ── Evento Ready ───────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`[2011x] 🩸 Entidad 2011X manifestada en Discord como: ${client.user.tag}`);
  console.log(`[2011x] Servidores conectados: ${client.guilds.cache.size}`);

  client.user.setPresence({
    activities: [{ name: 'Outcome Memories | I\'m 2011X, play my games.', type: 0 }],
    status: 'dnd',
  });

  await registerCommands(client).catch(err => {
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
    await message.reply('*Te mira fijamente con ojos ensangrentados...*\n-# 🩸 ¿Acaso te quedaste mudo, pequeño ratón? Habla o déjame en paz en mis sombras.').catch(() => {});
    return;
  }

  const userId = message.author.id;
  const username = message.author.username;
  const guildId = message.guild?.id || null;

  if (activeUsers.has(userId)) {
    await message.reply('-# ⚠️ *¡No me satures con tus balbuceos! Espera tu turno en el juego...*').catch(() => {});
    return;
  }

  activeUsers.add(userId);
  const timeoutGuard = setTimeout(() => activeUsers.delete(userId), 30000);

  try {
    await message.channel.sendTyping().catch(() => {});

    // 1. Obtener memoria del usuario desde Realtime Database
    const userMemory = await getUserMemory(userId, guildId);

    // 2. Construir System Prompt con la personalidad 2011X y recuerdos
    const isRage = /c[aá]llate|tonto|est[uú]pido|in[uú]til|eres malo|te gano|perdedor/i.test(cleanContent);
    const systemPrompt = buildSystemPromptWithContext({
      userFacts: userMemory.facts || [],
      mood: isRage ? 'rage' : 'sadistic',
    });

    // 3. Estructurar el historial conversacional
    const history = [
      ...(userMemory.messages || []).slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: cleanContent }
    ];

    // 4. Generar respuesta con la IA Principal
    const aiResult = await generateChatResponse(history, systemPrompt);
    const responseText = aiResult.text;

    // 5. Guardar en Realtime Database los mensajes
    await appendUserMessage(userId, 'user', cleanContent, guildId);
    await appendUserMessage(userId, 'assistant', responseText, guildId);

    // 6. Enviar respuesta en Discord (manejando límite de 2000 caracteres si es necesario)
    if (responseText.length <= 1950) {
      await message.reply({ content: responseText, allowedMentions: { repliedUser: false } }).catch(async () => {
        await message.channel.send(responseText).catch(() => {});
      });
    } else {
      const chunks = responseText.match(/[\s\S]{1,1900}/g) || [responseText];
      for (const chunk of chunks) {
        await message.channel.send(chunk).catch(() => {});
      }
    }

    // 7. Extraer hechos en segundo plano para la memoria persistente en Realtime Database
    processMessageInMemoryAsync(userId, cleanContent, username);

  } catch (err) {
    console.error('[messageCreate] Error procesando respuesta de 2011X:', err);
    await message.reply(`*Una distorsión oscura sacude la dimensión...*\n-# ❌ Ocurrió una interferencia cósmica: \`${err.message.slice(0, 100)}\``).catch(() => {});
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

// ── Eventos de Gateway y Diagnóstico ───────────────────────────
client.on('error', (err) => {
  console.error('[discord] ❌ Error en el cliente de Discord:', err);
});

client.on('shardError', (err) => {
  console.error('[discord] ❌ Error en WebSocket Shard:', err);
});

client.on('warn', (warning) => {
  console.warn('[discord] ⚠️ Advertencia de Discord:', warning);
});

// ── Iniciar Sesión en Discord ──────────────────────────────────
const rawToken = config.discord.token;
if (!rawToken) {
  console.error('[fatal] ❌ Ni DISCORD_TOKEN ni BOT_TOKEN fueron encontrados en el entorno.');
  process.exit(1);
}

const token = String(rawToken).replace(/["']/g, '').trim();
console.log(`[discord] 🔐 Intentando autenticar con Discord Gateway (Token: ${token.slice(0, 8)}...)...`);

client.login(token).then(() => {
  console.log('[discord] 🔑 Token aceptado por Discord Gateway. Esperando evento READY...');
}).catch(err => {
  console.error('[fatal] ❌ Error al iniciar sesión en Discord:', err);
  if (err.message?.includes('disallowed intents') || err.message?.includes('Privileged')) {
    console.error('[fatal] 💡 SOLUCIÓN: Activa los "Privileged Gateway Intents" (Message Content, Server Members) en Discord Developer Portal > Bot.');
  }
});
