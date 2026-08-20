// ═══════════════════════════════════════════════════════════════
// 🌐 Novarito Discord Bot — Gateway Watchdog & Reconnection Supervisor
// ═══════════════════════════════════════════════════════════════

import Logger from './logger.js';
import config from './config.js';

export class GatewaySupervisor {
  constructor(client, token = null) {
    this.client = client;
    this.token = token || config.discord.token;
    this.watchdogInterval = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelayMs = 60000;
    this.baseReconnectDelayMs = 4000;
    this.isDestroyed = false;
  }

  startWatchdog(intervalMs = 15000) {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);

    this.watchdogInterval = setInterval(async () => {
      if (this.isDestroyed) return;

      const status = this.client?.ws?.status;
      const isReady = status === 0 && this.client.isReady();

      if (!isReady && !this.isConnecting && this.token) {
        Logger.warn('GatewaySupervisor', `WebSocket no listo (status: ${status}). Verificando reconexión...`);
        this.scheduleReconnect();
      }
    }, intervalMs);

    Logger.info('GatewaySupervisor', `Supervisor de Gateway activo (Watchdog cada ${intervalMs / 1000}s).`);
  }

  scheduleReconnect(customDelayMs = null) {
    if (this.isConnecting || this.isDestroyed) return;

    this.isConnecting = true;
    this.reconnectAttempts++;

    const delay = customDelayMs ?? Math.min(
      this.baseReconnectDelayMs * Math.pow(1.5, Math.min(this.reconnectAttempts - 1, 6)),
      this.maxReconnectDelayMs
    );

    Logger.warn('GatewaySupervisor', `Programando reconexión en ${(delay / 1000).toFixed(1)}s (Intento #${this.reconnectAttempts})...`);

    setTimeout(async () => {
      if (this.isDestroyed) {
        this.isConnecting = false;
        return;
      }

      try {
        Logger.info('GatewaySupervisor', 'Iniciando re-login en Discord Gateway...');
        await this.client.login(this.token);
        this.reconnectAttempts = 0;
        Logger.info('GatewaySupervisor', '✓ Reconexión exitosa a Discord Gateway.');
      } catch (err) {
        Logger.error('GatewaySupervisor', `Fallo al reconectar a Discord: ${err.message}`);
      } finally {
        this.isConnecting = false;
      }
    }, delay);
  }

  stop() {
    this.isDestroyed = true;
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }
}

export default GatewaySupervisor;
