// ═══════════════════════════════════════════════════════════════
// 🔥 Novarito Discord Bot — Firebase Realtime Database Connector
// ═══════════════════════════════════════════════════════════════

import admin from 'firebase-admin';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import config from '../core/config.js';
import Logger from '../core/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let rtdb = null;
let firestore = null;
let initialized = false;

function cleanPrivateKey(key) {
  if (!key) return undefined;
  let cleaned = String(key).trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

export function initFirebase() {
  if (initialized) return { rtdb, firestore, isReady: !!rtdb };

  let { projectId, clientEmail, privateKey, databaseURL } = config.firebase;
  let cleanedKey = cleanPrivateKey(privateKey);

  if (!projectId || !clientEmail || !cleanedKey) {
    const jsonCandidates = [
      path.join(__dirname, '..', '..', '..', '..', 'storage', 'alero-company-works-firebase-adminsdk-fbsvc-28f5b992cf.json'),
      path.join(__dirname, '..', '..', '..', 'storage', 'alero-company-works-firebase-adminsdk-fbsvc-28f5b992cf.json'),
      path.join(process.cwd(), 'storage', 'alero-company-works-firebase-adminsdk-fbsvc-28f5b992cf.json'),
      path.join(process.cwd(), 'windows-doc', 'storage', 'alero-company-works-firebase-adminsdk-fbsvc-28f5b992cf.json'),
    ];

    for (const cand of jsonCandidates) {
      if (fs.existsSync(cand)) {
        try {
          const sa = JSON.parse(fs.readFileSync(cand, 'utf8'));
          projectId = projectId || sa.project_id;
          clientEmail = clientEmail || sa.client_email;
          cleanedKey = cleanedKey || cleanPrivateKey(sa.private_key);
          Logger.info('Firebase', `Credenciales encontradas en ${path.basename(cand)}`);
          break;
        } catch {}
      }
    }
  }

  if (!projectId || !clientEmail || !cleanedKey) {
    Logger.warn('Firebase', 'Credenciales no disponibles. Operando con caché local en RAM.');
    return { rtdb: null, firestore: null, isReady: false };
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: cleanedKey,
        }),
        databaseURL: databaseURL || 'https://alero-company-works-default-rtdb.firebaseio.com',
      });
    }

    rtdb = admin.database();
    firestore = admin.firestore();
    initialized = true;
    Logger.info('Firebase', '✓ Conectado exitosamente a Firebase Realtime Database (/novarito/...)');
    return { rtdb, firestore, isReady: true };
  } catch (err) {
    Logger.error('Firebase', 'Fallo al inicializar Firebase Admin SDK:', err);
    return { rtdb: null, firestore: null, isReady: false };
  }
}

export function getDatabase() {
  return initFirebase();
}

export class RealtimeDatabaseClient {
  constructor() {
    initFirebase();
  }

  get isReady() {
    return !!rtdb;
  }

  async getUser(userId) {
    if (!rtdb || !userId) return null;
    try {
      let snap = await rtdb.ref(`novarito/memory/users/${userId}`).once('value');
      if (!snap.exists()) {
        snap = await rtdb.ref(`memory/users/${userId}`).once('value');
      }
      return snap.exists() ? snap.val() : null;
    } catch (err) {
      Logger.warn('RTDB', `Error al leer usuario ${userId}: ${err.message}`);
      return null;
    }
  }

  async saveUserFact(userId, fact) {
    if (!rtdb || !userId || !fact) return false;
    try {
      await rtdb.ref(`novarito/memory/users/${userId}/facts`).push({
        fact,
        savedAt: new Date().toISOString(),
      });
      await rtdb.ref(`novarito/memory/users/${userId}/updatedAt`).set(new Date().toISOString());
      return true;
    } catch (err) {
      Logger.warn('RTDB', `Error al guardar hecho de usuario ${userId}: ${err.message}`);
      return false;
    }
  }

  async getGuild(guildId) {
    if (!rtdb || !guildId) return null;
    try {
      const snap = await rtdb.ref(`novarito/memory/guilds/${guildId}`).once('value');
      return snap.exists() ? snap.val() : null;
    } catch (err) {
      Logger.warn('RTDB', `Error al leer servidor ${guildId}: ${err.message}`);
      return null;
    }
  }

  async saveGuildFact(guildId, fact) {
    if (!rtdb || !guildId || !fact) return false;
    try {
      await rtdb.ref(`novarito/memory/guilds/${guildId}/facts`).push({
        fact,
        savedAt: new Date().toISOString(),
      });
      await rtdb.ref(`novarito/memory/guilds/${guildId}/updatedAt`).set(new Date().toISOString());
      return true;
    } catch (err) {
      Logger.warn('RTDB', `Error al guardar hecho de servidor ${guildId}: ${err.message}`);
      return false;
    }
  }

  async saveAsset(userId, assetData) {
    if (!rtdb || !userId) return false;
    try {
      const ref = await rtdb.ref(`novarito/assets/${userId}`).push({
        type: assetData.type || 'document',
        name: assetData.name || 'Sin título',
        url: assetData.url || '',
        metadata: assetData.metadata || {},
        createdAt: new Date().toISOString(),
      });
      return ref.key;
    } catch (err) {
      Logger.error('RTDB', `Error al guardar asset para ${userId}: ${err.message}`);
      return false;
    }
  }

  async getAssets(userId, type = null) {
    if (!rtdb || !userId) return [];
    try {
      const snap = await rtdb.ref(`novarito/assets/${userId}`).once('value');
      if (!snap.exists()) return [];
      const val = snap.val();
      const list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
      return type ? list.filter(a => a.type === type) : list;
    } catch (err) {
      Logger.error('RTDB', `Error al recuperar assets para ${userId}: ${err.message}`);
      return [];
    }
  }
}

export async function closeFirebase() {
  if (rtdb && typeof rtdb.goOffline === 'function') {
    try {
      rtdb.goOffline();
    } catch {}
  }
  if (admin.apps && admin.apps.length) {
    try {
      await Promise.all(admin.apps.map(app => app.delete().catch(() => {})));
    } catch {}\n    rtdb = null;\n    firestore = null;\n    initialized = false;\n  }\n}\n\nexport default RealtimeDatabaseClient;\n