// ═══════════════════════════════════════════════════════════════
// 📝 Novarito Discord Bot — Structured Logger & Masking
// ═══════════════════════════════════════════════════════════════

import config from './config.js';

function maskSensitive(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(?:gsk_|sk-or-v1-|ghp_|bot\s+)[a-zA-Z0-9_\-]{16,}/gi, '[SECRET_MASKED]')
    .replace(/(?:DISCORD_TOKEN|API_KEY|PRIVATE_KEY)=([^\s]+)/gi, '$1=[MASKED]');
}

export class Logger {
  static format(level, module, message, extra = null) {
    const timestamp = new Date().toISOString();
    const cleanMsg = maskSensitive(String(message));
    const extraStr = extra ? ` ${maskSensitive(JSON.stringify(extra))}` : '';
    return `[${timestamp}] [${level}] [${module}] ${cleanMsg}${extraStr}`;
  }

  static info(module, message, extra = null) {
    console.log(this.format('INFO', module, message, extra));
  }

  static debug(module, message, extra = null) {
    if (config.personality.debug) {
      console.log(this.format('DEBUG', module, message, extra));
    }
  }

  static warn(module, message, extra = null) {
    console.warn(this.format('WARN', module, message, extra));
  }

  static error(module, message, err = null) {
    const errMsg = err ? ` — ${err.message || err}` : '';
    console.error(this.format('ERROR', module, `${message}${errMsg}`));
    if (err && config.personality.debug && err.stack) {
      console.error(maskSensitive(err.stack));
    }
  }

  static critical(module, message, err = null) {
    const errMsg = err ? ` — ${err.message || err}` : '';
    console.error(this.format('CRITICAL', module, `${message}${errMsg}`));
  }
}

export default Logger;
