/**
 * BattleScreen.jsx
 * Sistema de combate optimizado estilo GBC (Red/Blue/Gold)
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { SpriteAvatar } from '../components/GBSprite';

const delay = ms => new Promise(r => setTimeout(r, ms));
const padId = id => String(id).padStart(3, '0');

// Helper para dibujar HUD estilo clásico
const drawHUD = (ctx, { x, y, name, level, hp, maxHP, side }) => {
  const W = 152, H = 46;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 3, y + 3, W, H);
  ctx.fillStyle = '#F8F8F8';
  ctx.fillRect(x, y, W, H);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, W, H);

  ctx.fillStyle = '#111';
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText((name || '???').toUpperCase().substring(0, 10), x + 6, y + 14);
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('Lv' + (level || 5), x + 112, y + 14);
  ctx.fillText('HP', x + 6, y + 28);

  const barW = 100, barX = x + 26, barY = y + 21;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, 8);

  const pct = Math.max(0, Math.min(1, (hp || 0) / (maxHP || 100)));
  ctx.fillStyle = pct > 0.5 ? '#44BB44' : pct > 0.2 ? '#FFAA00' : '#FF4444';
  ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * pct), 6);

  if (side === 'player') {
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText(`${Math.round(hp)}/${maxHP}`, barX + barW - 36, y + 42);
  }
};

// Helper para dibujar Pokéball con primitivas
const drawPokeball = (ctx, x, y, radius, angle) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#E8190C'; // Rojo
  ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; // Blanco
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.stroke();
  ctx.restore();
};

const BattleScreen = ({ gymId, onNavigate }) => {
  const { progress, template, completeHabit, completeGym, user, coleccion, gainXP } = useGame();

  // Estados de control
  const [pkIdx, setPkIdx]             = useState(0);
  const [animating, setAnimating]   = useState(true);
  const [message, setMessage]       = useState('');
  const [showCaptureOverlay, setShowCaptureOverlay] = useState(false);

  // Referencias para Canvas y Animación
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const assetsRef = useRef({ bb: null, enemy: null, trainer: null, loaded: false });
  
  const animState = useRef({
    phase: 'fadeIn',
    timer: 0,
    fadeAlpha: 1,
    trainerX: -100,
    trainerOffsetX: 0,
    ballVisible: false, ballX: 0, ballY: 0, ballAngle: 0,
    enemyVisible: false, enemyOpacity: 0, enemyScale: 0, enemyOffsetX: 0, enemyOffsetY: 0,
    hudSlide: 0, 
    flashAlpha: 0,
    shake: 0,
    captureBall: { visible: false, x: 0, y: 0, angle: 0 }
  });

  const onAnimEndRef = useRef(null);
  const onFaintEndRef = useRef(null);

  // Template y Pokémon actual
  const gymTemplate = template?.find(g => String(g.gym_id).trim() === String(gymId || '').trim());
  const currentPk   = gymTemplate?.pokemon?.[pkIdx] ?? null;

  // Lógica de Hábitos (Garantizar movimientos)
  const habitsForStage = useMemo(() => {
    const gymIdStr = String(gymId || '').trim();
    const serverHabits = (progress?.habitos || []).filter(
      h => String(h.gym_id).trim() === gymIdStr && Number(h.pokemon_index || 0) === pkIdx
    );
    if (serverHabits.length > 0) return serverHabits;
    return (currentPk?.habitos || []).map(h => ({
      id: h.id, gym_id: gymId, pokemon_index: pkIdx,
      nombre: h.nombre, daño: h.daño, icono: h.icono,
      completado: false
    }));
  }, [progress, gymId, pkIdx, currentPk]);

  // Salud dinámica
  const dynamicMaxHp = habitsForStage.reduce((s, h) => s + (Number(h.daño) || 20), 0) || 100;
  const currentHP    = Math.max(0, dynamicMaxHp - habitsForStage.filter(h => h.completado).reduce((s, h) => s + (Number(h.daño) || 20), 0));
  
  const hpRef = useRef(currentHP);
  const maxHpRef = useRef(dynamicMaxHp);
  useEffect(() => {
    if (!animating) { 
      hpRef.current = currentHP; 
      maxHpRef.current = dynamicMaxHp;
    }
  }, [currentHP, dynamicMaxHp, animating]);

  // Carga de Assets
  useEffect(() => {
    if (!currentPk) return;
    const a = assetsRef.current;
    
    const bb = new Image();
    bb.src = gymTemplate?.battleback || 'Graphics/battlebacks/outdoor.png';
    bb.onload = () => { a.bb = bb; a.loaded = true; };
    
    const enemy = new Image();
    enemy.src = `Graphics/battlers/${padId(currentPk.id)}.png`;
    enemy.onerror = () => { enemy.src = `Graphics/pokemon/${padId(currentPk.id)}.png`; };
    a.enemy = enemy;

    const partner = coleccion?.find(p => parseInt(p.is_partner) === 1);
    const trainer = new Image();
    const avId = String(user?.avatar ?? 0).padStart(3, '0');
    if (partner) {
      trainer.src = `Graphics/battlers/${padId(partner.pokemon_id)}b.png`;
      trainer.onerror = () => { trainer.src = `Graphics/characters/trback${avId}.png`; };
    } else {
      trainer.src = `Graphics/characters/trchar${avId}.png`;
    }
    a.trainer = trainer;
  }, [pkIdx, gymTemplate, user, coleccion, currentPk]);

  // Redimensionar Canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const res = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    res();
    const ro = new ResizeObserver(res); ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // Bucle de Animación
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const frameLoop = () => {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const W = canvas.width, H = canvas.height;
      const anim = animState.current;
      const a = assetsRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      
      if (anim.shake > 0) {
        ctx.translate((Math.random() - 0.5) * anim.shake, (Math.random() - 0.5) * anim.shake);
        anim.shake *= 0.9;
      }

      if (a.bb && a.loaded) {
        ctx.drawImage(a.bb, 0, 0, W, H);
      } else {
        ctx.fillStyle = '#6090F8'; ctx.fillRect(0,0,W,H*0.55);
        ctx.fillStyle = '#78C840'; ctx.fillRect(0,H*0.55,W,H*0.45);
      }

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(W * 0.68, H * 0.48, 55, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(W * 0.28, H * 0.72, 45, 10, 0, 0, Math.PI * 2); ctx.fill();

      if (a.enemy && anim.enemyVisible) {
        const eW = 96 * anim.enemyScale, eH = 96 * anim.enemyScale;
        ctx.save();
        ctx.globalAlpha = anim.enemyOpacity;
        ctx.drawImage(a.enemy, W * 0.68 - eW / 2 + anim.enemyOffsetX, H * 0.48 - eH - 8 + anim.enemyOffsetY, eW, eH);
        ctx.restore();
      }

      if (a.trainer) {
        const pW = 80, pH = 80;
        const tx = (anim.phase === 'trainerEnter') ? anim.trainerX : (W * 0.28 - pW/2 + anim.trainerOffsetX);
        const ty = H * 0.72 - pH - 8;
        ctx.save();
        if (a.trainer.naturalWidth > 128) {
          const fw = a.trainer.naturalWidth / 4, fh = a.trainer.naturalHeight / 4;
          let col = 1, row = 0;
          if (anim.phase === 'trainerEnter') { col = (Math.floor(anim.timer / 8) % 4); row = 1; }
          else if (anim.phase === 'trainerThrow') { col = 2; row = 2; }
          ctx.drawImage(a.trainer, col*fw, row*fh, fw, fh, tx, ty, pW, pH);
        } else {
          ctx.drawImage(a.trainer, tx, ty, pW, pH);
        }
        ctx.restore();
      }

      anim.timer++;
      switch(anim.phase) {
        case 'fadeIn':
          anim.fadeAlpha = Math.max(0, anim.fadeAlpha - 0.05);
          if (anim.fadeAlpha <= 0) { anim.phase = 'trainerEnter'; anim.timer = 0; }
          break;
        case 'trainerEnter':
          anim.trainerX = Math.min(W * 0.28 - 40, anim.trainerX + 4);
          if (anim.timer >= 30 && anim.trainerX >= W * 0.28 - 40) { anim.phase = 'trainerThrow'; anim.timer = 0; }
          break;
        case 'trainerThrow':
          if (anim.timer === 15) { 
            anim.ballVisible = true; anim.ballX = anim.trainerX + 40; anim.ballY = H * 0.55; 
            anim.phase = 'ballFly'; anim.timer = 0; 
          }
          break;
        case 'ballFly':
          const progressPct = anim.timer / 25;
          anim.ballX = (W * 0.28) + (W * 0.68 - W * 0.28) * progressPct;
          anim.ballY = H * 0.55 - Math.sin(progressPct * Math.PI) * H * 0.25 + progressPct * (H * 0.48 - H * 0.55);
          anim.ballAngle += 0.3;
          if (anim.timer >= 25) { anim.phase = 'ballOpen'; anim.timer = 0; }
          break;
        case 'ballOpen':
          anim.flashAlpha = Math.max(0, 1 - anim.timer * 0.1);
          anim.ballVisible = false; anim.enemyVisible = true;
          anim.enemyScale = Math.min(1, anim.timer * 0.1);
          anim.enemyOpacity = Math.min(1, anim.timer * 0.15);
          if (anim.timer >= 12) { anim.phase = 'hudSlideIn'; anim.timer = 0; anim.enemyScale = 1; anim.enemyOpacity = 1; }
          break;
        case 'hudSlideIn':
          anim.hudSlide = Math.min(1, anim.hudSlide + 0.1);
          if (anim.timer >= 15) {
            anim.phase = 'ready'; setAnimating(false);
            setMessage(`¡${(currentPk?.nombre || 'Pokémon').toUpperCase()} APARECIÓ!`);
          }
          break;
        case 'playerAttack':
          anim.trainerOffsetX = Math.sin(anim.timer * 0.4) * 20;
          if (anim.timer > 18) { anim.phase = 'enemyShake'; anim.timer = 0; anim.trainerOffsetX = 0; }
          break;
        case 'enemyShake':
          anim.shake = 10;
          anim.enemyOffsetX = Math.sin(anim.timer * 1.5) * 6;
          anim.enemyOpacity = anim.timer % 4 < 2 ? 1 : 0.3;
          if (anim.timer > 20) { 
            anim.phase = 'ready'; anim.enemyOffsetX = 0; anim.enemyOpacity = 1; 
            if (onAnimEndRef.current) onAnimEndRef.current(); 
          }
          break;
        case 'enemyFaint':
          anim.enemyOffsetY += 4; anim.enemyOpacity = Math.max(0, anim.enemyOpacity - 0.05);
          if (anim.timer > 25) { anim.phase = 'ready'; if (onFaintEndRef.current) onFaintEndRef.current(); }
          break;
        case 'captureThrow':
          anim.captureBall.y = Math.min(H * 0.48, -20 + anim.timer * 8);
          anim.captureBall.angle += 0.2;
          if (anim.captureBall.y >= H * 0.48) anim.enemyOpacity = Math.max(0, anim.enemyOpacity - 0.1);
          break;
      }

      if (anim.hudSlide > 0) {
        drawHUD(ctx, { x: 8 - (1 - anim.hudSlide) * 160, y: 8, name: currentPk?.nombre, level: currentPk?.nivel, hp: hpRef.current, maxHP: maxHpRef.current, side: 'enemy' });
        drawHUD(ctx, { x: W - 160 + (1 - anim.hudSlide) * 160, y: H - 54, name: user?.username, level: 10, hp: 100, maxHP: 100, side: 'player' });
      }

      if (anim.ballVisible) drawPokeball(ctx, anim.ballX, anim.ballY, 8, anim.ballAngle);
      if (anim.captureBall.visible) drawPokeball(ctx, anim.captureBall.x, anim.captureBall.y, 8, anim.captureBall.angle);

      if (anim.flashAlpha > 0) { ctx.fillStyle = `rgba(255,255,255,${anim.flashAlpha})`; ctx.fillRect(0, 0, W, H); }
      if (anim.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${anim.fadeAlpha})`; ctx.fillRect(0, 0, W, H); }

      ctx.restore();
      rafRef.current = requestAnimationFrame(frameLoop);
    };

    rafRef.current = requestAnimationFrame(frameLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [currentPk, user]);

  const handleAttack = useCallback(async (habit) => {
    if (animating || habit.completado) return;
    setAnimating(true);
    const anim = animState.current;
    const dmg = Number(habit.daño) || 20;
    const startH = hpRef.current;
    const targetH = Math.max(0, startH - dmg);

    setMessage(`¡Adelante! ¡Usa ${habit.nombre.toUpperCase()}!`);
    anim.phase = 'playerAttack'; anim.timer = 0;
    
    await new Promise(r => { onAnimEndRef.current = r; });
    onAnimEndRef.current = null;

    try { 
      await completeHabit(gymId, habit.id);
      const partner = coleccion?.find(p => parseInt(p.is_partner) === 1);
      if (partner) gainXP(dmg, partner.id);
    } catch (e) { console.error(e); }

    const startTime = Date.now();
    await new Promise(r => {
      const step = () => {
        const p = Math.min(1, (Date.now() - startTime) / 600);
        hpRef.current = startH - (startH - targetH) * p;
        if (p < 1) requestAnimationFrame(step); else r();
      };
      step();
    });

    await delay(500);
    setMessage('¡ATAQUE COMPLETADO!');
    await delay(1000);

    if (targetH <= 0) {
      setMessage(`¡${(currentPk?.nombre || 'Enemigo').toUpperCase()} derrotado!`);
      anim.phase = 'enemyFaint'; anim.timer = 0;
      await new Promise(r => { onFaintEndRef.current = r; });
      onFaintEndRef.current = null;

      if (pkIdx < (gymTemplate?.pokemon?.length || 1) - 1) {
        setMessage('¡Viene el siguiente Pokémon!');
        await delay(1000);
        setPkIdx(i => i + 1);
        setAnimating(false);
      } else {
        setMessage('¡Lanzando Pokéball para capturar!');
        anim.phase = 'captureThrow'; anim.timer = 0;
        anim.captureBall = { visible: true, x: canvasRef.current.width * 0.68, y: -20, angle: 0 };
        await delay(1800);
        setShowCaptureOverlay(true);
      }
    } else {
      setAnimating(false);
    }
  }, [animating, currentPk, pkIdx, gymTemplate, gymId, completeHabit, gainXP, coleccion]);

  const finalizeBattle = async () => {
    await completeGym(gymId, currentPk?.id, currentPk?.nombre);
    onNavigate('MAP');
  };

  return (
    <div style={ST.screen}>
      <canvas ref={canvasRef} style={ST.canvas} />
      
      <div style={ST.ui}>
        <div style={ST.msgBox}>
          <span style={ST.msgText}>{message || `¿QUÉ HARÁ ${(user?.username || 'TÚ').toUpperCase()}?`}</span>
          <span style={ST.cursor}>▼</span>
        </div>

        {habitsForStage.length === 0 ? (
          <div style={ST.empty}>
            <p>NO HAY ATAQUES DISPONIBLES</p>
            <button style={ST.back} onClick={() => onNavigate('MAP')}>VOLVER AL MAPA</button>
          </div>
        ) : (
          <div style={ST.grid}>
            {habitsForStage.map(h => (
              <button key={h.id} disabled={h.completado || animating} onClick={() => handleAttack(h)} style={{ ...ST.btn, opacity: (h.completado || animating) ? 0.6 : 1, textDecoration: h.completado ? 'line-through' : 'none' }}>
                <span>{h.icono || '⚔️'}</span>
                <span>{h.nombre?.toUpperCase()}</span>
                <small style={{fontSize: 6}}>DMG {h.daño}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCaptureOverlay && (
        <div style={ST.overlay}>
          <img src={`Graphics/battlers/${padId(currentPk.id)}.png`} style={ST.overlayImg} alt="" onError={e => e.target.src=`Graphics/pokemon/${padId(currentPk.id)}.png`} />
          <p style={{fontSize: 10, margin: '16px 0 8px 0'}}>¡{currentPk.nombre.toUpperCase()} CAPTURADO!</p>
          <div style={ST.capBall}><div style={{height: '50%', background: '#E8190C'}}/><div style={{height: '50%', background: '#fff'}}/></div>
          <button onClick={finalizeBattle} style={ST.finish}>CONTINUAR</button>
        </div>
      )}

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  );
};

const ST = {
  screen: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', fontFamily: '"Press Start 2P", monospace', position: 'relative' },
  canvas: { flex: '0 0 60%', width: '100%', imageRendering: 'pixelated' },
  ui: { flex: '0 0 40%', background: '#fff', borderTop: '4px solid #111', display: 'flex', flexDirection: 'column' },
  msgBox: { padding: '12px', borderBottom: '3px solid #111', minHeight: '50px', display: 'flex', alignItems: 'center', position: 'relative' },
  msgText: { flex: 1, fontSize: 8, lineHeight: '1.4' },
  cursor: { position: 'absolute', right: 10, bottom: 6, fontSize: 8, animation: 'blink 0.8s infinite' },
  grid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 6, background: '#ccc' },
  btn: { border: '3px solid #333', padding: '8px', background: '#f8f8f8', fontFamily: '"Press Start 2P"', fontSize: 7, textAlign: 'left', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  empty: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 8, gap: 10 },
  back: { padding: '10px', background: '#444', color: '#fff', border: 'none', fontFamily: '"Press Start 2P"', fontSize: 8, cursor: 'pointer' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  overlayImg: { width: 120, imageRendering: 'pixelated' },
  capBall: { width: 40, height: 40, borderRadius: '50%', border: '3px solid #000', overflow: 'hidden', margin: '20px 0' },
  finish: { padding: '12px 24px', background: '#3048a8', color: '#fff', border: 'none', fontFamily: '"Press Start 2P"', fontSize: 9, cursor: 'pointer' }
};

export default BattleScreen;
