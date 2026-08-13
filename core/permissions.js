// ═══════════════════════════════════════════════════════════════
// 🛡️ Permissions Manager
// ═══════════════════════════════════════════════════════════════

import config from '../config.js';

export function isOwner(userId) {
  if (!userId) return false;
  return String(userId) === String(config.discord.ownerId);
}

export function isAdminOrHigher(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.permissions?.has('Administrator') || false;
}

export default { isOwner, isAdminOrHigher };
