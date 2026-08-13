// ═══════════════════════════════════════════════════════════════
// 🔥 Firebase Initialization: Realtime Database + Firestore
// ═══════════════════════════════════════════════════════════════

import admin from 'firebase-admin';
import config from '../config.js';

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
  if (initialized) return { rtdb, firestore, isReady: true };

  const { projectId, clientEmail, privateKey, databaseURL } = config.firebase;
  const cleanedKey = cleanPrivateKey(privateKey);

  if (!projectId || !clientEmail || !cleanedKey) {
    console.warn('[firebase] ⚠️ Credenciales incompletas. Firebase funcionará en modo offline/memoria local.');
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
        databaseURL: databaseURL || `https://${projectId}-default-rtdb.firebaseio.com`,
      });
    }

    rtdb = admin.database();
    firestore = admin.firestore();
    initialized = true;
    console.log(`[firebase] ✓ Conectado exitosamente a Firebase Realtime Database (${databaseURL}) y Firestore`);
    return { rtdb, firestore, isReady: true };
  } catch (err) {
    console.error('[firebase] ✗ Error al inicializar Firebase Admin SDK:', err.message);
    return { rtdb: null, firestore: null, isReady: false };
  }
}

// Auto-inicializar al importar el módulo
const { rtdb: initialRtdb, firestore: initialFirestore } = initFirebase();
export { initialRtdb as rtdb, initialFirestore as firestore };
export const db = initialFirestore;

export function isFirebaseReady() {
  return initialized && Boolean(rtdb);
}

export default { rtdb: initialRtdb, firestore: initialFirestore, db: initialFirestore, isFirebaseReady, initFirebase };
