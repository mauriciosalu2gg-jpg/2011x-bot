// ═══════════════════════════════════════════════════════════════
// 🤖 Novarito Discord Bot — Core Discord Client Configuration
// ═══════════════════════════════════════════════════════════════

import { Client, GatewayIntentBits, Partials, Options } from 'discord.js';
import config from './config.js';
import Logger from './logger.js';

export function createDiscordClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
    ],
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 3600,
        lifetime: 1800,
      },
      threads: {
        interval: 3600,
        lifetime: 1800,
      },
    },
    allowedMentions: {
      parse: ['users', 'roles'],
      repliedUser: true,
    },
  });

  return client;
}

export default createDiscordClient;
