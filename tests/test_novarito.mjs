// ═══════════════════════════════════════════════════════════════
// 🧪 Novarito Bot Comprehensive Test Suite (test_novarito.mjs)
// Complete Unit & Integration Coverage across all 7 Subsystems
// ═══════════════════════════════════════════════════════════════

import { NOVARITO_EMOJIS, UNICODE_FALLBACKS, EMOJIS, getEmoji } from '../src/visual/emojis.js';
import { DotAnimator, DeepThinkingAnimator } from '../src/visual/animator.js';
import { ProcessingTimer } from '../src/visual/timer.js';
import { StatusState, StatusManager } from '../src/visual/statusManager.js';
import { Mood, MoodEngine } from '../src/personality/moodEngine.js';
import { PromptBuilder } from '../src/personality/promptBuilder.js';
import { Humanizer } from '../src/personality/humanizer.js';
import { TextStreamer } from '../src/personality/textStreamer.js';
import { AIRouter, TaskType } from '../src/ai/router.js';
import { LocalFallbackEngine } from '../src/ai/localFallback.js';
import { CircuitBreaker } from '../src/services/rateLimiter.js';
import { CooldownsManager } from '../src/services/cooldowns.js';
import { RAMMemoryCache } from '../src/memory/cache.js';
import { MemoryEngine } from '../src/memory/memoryEngine.js';
import { RealtimeDatabaseClient, closeFirebase } from '../src/memory/realtimeDatabase.js';
import { startRenderServer } from '../src/services/renderServer.js';

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`  ✔ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${name} ${extra ? '— ' + extra : ''}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('======================================================');
  console.log('🌟 NOVARITO BOT v2.0 COMPREHENSIVE TEST SUITE');
  console.log('======================================================\n');

  console.log('1. Emojis Catalog & Canonical Discord IDs');
  assert('Anim1 matches exact Discord custom ID', NOVARITO_EMOJIS.Anim1 === '<:Anim1:1534830863764684940>');
  assert('Anim2 matches exact Discord custom ID', NOVARITO_EMOJIS.Anim2 === '<:Anim2:1534830885285658645>');
  assert('Anim3 matches exact Discord custom ID', NOVARITO_EMOJIS.Anim3 === '<:Anim3:1534830901526134804>');
  assert('pensamientoprofundo matches exact Discord custom ID', NOVARITO_EMOJIS.pensamientoprofundo === '<:pensamientoprofundo:1534830807666131056>');
  assert('recuperar matches exact Discord custom ID', NOVARITO_EMOJIS.recuperar === '<:recuperar:1528121773764116651>');
  assert('hojita matches exact Discord custom ID', NOVARITO_EMOJIS.hojita === '<:hojita:1527960400975630436>');
  assert('pensar matches exact Discord custom ID', NOVARITO_EMOJIS.pensar === '<:pensar:1527960192787025920>');
  assert('servidor matches exact Discord custom ID', NOVARITO_EMOJIS.servidor === '<:servidor:1527959988184682506>');
  assert('aceptar matches exact Discord custom ID', NOVARITO_EMOJIS.aceptar === '<:aceptar:1527959750443012187>');
  assert('equis matches exact Discord custom ID', NOVARITO_EMOJIS.equis === '<:equis:1527958663485198386>');
  assert('advertencia matches exact Discord custom ID', NOVARITO_EMOJIS.advertencia === '<:advertencia:1527958443338633296>');
  assert('Total canonical emojis is exactly 11', Object.keys(NOVARITO_EMOJIS).length === 11);
  assert('Unicode fallback returns emoji character', getEmoji('pensar', true) === '💭');
  assert('Unicode fallback for Anim1 returns symbol', getEmoji('Anim1', true) === '✨');

  console.log('\n2. Animation Systems (System A vs System B)');
  let dotOutput = '';
  const dotAnim = new DotAnimator((text) => { dotOutput = text; }, 50);
  dotAnim.start(EMOJIS.pensar, 'Procesando');
  assert('System A starts with single dot', dotOutput.includes('Procesando.'));
  await new Promise(r => setTimeout(r, 70));
  assert('System A cycles to double dots', dotOutput.includes('Procesando..'));
  dotAnim.stop();
  assert('System A stops cleanly', !dotAnim.isRunning);

  let deepOutput = '';
  const deepAnim = new DeepThinkingAnimator((text) => { deepOutput = text; }, 50);
  deepAnim.start();
  assert('System B frame 1 contains Anim1', deepOutput.includes('1534830863764684940'));
  assert('System B contains pensamientoprofundo header', deepOutput.includes('1534830807666131056'));
  await new Promise(r => setTimeout(r, 65));
  assert('System B frame 2 contains Anim2', deepOutput.includes('1534830885285658645'));
  await new Promise(r => setTimeout(r, 65));
  assert('System B frame 3 contains Anim3', deepOutput.includes('1534830901526134804'));
  deepAnim.stop();
  assert('System B stops cleanly', !deepAnim.isRunning);

  console.log('\n3. Real Processing Timer');
  const timer = new ProcessingTimer();
  timer.start();
  await new Promise(r => setTimeout(r, 120));
  timer.stop();
  const elapsedSec = parseFloat(timer.getElapsedSeconds());
  assert('Timer records positive elapsed time >= 0.1s', elapsedSec >= 0.1);
  const standardSummary = timer.formatSummary(false);
  assert('Standard summary contains "Pensó por"', standardSummary.includes('Pensó por'));
  const deepSummary = timer.formatSummary(true);
  assert('Deep summary contains "Pensó profundamente por"', deepSummary.includes('Pensó profundamente por'));
  assert('Deep summary contains pensamientoprofundo emoji', deepSummary.includes('1534830807666131056'));

  console.log('\n4. AI Router, Classification & 429 Failover Resiliency');
  const router = new AIRouter();
  assert('Classifies reasoning task', router.classifyTask('Por favor piensa profundamente y demuestra matematicamente la solucion') === TaskType.REASONING);
  assert('Classifies code task', router.classifyTask('escribe un script en luau para teleportar jugadores') === TaskType.CODE);
  assert('Classifies complex task', router.classifyTask('explica la diferencia entre microservicios y monolitos en detalle con ventajas y desventajas exhaustivas') === TaskType.COMPLEX);
  assert('Classifies casual chat', router.classifyTask('hola buenas tardes que tal') === TaskType.CASUAL);

  const testBreaker = new CircuitBreaker('TestProvider', { failureThreshold: 2, cooldownDurationMs: 500 });
  assert('Circuit breaker starts CLOSED', testBreaker.isAvailable() === true);
  testBreaker.recordFailure({ status: 429, message: 'Too Many Requests' }, true);
  assert('Circuit breaker opens immediately on 429', testBreaker.isAvailable() === false);
  assert('Cooldown remaining is positive', testBreaker.getRemainingCooldownMs() > 0);
  await new Promise(r => setTimeout(r, 550));
  assert('Circuit breaker enters HALF_OPEN after cooldown', testBreaker.isAvailable() === true);
  testBreaker.recordSuccess();
  assert('Circuit breaker resets to CLOSED on success', testBreaker.isAvailable() === true);

  const resilientRouter = new AIRouter();
  resilientRouter.groq.apiKey = '';
  resilientRouter.openRouter.apiKey = '';
  resilientRouter.huggingFace.apiKey = '';

  const fallbackResult = await resilientRouter.executeWithFallback([{ role: 'user', content: 'hola que tal' }]);
  assert('Router gracefully resolves to LocalFallback when cloud keys absent', fallbackResult.provider === 'LocalFallback');
  assert('Local fallback provides non-empty text', fallbackResult.text.length > 10);

  console.log('\n5. Memory Isolation & Storage Architecture');
  const memoryEngine = new MemoryEngine();

  const testUserA = `user_alpha_${Date.now()}`;
  const testUserB = `user_beta_${Date.now()}`;

  await memoryEngine.saveFact(testUserA, null, 'Le gusta la inteligencia artificial');
  await memoryEngine.saveFact(testUserB, null, 'Desarrolla juegos en Roblox');

  const alphaMemory = await memoryEngine.recallMemory(testUserA);
  const betaMemory = await memoryEngine.recallMemory(testUserB);

  assert('User Alpha memory contains Alpha fact', alphaMemory.includes('inteligencia artificial'));
  assert('User Alpha memory DOES NOT contain Beta fact', !alphaMemory.includes('Roblox'));
  assert('User Beta memory contains Beta fact', betaMemory.includes('Roblox'));
  assert('User Beta memory DOES NOT contain Alpha fact', !betaMemory.includes('inteligencia artificial'));

  await memoryEngine.saveAsset(testUserA, { type: 'image', name: 'Avatar', url: 'https://example.com/pic.png' });
  await memoryEngine.saveAsset(testUserA, { type: 'document', name: 'Doc', url: 'https://example.com/doc.pdf' });

  const allAssets = await memoryEngine.getAssets(testUserA);
  const imageAssets = await memoryEngine.getAssets(testUserA, 'image');

  assert('Retrieves all saved assets for user', allAssets.length === 2);
  assert('Filters assets by type correctly', imageAssets.length === 1 && imageAssets[0].type === 'image');

  memoryEngine.addRecentMessage('channel_99', 'user', 'Hola Novarito');
  memoryEngine.addRecentMessage('channel_99', 'assistant', '¡Hola! ¿En qué te ayudo?');
  const recentMsgs = memoryEngine.getRecentMessages('channel_99');
  assert('Chat history stores messages in order', recentMsgs.length === 2 && recentMsgs[0].role === 'user');

  console.log('\n6. Personality, 5 Moods & Code-Safe Humanizer');
  const moodEngine = new MoodEngine();

  assert('Detects HAPPY mood on praise', moodEngine.detectMood('muchas gracias eres genial!') === Mood.HAPPY);
  assert('Detects PLAYFUL mood on jokes', moodEngine.detectMood('jajaja que buen meme xd') === Mood.PLAYFUL);
  assert('Detects CURIOUS mood on questions', moodEngine.detectMood('por que el cielo es azul? explica como funciona') === Mood.CURIOUS);
  assert('Detects CONCERNED mood on bugs/errors', moodEngine.detectMood('tengo un error critico en mi bot, ayuda') === Mood.CONCERNED);
  assert('Detects NEUTRAL/CALM mood on normal statements', moodEngine.detectMood('la capital de Francia es Paris.') === Mood.NEUTRAL || moodEngine.detectMood('la capital de Francia es Paris.') === Mood.CALM);

  const systemPrompt = PromptBuilder.buildSystemPrompt(moodEngine, '[Usuario]: Desarrollador', 'Canal: #general');
  assert('PromptBuilder includes Novarito identity', systemPrompt.includes('Novarito'));
  assert('PromptBuilder embeds verified memory', systemPrompt.includes('[Usuario]: Desarrollador'));
  assert('PromptBuilder embeds server context', systemPrompt.includes('Canal: #general'));

  const codeBlockInput = 'De nada. Aquí tienes el código:\n```python\n# De nada.\nprint("Hello World https://example.com")\n```\nPor supuesto, úsalo bien.';
  const humanizedOutput = Humanizer.applyHumanization(codeBlockInput, false);

  assert('Humanizer transforms conversational text ("De nada." -> "de nadaa")', humanizedOutput.toLowerCase().includes('de nadaa'));
  assert('Humanizer transforms "Por supuesto" -> "Claro que sí"', humanizedOutput.includes('Claro que sí'));
  assert('Humanizer strictly preserves code block content verbatim', humanizedOutput.includes('```python\n# De nada.\nprint("Hello World https://example.com")\n```'));

  const urlInput = 'Visita https://github.com/novarito/bot para más detalles.';
  const humanizedUrl = Humanizer.applyHumanization(urlInput, false);
  assert('Humanizer does not mutate URLs', humanizedUrl.includes('https://github.com/novarito/bot'));

  console.log('\n7. Express WebServer Endpoints (Render Service)');
  const mockClient = {
    ws: { status: 0, ping: 12 },
    isReady: () => true,
    user: { tag: 'Novarito#1234' },
    guilds: { cache: new Map([['guild1', {}]]) },
  };

  const testPort = 3987;
  const webServer = startRenderServer(mockClient, testPort);

  try {
    const healthRes = await fetch(`http://localhost:${testPort}/health`);
    assert('GET /health returns HTTP 200', healthRes.status === 200);
    const healthText = await healthRes.text();
    assert('GET /health body is "OK"', healthText === 'OK');

    const readyRes = await fetch(`http://localhost:${testPort}/ready`);
    assert('GET /ready returns HTTP 200 when WS status is 0', readyRes.status === 200);
    const readyJson = await readyRes.json();
    assert('GET /ready returns ready: true', readyJson.ready === true);

    const rootRes = await fetch(`http://localhost:${testPort}/`);
    assert('GET / returns HTTP 200', rootRes.status === 200);
    const rootJson = await rootRes.json();
    assert('Root JSON contains bot name', rootJson.name === 'Novarito Discord Bot');
    assert('Root JSON contains version 2.0.0', rootJson.version === '2.0.0');
    assert('Root JSON reports online status', rootJson.status === 'online');
    assert('Root JSON reports memory statistics', Boolean(rootJson.memory && rootJson.memory.rssMb));

    mockClient.ws.status = 5;
    const notReadyRes = await fetch(`http://localhost:${testPort}/ready`);
    assert('GET /ready returns HTTP 503 when disconnected', notReadyRes.status === 503);
  } catch (err) {
    assert('WebServer test failed with exception', false, err.message);
  } finally {
    webServer.close();
  }

  console.log('\n8. Cooldowns Manager & Status State Machine');
  const cooldowns = new CooldownsManager();
  const cd1 = cooldowns.checkCooldown('user_100', 'chat', 1000);
  assert('First request is not on cooldown', cd1.onCooldown === false);
  const cd2 = cooldowns.checkCooldown('user_100', 'chat', 1000);
  assert('Immediate second request is on cooldown', cd2.onCooldown === true);
  assert('Remaining cooldown is positive', cd2.remainingMs > 0);

  let lastChannelMessage = '';
  const mockChannel = {
    send: async (msg) => { lastChannelMessage = msg; return { edit: async (t) => { lastChannelMessage = t; } }; }
  };
  const statusMgr = new StatusManager(mockChannel);
  await statusMgr.init(EMOJIS.pensar, 'Iniciando');
  assert('StatusManager initializes correctly', lastChannelMessage.includes('Iniciando'));
  await statusMgr.setRecovering('OpenRouter');
  assert('StatusManager transitions to RECOVERING state', statusMgr.currentState === StatusState.RECOVERING);
  await statusMgr.finalize('Hola Mauricio');
  assert('StatusManager finalizes and appends processing timer', lastChannelMessage.includes('Hola Mauricio') && lastChannelMessage.includes('Pensó por'));
  statusMgr.destroy();

  console.log('\n======================================================');
  console.log(`📊 NOVARITO TEST RESULTS: ${passed} PASADOS | ${failed} FALLIDOS`);
  console.log('======================================================\n');

  await closeFirebase();
  process.exitCode = failed > 0 ? 1 : 0;
}

runTestSuite().catch(err => {
  console.error('Fatal error in Novarito test suite:', err);
  process.exit(1);
});
