import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import Controls from '../components/Controls';

// CONFIGURACIÓN DE GIMNASIOS
const GYM_TILESET_MAP = {
  vestirse: 'Graphics/tilesets/gsc gym 1a.png',
  desayuno: 'Graphics/tilesets/gsc gym 1b.png', 
  higiene:  'Graphics/tilesets/gsc gym 2a.png',
  orden:    'Graphics/tilesets/gsc gym 2b.png',
};

const GYM_LEADERS = {
  vestirse: { 
    sprite: 'Graphics/characters/trchar020.png',
    nombre: 'LYRA',
    dialogo: [
      '¡Bienvenido al Gimnasio!',
      'Para superarme debes completar',
      'todos tus hábitos de hoy.',
      '¿Estás listo para el desafío?'
    ]
  },
  desayuno: {
    sprite: 'Graphics/characters/trchar015.png',
    nombre: 'ETHAN',
    dialogo: [
      '¡El desayuno es la batalla',
      'más importante del día!',
      '¿Tienes hambre de victoria?'
    ]
  },
  higiene: {
    sprite: 'Graphics/characters/trchar025.png',
    nombre: 'CLAIR',
    dialogo: [
      '¡La limpieza es poder!',
      'Demuestra que eres digno',
      'de la Medalla Higiene.'
    ]
  },
  orden: {
    sprite: 'Graphics/characters/trchar030.png',
    nombre: 'MORTY',
    dialogo: [
      '¡El orden es la base de',
      'todo gran entrenador!',
      '¿Puedes con el desafío?'
    ]
  },
};

const GYM_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,8,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,8,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,8,8,8,8,8,8,8,8,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,0,8,0,0,1,1,1,1,1,1,1,1],
];

const T = 32;

const GymScreen = ({ navigate, gymId }) => {
  const { user } = useGame();
  const canvasRef = useRef(null);
  
  // States
  const [dialogue, setDialogue] = useState(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showBattlePrompt, setShowBattlePrompt] = useState(false);
  const [nearLeader, setNearLeader] = useState(false);
  const [ready, setReady] = useState(false);

  // Refs para el motor de juego
  const playerState = useRef({
    x: 9, y: 13,
    dir: 3, // 0=d 1=l 2=r 3=u
    frame: 0,
    isMoving: false,
    moveProgress: 0,
    targetX: 9, targetY: 13
  });

  const assetsRef = useRef({
    tileset: null,
    player: null,
    leader: null
  });

  const currentLeader = GYM_LEADERS[gymId] || GYM_LEADERS.vestirse;
  const currentTilesetUrl = GYM_TILESET_MAP[gymId] || GYM_TILESET_MAP.vestirse;

  // Carga de Assets
  useEffect(() => {
    let loaded = 0;
    const toLoad = 3;
    const checkReady = () => { if (++loaded >= toLoad) setReady(true); };

    // Tileset
    const tsImg = new Image();
    tsImg.src = currentTilesetUrl;
    tsImg.onload = () => { assetsRef.current.tileset = tsImg; checkReady(); };

    // Player
    const pImg = new Image();
    const avatarNum = String(user?.avatar || 0).padStart(3, '0');
    pImg.src = `Graphics/characters/trchar${avatarNum}.png`;
    pImg.onload = () => { assetsRef.current.player = pImg; checkReady(); };

    // Leader
    const lImg = new Image();
    lImg.src = currentLeader.sprite;
    lImg.onload = () => { assetsRef.current.leader = lImg; checkReady(); };
  }, [gymId, user?.avatar]);

  // Juego y Renderizado
  useEffect(() => {
    if (!ready) return;
    let frameId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    };

    const update = (dt) => {
      const p = playerState.current;
      if (dialogue) return; // Bloquear movimiento en diálogo

      if (p.isMoving) {
        p.moveProgress += dt / 180; // Velocidad de movimiento
        if (p.moveProgress >= 1) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false;
          p.moveProgress = 0;
          p.frame = 0;
          // Trigger de salida
          if (p.y >= 14 && (p.x === 9 || p.x === 10)) {
            navigate('city');
          }
        } else {
          p.frame = p.moveProgress < 0.5 ? 1 : 3;
        }
      }

      // Detección de cercanía al líder (9,1)
      const dist = Math.abs(p.x - 9) + Math.abs(p.y - 1);
      setNearLeader(dist === 1);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const p = playerState.current;
      const interpX = p.x + (p.targetX - p.x) * p.moveProgress;
      const interpY = p.y + (p.targetY - p.y) * p.moveProgress;

      // Cámara centrada en el jugador
      const camX = Math.round(interpX * T + T/2 - W/2);
      const camY = Math.round(interpY * T + T/2 - H/2);
      const ox = -camX, oy = -camY;

      // Dibujar Mapa
      GYM_MAP.forEach((row, y) => {
        row.forEach((tid, x) => {
          const dx = x * T + ox, dy = y * T + oy;
          if (dx < -T || dx > W || dy < -T || dy > H) return;
          
          if (assetsRef.current.tileset) {
            const COLS = 8;
            const srcX = (tid % COLS) * 32;
            const srcY = Math.floor(tid / COLS) * 32;
            ctx.drawImage(assetsRef.current.tileset, srcX, srcY, 32, 32, dx, dy, T, T);
          } else {
            ctx.fillStyle = tid === 1 ? '#404858' : '#B09060';
            ctx.fillRect(dx, dy, T, T);
          }
        });
      });

      // Dibujar Líder (9, 1)
      if (assetsRef.current.leader) {
        const limg = assetsRef.current.leader;
        const fw = limg.width / 4, fh = limg.height / 4;
        ctx.drawImage(limg, 0, 0, fw, fh, 9 * T + ox, 1 * T + oy - (fh - T), T, fh * (T/fw));
        
        // Indicador ! si está cerca
        const dist = Math.abs(p.x - 9) + Math.abs(p.y - 1);
        if (dist === 1) {
          const blink = Math.floor(Date.now() / 400) % 2;
          if (blink) {
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
            ctx.font = 'bold 16px serif';
            ctx.fillText('!', 9 * T + ox + T/2 - 4, 1 * T + oy - 10);
          }
        }
      }

      // Dibujar Jugador
      if (assetsRef.current.player) {
        const pimg = assetsRef.current.player;
        const fw = pimg.width / 4, fh = pimg.height / 4;
        // Dibujamos en el centro de la pantalla (porque la cámara lo sigue)
        ctx.drawImage(pimg, p.frame * fw, p.dir * fh, fw, fh, Math.round(W / 2 - T / 2), Math.round(H / 2 - T / 2 - (fh - T)), T, fh * (T / fw));
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, dialogue]);

  // Controles
  const handleDirection = (dir) => {
    if (dialogue) return;
    const p = playerState.current;
    if (p.isMoving) return;

    if (!dir) return;

    let dx = 0, dy = 0;
    if (dir === 'up') { dy = -1; p.dir = 3; }
    if (dir === 'down') { dy = 1; p.dir = 0; }
    if (dir === 'left') { dx = -1; p.dir = 1; }
    if (dir === 'right') { dx = 1; p.dir = 2; }

    const nx = p.x + dx, ny = p.y + dy;
    
    // Colisión con límites y paredes
    if (ny >= 0 && ny < GYM_MAP.length && nx >= 0 && nx < GYM_MAP[0].length) {
      if (GYM_MAP[ny][nx] !== 1 && !(nx === 9 && ny === 1)) {
        p.targetX = nx; p.targetY = ny;
        p.isMoving = true;
      }
    }
  };

  const handleA = () => {
    if (dialogue) {
      advanceDialogue();
      return;
    }
    const p = playerState.current;
    const dist = Math.abs(p.x - 9) + Math.abs(p.y - 1);
    if (dist === 1) {
      setDialogue(currentLeader.dialogo);
      setDialogueIndex(0);
    }
  };

  const advanceDialogue = () => {
    if (dialogueIndex < dialogue.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      setDialogue(null);
      setShowBattlePrompt(true);
    }
  };

  // Ajuste de Canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      position: 'relative',
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* MAPA */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated'
        }}
      />

      {/* HUD SUPERIOR */}
      <button
        onClick={() => navigate('city')}
        style={{
          position: 'absolute',
          top: 8, left: 8,
          padding: '4px 10px',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          border: '2px solid rgba(255,255,255,0.4)',
          fontFamily: '"Press Start 2P",monospace',
          fontSize: 7,
          cursor: 'pointer',
          zIndex: 10
        }}
      >SALIR</button>

      <div style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.6)',
        color: '#FFD700',
        fontFamily: '"Press Start 2P",monospace',
        fontSize: 7,
        padding: '4px 10px',
        border: '1px solid rgba(255,215,0,0.4)',
        zIndex: 10
      }}>
        GYM {gymId?.toUpperCase()}
      </div>

      {/* DIÁLOGO */}
      {dialogue && (
        <div style={{
          position: 'absolute',
          bottom: 110,
          left: 12, right: 12,
          background: 'rgba(255,255,255,0.95)',
          border: '3px solid #111',
          padding: '16px 18px',
          fontFamily: '"Press Start 2P",monospace',
          fontSize: 8,
          color: '#111',
          lineHeight: '1.8em',
          zIndex: 60
        }}
        onClick={advanceDialogue}>
          <div style={{
            position: 'absolute',
            top: -16, left: 8,
            background: '#fff',
            border: '2px solid #111',
            padding: '2px 8px',
            fontSize: 7
          }}>
            {currentLeader?.nombre}
          </div>
          {dialogue[dialogueIndex]}
          <div style={{
            position: 'absolute',
            bottom: 6, right: 10,
            animation: 'blink 0.6s steps(1) infinite',
            fontSize: 10
          }}>▼</div>
        </div>
      )}

      {/* BATTLE PROMPT */}
      {showBattlePrompt && (
        <div style={{
          position: 'absolute',
          bottom: 110,
          left: 12, right: 12,
          background: 'rgba(255,255,255,0.95)',
          border: '3px solid #111',
          padding: 16,
          zIndex: 60,
          textAlign: 'center'
        }}>
          <p style={{
            fontFamily:'"Press Start 2P"',
            fontSize:8,color:'#111',
            marginBottom:14
          }}>
            ¿Aceptas el desafío?
          </p>
          <div style={{display:'flex',gap:10}}>
            <button
              onClick={() => navigate('battle', { gymId })}
              style={{
                flex:1,padding:12,
                background:'#E83030',color:'#fff',
                border:'3px solid #111',
                fontFamily:'"Press Start 2P"',
                fontSize:8,cursor:'pointer'
              }}
            >¡LUCHAR!</button>
            <button
              onClick={() => setShowBattlePrompt(false)}
              style={{
                flex:1,padding:12,
                background:'#f0f0f0',color:'#111',
                border:'3px solid #111',
                fontFamily:'"Press Start 2P"',
                fontSize:8,cursor:'pointer'
              }}
            >AHORA NO</button>
          </div>
        </div>
      )}

      {/* CONTROLES (Recibiendo input local) */}
      <Controls 
        onDirectionChange={handleDirection}
        onA={handleA}
      />
      
      <style>{`
        @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default GymScreen;
