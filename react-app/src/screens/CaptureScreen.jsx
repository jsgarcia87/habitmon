import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { POKEMON_SPECIES } from '../data/pokemonData';
import { getAssetPath } from '../api';
import { sfx } from '../utils/audioEngine';

// Canvas draws a pokéball (same style as battle system)
function drawBall(ctx, x, y, r, angle, type = 'pokeball') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const top = type === 'superball' ? '#3b82f6' : type === 'ultraball' ? '#eab308' : '#E8190C';
  ctx.fillStyle = top;
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = r * 0.12;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#666'; ctx.lineWidth = r * 0.08; ctx.stroke();
  ctx.restore();
}

// Spawn star particles on success
function spawnStars(particles, cx, cy) {
  const COLORS = ['#FFD700', '#FF6B6B', '#4FC3F7', '#81C784', '#FFCC02', '#CE93D8'];
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2;
    const speed = 2.5 + Math.random() * 3.5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      color: COLORS[i % COLORS.length],
      size: 3 + Math.random() * 4,
      life: 1, decay: 0.025 + Math.random() * 0.015
    });
  }
}

const CaptureScreen = ({ navigate, gymId }) => {
  const { user, starter } = useGame();
  const canvasRef = useRef(null);
  const stateRef = useRef({
    phase: 'appear',  // appear | fall | wobble | success | done
    timer: 0,
    ballY: 0, ballAngle: 0,
    wobbleCount: 0, wobbleAngle: 0,
    particles: [],
    pkOpacity: 1
  });
  const pkImgRef = useRef(null);
  const [overlayText, setOverlayText] = useState('');
  const [showEXP, setShowEXP] = useState(false);
  const [expPct, setExpPct] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [done, setDone] = useState(false);

  // Resolve Pokémon ID and name
  let pkId = 158, pkName = 'Totodile';
  if (gymId) {
    pkId = Number(gymId) || 158;
    const key = String(pkId).padStart(3, '0');
    pkName = POKEMON_SPECIES?.[key]?.name || `Pokémon #${pkId}`;
  }

  // Load Pokémon sprite
  useEffect(() => {
    const img = new Image();
    img.src = getAssetPath(`Graphics/battlers/${String(pkId).padStart(3, '0')}.png`);
    img.onload = () => { pkImgRef.current = img; };
  }, [pkId]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = 200, H = canvas.height = 180;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    // Initial positions
    const pkX = W * 0.5, pkY = H * 0.42;
    const ballStartY = -20, ballEndY = pkY;
    let lastTime = performance.now();
    let frameId;

    sfx.encounter();

    const loop = (now) => {
      const dt = now - lastTime; lastTime = now;
      s.timer += dt;
      ctx.clearRect(0, 0, W, H);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a1a3e');
      grad.addColorStop(1, '#2d1b4e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Shadow under Pokémon
      ctx.save();
      ctx.globalAlpha = 0.35 * s.pkOpacity;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(pkX, pkY + 28, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Draw Pokémon sprite
      if (pkImgRef.current && s.phase === 'appear') {
        ctx.save();
        ctx.globalAlpha = s.pkOpacity;
        const pw = 80, ph = 80;
        ctx.drawImage(pkImgRef.current, pkX - pw / 2, pkY - ph / 2, pw, ph);
        ctx.restore();
      }

      // Pokéball animation
      if (s.phase === 'fall') {
        const t = Math.min(1, s.timer / 700);
        const ease = 1 - Math.pow(1 - t, 3);
        s.ballY = ballStartY + (ballEndY - ballStartY) * ease;
        s.ballAngle += 0.12;
        s.pkOpacity = Math.max(0, 1 - t * 2.5);
        if (s.timer > 700) {
          s.phase = 'wobble'; s.timer = 0; s.wobbleCount = 0;
          sfx.throwBall();
        }
        drawBall(ctx, pkX, s.ballY, 14, s.ballAngle);
      }

      if (s.phase === 'wobble') {
        const wobblePeriod = 600;
        const wobbleT = (s.timer % wobblePeriod) / wobblePeriod;
        s.wobbleAngle = Math.sin(wobbleT * Math.PI * 2) * 0.28 * (1 - wobbleT * 0.3);
        drawBall(ctx, pkX, ballEndY, 14, s.wobbleAngle);

        if (s.timer > wobblePeriod) {
          s.wobbleCount++;
          s.timer = 0;
          sfx.wobble();
          if (s.wobbleCount >= 3) {
            s.phase = 'success'; s.timer = 0;
            spawnStars(s.particles, pkX, ballEndY);
            sfx.catchSuccess();
            setTimeout(() => setOverlayText(`¡${pkName.toUpperCase()} CAPTURADO!`), 300);
          }
        }
      }

      if (s.phase === 'success') {
        drawBall(ctx, pkX, ballEndY, 14, 0);
        // White flash at start
        if (s.timer < 200) {
          ctx.fillStyle = `rgba(255,255,255,${(1 - s.timer / 200) * 0.8})`;
          ctx.fillRect(0, 0, W, H);
        }
      }

      // Particles
      s.particles = s.particles.filter(p => p.life > 0);
      s.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.35, p.y - p.size * 0.35);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.lineTo(p.x + p.size * 0.35, p.y + p.size * 0.35);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size * 0.35, p.y + p.size * 0.35);
        ctx.lineTo(p.x - p.size, p.y);
        ctx.lineTo(p.x - p.size * 0.35, p.y - p.size * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      frameId = requestAnimationFrame(loop);
    };

    // Phase transitions via timers
    const t1 = setTimeout(() => { s.phase = 'fall'; s.timer = 0; }, 900);

    frameId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frameId); clearTimeout(t1); };
  }, [pkId, pkName]);

  // After capture message, show EXP
  useEffect(() => {
    if (!overlayText) return;
    const t = setTimeout(() => setShowEXP(true), 1200);
    return () => clearTimeout(t);
  }, [overlayText]);

  // Animate EXP bar
  useEffect(() => {
    if (!showEXP) return;
    sfx.item();
    let pct = 0;
    const interval = setInterval(() => {
      pct += 2;
      sfx.xpTick();
      setExpPct(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setShowLevelUp(true);
        sfx.levelUp();
      }
    }, 40);
    return () => clearInterval(interval);
  }, [showEXP]);

  return (
    <div style={S.screen}>
      {/* Canvas scene */}
      <div style={S.canvasWrap}>
        <canvas ref={canvasRef} style={S.canvas} />
      </div>

      {/* Overlay messages */}
      {overlayText && !showEXP && (
        <div style={S.gotcha}>{overlayText}</div>
      )}

      {/* EXP panel */}
      {showEXP && (
        <div style={S.panel}>
          <p style={S.panelTitle}>
            {(starter?.starter_nombre || 'TU POKÉMON').toUpperCase()} GANÓ EXP.
          </p>
          <div style={S.expTrack}>
            <div style={{ ...S.expBar, width: `${expPct}%` }} />
          </div>
          {showLevelUp && (
            <p style={S.lvlUp}>¡SUBIÓ AL NIVEL {(user?.starter_nivel || 1) + 1}!</p>
          )}
          {(expPct >= 100 || showLevelUp) && !done && (
            <button
              style={S.btn}
              onClick={() => { setDone(true); navigate('city'); }}>
              CONTINUAR ▶
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
};

const S = {
  screen: {
    width: '100%', height: '100%', background: '#0a0a1a',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', fontFamily: '"Press Start 2P",monospace', overflow: 'hidden'
  },
  canvasWrap: { flex: '0 0 auto' },
  canvas: { display: 'block', width: '200px', height: '180px', imageRendering: 'pixelated' },
  gotcha: {
    marginTop: '16px', fontSize: '9px', color: '#FFD700',
    animation: 'bounceIn 0.4s ease-out', textAlign: 'center', padding: '0 16px'
  },
  panel: {
    marginTop: '12px', width: '88%', maxWidth: '280px',
    background: '#f8f8f0', border: '4px solid #333', borderRadius: '4px',
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '4px 4px 0 #000'
  },
  panelTitle: { margin: 0, fontSize: '7px', color: '#222', textAlign: 'center' },
  expTrack: { height: '10px', background: '#ddd', border: '2px solid #888', borderRadius: '2px', overflow: 'hidden' },
  expBar: { height: '100%', background: 'linear-gradient(90deg,#2980b9,#1abc9c)', transition: 'width 0.08s linear', minWidth: '2px' },
  lvlUp: { margin: 0, fontSize: '8px', color: '#e67e22', textAlign: 'center', animation: 'blink 0.6s step-end infinite' },
  btn: {
    width: '100%', padding: '10px', fontSize: '8px',
    fontFamily: '"Press Start 2P",monospace', background: '#1a1a8a',
    color: '#fff', border: '3px solid #fff', borderRadius: '3px', cursor: 'pointer'
  }
};

export default CaptureScreen;
