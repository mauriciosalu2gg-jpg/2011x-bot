// ═══════════════════════════════════════════════════════════════
// ⚙️ Novarito Discord Bot — Central Configuration
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvironment() {
  const envCandidates = [
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '..', '..', '.env'),
    path.join(__dirname, '..', '..', '..', '..', '.env'),
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
  }
}

loadEnvironment();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    ownerId: process.env.OWNER_DISCORD_ID || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'alero-company-works',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://alero-company-works-default-rtdb.firebaseio.com',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqMemoryApiKey: process.env.GROQMEMORY_API_KEY || process.env.GROQ_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterMemoryApiKey: process.env.OPENROUTER_MEMORY_API_KEY || process.env.OPENROUTER_API_KEY || '',
    huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',

    models: {
      primaryGroq: process.env.PRIMARY_GROQ_MODEL || 'llama-3.3-70b-versatile',
      fallbackGroq: process.env.FALLBACK_GROQ_MODEL || 'llama-3.1-8b-instant',
      groqReasoning: process.env.REASONING_GROQ_MODEL || 'deepseek-r1-distill-llama-70b',
      openRouterFast: process.env.PRIMARY_OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      openRouterLight: 'google/gemini-2.0-flash-lite:free',
      openRouterReasoning: 'deepseek/deepseek-r1:free',
      huggingFace: process.env.HUGGINGFACE_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct',
      memoryAI: process.env.MEMORY_AI_MODEL || 'llama-3.1-8b-instant',
    },

    timeoutMs: parseInt(process.env.NOVARITO_FALLBACK_TIMEOUT_MS || '15000', 10),
    cooldownMs: parseInt(process.env.NOVARITO_COOLDOWN_MS || '60000', 10),
  },
  personality: {
    debug: process.env.NOVARITO_DEBUG === 'true',
    typingEffect: process.env.NOVARITO_TYPING_EFFECT !== 'false',
    humorLevel: parseFloat(process.env.NOVARITO_HUMOR_LEVEL || '0.7'),
    typoProbability: 0.03,
  },
};

export function validateConfig() {
  const issues = [];
  if (!config.discord.token) {
    issues.push({ level: 'CRITICAL', msg: 'DISCORD_TOKEN es obligatorio para conectar a Discord.' });
  }
  if (!config.ai.groqApiKey && !config.ai.openRouterApiKey && !config.ai.huggingFaceApiKey) {
    issues.push({ level: 'CRITICAL', msg: 'Al menos una API Key de IA (GROQ, OPENROUTER, HUGGINGFACE) es obligatoria.' });
  }
  if (!config.firebase.privateKey && !config.firebase.clientEmail) {
    issues.push({ level: 'WARNING', msg: 'Credenciales de Firebase no definidas; operando con memoria en caché volátil local.' });
  }
  return issues;
}

export default config;
