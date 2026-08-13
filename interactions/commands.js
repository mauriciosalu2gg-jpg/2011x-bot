// ═══════════════════════════════════════════════════════════════
// ⚡ Slash Commands Definitions & Handler
// ═══════════════════════════════════════════════════════════════

import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import config from '../config.js';
import { getFullDistributedMemory, purgeEntireUserMemory } from '../core/memory/realtimeMemory.js';
import { isFirebaseReady } from '../database/firebase.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Comprueba si 2011X está al acecho'),

  new SlashCommandBuilder()
    .setName('memoria')
    .setDescription('Revisa qué información tiene 2011X guardada sobre ti en su dimensión'),

  new SlashCommandBuilder()
    .setName('olvidar')
    .setDescription('Purga tus datos y memoria de la dimensión de 2011X'),

  new SlashCommandBuilder()
    .setName('estado')
    .setDescription('Consulta el estado del bot, latencia y conexión con Firebase'),
].map(c => c.toJSON());

export async function registerCommands(client) {
  const token = String(config.discord.token || '').replace(/["']/g, '').trim();
  const clientId = config.discord.clientId || client.user?.id;

  if (!token || !clientId) {
    console.warn('[commands] Falta DISCORD_TOKEN o DISCORD_CLIENT_ID para registrar comandos slash.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    // 1. Purgar comandos antiguos de servidores específicos (Novarito solía registrar comandos de guild)
    if (client.guilds?.cache) {
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
          console.log(`[commands] 🧹 Comandos antiguos de guild purgados en: ${guild.name} (${guildId})`);
        } catch (gErr) {
          console.warn(`[commands] No se pudieron purgar comandos de guild en ${guildId}:`, gErr.message);
        }
      }
    }

    // 2. Sobrescribir comandos globales únicamente con los actuales de 2011X
    console.log('[commands] Registrando comandos globales actualizados de 2011X...');
    await rest.put(Routes.applicationCommands(clientId), { body: commandDefinitions });
    console.log(`[commands] ✓ Comandos globales registrados con éxito (${commandDefinitions.length} comandos).`);
  } catch (err) {
    console.error('[commands] Error registrando comandos slash:', err.message);
  }
}

export async function handleCommandInteraction(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === 'ping') {
    const ping = interaction.client.ws.ping;
    await interaction.reply({
      content: `Mi latencia actual es de **${ping}ms**. ¿Eso es todo lo que querías saber?`,
      ephemeral: false
    });
  } else if (commandName === 'memoria') {
    await interaction.deferReply({ ephemeral: true });
    const mem = await getFullDistributedMemory(user.id, interaction.guildId);
    const facts = mem.facts || [];
    const preferences = mem.preferences || [];
    const topics = mem.topics || [];
    const areas = mem.areas || [];
    const roleStatus = mem.identity?.roleStatus || 'Usuario';

    let msg = `### 📋 Expediente de ${user.username.toUpperCase()}:\n`;
    msg += `- **Estado**: ${roleStatus}\n`;

    if (facts.length > 0) {
      msg += `\n**📜 Hechos conocidos**:\n${facts.map((f, i) => `• ${f}`).join('\n')}\n`;
    }
    if (preferences.length > 0) {
      msg += `\n**🎯 Preferencias / Gustos**:\n${preferences.map((p, i) => `• ${p}`).join('\n')}\n`;
    }
    if (topics.length > 0) {
      msg += `\n**💬 Temas hablados**:\n${topics.map(t => `• ${t.title}`).join('\n')}\n`;
    }
    if (areas.length > 0) {
      msg += `\n**🏰 Áreas de interés**:\n${areas.map(a => `• ${a.name}`).join('\n')}\n`;
    }

    if (facts.length === 0 && preferences.length === 0 && topics.length === 0) {
      msg += `\nTodavía no tengo información guardada sobre ti. Habla más conmigo en el chat para registrar datos.`;
    }

    await interaction.editReply({ content: msg.trim() });
  } else if (commandName === 'olvidar') {
    await interaction.deferReply({ ephemeral: true });
    await purgeEntireUserMemory(user.id, interaction.guildId);
    await interaction.editReply({
      content: `He eliminado completamente toda tu memoria y datos de la base de datos.`
    });
  } else if (commandName === 'estado') {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeStr = `${hours}h ${mins}m ${secs}s`;

    await interaction.reply({
      content: `### ⚙️ ESTADO DE 2011X BOT:\n- **Entidad**: 2011X\n- **Uptime**: ${uptimeStr}\n- **Firebase RTDB**: ${isFirebaseReady() ? '🟢 Conectado' : '🔴 Modo Local'}\n- **Servidores Activos**: ${interaction.client.guilds.cache.size}\n- **Latencia Gateway**: ${interaction.client.ws.ping}ms`,
      ephemeral: true
    });
  }
}

export default { commandDefinitions, registerCommands, handleCommandInteraction };
