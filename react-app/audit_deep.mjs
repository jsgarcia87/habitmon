/**
 * Habitmon RPG — Deep User Audit
 * Simulates a real user: register → intro dialogs → starter → map → menu → habits → login
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5173';
const SHOTS_DIR = '/tmp/audit_deep';
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
  log(`📸 ${name}`);
  return file;
}
async function pause(page, ms, name) {
  await page.waitForTimeout(ms);
  if (name) await shot(page, name);
}

// A button = 'z' key (Controls.jsx line 75)
async function clickA(page) {
  const aBtn = page.locator('button', { hasText: /^A$/ }).first();
  if (await aBtn.count() > 0) await aBtn.click({ force: true });
  else await page.keyboard.press('z');
  await page.waitForTimeout(350);
}

// START = Enter key (Controls.jsx line 77)
async function clickStart(page) {
  const startBtn = page.locator('button', { hasText: /^START$/ }).first();
  if (await startBtn.count() > 0) await startBtn.click({ force: true });
  else await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
}

async function pressDir(page, dir, times = 1) {
  const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(keyMap[dir]);
    await page.waitForTimeout(180);
  }
}

async function run() {
  const consoleErrors = [];
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  // ═══════════════════════════════════════════════════════════
  // SESIÓN 1: REGISTRO COMPLETO + EXPLORACIÓN DEL JUEGO
  // ═══════════════════════════════════════════════════════════
  const ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx1.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push(e.message));

  // ── 1. LANDING ────────────────────────────────────────────
  log('=== 1. LANDING ===');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await shot(page, '01_landing');

  // Check footer exists
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '01b_landing_scroll');
  await page.evaluate(() => window.scrollTo(0, 0));

  const hasH1 = await page.locator('h1, [class*="hero"], [class*="title"]').count() > 0;
  if (!hasH1) issue('BAJO', 'Landing', 'No se detecta título principal en la landing');

  // ── 2. REGISTRO ───────────────────────────────────────────
  log('=== 2. REGISTRO ===');
  await page.locator('button', { hasText: /Crear Cuenta/i }).first().click({ force: true });
  await pause(page, 800, '02_register_form');

  // Inspect form fields
  const allInputs = page.locator('input');
  const nInputs = await allInputs.count();
  log(`Campos de registro: ${nInputs}`);

  // Username
  await allInputs.nth(0).fill('audituser');
  log('Username: audituser');

  // Email
  const emailInput = page.locator('input[type="email"], input[placeholder*="@"]').first();
  if (await emailInput.count() > 0) {
    await emailInput.fill('audit@test.com');
    log('Email: audit@test.com');
  }

  // Password
  const passInputs = page.locator('input[type="password"]');
  const nPass = await passInputs.count();
  log(`Campos de contraseña: ${nPass}`);
  if (nPass >= 1) await passInputs.nth(0).fill('audit1234');
  if (nPass >= 2) {
    await passInputs.nth(1).fill('audit1234');
    log('Confirmación de contraseña rellenada');
  }

  // Avatar — click first one, check visual feedback
  const avatarBtns = page.locator('[class*="avatar" i], [class*="Avatar" i]');
  const nAvatars = await avatarBtns.count();
  log(`Avatares disponibles: ${nAvatars}`);
  if (nAvatars === 0) {
    issue('MEDIO', 'Registro', 'No hay selector de avatar visible — puede que use clases distintas');
    // Try clicking any image/card in form
    const formCards = page.locator('form img, form [class*="card"], form [class*="sprite"]');
    if (await formCards.count() > 0) {
      await formCards.first().click({ force: true });
      log('Clic en imagen dentro del formulario como fallback de avatar');
    }
  } else {
    await avatarBtns.nth(1).click({ force: true }); // Pick avatar 1 (not default)
    log('Avatar 1 seleccionado');
  }

  await shot(page, '02b_register_filled');

  // Submit
  const regBtn = page.locator('button', { hasText: /REGISTRARME|CREAR|REGISTRO|EMPEZAR/i }).first();
  if (await regBtn.count() > 0) await regBtn.click({ force: true });
  else await page.locator('button[type="submit"]').first().click({ force: true });

  await pause(page, 3000, '02c_register_submitted');

  // ── 3. INTRO DIALOGS (Professor Oak) ─────────────────────
  log('=== 3. INTRO DIÁLOGOS ===');
  // Advance through any intro dialogs with A button
  for (let i = 0; i < 8; i++) {
    const dialogBox = page.locator('[class*="dialog" i], [class*="dialogue" i], [class*="textbox" i], [class*="message-box" i]');
    if (await dialogBox.count() === 0) break;
    const text = await dialogBox.first().textContent();
    log(`  Diálogo ${i+1}: "${text?.trim().substring(0, 60)}"`);
    await clickA(page);
    await pause(page, 400);
    if (i === 3) await shot(page, `03_dialog_${i}`);
  }
  await shot(page, '03b_post_dialogs');

  // ── 4. STARTER SELECTION ─────────────────────────────────
  // Starters en StarterScreen están en el mapa como NPCs en tileX:9-11, tileY:5
  // El jugador empieza en x:10, y:10 → necesita subir 5 tiles con ArrowUp
  log('=== 4. STARTER (walkup al Pokéball) ===');
  await shot(page, '04_pre_starter');

  // En StarterScreen modo exploration, los Pokéballs son imgs clickables con alt=nombre
  // Clic directo en Cyndaquil (centro)
  const pokeballImg = page.locator('img[alt="Cyndaquil"], img[alt="Chikorita"], img[alt="Totodile"]').first();
  const nBalls = await pokeballImg.count();
  log(`Pokéballs clickables encontrados: ${nBalls}`);

  if (nBalls > 0) {
    await pokeballImg.click({ force: true });
    await pause(page, 600, '04b_pokeball_clicked');
    log('Clic en Pokéball');
  } else {
    // Fallback: subir tiles y usar tecla z
    for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowUp'); await page.waitForTimeout(150); }
    await pause(page, 300, '04b_beside_pokeballs');
    await clickA(page);
    await pause(page, 600);
    log('Interacción con A (fallback)');
  }

  // El modal "¿Quieres a X?" aparece — click SÍ
  const siBtn = page.locator('button', { hasText: /^SÍ$/i }).first();
  await siBtn.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await siBtn.count() > 0) {
    await shot(page, '04c_starter_confirm_dialog');
    await siBtn.click({ force: true });
    log('Starter confirmado con botón SÍ');
    await pause(page, 3000, '04d_starter_confirmed'); // Esperar animación + navigate('city')
  } else {
    issue('MEDIO', 'Starter', 'Modal de confirmación no apareció');
    await shot(page, '04_no_confirm_modal');
  }

  // ── 5. MAPA / CIUDAD ─────────────────────────────────────
  log('=== 5. MAPA ===');
  await pause(page, 3000, '05_mapa_inicial');

  const canvas = page.locator('canvas');
  if (await canvas.count() === 0) {
    issue('ALTO', 'Mapa', 'Canvas no renderizado');
  } else {
    const box = await canvas.first().boundingBox();
    log(`Canvas OK: ${box?.width}x${box?.height}`);
  }

  // Advance any remaining dialogs
  for (let i = 0; i < 5; i++) {
    const dialog = page.locator('[class*="dialog" i], [class*="textbox" i], [class*="message" i]');
    if (await dialog.count() === 0) break;
    log(`Diálogo post-mapa ${i+1}: "${(await dialog.first().textContent())?.substring(0,50)}"`);
    await clickA(page);
    await pause(page, 400);
  }
  await shot(page, '05b_mapa_sin_dialogo');

  // ── 6. MOVIMIENTO ────────────────────────────────────────
  log('=== 6. MOVIMIENTO ===');
  await canvas.first().click({ force: true }).catch(() => {});
  await pressDir(page, 'down', 3);
  await pressDir(page, 'right', 3);
  await pressDir(page, 'up', 2);
  await pressDir(page, 'left', 1);
  await pause(page, 600, '06_movimiento');

  // Check player moved (compare screenshots)
  log('Movimiento de personaje completado');

  // ── 7. MENÚ START ────────────────────────────────────────
  log('=== 7. MENÚ START ===');
  await clickStart(page);
  await pause(page, 800, '07_menu_start');

  // StartMenu tiene className="animate-slide-in-right retro-panel"
  const menuPanel = page.locator('.retro-panel').first();
  const menuOpen = await menuPanel.isVisible().catch(() => false);
  if (!menuOpen) {
    issue('ALTO', 'Menú', 'Panel .retro-panel no visible tras pulsar START');
  } else {
    log('✅ Menú START abierto (.retro-panel visible)');
    const menuSpans = menuPanel.locator('span');
    const nSpans = await menuSpans.count();
    const menuTexts = await menuSpans.allTextContents();
    log(`Opciones en menú: ${menuTexts.filter(t => t.trim().length > 1).join(', ')}`);
  }

  // ── 8. HÁBITOS DESDE MENÚ ────────────────────────────────
  log('=== 8. HÁBITOS (desde menú) ===');
  const habitosItem = page.locator('.retro-panel span', { hasText: /AGENDA/i }).first();

  if (await habitosItem.count() > 0) {
    await habitosItem.click({ force: true });
    await pause(page, 1500, '08_habitos_screen');

    const habItems = page.locator('[class*="habit" i], [class*="habito" i], [class*="task" i], [class*="gym" i]');
    const nHab = await habItems.count();
    log(`Hábitos/Gimnasios visibles: ${nHab}`);
    if (nHab === 0) issue('ALTO', 'Hábitos', 'No aparecen hábitos en la pantalla de agenda');
    else log(`✅ ${nHab} elementos de hábitos`);

    // Try ticking first habit
    if (nHab > 0) {
      await habItems.first().click({ force: true });
      await pause(page, 1000, '08b_habito_completar');
      const completedIndicator = page.locator('[class*="complet" i], [class*="done" i], [class*="check" i]');
      if (await completedIndicator.count() > 0) log('✅ Hábito completado con éxito (indicador visible)');
      else log('Hábito clicado — sin indicador de completado visible');
    }
    // Close/back
    const backBtn = page.locator('button', { hasText: /volver|cerrar|back|B/i }).first();
    if (await backBtn.count() > 0) await backBtn.click({ force: true });
    else await clickA(page);
    await pause(page, 500);
  } else {
    issue('MEDIO', 'Hábitos', 'No se encuentra "Hábitos/Agenda" en el menú START');
    // Close menu and try other approach
    await page.keyboard.press('Escape');
    await pause(page, 400);
  }

  // ── 9. POKÉDEX DESDE MENÚ ────────────────────────────────
  log('=== 9. POKÉDEX (desde menú) ===');
  await clickStart(page);
  await pause(page, 600);
  const pokedexItem = page.locator('.retro-panel span', { hasText: /POKÉDEX/i }).first();

  if (await pokedexItem.count() > 0) {
    await pokedexItem.click({ force: true });
    await pause(page, 1500, '09_pokedex');
    const pkItems = page.locator('[class*="pokemon" i], [class*="Pokemon" i]');
    log(`Elementos Pokémon: ${await pkItems.count()}`);
  } else {
    issue('BAJO', 'Pokédex', 'No hay Pokédex en el menú START');
    await page.keyboard.press('Escape');
    await pause(page, 400);
    await shot(page, '09_no_pokedex');
  }

  // ── 10. MONEDAS / UI ─────────────────────────────────────
  log('=== 10. UI — MONEDAS, HP, ETC. ===');
  await pause(page, 500, '10_ui_general');
  const monedas = page.locator('[class*="moneda" i], [class*="coin" i], [class*="gold" i]');
  if (await monedas.count() > 0) {
    log(`Monedas UI: "${await monedas.first().textContent()}"`);
  } else {
    log('Widget de monedas no detectado por clase');
  }
  // Check top-right indicator visible in screenshots ($ 300)
  const topBar = page.locator('[class*="hud" i], [class*="header" i], [class*="status" i]');
  log(`Elementos HUD: ${await topBar.count()}`);

  await ctx1.close();

  // ═══════════════════════════════════════════════════════════
  // SESIÓN 2: LOGIN CON USUARIO / EMAIL (fix verificado)
  // ═══════════════════════════════════════════════════════════
  log('=== 11. LOGIN CON USERNAME (nuevo campo) ===');
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  page2.on('console', m => { if (m.type() === 'error') consoleErrors.push('[S2] ' + m.text()); });

  await page2.goto(BASE, { waitUntil: 'networkidle' });
  await page2.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
  await pause(page2, 600, '11_login_form');

  // Check field label
  const labelText = await page2.locator('.gb-label').first().textContent();
  log(`Label del campo de login: "${labelText}"`);
  if (labelText?.includes('EMAIL') && !labelText?.includes('USUARIO')) {
    issue('ALTO', 'Login', `Campo sigue mostrando solo "EMAIL" — fix no aplicado en runtime`);
  } else {
    log('✅ Campo de login actualizado correctamente');
  }

  // Login con USERNAME
  const loginInputs = page2.locator('input');
  await loginInputs.nth(0).fill('audituser');
  await loginInputs.nth(1).fill('audit1234');
  await shot(page2, '11b_login_with_username');
  await page2.locator('button', { hasText: /ENTRAR|LOGIN/i }).first().click({ force: true });
  await pause(page2, 3000, '11c_post_login_username');

  if (await page2.locator('canvas').count() > 0) {
    log('✅ Login con username: ÉXITO — canvas visible');
  } else {
    issue('ALTO', 'Login', 'Login con username falla — canvas no aparece');
    // Check for error message
    const errMsg = await page2.locator('[class*="error" i], [style*="color"]').allTextContents();
    errMsg.forEach(e => log(`  Error visible: "${e}"`));
  }

  // Login con EMAIL
  log('=== 12. LOGIN CON EMAIL ===');
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page3 = await ctx3.newPage();
  await page3.goto(BASE, { waitUntil: 'networkidle' });
  await page3.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
  await pause(page3, 400);
  const li3 = page3.locator('input');
  await li3.nth(0).fill('audit@test.com');
  await li3.nth(1).fill('audit1234');
  await shot(page3, '12_login_with_email');
  await page3.locator('button', { hasText: /ENTRAR|LOGIN/i }).first().click({ force: true });
  await pause(page3, 3000, '12b_post_login_email');

  if (await page3.locator('canvas').count() > 0) {
    log('✅ Login con email: ÉXITO — canvas visible');
  } else {
    issue('ALTO', 'Login', 'Login con email falla');
  }

  // ── 13. CONTRASEÑA INCORRECTA → MENSAJE DE ERROR ─────────
  log('=== 13. LOGIN CON CONTRASEÑA INCORRECTA ===');
  const ctx4 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page4 = await ctx4.newPage();
  await page4.goto(BASE, { waitUntil: 'networkidle' });
  await page4.locator('button', { hasText: /Iniciar Sesión/i }).first().click({ force: true });
  await pause(page4, 400);
  const li4 = page4.locator('input');
  await li4.nth(0).fill('audituser');
  await li4.nth(1).fill('contraseñaMal123');
  await page4.locator('button', { hasText: /ENTRAR|LOGIN/i }).first().click({ force: true });
  await pause(page4, 1500, '13_login_bad_password');

  const errBadPass = await page4.locator('[class*="error" i], p[style*="color"]').first();
  if (await errBadPass.count() > 0) {
    log(`✅ Mensaje de error con contraseña mala: "${await errBadPass.textContent()}"`);
  } else {
    issue('MEDIO', 'Login', 'Sin mensaje de error visible con contraseña incorrecta');
  }

  // ── 14. ERRORES DE CONSOLA ───────────────────────────────
  log('=== 14. ERRORES DE CONSOLA ===');
  const realErrors = consoleErrors.filter(e =>
    !e.includes('ERR_CERT_AUTHORITY_INVALID') && // Fonts HTTPS en sandbox — ignorable
    !e.includes('fonts.googleapis') &&
    !e.includes('fonts.gstatic')
  );
  if (realErrors.length === 0) {
    log('✅ Sin errores de consola relevantes');
  } else {
    realErrors.forEach(e => issue('ALTO', 'Consola', e.substring(0, 200)));
  }

  await ctx2.close(); await ctx3.close(); await ctx4.close();
  await browser.close();

  // ══ INFORME FINAL ═════════════════════════════════════════
  const div = '═'.repeat(60);
  const report = [
    div,
    '  AUDITORÍA PROFUNDA — HABITMON RPG',
    `  ${new Date().toLocaleString('es-ES')}`,
    div, '',
    `ISSUES ENCONTRADOS: ${issues.length}`,
    ...issues.map(i => '  ' + i),
    '', div, 'LOG COMPLETO:',
    ...notes.map(n => '  ' + n),
    div,
  ].join('\n');

  console.log('\n' + report);
  fs.writeFileSync('/tmp/audit_deep_report.txt', report);
}

run().catch(err => {
  console.error('ERROR FATAL:', err.message);
  process.exit(1);
});
