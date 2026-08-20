// ═══════════════════════════════════════════════════════════════
// 💬 Novarito Discord Bot — Interactions & Message Event Handler
// ═══════════════════════════════════════════════════════════════

import { StatusManager } from '../visual/status_manager.js';
import { PromptBuilder } from '../personality/promptBuilder.js';
import { Humanizer } from '../personality/humanizer.js';
import { TextStreamer } from '../personality/textStreamer.js';
import Logger from '../core/logger.js';
import config from '../core/config.js';

export async function handleMessage(message, context) {
  const { client, aiRouter, memoryEngine, moodEngine, cooldownsManager } = context;

  if (!message || message.author?.bot) return;
  if (message.content.includes('@everyone') || message.content.includes('@here')) return;

  const channelName = message.channel?.name?.toLowerCase() || '';
  if (/(anuncios|reglas|bienvenida|normas|welcome|announcements)/i.test(channelName)) return;

  const isDM = !message.guild;
  const isMentioned = message.mentions?.has(client.user);
  let isReplyToBot = false;

  if (message.reference) {
    try {
      const referenced = await message.fetchReference();
      if (referenced && referenced.author.id === client.user.id) {
        isReplyToBot = true;
      }
    } catch {}
  }

  if (!isDM && !isMentioned && !isReplyToBot) return;

  let prompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
  if (!prompt) {
    prompt = '¡Hola!';
  }

  const userId = message.author.id;
  const guildId = message.guild?.id || null;
  const channelId = message.channel.id;

  if (cooldownsManager) {
    const cd = cooldownsManager.checkCooldown(userId, 'chat', 2000);
    if (cd.onCooldown) {
      Logger.debug('Handler', `Usuario ${message.author.username} en cooldown (${cd.remainingSec}s restantes).`);
      return;
    }
  }

  const requestId = `REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  Logger.info('Handler', `[${requestId}] Solicitud de @${message.author.username}: "${prompt.slice(0, 50)}..."`);

  const status = new StatusManager(message.channel, message);
  await status.init();
  await status.setThinking();

  try {
    moodEngine.detectMood(prompt);
    await status.setMemoryRecall(guildId ? 'server' : 'global');
    const memoryContext = await memoryEngine.recallMemory(userId, guildId, prompt);
    const recentHistory = memoryEngine.getRecentMessages(channelId);

    const serverName = message.guild ? message.guild.name : 'Mensaje Directo';
    const serverContext = `Canal: #${message.channel.name || 'MD'}, Servidor: ${serverName}, Usuario: @${message.author.username}`;
    const systemPrompt = PromptBuilder.buildSystemPrompt(moodEngine, memoryContext, serverContext);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];

    const result = await aiRouter.executeWithFallback(apiMessages, status, prompt);

    const isTechnical = result.taskType === 'CODE' || result.taskType === 'REASONING';
    const humanizedText = Humanizer.applyHumanization(result.text, isTechnical);

    if (config.personality.typingEffect && humanizedText.length > 50 && humanizedText.length < 1600) {
      const streamer = new TextStreamer(status);
      await streamer.streamText(humanizedText);
    } else {
      await status.finalize(humanizedText);
    }

    memoryEngine.addRecentMessage(channelId, 'user', prompt, message.author.username);
    memoryEngine.addRecentMessage(channelId, 'assistant', humanizedText, 'Novarito');
    memoryEngine.queueMemoryExtraction(userId, guildId, prompt, humanizedText);

    Logger.info('Handler', `[${requestId}] ✓ Respuesta enviada con ${result.provider} (${result.model})`);
  } catch (err) {
    Logger.error('Handler', `[${requestId}] Error al procesar interacción:`, err);
    await status.setError('No pude generar una respuesta en este momento. Inténtalo de nuevo en unos instantes.');
  }
}

export default { handleMessage };
