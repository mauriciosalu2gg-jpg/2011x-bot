// ═══════════════════════════════════════════════════════════════
// ⚡ Novarito Discord Bot — Slash Commands Definitions & Diagnostics
// ═══════════════════════════════════════════════════════════════

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { EMOJIS } from '../visual/emojis.js';
import { getDatabase } from '../memory/realtimeDatabase.js';
import { Mood } from '../personality/moodEngine.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('novarito-status')
    .setDescription('Muestra el estado interno, rendimiento, proveedores y conexión de Novarito'),

  new SlashCommandBuilder()
    .setName('novarito-ping')
    .setDescription('Comprueba la latencia del WebSocket y de la API de Discord'),

  new SlashCommandBuilder()
    .setName('novarito-memory')
    .setDescription('Consulta qué recuerdos tiene guardados Novarito sobre ti'),

  new SlashCommandBuilder()
    .setName('novarito-save-asset')
    .setDescription('Guarda un asset (imagen, audio, video, documento) en tu almacén personal de Firebase')
    .addStringOption(o => o.setName('tipo').setDescription('Tipo de asset').setRequired(true).addChoices(
      { name: 'Imagen', value: 'image' },
      { name: 'Música / Audio', value: 'audio' },
      { name: 'Video', value: 'video' },
      { name: 'Documento / Código', value: 'document' },
    ))
    .addStringOption(o => o.setName('nombre').setDescription('Nombre descriptivo del asset').setRequired(true))
    .addStringOption(o => o.setName('url').setDescription('Enlace URL del archivo').setRequired(true)),

  new SlashCommandBuilder()
    .setName('novarito-mood')
    .setDescription('Consulta o ajusta el estado de ánimo actual de Novarito')
    .addStringOption(o => o.setName('animo').setDescription('Selecciona un estado de ánimo').setRequired(false).addChoices(
      { name: 'Neutral (Equilibrado)', value: Mood.NEUTRAL },
      { name: 'Happy (Alegre)', value: Mood.HAPPY },
      { name: 'Playful (Juguetón)', value: Mood.PLAYFUL },
      { name: 'Concerned (Comprensivo/Empático)', value: Mood.CONCERNED },
      { name: 'Curious (Curioso/Analítico)', value: Mood.CURIOUS },
    )),

  new SlashCommandBuilder()
    .setName('novarito-help')
    .setDescription('Guía rápida sobre las capacidades y comandos de Novarito'),
];

export async function handleInteraction(interaction, context) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  const { client, memoryEngine, aiRouter, moodEngine } = context;

  if (commandName === 'novarito-ping') {
    const ping = client?.ws?.ping ?? 0;
    await interaction.reply({
      content: `${EMOJIS.aceptar} Pong! Latencia del WebSocket: **${ping}ms**`,
      ephemeral: true,
    });
  } else if (commandName === 'novarito-status') {
    const { isReady: fbReady } = getDatabase();
    const uptimeMinutes = Math.floor(process.uptime() / 60);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.pensar} Diagnóstico de Novarito v2.0`)
      .setColor(0x5865F2)
      .addFields(
        { name: '🤖 Bot Tag', value: client?.user?.tag || 'Novarito', inline: true },
        { name: '⏱ Uptime', value: `${uptimeMinutes} minutos`, inline: true },
        { name: '📶 Discord Ping', value: `${client?.ws?.ping ?? 0}ms`, inline: true },
        { name: '🔥 Firebase Realtime DB', value: fbReady ? '🟢 Conectado (/novarito/)' : '🟡 Modo RAM Local', inline: true },
        { name: '⚡ Groq Provider', value: aiRouter?.groq?.isReady() ? '🟢 Listo' : '🟡 Cooldown/Sin Key', inline: true },
        { name: '🌐 OpenRouter Provider', value: aiRouter?.openRouter?.isReady() ? '🟢 Listo' : '🟡 Cooldown/Sin Key', inline: true },
        { name: '🎭 Humor Actual', value: `\`${moodEngine?.currentMood || 'neutral'}\``, inline: true },
        { name: '🧠 Memoria Dual', value: 'Extracción semántica asíncrona activa', inline: true },
      )
      .setFooter({ text: 'Novarito Elite AI Bot • Render Ready' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (commandName === 'novarito-memory') {
    await interaction.deferReply({ ephemeral: true });
    const memories = await memoryEngine.recallMemory(interaction.user.id);
    if (!memories) {
      await interaction.editReply(`${EMOJIS.hojita} No tengo recuerdos guardados sobre ti todavía. ¡Charlemos y aprenderé datos importantes!`);
    } else {
      await interaction.editReply(`${EMOJIS.hojita} **Esto es lo que recuerdo sobre ti:**\n\n${memories}`);
    }
  } else if (commandName === 'novarito-save-asset') {
    const type = interaction.options.getString('tipo');
    const name = interaction.options.getString('nombre');
    const url = interaction.options.getString('url');

    const success = await memoryEngine.saveAsset(interaction.user.id, { type, name, url });
    if (success) {
      await interaction.reply({
        content: `${EMOJIS.aceptar} ¡Asset **"${name}"** (${type}) guardado exitosamente en tu almacén personal de Firebase!`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `${EMOJIS.equis} No se pudo guardar el asset en este momento.`,
        ephemeral: true,
      });
    }
  } else if (commandName === 'novarito-mood') {
    const newMood = interaction.options.getString('animo');
    if (newMood && moodEngine) {
      moodEngine.setMood(newMood);
      await interaction.reply({
        content: `${EMOJIS.aceptar} Estado de ánimo cambiado a **${newMood}**. ${moodEngine.getMoodStyle()}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `${EMOJIS.pensar} Mi estado de ánimo actual es **${moodEngine?.currentMood || 'neutral'}**. ${moodEngine?.getMoodStyle() || ''}`,
        ephemeral: true,
      });
    }
  } else if (commandName === 'novarito-help') {
    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.pensar} Guía de Novarito AI Bot`)
      .setColor(0x00AE86)
      .setDescription('Novarito es un asistente de IA avanzado para Discord con pensamiento profundo animado, memoria semántica persistente y múltiples proveedores de IA.')
      .addFields(
        { name: '💬 Conversación', value: 'Mencióname en cualquier canal o háblame por Mensaje Directo.' },
        { name: '🧠 Pensamiento Profundo', value: 'Pídeme análisis paso a paso o demostraciones lógicas para activar el modo de razonamiento profundo animado.' },
        { name: '📁 Almacén de Assets', value: 'Usa `/novarito-save-asset` para registrar URLs de imágenes o recursos en Firebase.' },
        { name: '🔍 Comandos Útiles', value: '`/novarito-status`, `/novarito-ping`, `/novarito-memory`, `/novarito-mood`' }
      );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

export default { commands, handleInteraction };
