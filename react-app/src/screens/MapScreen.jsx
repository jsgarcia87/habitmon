import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import TileMap from '../components/TileMap';
import { WORLDS } from '../data/worlds';

const TIME_META = {
  morning: { label: '🌅 MAÑANA',  subtitle: '06:00 – 12:00', color: '#E8A020', bg: '#FFF4D0' },
  day:     { label: '☀️ TARDE',   subtitle: '12:00 – 20:00', color: '#2880E0', bg: '#E0F0FF' },
  night:   { label: '🌙 NOCHE',   subtitle: '20:00 – 06:00', color: '#6040C0', bg: '#1A1A3E' },
};

const MapScreen = ({ onNavigate, worldId }) => {
  const { timeOfDay, setTimeOfDay, template, progress } = useGame();
  const [transitioning, setTransitioning] = useState(false);
  const [battleIntro, setBattleIntro] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const prevTimeRef = useRef(timeOfDay);

  const world = WORLDS.find(w => w.world_id === worldId) || WORLDS[0];

  const [mapState, setMapState] = useState({
    id: world.mapId,
    x: world.posicion_inicial.x,
    y: world.posicion_inicial.y,
    dir: 0
  });

  const meta = TIME_META[timeOfDay] || TIME_META.morning;
  const completedGyms = progress?.gimnasios_completados || [];

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

  const handleTrigger = useCallback((type, data) => {
    if (type === 'npc_dialogue') {
      setDialogue(data);
      setDialogueIndex(0);
      return;
    }

    if (type === 'transfer') {
      setTransitioning(true);
      setTimeout(() => {
        setMapState({
          id: data.mapId,
          x: data.x,
          y: data.y,
          dir: data.dir
        });
        setTransitioning(false);
      }, 400);
      return;
    }

    if (type === 'gym_enter') {
      const gym = template.find(g => g.gym_id === data.gym_id);
      const isCorrectTime = gym?.tiempo === timeOfDay;
      
      if (!isCorrectTime) {
        setDialogue({
          npc: { nombre: 'SISTEMA' },
          messages: [`🚫 El gimnasio está cerrado. No hay tareas asignadas aquí en este momento (Horario: ${gym?.tiempo || '???'}).`]
        });
        setDialogueIndex(0);
        return;
      }

      // Si estamos en el mapa exterior (Map001), entramos al interior
      if (mapState.id === 'Map001') {
        onNavigate('INDOOR', 'pokegym');
        return;
      }

      // Si ya estamos dentro del gimnasio, lanzamos el prompt de batalla
      const isDone = completedGyms.includes(data.gym_id);
      if (isDone) {
        setDialogue({
          npc: { nombre: 'SISTEMA' },
          messages: [`🏅 Ya has superado el gimnasio ${data.gym_nombre.toUpperCase()} hoy. ¡Vuelve mañana para más retos!`]
        });
        setDialogueIndex(0);
      } else {
        setDialogue({
          npc: { nombre: 'RETO DE GIMNASIO' },
          messages: [`¿Quieres desafiar al líder de ${data.gym_nombre.toUpperCase()}?`],
          isBattlePrompt: true,
          gymId: data.gym_id
        });
        setDialogueIndex(0);
      }
    }

    if (type === 'battle_start') {
      const isDone = completedGyms.includes(data.gym_id);
      if (isDone) {
        setDialogue({
          npc: { nombre: 'SISTEMA' },
          messages: [`¡El gimnasio ${data.gym_id.toUpperCase()} ya ha sido superado hoy! Medal: 🏅`]
        });
        setDialogueIndex(0);
      } else {
        // Iniciar secuencia de intro de batalla
        setBattleIntro(true);
        setTimeout(() => {
          onNavigate('BATTLE', data.gym_id);
          setBattleIntro(false);
          setDialogue(null);
        }, 1200);
      }
    }
  }, [completedGyms, onNavigate, timeOfDay]);

  const advanceDialogue = () => {
    if (dialogue?.isBattlePrompt) return; 
    if (dialogueIndex < dialogue.messages.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      setDialogue(null);
      setDialogueIndex(0);
    }
  };

  return (
    <div style={{ ...s.screen, background: meta.bg }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ ...s.header, borderBottomColor: meta.color }}>
        <div style={s.timeBlock}>
          <span style={{ ...s.timeLabel, color: meta.color }}>{world.nombre.toUpperCase()}</span>
          <span style={s.timeSub}>{meta.label}</span>
        </div>
        <button style={s.mapBtn} onClick={() => onNavigate('WORLD_MAP')}>
          🗺 MAPA MUNDIAL
        </button>
      </div>

      {/* ── Map area ─────────────────────────────────── */}
      <div style={s.mapArea}>
        {!transitioning && (
          <TileMap
            key={mapState.id}
            mapId={mapState.id}
            worldId={world.world_id}
            startX={mapState.x}
            startY={mapState.y}
            startDir={mapState.dir}
            onTrigger={handleTrigger}
            timeOfDay={timeOfDay}
          />
        )}

        {/* ── GBC Dialogue Box ────────────────────────── */}
        {dialogue && (
          <div style={s.dialogueBox} onClick={advanceDialogue}>
            {/* NPC Name Badge */}
            <div style={s.npcName}>
              {dialogue.npc.nombre.toUpperCase()}
            </div>
            
            {/* Message Content */}
            <p style={s.dialogueText}>
              {dialogue.messages[dialogueIndex]}
            </p>
            
            {/* Next Arrow Pulsing */}
            <div className="pulsing-arrow" style={s.nextArrow}>▼</div>
            
            {/* Dialogue Progress */}
            <div style={s.progressText}>
              {dialogueIndex + 1}/{dialogue.messages.length}
            </div>

            {/* Battle Buttons */}
            {dialogue.isBattlePrompt && dialogueIndex === dialogue.messages.length - 1 && (
              <div style={s.dialogueActions} onClick={e => e.stopPropagation()}>
                <button 
                  style={{...s.gbBtn, background: '#e74c3c', color: '#fff'}}
                  onClick={() => { handleTrigger('battle_start', { gym_id: dialogue.gymId }); }}
                >
                  ¡LUCHAR!
                </button>
                <button 
                  style={{...s.gbBtn, background: '#888', color: '#fff'}}
                  onClick={() => setDialogue(null)}
                >
                  LUEGO
                </button>
              </div>
            )}
          </div>
        )}

        {/* Time transition flash */}
        {transitioning && <div style={s.transition} />}

        {/* Battle Intro Animation overlay */}
        {battleIntro && <div style={s.battleIntro} />}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .pulsing-arrow { animation: blink 0.6s steps(1) infinite; }
        @keyframes timeTransition { 0% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
        @keyframes battleFlash {
          0%, 20%, 40%, 60% { background: #fff; }
          10%, 30%, 50%, 70% { background: #000; }
          80% { background: #fff; opacity: 1; }
          100% { background: #fff; opacity: 0; }
        }
      `}</style>
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
  loadText: { fontSize: 10, color: '#888' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 14px', borderBottom: '3px solid',
    background: 'rgba(255,255,255,0.9)', flexShrink: 0,
  },
  timeBlock: { display: 'flex', flexDirection: 'column', gap: 2 },
  timeLabel: { fontSize: '10px', fontWeight: 'bold' },
  timeSub: { fontSize: '6px', color: '#888' },
  mapBtn: {
    background: '#333', color: '#fff', border: 'none',
    padding: '6px 8px', fontSize: '6px', cursor: 'pointer',
    fontFamily: '"Press Start 2P"', borderRadius: '2px',
  },
  mapArea: {
    flex: 1, position: 'relative', overflow: 'hidden',
    border: '2px solid rgba(0,0,0,0.15)',
    minHeight: 0,
  },
  dialogueBox: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: '#fff', border: '4px solid #111',
    borderTop: '6px solid #111',
    padding: '16px 20px', zIndex: 100,
    fontFamily: '"Press Start 2P", monospace',
    boxShadow: '0 -4px 10px rgba(0,0,0,0.2)',
    cursor: 'pointer'
  },
  npcName: {
    position: 'absolute', top: -20, left: 16,
    background: '#fff', border: '3px solid #111',
    padding: '3px 10px', fontSize: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dialogueText: {
    fontSize: '10px', lineHeight: '1.8em',
    minHeight: '44px', margin: 0,
    color: '#111'
  },
  nextArrow: {
    position: 'absolute', right: 16, bottom: 12,
    fontSize: '12px', color: '#111'
  },
  progressText: {
    position: 'absolute', right: 44, bottom: 14,
    fontSize: '6px', color: '#999'
  },
  dialogueActions: {
    marginTop: '12px', display: 'flex', gap: '8px', 
    justifyContent: 'center', pointerEvents: 'auto'
  },
  gbBtn: {
    fontFamily: '"Press Start 2P", cursive', fontSize: '8px',
    padding: '8px 12px', border: '2px solid #222', cursor: 'pointer',
    boxShadow: '2px 2px 0 #333'
  },
  transition: {
    position: 'absolute', inset: 0,
    background: '#000', zIndex: 100,
    animation: 'timeTransition 0.8s forwards',
    pointerEvents: 'none',
  },
  battleIntro: {
    position: 'absolute', inset: 0,
    zIndex: 1000,
    animation: 'battleFlash 1.2s ease-in-out forwards',
  }
};

export default MapScreen;
