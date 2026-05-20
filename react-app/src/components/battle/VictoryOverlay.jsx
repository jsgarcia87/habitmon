import React, { useEffect, useRef, useState } from 'react';
import { getAssetPath } from '../../api.js';
import { sfx } from '../../utils/audioEngine';

// Canvas confetti that rains Pokémon-colored rectangles and dots
function useConfetti(active) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const W = canvas.width, H = canvas.height;
    const COLORS = ['#FFD700','#FF6B6B','#4FC3F7','#81C784','#CE93D8','#FFCC02','#FF8A65'];
    const pieces = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: -8 - Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 2.5, vy: 1.6 + Math.random() * 2.8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2, rs: (Math.random() - 0.5) * 0.18,
      circle: Math.random() > 0.6
    }));
    let id;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rs; p.vy += 0.04;
        if (p.y > H + 10) { p.y = -8; p.x = Math.random() * W; p.vy = 1.6 + Math.random() * 2.8; }
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [active]);
  return canvasRef;
}

const VictoryOverlay = ({ victoryData, displayXp, displayMonedas, showContinueHint, onClose }) => {
  const [scale, setScale] = useState(0.05);
  const [showMedal, setShowMedal] = useState(false);
  const [medalRot, setMedalRot] = useState(0);
  const confettiRef = useConfetti(!!victoryData);
  const spinRef = useRef(null);

  useEffect(() => {
    if (!victoryData) return;
    setTimeout(() => setScale(1.06), 20);
    setTimeout(() => setScale(1.0), 160);

    if (victoryData.levelUp) setTimeout(() => sfx.levelUp(), 350);

    if (victoryData.medallaUrl) {
      setTimeout(() => {
        setShowMedal(true);
        sfx.badge();
        let a = 0;
        spinRef.current = setInterval(() => { a += 0.04; setMedalRot(a); }, 16);
        setTimeout(() => { clearInterval(spinRef.current); spinRef.current = null; }, 2200);
      }, 700);
    }
    return () => { if (spinRef.current) clearInterval(spinRef.current); };
  }, [victoryData]);

  if (!victoryData) return null;

  const xpPct = victoryData.newXp != null ? Math.min(100, victoryData.newXp % 100) : 0;

  return (
    <div style={S.overlay} onClick={showContinueHint ? onClose : null}>
      <canvas ref={confettiRef} style={S.confetti} />

      <div style={{ ...S.card, transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}>

        {/* Header */}
        <div style={S.header}>
          <span style={S.star}>★</span>
          ¡VICTORIA!
          <span style={S.star}>★</span>
        </div>

        <div style={S.body}>
          {/* EXP row + bar */}
          <div>
            <div style={S.row}>
              <span style={S.label}>EXP. GANADA</span>
              <span style={{ ...S.val, color: '#27ae60' }}>+{displayXp}</span>
            </div>
            <div style={S.track}>
              <div style={{ ...S.xpBar, width: `${xpPct}%` }} />
            </div>
          </div>

          {/* Coins */}
          <div style={S.row}>
            <span style={S.label}>🪙 MONEDAS</span>
            <span style={{ ...S.val, color: '#FFD700' }}>+{displayMonedas}</span>
          </div>

          {/* Medal */}
          {victoryData.medallaUrl && showMedal && (
            <div style={S.medalBox}>
              <span style={S.medalLabel}>✦ MEDALLA OBTENIDA ✦</span>
              <div style={{ transform: `rotate(${medalRot}rad)` }}>
                <img src={getAssetPath(victoryData.medallaUrl)} alt="Medalla" style={S.medalImg} />
              </div>
            </div>
          )}

          {/* Level up */}
          {victoryData.levelUp && (
            <div style={S.levelUp}>⬆ ¡NIVEL {victoryData.newLevel}! ⬆</div>
          )}
        </div>

        {showContinueHint && <div style={S.hint}>▼ TOCA PARA CONTINUAR ▼</div>}
      </div>

      <style>{`
        @keyframes pulse { from{opacity:1} to{opacity:0.5} }
        @keyframes bounce { from{transform:translateY(0)} to{transform:translateY(-4px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
};

const S = {
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, cursor: 'pointer'
  },
  confetti: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'
  },
  card: {
    width: '82%', background: 'linear-gradient(160deg,#fffde7,#fff9c4)',
    border: '4px solid #333', borderRadius: '6px', padding: '18px 16px',
    fontFamily: '"Press Start 2P",monospace', zIndex: 1,
    boxShadow: '0 0 0 2px #fff, 0 0 28px rgba(255,215,0,0.7), 8px 8px 0 rgba(0,0,0,0.4)'
  },
  header: {
    textAlign: 'center', color: '#c0392b', fontSize: '11px', marginBottom: '16px',
    borderBottom: '3px solid #e0c000', paddingBottom: '10px',
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
  },
  star: { fontSize: '9px', color: '#e0a000', animation: 'pulse 0.7s infinite alternate' },
  body: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '7px', color: '#333' },
  label: { color: '#666' },
  val: { fontWeight: 'bold' },
  track: { height: '7px', background: '#d0c890', border: '2px solid #888', borderRadius: '2px', overflow: 'hidden', marginTop: '5px' },
  xpBar: { height: '100%', background: 'linear-gradient(90deg,#2980b9,#1abc9c)', transition: 'width 0.5s ease-out', minWidth: '2px' },
  medalBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
    padding: '12px 8px', background: 'rgba(255,200,0,0.12)',
    border: '2px dashed #c0a000', borderRadius: '4px'
  },
  medalLabel: { fontSize: '6px', color: '#a07000' },
  medalImg: { width: '44px', height: '44px', imageRendering: 'pixelated' },
  levelUp: {
    textAlign: 'center', color: '#e67e22', fontSize: '8px',
    padding: '8px', background: 'rgba(255,150,0,0.1)', border: '2px solid #e67e22',
    borderRadius: '3px', animation: 'bounce 0.45s infinite alternate'
  },
  hint: {
    textAlign: 'center', fontSize: '6px', color: '#888', marginTop: '16px',
    animation: 'blink 0.8s step-end infinite'
  }
};

export default VictoryOverlay;
