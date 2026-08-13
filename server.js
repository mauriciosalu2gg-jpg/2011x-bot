// ═══════════════════════════════════════════════════════════════
// 🌐 Express Web Server — Render Web Service Ready
// Puerto instantáneo para health check
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import { isFirebaseReady } from './database/firebase.js';

export function startWebServer(client, port = process.env.PORT || 3000) {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    const isReady = client?.ws?.status === 0;
    res.json({
      status: 'online',
      name: '2011X Discord Bot',
      persona: 'Outcome Memories (Roblox)',
      botTag: client?.user?.tag || 'Conectando...',
      uptimeSeconds: Math.floor(process.uptime()),
      firebaseConnected: isFirebaseReady(),
      guildsCount: client?.guilds?.cache?.size || 0,
      ping: client?.ws?.ping || 0,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  const server = app.listen(port, () => {
    console.log(`[web] ✓ Servidor Express listo y escuchando en el puerto ${port}`);
  });

  return server;
}

export default { startWebServer };
