/**
 * Audit battle animations: trainer sprite, pokeball throw, pokemon appearance.
 * Strategy: Login as audituser, complete a habit (to bypass route guard),
 * reload, walk to Gym 1 entrance in Map002 (Gimnasio Roca, x:9, y:5 approx),
 * enter gym, trigger battle.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const logs = [];
page.on('console', m => {
  const t = m.text();
  if (m.type() === 'log' || m.type() === 'error') {
    logs.push(`[${m.type()}] ${t.substring(0, 200)}`);
    if (t.includes('battle') || t.includes('Battle') || t.includes('gym') || t.includes('Gym') ||
        t.includes('combat') || t.includes('trainer') || t.includes('pokeball')) {
      console.log('[BROWSER]', t.substring(0, 200));
    }
  }
});

console.log('=== Login ===');
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
await page.waitForTimeout(500);
const inp = page.locator('input');
await inp.nth(0).fill('audituser');
await inp.nth(1).fill('audit1234');
await page.locator('button', { hasText: /ENTRAR/i }).first().click({ force: true });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/battle_01_logged.png' });

// Complete a habit via API to bypass route guard
console.log('=== Completing habit via API ===');
const token = await page.evaluate(() => localStorage.getItem('hm_token'));
const habitsResp = await page.evaluate(async (tok) => {
  const r = await fetch('/hb_api/index.php?route=/habitos/hoy', { headers: { Authorization: `Bearer ${tok}` } });
  return r.json();
}, token);
console.log('Habits:', habitsResp.habitos?.length || 0);

if (habitsResp.habitos?.length > 0) {
  const h = habitsResp.habitos.find(x => !x.completado) || habitsResp.habitos[0];
  const compResp = await page.evaluate(async (args) => {
    const r = await fetch('/hb_api/index.php?route=/habitos/completar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.tok}` },
      body: JSON.stringify({ habito_id: args.h.habito_id || args.h.id, gimnasio_id: args.h.gimnasio_id || args.h.gym_id, pokemon_index: 0 })
    });
    return r.json();
  }, { tok: token, h });
  console.log('Habit completion result:', JSON.stringify(compResp).substring(0, 150));
}

// Reload to fresh state with habits completed
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/battle_02_reloaded.png' });

// Check current screen
const html = await page.locator('body').textContent();
console.log('Body snippet:', html.substring(0, 200));

const walk = async (dir, n, holdMs = 350) => {
  const k = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  for (let i = 0; i < n; i++) {
    await page.keyboard.down(k);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(k);
    await page.waitForTimeout(60);
  }
};

// Player spawns at Map002 (12,13). Gym entrance in Map002 is around (9,5) area.
// Walk up first to reach gym area, then left.
console.log('\n=== Navigate to Gym 1 entrance ===');
console.log('Player at (12,13). Walking UP 8 tiles, LEFT 3 tiles...');
await walk('up', 8, 350);
await page.screenshot({ path: '/tmp/battle_03_walked_up.png' });

await walk('left', 3, 350);
await page.screenshot({ path: '/tmp/battle_04_near_gym.png' });

// Try pressing z to enter gym
console.log('Pressing z to enter gym...');
await page.keyboard.press('z');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/battle_05_after_z_gym.png' });

// Check if we entered gym
const bodyAfterZ = await page.locator('body').textContent();
console.log('After z body snippet:', bodyAfterZ.substring(0, 200));

// Try walking up to gym door (it may be at y:6 or y:7)
console.log('Trying a few more steps up...');
await walk('up', 2, 350);
await page.keyboard.press('z');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/battle_06_gym_attempt2.png' });

// Maybe we need to walk further — gym might be more to the left or up
await walk('up', 2, 350);
await page.keyboard.press('z');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/battle_07_gym_attempt3.png' });

// Let's check the game state - look for battle screen canvas
const canvasCount = await page.locator('canvas').count();
console.log(`Canvas elements: ${canvasCount}`);

// If battle started, take rapid screenshots of animation frames
const bodyNow = await page.locator('body').textContent();
const inBattle = bodyNow.includes('HP') || bodyNow.includes('Nivel') || bodyNow.includes('nivel') || canvasCount > 0;
console.log(`Possibly in battle: ${inBattle}`);

if (inBattle || canvasCount > 0) {
  console.log('=== Capturing battle animation frames ===');
  for (let f = 0; f < 12; f++) {
    await page.screenshot({ path: `/tmp/battle_anim_${String(f).padStart(2,'0')}.png` });
    await page.waitForTimeout(250);
  }
} else {
  // Try navigating directly via JS to trigger a gym battle
  console.log('=== Attempting direct gym battle via JS ===');
  const battleResult = await page.evaluate(() => {
    // Check if there's a way to trigger battle directly
    const gameCtx = window.__gameContext || window.gameContext;
    return { hasGameCtx: !!gameCtx, keys: gameCtx ? Object.keys(gameCtx) : [] };
  });
  console.log('Game context:', JSON.stringify(battleResult));
}

// Dump relevant logs
console.log('\n=== Battle-related browser logs ===');
logs.filter(l => l.toLowerCase().includes('gym') || l.toLowerCase().includes('battle') ||
  l.toLowerCase().includes('combat') || l.toLowerCase().includes('map')).slice(0, 20).forEach(l => console.log(l));

await browser.close();
console.log('\nScreenshots: /tmp/battle_*');
