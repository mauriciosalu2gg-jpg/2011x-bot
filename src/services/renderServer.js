// ═══════════════════════════════════════════════════════════════
// 🌐 Novarito Discord Bot — Express Web Server for Render
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import Logger from '../core/logger.js';
import { getDatabase } from '../memory/realtimeDatabase.js';

export function startRenderServer(discordClient, port = 3000) {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    const isReady = discordClient?.ws?.status === 0;
    const { isReady: fbReady } = getDatabase();
    const mem = process.memoryUsage();

    res.json({
      status: isReady ? 'online' : 'starting',
      name: 'Novarito Discord Bot',
      version: '2.0.0',
      botTag: discordClient?.user?.tag || 'Conectando...',
      uptimeSeconds: Math.floor(process.uptime()),
      firebaseConnected: fbReady,
      guildsCount: discordClient?.guilds?.cache?.size || 0,
      ping: discordClient?.ws?.ping || 0,
      memory: {
        rssMb: (mem.rss / 1024 / 1024).toFixed(1),
        heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(1),
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  app.get('/ready', (req, res) => {
    if (discordClient?.ws?.status === 0) {
      res.status(200).json({ ready: true, status: 'CONNECTED' });
    } else {
      res.status(503).json({ ready: false, status: discordClient?.ws?.status ?? 'UNKNOWN' });
    }
  });

  const server = app.listen(port, () => {
    Logger.info('RenderServer', `Servidor Express listo y escuchando en el puerto ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      Logger.warn('RenderServer', `Puerto ${port} ocupado. Reubicando en puerto dinámico...`);
      const alt = app.listen(0, () => {
        Logger.info('RenderServer', `Servidor Express reubicado en puerto ${alt.address().port}`);
      });
      alt.on('error', () => {});
    } else {
      Logger.error('RenderServer', 'Error en servidor Express:', err);
    }
  });

  return server;
}

export default startRenderServer;
