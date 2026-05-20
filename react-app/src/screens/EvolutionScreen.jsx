import React, { useEffect, useRef, useState } from 'react';
import { getAssetPath } from '../api';
import { sfx } from '../utils/audioEngine';
import { POKEMON_SPECIES } from '../data/pokemonData';
import { useGame } from '../context/GameContext';

/**
 * EvolutionScreen — animación estilo Pokémon Crystal
 * Props: navigate, fromId, toId, fromName, toName
 *
 * Fases:
 *  intro    → texto "¿QUÉ? ¡X ESTÁ EVOLUCIONANDO!" + sprite pulsante (1.8s)
 *  flash    → 3 destellos blancos (900ms)
 *  morph    → sprite blanco → silueta nueva → color (2.4s, canvas)
 *  fanfare  → texto "¡X EVOLUCIONÓ EN Y!" + botón CONTINUAR
 */

const PHASE_INTRO   = 'intro';
const PHASE_FLASH   = 'flash';
const PHASE_MORPH   = 'morph';
const PHASE_FANFARE = 'fanfare';

// Draws a sprite tinted toward white at `whiteness` (0=normal, 1=full white)
function drawTinted(ctx, img, x, y, w, h, whiteness) {
  ctx.save();
  ctx.drawImage(img, x, y, w, h);
  if (whiteness > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,255,255,${whiteness})`;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

const EvolutionScreen = ({ navigate, fromId, toId, fromName, toName }) => {
  const { cargarDatos, evolucionar } = useGame();
  const canvasRef = useRef(null);
  const fromImg   = useRef(null);
  const toImg     = useRef(null);
  const rafRef    = useRef(null);
  const phaseRef  = useRef(PHASE_INTRO);

  const [phase, setPhase]         = useState(PHASE_INTRO);
  const [flashOn, setFlashOn]     = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  const resolvedFrom = fromName || POKEMON_SPECIES?.[String(fromId).padStart(3,'0')]?.name || `#${fromId}`;
  const resolvedTo   = toName   || POKEMON_SPECIES?.[String(toId).padStart(3,'0')]?.name  || `#${toId}`;

  // Preload both sprites
  useEffect(() => {
    const a = new Image();
    a.src = getAssetPath(`Graphics/battlers/${String(fromId).padStart(3,'0')}.png`);
    a.onload = () => { fromImg.current = a; };

    const b = new Image();
    b.src = getAssetPath(`Graphics/battlers/${String(toId).padStart(3,'0')}.png`);
    b.onload = () => { toImg.current = b; };
  }, [fromId, toId]);

  // Typewriter helper
  const typeText = (text, onDone) => {
    let i = 0;
    setDialogText('');
    const id = setInterval(() => {
      i++;
      setDialogText(text.slice(0, i));
      sfx.dialog();
      if (i >= text.length) { clearInterval(id); if (onDone) onDone(); }
    }, 42);
    return id;
  };

  // Master sequence controller
  useEffect(() => {
    let timers = [];
    const T = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

    // PHASE 1 — INTRO: mensaje + sprite pulsando
    setPhase(PHASE_INTRO);
    phaseRef.current = PHASE_INTRO;
    const introText = `¿QUÉ?\n¡${resolvedFrom.toUpperCase()} ESTÁ\nEVOLUCIONANDO!`;
    typeText(introText);
    sfx.encounter();

    // PHASE 2 — FLASH: 3 parpadeos blancos
    T(() => {
      setPhase(PHASE_FLASH);
      phaseRef.current = PHASE_FLASH;
      let f = 0;
      const flash = setInterval(() => {
        setFlashOn(v => !v);
        f++;
        if (f >= 6) clearInterval(flash);
      }, 150);
      timers.push(flash);
    }, 2200);

    // PHASE 3 — MORPH: animación canvas
    T(() => {
      setFlashOn(false);
      setPhase(PHASE_MORPH);
      phaseRef.current = PHASE_MORPH;
      setDialogText('');
    }, 3100);

    // PHASE 4 — FANFARE
    T(() => {
      setPhase(PHASE_FANFARE);
      phaseRef.current = PHASE_FANFARE;
      sfx.levelUp();
      // Persist evolution in backend and sync local state
      evolucionar(fromId, toId, resolvedTo).catch(console.error);
      setTimeout(() => {
        typeText(`¡${resolvedFrom.toUpperCase()} EVOLUCIONÓ EN ${resolvedTo.toUpperCase()}!`, () => {
          setShowCursor(true);
          setCanContinue(true);
        });
      }, 300);
      cargarDatos();
    }, 3100 + 2600);

    return () => { timers.forEach(clearTimeout); timers.forEach(clearInterval); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas morph animation
  useEffect(() => {
    if (phase !== PHASE_MORPH) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = 200;
    const H = canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const DURATION = 2400;
    const SW = 96, SH = 96;
    const sx = (W - SW) / 2, sy = (H - SH) / 2 - 8;
    let start = null;

    const loop = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DURATION);
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#0a0820';
      ctx.fillRect(0, 0, W, H);

      // Pulse scale — oscila suavemente
      const scale = 1 + Math.sin(t * Math.PI * 6) * 0.06 * (1 - t);
      const dw = SW * scale, dh = SH * scale;
      const dx = sx + (SW - dw) / 2, dy = sy + (SH - dh) / 2;

      if (t < 0.45) {
        // Old sprite: color → blanco
        const w = Math.min(1, t / 0.4);
        if (fromImg.current) drawTinted(ctx, fromImg.current, dx, dy, dw, dh, w);
      } else if (t < 0.55) {
        // Full white flash — pantalla blanca pura
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      } else {
        // New sprite: blanco → color
        const w = Math.max(0, 1 - (t - 0.55) / 0.4);
        if (toImg.current) drawTinted(ctx, toImg.current, dx, dy, dw, dh, w);
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Intro/fanfare canvas — sprite estático con pulso
  useEffect(() => {
    if (phase !== PHASE_INTRO && phase !== PHASE_FANFARE) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width = 200;
    const H = canvas.height = 160;
    const ctx = canvas.getContext('2d');
    const SW = 96, SH = 96;
    const sx = (W - SW) / 2, sy = (H - SH) / 2 - 8;
    const img = phase === PHASE_FANFARE ? toImg.current : fromImg.current;
    let start = performance.now();

    const loop = (now) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0820';
      ctx.fillRect(0, 0, W, H);
      if (img) {
        const pulse = 1 + Math.sin(t * 3) * 0.04;
        const dw = SW * pulse, dh = SH * pulse;
        ctx.drawImage(img, sx + (SW - dw) / 2, sy + (SH - dh) / 2, dw, dh);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const handleContinue = () => {
    if (!canContinue) return;
    navigate('city');
  };

  return (
    <div style={S.screen} onClick={canContinue ? handleContinue : undefined}>
      {/* Flash overlay — pantalla blanca entre fases */}
      {flashOn && <div style={S.flashOverlay} />}

      {/* Canvas sprite */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* Crystal dialog box */}
      <div style={S.dialogOuter}>
        <div style={S.dialogInner}>
          <pre style={S.dialogText}>{dialogText}</pre>
          {showCursor && <span style={S.cursor}>▼</span>}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 49%{opacity:1} 50%,99%{opacity:0} }
      `}</style>
    </div>
  );
};

const S = {
  screen: {
    width: '100%', height: '100%',
    background: '#0a0820',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end',
    fontFamily: '"Press Start 2P", monospace',
    position: 'relative', overflow: 'hidden',
    cursor: 'default'
  },
  flashOverlay: {
    position: 'absolute', inset: 0,
    background: '#ffffff',
    zIndex: 20, pointerEvents: 'none'
  },
  canvas: {
    display: 'block',
    width: '200px', height: '160px',
    imageRendering: 'pixelated',
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -68%)'
  },
  // Caja de diálogo estilo Crystal: borde doble simulado
  dialogOuter: {
    width: '100%',
    background: '#f8f8f0',
    border: '4px solid #333',
    borderTop: '4px solid #333',
    boxShadow: '0 -2px 0 #888 inset',
    padding: '2px',
    boxSizing: 'border-box',
    zIndex: 10
  },
  dialogInner: {
    border: '3px solid #888',
    padding: '10px 14px 8px',
    minHeight: '56px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    position: 'relative'
  },
  dialogText: {
    margin: 0, fontSize: '7px', color: '#111',
    lineHeight: '1.7em', whiteSpace: 'pre-wrap',
    fontFamily: '"Press Start 2P", monospace'
  },
  cursor: {
    position: 'absolute', bottom: 4, right: 8,
    fontSize: '8px', color: '#333',
    animation: 'blink 0.8s step-end infinite'
  }
};

export default EvolutionScreen;
