// ═══════════════════════════════════════════════════════════════
// ⚙️ Configuration & Environment Settings
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  discord: {
    token: process.env.DISCORD_TOKEN || process.env.BOT_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    ownerId: process.env.OWNER_DISCORD_ID,
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
    memoryGroqKey: process.env.MEMORY_GROQ_KEY || process.env.GROQ_API_KEY,
    memoryOpenRouterKey: process.env.MEMORY_OPENROUTER_KEY || process.env.OPENROUTER_API_KEY,
    defaultChatModel: 'llama-3.3-70b-versatile',
    fallbackChatModel: 'meta-llama/llama-3.3-70b-instruct',
    memoryModel: 'llama-3.1-8b-instant',
  }
};

export default config;
