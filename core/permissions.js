// ═══════════════════════════════════════════════════════════════
// 🛡️ Permissions Manager
// ═══════════════════════════════════════════════════════════════

import config from '../config.js';

export function isOwner(userId) {
  if (!userId || !config.discord.ownerId) return false;
  return String(userId).trim() === String(config.discord.ownerId).trim();
}

export function isAdminOrHigher(member) {
  if (!member) return false;
  if (isOwner(member.id || member.user?.id)) return true;
  return Boolean(member.permissions?.has('Administrator'));
}

export default { isOwner, isAdminOrHigher };
