import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5173';
const SHOTS_DIR = '/tmp/audit_shots';
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const issues = [];
const notes = [];

function log(msg) { console.log('[AUDIT] ' + msg); notes.push(msg); }
function issue(sev, ctx, msg) {
  const e = `[${sev}] ${ctx}: ${msg}`;
  console.warn(e);
  issues.push(e);
}

async function shot(page, name) {
  const file = path.join(SHOTS_DIR, name + '.png');
  await page.screenshot({ path: file });
  log(`Screenshot: ${name}`);
  return file;
}

async function waitShot(page, name, ms = 1500) {
  await page.waitForTimeout(ms);
  return shot(page, name);
}

async function run() {
  const consoleErrors = [];
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  // ═══════════════════════════════════════════════════════════
  // SESION 1: REGISTRO + JUEGO COMPLETO
  // ═══════════════════════════════════════════════════════════
  const ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx1.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));

  // 1. LANDING
  log('=== 1. LANDING PAGE ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01_landing');
  const title = await page.title();
  log(`Titulo: "${title}"`);
  if (!title || title === 'Vite App') issue('MEDIO', 'Landing', 'Titulo de pestana generica: ' + title);

  // scroll footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '01b_landing_footer');
  await page.evaluate(() => window.scrollTo(0, 0));

  // 2. REGISTRO
  log('=== 2. REGISTRO ===');
  const crearBtn = page.locator('button', { hasText: /Crear Cuenta/i }).first();
  await crearBtn.waitFor({ state: 'attached' });
  await crearBtn.click({ force: true });
  await waitShot(page, '02_register_form', 800);

  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  log(`Campos de entrada en registro: ${inputCount}`);
  if (inputCount < 2) issue('ALTO', 'Registro', `Solo ${inputCount} campo(s), esperado >=2`);

  // Rellenar
  if (inputCount >= 1) await inputs.nth(0).fill('jugadortest');
  if (inputCount >= 2) await inputs.nth(1).fill('jugador@test.com');
  if (inputCount >= 3) await inputs.nth(2).fill('test1234');
  if (inputCount >= 4) await inputs.nth(3).fill('test1234');

  // Seleccionar avatar (clic en la primera carta de avatar)
  const avatarCards = page.locator('[class*="avatar" i], [class*="Avatar" i]');
  const nAvatars = await avatarCards.count();
  log(`Avatares disponibles: ${nAvatars}`);
  if (nAvatars > 0) {
    await avatarCards.first().click({ force: true });
    log('Avatar seleccionado');
  } else {
    issue('MEDIO', 'Registro', 'No se encuentran cartas de avatar para seleccionar');
  }
  await shot(page, '02b_register_filled');

  const regSubmit = page.locator('button', { hasText: /registrar|crear|unirse|empezar/i }).first();
  if (await regSubmit.count() > 0) {
    await regSubmit.click({ force: true });
  } else {
    await page.locator('button[type="submit"]').first().click({ force: true });
  }
  await waitShot(page, '02c_register_submitted', 2500);

  // 3. SELECCIÓN DE STARTER
  log('=== 3. STARTER ===');
  const starterCards = page.locator('[class*="starter" i], [class*="pokemon-card" i]');
  if (await starterCards.count() > 0) {
    log(`Starters disponibles: ${await starterCards.count()}`);
    await starterCards.first().click({ force: true });
    await waitShot(page, '03_starter_clicked', 800);
    const confirmBtn = page.locator('button', { hasText: /elegir|confirmar|escoger|seleccionar/i }).first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click({ force: true });
      await waitShot(page, '03b_starter_confirmed', 2500);
    } else {
      issue('MEDIO', 'Starter', 'No hay boton de confirmacion de starter');
    }
  } else {
    log('Sin pantalla de starter (puede que ya este seleccionado)');
    await shot(page, '03_no_starter_screen');
  }

  // 4. MAPA / CIUDAD
  log('=== 4. MAPA ===');
  await waitShot(page, '04_mapa', 3000);
  const canvas = page.locator('canvas');
  const nCanvas = await canvas.count();
  if (nCanvas === 0) {
    issue('ALTO', 'Mapa', 'No hay canvas — mapa no renderizado');
  } else {
    log(`Canvas: ${nCanvas} elemento(s)`);
    const box = await canvas.first().boundingBox();
    log(`Tamano canvas: ${box?.width}x${box?.height}`);
    if (box && (box.width < 50 || box.height < 50)) {
      issue('ALTO', 'Mapa', `Canvas muy pequeno: ${box.width}x${box.height}`);
    } else {
      log('Canvas OK');
    }
  }

  // Movimiento con teclas
  await canvas.first().click({ force: true, timeout: 5000 }).catch(() => {});
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown');
  await waitShot(page, '04b_mapa_movimiento', 800);

  // 5. NAVEGACIÓN
  log('=== 5. NAVEGACION ===');
  const allVisibleBtns = await page.locator('button:visible').all();
  log(`Botones visibles: ${allVisibleBtns.length}`);
  for (const b of allVisibleBtns.slice(0, 8)) {
    const txt = (await b.textContent())?.trim().substring(0, 40);
    if (txt) log(`  btn: "${txt}"`);
  }

  // 6. HABITOS
  log('=== 6. HABITOS ===');
  const agendaBtn = page.locator('button:visible', { hasText: /agenda|habito|habits/i }).first();
  if (await agendaBtn.count() > 0) {
    await agendaBtn.click({ force: true });
    await waitShot(page, '06_habitos', 2000);
    const habElems = page.locator('[class*="habit" i], [class*="habito" i], [class*="gym" i]');
    const nHab = await habElems.count();
    log(`Elementos habitos/gym: ${nHab}`);
    if (nHab === 0) issue('ALTO', 'Habitos', 'No aparecen habitos ni gimnasios');
    else log(`${nHab} elementos de habitos visibles`);

    if (nHab > 0) {
      await habElems.first().click({ force: true });
      await waitShot(page, '06b_habito_interaccion', 1000);
    }
  } else {
    issue('MEDIO', 'Habitos', 'No se encuentra boton de navegacion a agenda/habitos');
    await shot(page, '06_habitos_notfound');
  }

  // 7. POKEMON / POKEDEX
  log('=== 7. POKEDEX ===');
  const pkBtn = page.locator('button:visible', { hasText: /pokemon|pokédex|colec/i }).first();
  if (await pkBtn.count() > 0) {
    await pkBtn.click({ force: true });
    await waitShot(page, '07_pokedex', 2000);
  } else {
    log('Boton de Pokedex no encontrado en nav visible');
    await shot(page, '07_pokedex_notfound');
  }

  // 8. TIENDA
  log('=== 8. TIENDA ===');
  const shopBtn = page.locator('button:visible', { hasText: /tienda|shop|comprar/i }).first();
  if (await shopBtn.count() > 0) {
    await shopBtn.click({ force: true });
    await waitShot(page, '08_tienda', 2000);
  } else {
    log('Tienda no accesible desde nav (puede estar en mapa)');
  }

  await ctx1.close();

  // ═══════════════════════════════════════════════════════════
  // SESION 2: LOGIN CON USUARIO EXISTENTE
  // ═══════════════════════════════════════════════════════════
  log('=== 9. TEST LOGIN USUARIO EXISTENTE ===');
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE, { waitUntil: 'networkidle' });

  const loginBtn = page2.locator('button', { hasText: /Iniciar Sesión/i }).first();
  await loginBtn.waitFor({ state: 'attached', timeout: 5000 });
  await loginBtn.click({ force: true });
  await page2.waitForTimeout(600);
  await shot(page2, '09_login_form');

  const loginInputs = page2.locator('input');
  const nLoginInputs = await loginInputs.count();
  log(`Campos login: ${nLoginInputs}`);
  if (nLoginInputs >= 1) await loginInputs.nth(0).fill('jugadortest');
  if (nLoginInputs >= 2) await loginInputs.nth(1).fill('test1234');
  await shot(page2, '09b_login_filled');

  const loginSubmit = page2.locator('button', { hasText: /entrar|login|iniciar/i }).first();
  if (await loginSubmit.count() > 0) await loginSubmit.click({ force: true });
  else await page2.locator('button[type="submit"]').first().click({ force: true });
  await waitShot(page2, '09c_post_login', 3500);

  const loginCanvas = page2.locator('canvas');
  if (await loginCanvas.count() > 0) log('Login exitoso — canvas visible');
  else issue('ALTO', 'Login', 'Tras login correcto no aparece canvas/mapa');

  // 10. ERRORES CONSOLA
  log('=== 10. ERRORES DE CONSOLA ===');
  if (consoleErrors.length === 0) {
    log('Sin errores de consola detectados');
  } else {
    consoleErrors.slice(0, 10).forEach(e => issue('ALTO', 'Consola', e.substring(0, 200)));
  }

  await ctx2.close();
  await browser.close();

  // INFORME FINAL
  const div = '═'.repeat(60);
  const report = [
    div,
    '  INFORME DE AUDITORIA — HABITMON RPG',
    `  ${new Date().toLocaleString('es-ES')}`,
    div, '',
    `ISSUES: ${issues.length}`,
    ...issues.map(i => '  ' + i),
    '', div, 'LOG:', ...notes.map(n => '  ' + n), div,
  ].join('\n');

  console.log('\n' + report);
  fs.writeFileSync('/tmp/audit_report.txt', report);
}

run().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
