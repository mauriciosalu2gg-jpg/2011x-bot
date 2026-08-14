// ═══════════════════════════════════════════════════════════════
// ⚙️ Configuration & Environment Settings
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  discord: {
    token: process.env.DISCORD_TOKEN || process.env.BOT_TOKEN || process.env.DISCORD_BOT_TOKEN || process.env.TOKEN || process.env.DISCORD_SECRET_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || process.env.BOT_ID || process.env.APPLICATION_ID,
    ownerId: process.env.OWNER_DISCORD_ID || process.env.OWNER_ID,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'alero-company-works',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://alero-company-works-default-rtdb.firebaseio.com',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    memoryGroqKey: process.env.GROQMEMORY_API_KEY || process.env.MEMORY_GROQ_KEY || process.env.GROQ_API_KEY,
    memoryOpenRouterKey: process.env.OPENROUTERMEMORY_API_KEY || process.env.MEMORY_OPENROUTER_KEY || process.env.OPENROUTER_API_KEY,
    primaryGroqModel: 'llama-3.3-70b-versatile',
    balancedGroqModel: 'llama-3.1-8b-instant',
    openRouterFreeModels: [
      'openrouter/free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-7b-instruct:free'
    ],
    memoryModel: 'llama-3.1-8b-instant',
  }
};

export default config;
