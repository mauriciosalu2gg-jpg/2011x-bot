#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🌟 Novarito Discord Bot v2.0 — Main System Entry Point
// ═══════════════════════════════════════════════════════════════

import { createDiscordClient } from './src/core/client.js';
import { GatewaySupervisor } from './src/core/gateway.js';
import { registerEvents } from './src/core/events.js';
import { config, validateConfig } from './src/core/config.js';
import Logger from './src/core/logger.js';
import { initFirebase } from './src/memory/realtimeDatabase.js';
import { MemoryEngine } from './src/memory/memoryEngine.js';
import { AIRouter } from './src/ai/router.js';
import { MoodEngine } from './src/personality/moodEngine.js';
import { CooldownsManager } from './src/services/cooldowns.js';
import { startRenderServer } from './src/services/renderServer.js';

async function bootstrap() {
  Logger.info('Bootstrap', '==================================================');
  Logger.info('Bootstrap', '🌟 INICIANDO NOVARITO DISCORD BOT v2.0 (RENDER READY)');
  Logger.info('Bootstrap', '==================================================');

  // 1. Validar entorno y configuración
  const issues = validateConfig();
  for (const iss of issues) {
    if (iss.level === 'CRITICAL') {
      Logger.critical('Config', iss.msg);
    } else {
      Logger.warn('Config', iss.msg);
    }
  }

  // 2. Inicializar Firebase Realtime Database
  initFirebase();

  // 3. Instanciar Motores Centrales
  const memoryEngine = new MemoryEngine();
  const aiRouter = new AIRouter();
  const moodEngine = new MoodEngine();
  const cooldownsManager = new CooldownsManager();

  // 4. Instanciar Cliente de Discord y Gateway Supervisor
  const client = createDiscordClient();
  const supervisor = new GatewaySupervisor(client, config.discord.token);

  // 5. Iniciar Servidor Web para Render Healthchecks
  const server = startRenderServer(client, config.server.port);

  // 6. Registrar Dispatcher de Eventos del Bot
  registerEvents(client, {
    aiRouter,
    memoryEngine,
    moodEngine,
    cooldownsManager,
    supervisor,
  });

  // 7. Iniciar Gateway Watchdog y Conexión
  supervisor.startWatchdog(15000);

  if (config.discord.token) {
    try {
      await client.login(config.discord.token);
    } catch (err) {
      Logger.critical('Discord', `Fallo en login inicial: ${err.message}`);
      supervisor.scheduleReconnect(5000);
    }
  } else {
    Logger.warn('Discord', 'DISCORD_TOKEN no proporcionado. Bot en espera de credenciales.');
  }

  // 8. Graceful Shutdown
  const shutdown = async (signal) => {
    Logger.info('System', `Recibida señal ${signal}. Cerrando Novarito ordenadamente...`);
    supervisor.stop();
    if (server) server.close();
    if (client) client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    Logger.error('System', 'Unhandled Rejection detectado:', reason);
  });

  process.on('uncaughtException', (err) => {
    Logger.critical('System', 'Uncaught Exception crítica:', err);
  });
}

bootstrap().catch(err => {
  Logger.critical('Bootstrap', 'Error fatal al iniciar Novarito:', err);
  process.exit(1);
});
