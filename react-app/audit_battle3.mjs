/**
 * Battle animation audit — clean version.
 * Flow:
 *   1. Login as audituser (NO habit completion so vestirse gym is still pending)
 *   2. Walk to VESTIMENTA gym (8,5) on Map002: spawn (12,13), walk left+up
 *   3. Press z → HomeScreen with Map015 (LÍDER DE VESTIMENTA)
 *   4. Walk UP inside gym interior → trainer at (9,3)
 *   5. Press z → dialog → click "¡DESAFÍO!"
 *   6. Capture battle intro frames (trainer sprite + pokeball throw)
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
    if (/gym|battle|entry|trainer|interior|npc_talk|navigate/i.test(t)) {
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
await page.screenshot({ path: '/tmp/b3_01_logged.png' });

// Check habits to understand state
const token = await page.evaluate(() => localStorage.getItem('hm_token'));
const habitsResp = await page.evaluate(async (tok) => {
  const r = await fetch('/hb_api/index.php?route=/habitos/hoy', { headers: { Authorization: `Bearer ${tok}` } });
  return r.json();
}, token);
const habits = habitsResp.habitos || [];
console.log('Habits:', habits.map(h => `${h.habito_id || h.id}(${h.gym_id}):${h.completado ? 'done' : 'pending'}`).join(', '));

// Reset habits via API to ensure vestirse habit is pending
console.log('=== Resetting habits so vestirse is pending ===');
await page.evaluate(async (tok) => {
  await fetch('/hb_api/index.php?route=/habitos/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
    body: JSON.stringify({})
  });
}, token);

// Reload
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/b3_02_after_reset.png' });

const walk = async (dir, n, holdMs = 180) => {
  const k = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  for (let i = 0; i < n; i++) {
    await page.keyboard.down(k);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(k);
    await page.waitForTimeout(80);
  }
};

// Navigate to VESTIMENTA gym at (8,5). Player at (12,13).
// With 180ms hold (just over 1 tile at 160ms), each key press = 1 tile.
console.log('\n=== Navigate to VESTIMENTA gym (8,5) ===');
console.log('Walk LEFT 4 → (8,13), then UP 7 → (8,6)');
await walk('left', 4, 180);
await page.screenshot({ path: '/tmp/b3_03_left4.png' });

await walk('up', 7, 180);
await page.screenshot({ path: '/tmp/b3_04_at_8_6.png' });

// Check body text
let body = await page.locator('body').textContent();
console.log('After movement body:', body.substring(0, 100));

// Press z to enter gym (player at 8,6 facing UP → building at 8,5 = VESTIMENTA)
console.log('Press z to enter VESTIMENTA gym...');
await page.keyboard.press('z');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/b3_05_gym_entry.png' });

body = await page.locator('body').textContent();
const inGym = body.includes('VESTIMENTA') || body.includes('LÍDER') || body.includes('vestirse');
console.log('In gym:', inGym, '| Header:', body.substring(0, 80));

if (!inGym) {
  // Try adjusting position and retry
  console.log('Not in gym, trying one step left then up and z...');
  await walk('left', 1, 180);
  await walk('up', 2, 180);
  await page.keyboard.press('z');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/b3_06_retry_entry.png' });
  body = await page.locator('body').textContent();
  console.log('After retry body:', body.substring(0, 80));
}

// Now inside gym (HomeScreen with Map015 tileset, player at 9,11)
// Trainer is at (9,3). Walk UP to reach trainer.
// With 180ms hold = 1 tile. Walk UP 7 to reach y=4 facing trainer at y=3.
console.log('\n=== Inside gym: walk UP to trainer ===');
await walk('up', 7, 200);
await page.screenshot({ path: '/tmp/b3_07_near_trainer.png' });

// Press z to interact with trainer
console.log('Press z to interact with trainer...');
await page.keyboard.press('z');
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/b3_08_trainer_dialog.png' });

body = await page.locator('body').textContent();
console.log('After z body:', body.substring(0, 150));

// Look for battle/challenge button
const challengeBtn = page.locator('button').filter({ hasText: /DESAFÍO|LUCHAR|BATALLA|SÍ/i }).first();
const challengeCount = await challengeBtn.count();
console.log('Challenge button found:', challengeCount > 0);

// Advance dialog if needed (press z multiple times to finish dialog text)
for (let i = 0; i < 4; i++) {
  await page.keyboard.press('z');
  await page.waitForTimeout(400);
}
await page.screenshot({ path: '/tmp/b3_09_dialog_advanced.png' });

// Click challenge button
const btn = page.locator('button').filter({ hasText: /DESAFÍO|LUCHAR|BATALLA/i }).first();
if (await btn.count() > 0) {
  console.log('Clicking challenge button...');
  await btn.click({ force: true });
  await page.waitForTimeout(500);
} else {
  // Try the first dialog option button
  const firstOpt = page.locator('button[data-value], .dialog-option').first();
  if (await firstOpt.count() > 0) {
    await firstOpt.click({ force: true });
  }
}

await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/b3_10_battle_init.png' });

// Capture battle intro animation frames
console.log('\n=== Capturing battle animation frames ===');
for (let f = 0; f < 20; f++) {
  await page.screenshot({ path: `/tmp/b3_anim_${String(f).padStart(2,'0')}.png` });
  await page.waitForTimeout(150);
}

body = await page.locator('body').textContent();
const inBattle = body.includes('HP') || body.includes('Nivel') || body.includes('ATACAR') || body.includes('BOLSA');
console.log('Battle HUD visible:', inBattle);
console.log('Body sample:', body.substring(0, 200));

console.log('\n=== Browser logs ===');
logs.filter(l => /gym|battle|entry|navigate|trainer/i.test(l)).slice(0, 25).forEach(l => console.log(l));

await browser.close();
console.log('\nScreenshots saved to /tmp/b3_*');
