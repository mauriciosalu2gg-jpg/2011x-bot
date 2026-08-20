// ═══════════════════════════════════════════════════════════════
// 📡 Novarito Discord Bot — Events Dispatcher & Lifecycle Manager
// ═══════════════════════════════════════════════════════════════

import { REST, Routes, ActivityType } from 'discord.js';
import Logger from './logger.js';
import config from './config.js';
import { commands, handleInteraction } from '../interactions/commands.js';
import { handleMessage } from '../interactions/handlers.js';

export function registerEvents(client, context) {
  const { aiRouter, memoryEngine, moodEngine, cooldownsManager, supervisor } = context;

  // 1. Evento Ready
  client.once('ready', async () => {
    Logger.info('Discord', `==================================================`);
    Logger.info('Discord', `🌟 Conectado exitosamente como: ${client.user.tag}`);
    Logger.info('Discord', `🏰 Servidores conectados: ${client.guilds.cache.size}`);
    Logger.info('Discord', `==================================================`);

    client.user.setPresence({
      activities: [{
        name: 'a tus preguntas | Novarito AI',
        type: ActivityType.Listening,
      }],
      status: 'online',
    });

    if (config.discord.clientId && config.discord.token) {
      try {
        const rest = new REST({ version: '10' }).setToken(config.discord.token);
        Logger.info('Discord', `Registrando ${commands.length} Slash Commands...`);
        await rest.put(
          Routes.applicationCommands(config.discord.clientId),
          { body: commands.map(c => c.toJSON()) }
        );
        Logger.info('Discord', '✓ Slash Commands registrados globalmente.');
      } catch (err) {
        Logger.warn('Discord', `No se pudieron registrar slash commands: ${err.message}`);
      }
    }
  });

  // 2. Evento messageCreate
  client.on('messageCreate', async (message) => {
    try {
      await handleMessage(message, {
        client,
        aiRouter,
        memoryEngine,
        moodEngine,
        cooldownsManager,
      });
    } catch (err) {
      Logger.error('Discord', 'Error no manejado en messageCreate:', err);
    }
  });

  // 3. Evento interactionCreate
  client.on('interactionCreate', async (interaction) => {
    try {
      await handleInteraction(interaction, {
        client,
        aiRouter,
        memoryEngine,
        moodEngine,
        cooldownsManager,
      });
    } catch (err) {
      Logger.error('Discord', 'Error no manejado en interactionCreate:', err);
    }
  });

  // 4. Listeners de Errores y Shard Lifecycle
  client.on('error', (err) => {
    Logger.error('Discord', 'Error en el cliente de Discord:', err);
  });

  client.on('shardError', (err, shardId) => {
    Logger.error('Discord', `Error en Shard #${shardId}:`, err);
  });

  client.on('shardDisconnect', (event, shardId) => {
    Logger.warn('Discord', `Shard #${shardId} desconectado (Código: ${event.code}). Supervisor intervendrá si es necesario.`);
    if (supervisor) supervisor.scheduleReconnect();
  });

  client.on('shardReconnecting', (shardId) => {
    Logger.info('Discord', `Shard #${shardId} intentando reconectar...`);
  });

  client.on('shardResume', (shardId, replayedEvents) => {
    Logger.info('Discord', `Shard #${shardId} reanudó sesión (${replayedEvents} eventos repoblados).`);
  });
}

export default registerEvents;
