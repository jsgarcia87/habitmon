/**
 * Test NPC interaction inside Pokémon Center (Map031).
 * Strategy: After login, navigate via the route to Map031.
 *   Map002 -> exit LEFT -> Map008 -> exit LEFT -> Map029 -> walk to Center entrance.
 * Requires completing 1 habit first to bypass the guard.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

page.on('console', m => {
  const t = m.text();
  if (m.type() === 'log' && (t.includes('DEBUG') || t.includes('npc_talk') || t.includes('Interacting') || t.includes('home_entry'))) {
    console.log('[BROWSER]', t.substring(0, 200));
  }
});

console.log('=== Login ===');
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
await page.waitForTimeout(500);
const i = page.locator('input');
await i.nth(0).fill('audituser'); await i.nth(1).fill('audit1234');
await page.locator('button', { hasText: /ENTRAR/i }).first().click({ force: true });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/int_01_logged.png' });

// Complete a habit to bypass the route guard
console.log('=== Complete 1 habit via API ===');
const token = await page.evaluate(() => localStorage.getItem('hm_token'));
const habitsResp = await page.evaluate(async (token) => {
  const r = await fetch('/hb_api/index.php?route=/habitos/hoy', { headers: { Authorization: `Bearer ${token}` }});
  return r.json();
}, token);
console.log('Habits available:', habitsResp.habitos?.length || 0);

if (habitsResp.habitos?.length > 0) {
  const habito = habitsResp.habitos[0];
  console.log('Habit sample:', JSON.stringify(habito).substring(0, 200));
  const compResp = await page.evaluate(async (args) => {
    const r = await fetch('/hb_api/index.php?route=/habitos/completar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${args.token}` },
      body: JSON.stringify({ habito_id: args.habito.habito_id || args.habito.id, gimnasio_id: args.habito.gimnasio_id || args.habito.gym_id, pokemon_index: 0 })
    });
    return r.json();
  }, { token, habito });
  console.log('Habit completion:', JSON.stringify(compResp).substring(0, 150));
}

// Reload to fresh state
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/int_02_reloaded.png' });

console.log('\n=== Navigate to Map029 (Ganymaho) ===');
// From Map002 (12,13), exit left -> Map008 spawn (41,11), exit left -> Map029 spawn (18,12)
// Need to walk to the left edge of each map.
// Each tile animation takes ~250-400ms. Hold key, wait, release.
const walk = async (dir, n, holdMs = 350) => {
  const k = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  for (let i = 0; i < n; i++) {
    await page.keyboard.down(k);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(k);
    await page.waitForTimeout(50);
  }
};

// Walk left until we exit Map002
console.log('Walking left out of Map002 to Map008...');
await walk('left', 16, 400);
await page.screenshot({ path: '/tmp/int_03_in_map008.png' });

// Walk left in Map008 to exit to Map029
console.log('Walking left in Map008 to Map029...');
await walk('left', 45, 250);
await page.screenshot({ path: '/tmp/int_04_in_map029.png' });

// Look for Centro Pokémon entrance. In Map029 it's at (15, 17). Player spawn is (18, 12).
// So walk left 3 and down 5.
console.log('Walking to Centro Pokémon entrance...');
await walk('left', 4, 400);
await walk('down', 6, 400);
await page.screenshot({ path: '/tmp/int_05_near_center.png' });

// Try interacting with the entrance (press z)
console.log('Press z to enter Center...');
await page.keyboard.press('z');
await page.waitForTimeout(2500); // Iris wipe transition
await page.screenshot({ path: '/tmp/int_06_inside_center.png' });

// Now we should be inside Map031 at spawn (9, 11). Joy is at (9, 5). Walk UP 6 tiles.
console.log('Walking UP to Joy...');
await walk('up', 7, 400);
await page.screenshot({ path: '/tmp/int_07_beside_joy.png' });

console.log('Press z to interact with Joy...');
await page.keyboard.press('z');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/int_08_after_z_joy.png' });

// Check for dialogue
const dialogText = await page.locator('body').textContent();
const hasJoyMsg = dialogText.includes('Centro Pokémon') || dialogText.includes('Joy') || dialogText.includes('cansado');
const hasSiButton = await page.locator('button', { hasText: /SÍ|POR FAVOR/i }).count();
console.log(`Joy dialogue triggered: ${hasJoyMsg}`);
console.log(`SÍ button visible: ${hasSiButton > 0}`);

await browser.close();
console.log('\nScreenshots: /tmp/int_*');
