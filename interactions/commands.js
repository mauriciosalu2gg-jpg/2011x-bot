// ═══════════════════════════════════════════════════════════════
// ⚡ Slash Commands Definitions & Handler
// ═══════════════════════════════════════════════════════════════

import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import config from '../config.js';
import { getUserMemory, purgeUserMemory } from '../core/memory/realtimeMemory.js';
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
  const token = config.discord.token;
  const clientId = config.discord.clientId || client.user?.id;

  if (!token || !clientId) {
    console.warn('[commands] Falta DISCORD_TOKEN o DISCORD_CLIENT_ID para registrar comandos slash globales.');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log('[commands] Registrando comandos slash globales...');
    await rest.put(Routes.applicationCommands(clientId), { body: commandDefinitions });
    console.log(`[commands] ✓ Comandos slash registrados con éxito (${commandDefinitions.length} comandos).`);
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
      content: `*Sonríe desde la oscuridad...*\n-# 🩸 Mi latencia dimensional es de **${ping}ms**. ¿Crees que esa fracción de segundo te salvará de mis juegos?`,
      ephemeral: false
    });
  } else if (commandName === 'memoria') {
    await interaction.deferReply({ ephemeral: true });
    const mem = await getUserMemory(user.id);
    const facts = mem.facts || [];

    if (facts.length === 0) {
      await interaction.editReply({
        content: `*Te observa fijamente sin pestañear...*\n-# 📜 Todavía no he recolectado suficientes datos sobre ti, pequeño mortal. Habla más en mis dominios...`
      });
    } else {
      const list = facts.map((f, i) => `${i + 1}. ${f}`).join('\n');
      await interaction.editReply({
        content: `### 🩸 LO QUE SÉ DE TI (${user.username}):\n${list}\n\n*Todo está guardado en mi archivo dimensional... jamás lo olvides.*`
      });
    }
  } else if (commandName === 'olvidar') {
    await interaction.deferReply({ ephemeral: true });
    await purgeUserMemory(user.id);
    await interaction.editReply({
      content: `*Arranca las páginas de tu expediente y las reduce a cenizas oscuras...*\n-# 🗑️ He purgado tu registro en mi memoria en tiempo real. Ahora volvemos a ser extraños... por ahora.`
    });
  } else if (commandName === 'estado') {
    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeStr = `${hours}h ${mins}m ${secs}s`;

    await interaction.reply({
      content: `### ⚙️ ESTADO DE 2011X BOT:\n- **Entidad**: 2011X (Outcome Memories)\n- **Uptime**: ${uptimeStr}\n- **Firebase RTDB**: ${isFirebaseReady() ? '🟢 Conectado' : '🔴 Modo Local'}\n- **Servidores Activos**: ${interaction.client.guilds.cache.size}\n- **Latencia Gateway**: ${interaction.client.ws.ping}ms`,
      ephemeral: true
    });
  }
}

export default { commandDefinitions, registerCommands, handleCommandInteraction };
