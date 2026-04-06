/**
 * BattleScreen.jsx
 * Sistema de combate estilo Pokémon Gold/Silver/Crystal
 * Canvas (60%) + React UI (40%)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';

/* ─── Utilidades ─────────────────────────────────────────────────────────── */
const delay = ms => new Promise(r => setTimeout(r, ms));

const padId = id => String(id).padStart(3, '0');

/* ─── SpriteAvatar exportable (usado en Profile / Register) ──────────────── */
export const SpriteAvatar = ({ path, fallbackPath, size = 48, col = 0, row = 0 }) => {
  const [src, setSrc] = useState(path);
  const [dims, setDims] = useState({ w: 128, h: 192 });
  useEffect(() => { setSrc(path); }, [path]);
  const fw = dims.w / 4, fh = dims.h / 4;
  const scale = size / fh;
  return (
    <div style={{ width: fw * scale, height: size, overflow: 'hidden', display: 'inline-block' }}>
      <img src={src} alt="avatar"
        onLoad={e => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
        onError={() => { if (src !== fallbackPath) setSrc(fallbackPath); }}
        style={{
          position: 'relative',
          left: -(col * fw * scale), top: -(row * fh * scale),
          width: dims.w * scale, height: dims.h * scale,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

/* ─── drawHUD ─────────────────────────────────────────────────────────────── */
function drawHUD(ctx, { x, y, name, level, hp, maxHP, side }) {
  const W = 152, H = 46;
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 3, y + 3, W, H);
  // Fondo
  ctx.fillStyle = '#F8F8F8';
  ctx.fillRect(x, y, W, H);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, W, H);
  // Nombre
  ctx.fillStyle = '#111';
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(name.toUpperCase().substring(0, 10), x + 6, y + 14);
  // Nivel
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('Lv' + level, x + 112, y + 14);
  // Label HP
  ctx.fillText('HP', x + 6, y + 28);
  // Barra HP
  const barW = 100, barX = x + 26, barY = y + 21;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, 8);
  const pct = Math.max(0, Math.min(1, hp / maxHP));
  ctx.fillStyle = pct > 0.5 ? '#44BB44' : pct > 0.2 ? '#FFAA00' : '#FF4444';
  ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * pct), 6);
  // HP numérico (lado jugador)
  if (side === 'player') {
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#333';
    ctx.fillText(`${hp}/${maxHP}`, barX + barW - 36, y + 42);
  }
}

/* ─── drawPokeball ────────────────────────────────────────────────────────── */
function drawPokeball(ctx, x, y, r = 12) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0);
  ctx.fillStyle = '#E8190C'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  ctx.strokeRect(-r, -r, r * 2, r * 2); // outer square not needed, draw circle:
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

/* ─── BattleScreen principal ─────────────────────────────────────────────── */
const BattleScreen = ({ gymId, onNavigate }) => {
  const { progress, template, completeHabit, completeGym, user, timeOfDay } = useGame();

  // ── Template data
  const gymTemplate = template?.find(g => String(g.gym_id).trim() === String(gymId || '').trim());

  // ── State
  const [pkIdx, setPkIdx]           = useState(0);
  const [animating, setAnimating]   = useState(true); // starts locked during entry
  const [message, setMessage]       = useState('');
  const [showCapture, setShowCapture] = useState(null); // { nombre, id } when victory
  const [phase, setPhase]           = useState('entry'); // entry | battle | fainted | victory

  // ── Canvas
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const assetsRef   = useRef({ bb: null, enemy: null, trainer: null, bbLoaded: false });
  const battleAnim  = useRef({
    phase: 'entry',
    timer: 0,
    enemyOffsetX: 0, enemyOffsetY: 0, enemyOpacity: 0,
    trainerOffsetX: -300,
    flashCount: 0,
    fadeAlpha: 1,
    pokeball: { x: 0, y: 0, visible: false, bouncing: false },
    damageFloat: null, // { text, x, y, alpha }
    hudSlide: 0,  // 0..1
  });

  // ── Derived
  const currentPk     = gymTemplate?.pokemon?.[pkIdx] ?? null;
  const gymIdStr       = String(gymId || '').trim();
  const habitsForStage = (progress?.habitos || []).filter(h =>
    String(h.gym_id).trim() === gymIdStr && Number(h.pokemon_index) === pkIdx
  );
  const completedCount = habitsForStage.filter(h => h.completado).length;
  const computedHP = Math.max(0,
    (currentPk?.maxhp || 100) - habitsForStage
      .filter(h => h.completado)
      .reduce((s, h) => s + (Number(h.daño) || 20), 0)
  );

  // Use ref for HP so canvas loop always has latest value
  const hpRef   = useRef(computedHP);
  const maxHpRef = useRef(currentPk?.maxhp || 100);
  useEffect(() => {
    hpRef.current   = computedHP;
    maxHpRef.current = currentPk?.maxhp || 100;
  }, [computedHP, currentPk]);

  // Player HP is always full (trainer)
  const playerMaxHP = 100;
  const playerHP    = 100;

  const avIdx          = String(user?.avatar ?? 0).padStart(3, '0');
  const battlebackSrc  = gymTemplate?.battleback || 'Graphics/battlebacks/outdoor.png';

  // ─── Load assets ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentPk) return;
    const assets = assetsRef.current;
    // Battleback
    const bb = new Image();
    bb.src = battlebackSrc;
    bb.onload = () => { assets.bb = bb; assets.bbLoaded = true; };
    bb.onerror = () => { assets.bbLoaded = false; };
    assets.bb = bb;
    // Enemy sprite
    const enemy = new Image();
    enemy.src = `Graphics/battlers/${padId(currentPk.id)}.png`;
    enemy.onerror = () => {
      const fb = new Image();
      fb.src = `Graphics/pokemon/${padId(currentPk.id)}.png`;
      assets.enemy = fb;
    };
    assets.enemy = enemy;
    // Trainer back sprite
    const trainer = new Image();
    trainer.src = `Graphics/characters/trback${avIdx}.png`;
    trainer.onerror = () => {
      const fb = new Image(); fb.src = `Graphics/characters/trchar${avIdx}.png`; assets.trainer = fb;
    };
    assets.trainer = trainer;
  }, [pkIdx, gymTemplate, avIdx, battlebackSrc]);

  // ─── Canvas resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ─── Main render loop ─────────────────────────────────────────────────────
  const onAnimEndRef    = useRef(null);
  const onFaintEndRef   = useRef(null);
  const onCaptureEndRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = () => {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const W = canvas.width, H = canvas.height;
      if (W === 0 || H === 0) { rafRef.current = requestAnimationFrame(loop); return; }

      const assets = assetsRef.current;
      const anim   = battleAnim.current;

      // ── Clear
      ctx.clearRect(0, 0, W, H);

      // ── Battleback
      if (assets.bb && assets.bb.complete && assets.bb.naturalWidth > 0) {
        ctx.drawImage(assets.bb, 0, 0, W, H);
      } else {
        // Fallback sky + grass
        ctx.fillStyle = '#6090F8';
        ctx.fillRect(0, 0, W, H * 0.55);
        ctx.fillStyle = '#78C840';
        ctx.fillRect(0, H * 0.55, W, H * 0.45);
      }

      // ── Platforms
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(W * 0.72, H * 0.52, Math.min(70, W * 0.18), 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W * 0.28, H * 0.78, Math.min(58, W * 0.16), 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Enemy sprite
      const enemySize = Math.min(100, W * 0.28);
      if (assets.enemy && anim.enemyOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = anim.enemyOpacity;
        ctx.drawImage(assets.enemy,
          W * 0.72 - enemySize / 2 + anim.enemyOffsetX,
          H * 0.52 - enemySize - 14 + anim.enemyOffsetY,
          enemySize, enemySize);
        ctx.restore();
      }

      // ── Trainer sprite
      const trW = Math.min(64, W * 0.18), trH = trW * 1.25;
      if (assets.trainer) {
        const trImg = assets.trainer;
        const fw = trImg.naturalWidth / 4 || 32;
        const fh = trImg.naturalHeight / 4 || 48;
        const scale = trW / fw;
        ctx.save();
        ctx.drawImage(trImg,
          fw,  // col=1 (standing frame), row=0 (back)
          0, fw, fh,
          W * 0.28 - trW / 2 + anim.trainerOffsetX,
          H * 0.78 - fh * scale - 12,
          fw * scale, fh * scale);
        ctx.restore();
      }

      // ── HUDs
      if (anim.hudSlide > 0) {
        const slide = anim.hudSlide;
        // Enemy HUD (slides in from left)
        ctx.save();
        ctx.globalAlpha = slide;
        drawHUD(ctx, {
          x: 8 - (1 - slide) * 160,
          y: 8,
          name: currentPk?.nombre || '???',
          level: currentPk?.nivel || 5,
          hp: Math.round(hpRef.current),
          maxHP: maxHpRef.current,
          side: 'enemy',
        });
        ctx.restore();
        // Player HUD (slides in from right)
        ctx.save();
        ctx.globalAlpha = slide;
        drawHUD(ctx, {
          x: W - 160 + (1 - slide) * 160,
          y: H - 54,
          name: user?.username || 'TÚ',
          level: 10,
          hp: playerHP,
          maxHP: playerMaxHP,
          side: 'player',
        });
        ctx.restore();
      }

      // ── Damage float text
      if (anim.damageFloat && anim.damageFloat.alpha > 0) {
        const df = anim.damageFloat;
        ctx.save();
        ctx.globalAlpha = df.alpha;
        ctx.font = 'bold 12px "Press Start 2P", monospace';
        ctx.fillStyle = '#FF2222';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(df.text, df.x, df.y);
        ctx.fillText(df.text, df.x, df.y);
        df.y -= 0.8;
        df.alpha -= 0.025;
        ctx.restore();
      }

      // ── Pokéball
      if (anim.pokeball.visible) {
        drawPokeball(ctx, anim.pokeball.x, anim.pokeball.y);
      }

      // ── Night overlay
      if (timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(0,0,30,0.30)';
        ctx.fillRect(0, 0, W, H);
      }

      // ── Fade overlay
      if (anim.fadeAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${anim.fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Flash overlay
      if (anim.flashCount > 0 && Math.floor(anim.timer / 3) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(0, 0, W, H);
      }

      // ── Animation state machine
      switch (anim.phase) {
        // Entry: fade in + sprites slide in
        case 'entry':
          anim.fadeAlpha = Math.max(0, anim.fadeAlpha - 0.04);
          anim.trainerOffsetX = Math.max(0, anim.trainerOffsetX + 10);
          anim.enemyOpacity = Math.min(1, anim.enemyOpacity + 0.04);
          anim.hudSlide = Math.min(1, anim.hudSlide + 0.04);
          anim.timer++;
          if (anim.timer > 40) {
            anim.phase = 'idle';
            anim.fadeAlpha = 0;
            anim.trainerOffsetX = 0;
            anim.enemyOpacity = 1;
            anim.hudSlide = 1;
            anim.timer = 0;
          }
          break;

        // Player attacks: trainer surges forward
        case 'playerAttack':
          anim.trainerOffsetX = Math.sin(anim.timer * 0.4) * 22;
          anim.timer++;
          if (anim.timer > 18) {
            anim.phase = 'enemyShake';
            anim.timer = 0;
            anim.trainerOffsetX = 0;
          }
          break;

        // Enemy shakes and flashes
        case 'enemyShake':
          anim.enemyOffsetX = Math.sin(anim.timer * 1.6) * 7;
          anim.enemyOpacity = anim.timer % 4 < 2 ? 1 : 0.2;
          anim.timer++;
          if (anim.timer > 22) {
            anim.phase = 'idle';
            anim.enemyOffsetX = 0;
            anim.enemyOpacity = 1;
            anim.timer = 0;
            if (onAnimEndRef.current) onAnimEndRef.current();
          }
          break;

        // Enemy faints: falls and fades
        case 'enemyFaint':
          anim.enemyOffsetY += 3.5;
          anim.enemyOpacity = Math.max(0, anim.enemyOpacity - 0.045);
          anim.timer++;
          if (anim.timer > 28) {
            anim.phase = 'idle';
            anim.timer = 0;
            if (onFaintEndRef.current) onFaintEndRef.current();
          }
          break;

        // Pokéball capture sequence
        case 'capture':
          if (anim.timer < 20) {
            anim.pokeball.visible = true;
            anim.pokeball.x = W * 0.72;
            anim.pokeball.y = H * 0.25 + anim.timer * (H * 0.52 / 20);
          } else if (anim.timer < 32) {
            anim.enemyOpacity = Math.max(0, 1 - (anim.timer - 20) * 0.085);
          } else if (anim.timer < 68) {
            const t = anim.timer - 32;
            anim.pokeball.y = H * 0.52 - Math.abs(Math.sin(t * 0.28)) * 22;
          } else if (anim.timer < 88) {
            // Victory flash
            anim.flashCount = 1;
            anim.timer++;
            if (anim.timer >= 88) {
              anim.phase = 'idle';
              anim.flashCount = 0;
              anim.pokeball.visible = false;
              anim.timer = 0;
              if (onCaptureEndRef.current) onCaptureEndRef.current();
            }
            break;
          }
          anim.timer++;
          break;

        case 'idle':
        default:
          break;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentPk, timeOfDay, user?.username, pkIdx]);

  // ─── Entry sequence on mount & pkIdx change ───────────────────────────────
  useEffect(() => {
    const anim = battleAnim.current;
    anim.phase = 'entry';
    anim.timer = 0;
    anim.fadeAlpha = 1;
    anim.trainerOffsetX = -300;
    anim.enemyOpacity = 0;
    anim.hudSlide = 0;
    anim.enemyOffsetX = 0;
    anim.enemyOffsetY = 0;
    anim.pokeball.visible = false;

    const t = setTimeout(() => {
      setMessage(`¡${currentPk?.nombre || '???'} APARECIÓ!`);
      setAnimating(false);
    }, 1100);
    return () => clearTimeout(t);
  }, [pkIdx, gymTemplate]);

  // ─── Attack handler ────────────────────────────────────────────────────────
  const handleAttack = useCallback(async (habit) => {
    if (animating || habit.completado) return;
    setAnimating(true);
    const anim = battleAnim.current;
    const dmg  = Number(habit.daño) || 20;
    const tpl  = currentPk?.habitos?.find(t => t.id === habit.id);
    const icon = tpl?.icono || '⚔️';

    setMessage(`¡${(user?.username || 'TÚ').toUpperCase()} USÓ ${habit.nombre.toUpperCase()}!`);

    // Start player attack animation
    anim.phase = 'playerAttack';
    anim.timer = 0;

    // Wait for enemyShake to finish via callback
    await new Promise(resolve => {
      onAnimEndRef.current = resolve;
    });
    onAnimEndRef.current = null;

    // Show damage float
    const W = canvasRef.current?.width || 200;
    const H = canvasRef.current?.height || 200;
    anim.damageFloat = { text: `-${dmg}`, x: W * 0.72, y: H * 0.35, alpha: 1 };

    // Apply habit to backend
    try { await completeHabit(gymId, habit.id); } catch (e) { console.error(e); }

    await delay(400);
    setMessage('¡FUE MUY EFICAZ!');
    await delay(800);

    const newHP = computedHP - dmg;
    const actualHP = hpRef.current;

    if (actualHP <= 0) {
      // Faint animation
      setMessage(`¡${currentPk.nombre.toUpperCase()} SE DEBILITÓ!`);
      anim.phase = 'enemyFaint';
      anim.timer = 0;

      await new Promise(resolve => {
        onFaintEndRef.current = resolve;
      });
      onFaintEndRef.current = null;

      await delay(400);

      if (pkIdx < gymTemplate.pokemon.length - 1) {
        // Next Pokémon
        setMessage('¡El rival lanza otro Pokémon!');
        await delay(900);
        anim.enemyOffsetY = 0;
        anim.enemyOpacity = 0;
        setPkIdx(i => i + 1);
        setAnimating(false);
      } else {
        // Victory — capture sequence
        setPhase('victory');
        setMessage(`¡${currentPk.nombre.toUpperCase()} FUE DERROTADO!`);
        await delay(1000);
        setMessage('¡Usando Pokéball!');

        anim.phase = 'capture';
        anim.timer = 0;
        anim.pokeball.x = W * 0.72;
        anim.pokeball.y = H * 0.25;

        await new Promise(resolve => {
          onCaptureEndRef.current = resolve;
        });
        onCaptureEndRef.current = null;

        setMessage(`¡${currentPk.nombre.toUpperCase()} FUE CAPTURADO!`);
        await delay(1200);

        // Show victory screen
        setShowCapture({ nombre: currentPk.nombre, id: currentPk.id });
        setAnimating(false);
      }
    } else {
      setMessage(`¿QUÉ HARÁ ${(user?.username || 'EL ENTRENADOR').toUpperCase()}?`);
      setAnimating(false);
    }
  }, [animating, currentPk, pkIdx, gymTemplate, gymId, computedHP, completeHabit, user]);

  // ─── Victory screen ────────────────────────────────────────────────────────
  if (showCapture) {
    return (
      <div style={S.victoryScreen}>
        <div style={S.victoryOverlay}>
          <p style={S.victoryTitle}>🏆 ¡VICTORIA!</p>
          <div style={S.capturedBox}>
            <img
              src={`Graphics/battlers/${padId(showCapture.id)}.png`}
              alt={showCapture.nombre}
              style={S.capturedImg}
              onError={e => { e.target.src = `Graphics/pokemon/${padId(showCapture.id)}.png`; }}
            />
            <p style={S.capturedText}>
              ¡{showCapture.nombre.toUpperCase()}<br />añadido a tu colección!
            </p>
          </div>
          <button
            style={S.continueBtn}
            onClick={async () => {
              try { await completeGym(gymId, showCapture.id, showCapture.nombre); } catch (e) {}
              onNavigate('MAP');
            }}
          >
            CONTINUAR →
          </button>
        </div>
      </div>
    );
  }

  // ─── Error screen ──────────────────────────────────────────────────────────
  if (!gymTemplate || !currentPk) {
    return (
      <div style={S.errorScreen}>
        <p>GYM "{gymId}" NO ENCONTRADO</p>
        <p style={{ fontSize: 7, marginTop: 8, color: '#faa' }}>
          Asegúrate de haber completado el ajuste diario.
        </p>
        <button style={S.errorBtn} onClick={() => onNavigate('MAP')}>← VOLVER</button>
      </div>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────
  const tplHabits = currentPk.habitos || [];

  return (
    <div style={S.screen}>
      {/* ── 60% Canvas ── */}
      <canvas
        ref={canvasRef}
        style={S.battleCanvas}
      />

      {/* ── 40% UI ── */}
      <div style={S.uiPanel}>
        {/* Message box */}
        <div style={S.msgBox}>
          <span style={S.msgText}>
            {message || `¿QUÉ HARÁ ${(user?.username || 'EL ENTRENADOR').toUpperCase()}?`}
          </span>
          <span style={S.msgCursor}>▼</span>
        </div>

        {/* Attack grid or no-moves state */}
        {habitsForStage.length === 0 ? (
          <div style={S.noMoves}>
            <p style={{ fontSize: 8, color: '#666', textAlign: 'center', lineHeight: '1.8' }}>
              SIN MOVIMIENTOS<br />
              <span style={{ fontSize: 7 }}>(Completa el ajuste diario)</span>
            </p>
            <button style={S.backBtn} onClick={() => onNavigate('MAP')}>← VOLVER</button>
          </div>
        ) : (
          <div style={S.attackGrid}>
            {habitsForStage.map(h => {
              const tpl  = tplHabits.find(t => t.id === h.id);
              const done = h.completado;
              return (
                <button
                  key={h.id}
                  disabled={done || animating}
                  onClick={() => handleAttack(h)}
                  style={{
                    ...S.attackBtn,
                    background: done ? '#aaa' : '#f0f0f0',
                    cursor: (done || animating) ? 'not-allowed' : 'pointer',
                    opacity: animating && !done ? 0.75 : 1,
                    textDecoration: done ? 'line-through' : 'none',
                    color: done ? '#666' : '#111',
                  }}
                >
                  <span style={{ fontSize: 'clamp(14px, 4vw, 20px)' }}>
                    {tpl?.icono || '⚔️'}
                  </span>
                  <span style={S.attackName}>{h.nombre.toUpperCase()}</span>
                  <span style={S.attackDmg}>
                    DMG {tpl?.daño || '?'}
                    {tpl?.obligatorio === false ? ' ★' : ''}
                  </span>
                  {done && <span style={S.doneCheck}>✓</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {habitsForStage.length > 0 && (
          <div style={S.progressWrap}>
            <div style={{
              width: `${(completedCount / habitsForStage.length) * 100}%`,
              height: '100%',
              background: '#44BB44',
              transition: 'width 0.5s ease',
            }} />
            <span style={S.progressLabel}>
              {completedCount}/{habitsForStage.length} completados
            </span>
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
};

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  screen: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: '"Press Start 2P", monospace',
    background: '#000',
  },
  battleCanvas: {
    flex: '0 0 60%',
    width: '100%',
    imageRendering: 'pixelated',
    display: 'block',
  },
  uiPanel: {
    flex: '0 0 40%',
    display: 'flex', flexDirection: 'column',
    backgroundColor: '#fff',
    borderTop: '4px solid #111',
    overflow: 'hidden',
  },
  msgBox: {
    padding: '10px 14px',
    fontSize: 'clamp(7px, 2vw, 9px)',
    lineHeight: '1.8em',
    borderBottom: '3px solid #111',
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    color: '#111',
    position: 'relative',
    flexShrink: 0,
  },
  msgText: { flex: 1 },
  msgCursor: {
    position: 'absolute', right: 10, bottom: 6,
    fontSize: 8, animation: 'blink 0.8s steps(1) infinite',
  },
  attackGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 3,
    padding: 6,
    backgroundColor: '#c8c8c8',
    overflow: 'hidden',
  },
  attackBtn: {
    border: '3px solid #444',
    padding: 'clamp(4px, 1.5vw, 8px) 6px',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 'clamp(5px, 1.3vw, 7px)',
    textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 3,
    position: 'relative',
    boxShadow: 'inset -2px -2px 0 #888, inset 2px 2px 0 #fff',
    transition: 'opacity 0.15s',
    WebkitTapHighlightColor: 'transparent',
  },
  attackName: { fontWeight: 'bold', lineHeight: 1.3 },
  attackDmg: { fontSize: 'clamp(4px, 1.1vw, 6px)', color: '#555' },
  doneCheck: {
    position: 'absolute', top: 3, right: 5,
    fontSize: 10, color: '#4caf50',
  },
  noMoves: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 16, backgroundColor: '#c8c8c8',
  },
  progressWrap: {
    height: 10, background: '#888',
    position: 'relative', flexShrink: 0,
    borderTop: '2px solid #444',
  },
  progressLabel: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 5, color: '#fff',
  },
  backBtn: {
    padding: '8px 14px', background: '#3048a8', color: '#fff',
    border: '2px solid #1a2870', cursor: 'pointer',
    fontFamily: '"Press Start 2P", monospace', fontSize: 8,
  },

  /* Victory */
  victoryScreen: {
    width: '100%', height: '100%',
    background: 'linear-gradient(135deg, #1a0a2e, #0a1a4e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Press Start 2P", monospace',
    animation: 'battleFadeIn 0.5s ease',
  },
  victoryOverlay: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 20, padding: '30px 20px',
    background: 'rgba(255,255,255,0.06)',
    border: '3px solid rgba(255,215,0,0.5)',
    borderRadius: 8, maxWidth: 320, width: '90%',
  },
  victoryTitle: {
    fontSize: 'clamp(14px, 4vw, 20px)', color: '#f0c020',
    textAlign: 'center', textShadow: '0 0 20px rgba(240,192,32,0.8)',
    animation: 'blink 1.2s steps(1) infinite',
  },
  capturedBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  capturedImg: {
    width: 'clamp(80px, 25vw, 120px)', height: 'clamp(80px, 25vw, 120px)',
    imageRendering: 'pixelated', animation: 'battleFadeIn 0.8s ease',
  },
  capturedText: {
    fontSize: 'clamp(7px, 2vw, 9px)', color: '#fff',
    textAlign: 'center', lineHeight: '2em',
  },
  continueBtn: {
    padding: '14px 24px', background: '#f0c020', color: '#111',
    border: '3px solid #c09000', cursor: 'pointer',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 'clamp(8px, 2.2vw, 10px)',
    boxShadow: '0 4px 0 #8a6000',
    transition: 'transform 0.1s, box-shadow 0.1s',
    WebkitTapHighlightColor: 'transparent',
  },

  /* Error */
  errorScreen: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#600', color: '#fff',
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 10, gap: 14, padding: 24, textAlign: 'center',
  },
  errorBtn: {
    marginTop: 8, padding: '10px 16px',
    background: '#fff', color: '#600',
    border: '2px solid #fff', cursor: 'pointer',
    fontFamily: '"Press Start 2P", monospace', fontSize: 8,
  },
};

const CSS = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes battleFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to   { transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
`;

export default BattleScreen;
