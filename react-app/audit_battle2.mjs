/**
 * Precise gym battle audit.
 * VESTIMENTA gym is at Map002 (8,5). Approach from below: reach (8,6), face UP, press z.
 * From spawn (12,13): walk LEFT 4 → (8,13), then UP 7 → (8,6), face UP, press z.
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
    if (t.includes('gym') || t.includes('Gym') || t.includes('Interact') ||
        t.includes('battle') || t.includes('trainer') || t.includes('entry')) {
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

// Complete ALL pending habits so we can fight all gyms
console.log('=== Completing all habits via API ===');
const token = await page.evaluate(() => localStorage.getItem('hm_token'));
const habitsResp = await page.evaluate(async (tok) => {
  const r = await fetch('/hb_api/index.php?route=/habitos/hoy', { headers: { Authorization: `Bearer ${tok}` } });
  return r.json();
}, token);
console.log('Habits available:', habitsResp.habitos?.length || 0);

for (const h of (habitsResp.habitos || []).filter(x => !x.completado).slice(0, 3)) {
  const compResp = await page.evaluate(async (args) => {
    const r = await fetch('/hb_api/index.php?route=/habitos/completar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.tok}` },
      body: JSON.stringify({ habito_id: args.h.habito_id || args.h.id, gimnasio_id: args.h.gimnasio_id || args.h.gym_id, pokemon_index: 0 })
    });
    return r.json();
  }, { tok: token, h });
  console.log(`  Completed habit ${h.habito_id || h.id}: success=${compResp.success}`);
}

// Reload
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/b2_01_start.png' });

const walk = async (dir, n, holdMs = 320) => {
  const k = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  for (let i = 0; i < n; i++) {
    await page.keyboard.down(k);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(k);
    await page.waitForTimeout(80);
  }
};

// Navigate to VESTIMENTA gym: spawn (12,13) → walk LEFT 4 → (8,13) → walk UP 7 → (8,6)
console.log('\n=== Navigate to VESTIMENTA gym (8,5) ===');
console.log('Step 1: Walk LEFT 4 → (8,13)');
await walk('left', 4, 320);
await page.screenshot({ path: '/tmp/b2_02_after_left4.png' });

console.log('Step 2: Walk UP 7 → (8,6)');
await walk('up', 7, 320);
await page.screenshot({ path: '/tmp/b2_03_at_8_6.png' });

// Face UP (already after walking up) and press z to enter gym
console.log('Step 3: Press z to enter gym (facing UP, building at 8,5)');
await page.keyboard.press('z');
await page.waitForTimeout(3000); // Wait for iris wipe transition
await page.screenshot({ path: '/tmp/b2_04_after_gym_entry.png' });

// Check if we're in the gym map
const bodyText = await page.locator('body').textContent();
const inGym = bodyText.includes('Gimnasio') || bodyText.includes('VESTIMENTA') || bodyText.includes('Map015');
console.log('In gym map:', inGym);
console.log('Body sample:', bodyText.substring(0, 150));

// If we didn't enter, try once more at (8,7) facing up
if (!inGym) {
  console.log('\n→ Not in gym yet, trying from (8,7)...');
  await walk('down', 1, 320);
  await page.keyboard.press('z');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/b2_05_retry_entry.png' });
}

// If still not in gym, check if maybe collision blocked and we're off by 1
// Try also: face LEFT (gym might be to our left if we drifted right)
const bodyAfter2 = await page.locator('body').textContent();
if (!bodyAfter2.includes('Gimnasio') && !bodyAfter2.includes('VESTIMENTA')) {
  console.log('\n→ Trying LEFT approach at (9,5)...');
  // Walk to (9,5): from current (try to reset) — walk RIGHT 1 from (8,6/7) to (9,...) then UP to y=5
  await walk('right', 1, 320);
  await walk('up', 2, 320);
  // Now face LEFT and press z
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(100);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.press('z');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/b2_06_left_approach.png' });
}

// Check final state
const finalBody = await page.locator('body').textContent();
console.log('\nFinal body sample:', finalBody.substring(0, 200));

// Now look for the gym trainer and trigger battle
const canvas = await page.locator('canvas');
const canvasCount = await canvas.count();
console.log(`Canvas count: ${canvasCount}`);

// Inside gym (Map015), trainer is at some position. Walk to them or press z.
// Map015 spawn is (9,11). Trainer should be near the top (y:5 area).
console.log('\n=== Walking up inside gym to find trainer ===');
await walk('up', 6, 320);
await page.screenshot({ path: '/tmp/b2_07_inside_gym_up.png' });

// Press z to interact with trainer
console.log('Press z to interact with trainer...');
await page.keyboard.press('z');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/b2_08_talk_trainer.png' });

// Check for dialogue/battle option
const afterTrainer = await page.locator('body').textContent();
const hasDialog = afterTrainer.includes('luchar') || afterTrainer.includes('batalla') ||
                  afterTrainer.includes('SÍ') || afterTrainer.includes('Sí') ||
                  afterTrainer.includes('RETAR') || afterTrainer.includes('combate');
console.log('Dialog/battle option visible:', hasDialog);

// Accept battle
const battleBtn = page.locator('button').filter({ hasText: /luchar|batalla|retar|SÍ|Sí|combate/i }).first();
if (await battleBtn.count() > 0) {
  console.log('Clicking battle button...');
  await battleBtn.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/b2_09_battle_start.png' });
}

// If no button, press z again (might advance dialog)
await page.keyboard.press('z');
await page.waitForTimeout(500);
await page.keyboard.press('z');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/b2_10_pre_battle.png' });

// Capture battle intro animation frames
console.log('\n=== Capturing battle animation frames ===');
for (let f = 0; f < 16; f++) {
  await page.screenshot({ path: `/tmp/b2_anim_${String(f).padStart(2,'0')}.png` });
  await page.waitForTimeout(200);
}

// Check for HUD elements
const bodyBattle = await page.locator('body').textContent();
const hasHP = bodyBattle.includes('HP') || bodyBattle.includes('Nivel') || bodyBattle.includes('nivel');
console.log('Battle HUD visible:', hasHP);

console.log('\n=== Browser logs ===');
logs.filter(l => /gym|battle|entry|trainer|interact/i.test(l)).slice(0, 20).forEach(l => console.log(l));

await browser.close();
console.log('\nScreenshots: /tmp/b2_*');
