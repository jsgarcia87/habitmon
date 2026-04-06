import React, { useRef, useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import TileMap from '../components/TileMap';

const TIME_META = {
  morning: { label: '🌅 MAÑANA',  subtitle: '06:00 – 12:00', color: '#E8A020', bg: '#FFF4D0' },
  day:     { label: '☀️ TARDE',   subtitle: '12:00 – 20:00', color: '#2880E0', bg: '#E0F0FF' },
  night:   { label: '🌙 NOCHE',   subtitle: '20:00 – 06:00', color: '#6040C0', bg: '#1A1A3E' },
};

const MapScreen = ({ onNavigate }) => {
  const { timeOfDay, setTimeOfDay, template, progress } = useGame();
  const [dialog, setDialog] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const prevTimeRef = useRef(timeOfDay);

  const meta        = TIME_META[timeOfDay] || TIME_META.morning;
  const gymsForTime = (template || []).filter(g => g.tiempo === timeOfDay);
  const completedGyms = progress?.gimnasios_completados || [];
  const doneCount   = gymsForTime.filter(g => completedGyms.includes(g.gym_id)).length;

  // Transition animation when time changes
  useEffect(() => {
    if (prevTimeRef.current !== timeOfDay) {
      setTransitioning(true);
      setTimeout(() => setTransitioning(false), 800);
      prevTimeRef.current = timeOfDay;
    }
  }, [timeOfDay]);

  if (!template || !progress) {
    return (
      <div style={{ ...s.screen, justifyContent: 'center', alignItems: 'center', background: meta.bg }}>
        <p style={s.loadText}>CARGANDO MAPA...</p>
      </div>
    );
  }

  const handleTrigger = (targetMap) => {
    const triggerId = targetMap.toLowerCase().replace(/\s/g, '_');

    // Gyms: match by mapa_evento or gym_id prefix
    const gym = gymsForTime.find(g =>
      (g.mapa_evento && g.mapa_evento.toLowerCase() === triggerId) ||
      g.gym_id === triggerId ||
      ('gym_' + g.gym_id) === triggerId ||
      triggerId.includes(g.gym_id)
    );

    if (gym) {
      const isDone = completedGyms.includes(gym.gym_id);
      if (isDone) {
        setDialog({
          title: '🏅 MEDALLA',
          text: `¡El ${gym.gym_nombre} ya fue superado! Eres el mejor entrenador.`,
          type: 'success',
        });
      } else {
        setDialog({
          title: '⚔️ DESAFÍO',
          text: `${gym.gym_nombre}. ¿Listo para el combate basado en tus hábitos?`,
          gymId: gym.gym_id,
          type: 'gym',
        });
      }
      return;
    }

    // Buildings
    if (triggerId.includes('home') || triggerId.includes('casa') || triggerId.includes('house')) {
      onNavigate('INDOOR', 'house');
      return;
    }
    if (triggerId.includes('lab') || triggerId.includes('center') || triggerId.includes('laboratorio')) {
      onNavigate('INDOOR', 'pokecenter');
      return;
    }

    // Generic NPC / sign
    setDialog({
      title: 'ℹ️ INFO',
      text: triggerId.includes('sign')
        ? 'Pueblo Entrenamiento — Donde los hábitos se vuelven superpoderes.'
        : `Zona: ${targetMap}`,
    });
  };

  return (
    <div style={{ ...s.screen, background: meta.bg }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ ...s.header, borderBottomColor: meta.color }}>
        <div style={s.timeBlock}>
          <span style={{ ...s.timeLabel, color: meta.color }}>{meta.label}</span>
          <span style={s.timeSub}>{meta.subtitle}</span>
        </div>
        <div style={s.progressBlock}>
          <span style={{ ...s.progressCount, color: meta.color }}>{doneCount}/{gymsForTime.length}</span>
          <span style={s.progressSub}>gimnasios</span>
        </div>
      </div>

      {/* ── Gym strip (quick access) ───────────────────── */}
      <div style={s.gymStrip}>
        {gymsForTime.map(g => {
          const done = completedGyms.includes(g.gym_id);
          return (
            <button
              key={g.gym_id}
              style={{
                ...s.gymPill,
                background: done ? '#4caf50' : meta.color,
                opacity: done ? 0.85 : 1,
              }}
              onClick={() => {
                if (done) {
                  setDialog({ title: '🏅 YA COMPLETADO', text: `${g.gym_nombre} superado.`, type: 'success' });
                } else {
                  setDialog({ title: '⚔️ DESAFÍO', text: `${g.gym_nombre}. ¿Listo?`, gymId: g.gym_id, type: 'gym' });
                }
              }}
            >
              {done ? '✓' : '!'} {g.gym_nombre.replace('Gimnasio ', '')}
            </button>
          );
        })}
      </div>

      {/* ── Map canvas ─────────────────────────────────── */}
      <div style={s.mapArea}>
        <TileMap
          onTrigger={handleTrigger}
          timeOfDay={timeOfDay}
          completedGyms={completedGyms}
        />

        {/* Dialog */}
        {dialog && (
          <div className="dialog-overlay" onClick={() => !dialog.gymId && setDialog(null)}>
            <div className={`dialog-box ${dialog.type || ''}`}>
              {dialog.title && <div className="dialog-header">{dialog.title}</div>}
              <div className="dialog-content"><p>{dialog.text}</p></div>
              <div className="dialog-actions">
                {dialog.gymId ? (
                  <>
                    <button className="gb-btn challenge-btn"
                      onClick={() => { onNavigate('BATTLE', dialog.gymId); setDialog(null); }}>
                      ¡LUCHAR!
                    </button>
                    <button className="gb-btn second" onClick={() => setDialog(null)}>LUEGO</button>
                  </>
                ) : (
                  <button className="gb-btn primary" onClick={() => setDialog(null)}>ENTENDIDO</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Time transition flash */}
        {transitioning && <div style={s.transition} />}
      </div>

      {/* Debug time switcher — only in dev */}
      {import.meta.env.DEV && (
        <div style={s.devBar}>
          {['morning', 'day', 'night'].map(t => (
            <button key={t} style={{
              ...s.devBtn,
              background: timeOfDay === t ? meta.color : '#555',
            }} onClick={() => setTimeOfDay(t)}>
              {TIME_META[t].label}
            </button>
          ))}
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
};

const s = {
  screen: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"Press Start 2P", cursive',
    overflow: 'hidden', paddingBottom: 48,
    boxSizing: 'border-box',
  },
  loadText: { fontSize: 10, fontFamily: '"Press Start 2P"', color: '#888' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 14px', borderBottom: '3px solid',
    background: 'rgba(0,0,0,0.08)', flexShrink: 0,
  },
  timeBlock: { display: 'flex', flexDirection: 'column', gap: 2 },
  timeLabel: { fontSize: 'clamp(8px, 2.5vw, 12px)', fontWeight: 'bold' },
  timeSub: { fontSize: '6px', color: '#888' },

  progressBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
  },
  progressCount: { fontSize: 'clamp(12px, 3.5vw, 16px)', fontWeight: 'bold' },
  progressSub: { fontSize: '6px', color: '#888' },

  gymStrip: {
    display: 'flex', gap: 6, padding: '6px 10px',
    overflowX: 'auto', flexShrink: 0,
    scrollbarWidth: 'none',
    WebkitScrollSnap: 'x mandatory',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  gymPill: {
    flexShrink: 0, padding: '5px 10px',
    border: 'none', color: '#fff', cursor: 'pointer',
    fontFamily: '"Press Start 2P", cursive',
    fontSize: 'clamp(5px, 1.4vw, 7px)',
    borderRadius: 3, whiteSpace: 'nowrap',
    boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
    WebkitTapHighlightColor: 'transparent',
  },

  mapArea: {
    flex: 1, position: 'relative', overflow: 'hidden',
    border: '2px solid rgba(0,0,0,0.15)',
    minHeight: 0,
  },

  transition: {
    position: 'absolute', inset: 0,
    background: '#000', zIndex: 100,
    animation: 'timeTransition 0.8s forwards',
    pointerEvents: 'none',
  },

  devBar: {
    position: 'absolute', bottom: 50, left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: 4, zIndex: 600,
    background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4,
  },
  devBtn: {
    border: 'none', color: '#fff', cursor: 'pointer',
    padding: '4px 8px', fontSize: '6px',
    fontFamily: '"Press Start 2P", cursive', borderRadius: 2,
  },
};

const CSS = `
  .dialog-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  .dialog-box {
    background: #fbfbfb; border: 4px solid #222;
    padding: 16px; min-width: 240px; max-width: 310px;
    box-shadow: 4px 4px 0 #555; position: relative;
    font-family: "Press Start 2P", cursive;
  }
  .dialog-header {
    position: absolute; top: -13px; left: 10px;
    background: #222; color: #fff;
    padding: 2px 10px; font-size: 8px; border: 2px solid #fff;
  }
  .dialog-content { padding-top: 6px; font-size: 9px; line-height: 1.6; color: #333; }
  .dialog-box.gym { border-color: #c0392b; box-shadow: 4px 4px 0 #8B0000; }
  .dialog-box.gym .dialog-header { background: #c0392b; }
  .dialog-box.success { border-color: #4caf50; box-shadow: 4px 4px 0 #2a7a2a; }
  .dialog-box.success .dialog-header { background: #4caf50; }
  .dialog-actions { margin-top: 14px; display: flex; gap: 8px; justify-content: center; }
  .gb-btn {
    font-family: "Press Start 2P", cursive; font-size: 8px;
    padding: 9px 14px; border: 2px solid #222; cursor: pointer;
    box-shadow: 2px 2px 0 #555;
  }
  .gb-btn.primary { background: #9bc60b; color: #081820; }
  .gb-btn.challenge-btn { background: #e74c3c; color: #fff; border-color: #8B1010; }
  .gb-btn.second { background: #888; color: #fff; }
  .gb-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 #555; }
  @keyframes timeTransition {
    0%   { opacity: 1; }
    100% { opacity: 0; pointer-events: none; }
  }
  /* Hide scrollbar for gym strip */
  .gym-strip::-webkit-scrollbar { display: none; }
`;

export default MapScreen;
