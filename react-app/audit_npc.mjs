import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const logs = [];
page.on('console', m => { if (m.type() === 'log' || m.type() === 'error') logs.push(`[${m.type()}] ${m.text().substring(0, 150)}`); });

console.log('=== Login ===');
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
await page.waitForTimeout(400);
const i = page.locator('input');
await i.nth(0).fill('audituser');
await i.nth(1).fill('audit1234');
await page.locator('button', { hasText: /ENTRAR/i }).first().click({ force: true });
await page.waitForTimeout(5000);
await page.screenshot({ path: '/tmp/npc_01_logged.png' });

// Test 1: Walk to Guía del Pueblo in Map002 (x:5, y:10). Player spawn ~(12, 13).
console.log('\n=== Test 1: NPC en Map002 (Guía del Pueblo) ===');
console.log('Player default: x:12,y:13 → Guía: x:5,y:10. Walking left 12, up 4 (with extra to overcome collision).');
// Slow down to let movement animation complete (~400ms per tile)
for (let n = 0; n < 12; n++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(500); }
for (let n = 0; n < 4; n++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(500); }
await page.screenshot({ path: '/tmp/npc_02_beside_guia.png' });

// Player faces UP after movement. NPC may be UP or LEFT. Try UP first.
console.log('Press z facing UP...');
await page.keyboard.press('z');
await page.waitForTimeout(1500);
let dlg = await page.locator('[class*="dialog" i]').count();
console.log(`  Dialogos: ${dlg}`);
if (dlg === 0) {
  // Face LEFT and try again
  console.log('Facing LEFT and pressing z...');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.press('z');
  await page.waitForTimeout(1500);
  dlg = await page.locator('[class*="dialog" i]').count();
  console.log(`  Dialogos: ${dlg}`);
}
if (dlg === 0) {
  // Try DOWN
  console.log('Facing DOWN and pressing z...');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.press('z');
  await page.waitForTimeout(1500);
  dlg = await page.locator('[class*="dialog" i]').count();
  console.log(`  Dialogos: ${dlg}`);
}
if (dlg === 0) {
  // Try RIGHT
  console.log('Facing RIGHT and pressing z...');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.press('z');
  await page.waitForTimeout(1500);
  dlg = await page.locator('[class*="dialog" i]').count();
  console.log(`  Dialogos: ${dlg}`);
}
await page.screenshot({ path: '/tmp/npc_03_after_z_guia.png' });

// Try clicking A button explicitly
const aBtn = page.locator('button', { hasText: /^A$/ }).first();
if (await aBtn.count() > 0) {
  console.log('\nIntentando con clic en el botón A en pantalla...');
  await aBtn.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/npc_04_clicked_A.png' });
}

console.log('\n=== Logs relevantes ===');
logs.filter(l => l.toLowerCase().includes('npc') || l.toLowerCase().includes('interact') || l.toLowerCase().includes('button')).slice(0, 15).forEach(l => console.log(l));

await browser.close();
console.log('\nScreenshots: /tmp/npc_*');
