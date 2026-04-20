import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

// CONFIGURACIÓN DE GIMNASIOS
const BASE = import.meta.env.BASE_URL || '';

const GYM_CONFIG = {
  vestirse: { 
    sprite: `${BASE}Graphics/characters/trchar020.png`,
    tileset: `${BASE}Graphics/tilesets/gsc gym 2b.png`,
    nombre: 'LYRA',
    dialogo: ['¡Bienvenido al Gimnasio!', 'Vestirse bien es el primer paso.', '¿Listo para el desafío?'],
    tiles: { floor: 15, wall: 0, obstacle: 13, carpet: 11 } // Madera clara y alfombra roja
  },
  higiene: {
    sprite: `${BASE}Graphics/characters/trchar025.png`,
    tileset: `${BASE}Graphics/tilesets/gsc gym 2a.png`,
    nombre: 'CLAIR',
    dialogo: ['¡La limpieza es poder!', 'Demuestra tu valor.'],
    tiles: { floor: 15, wall: 0, obstacle: 13, carpet: 11 } // Madera clásica
  },
  orden: {
    sprite: `${BASE}Graphics/characters/trchar030.png`,
    tileset: `${BASE}Graphics/tilesets/gsc cave-gym d.png`,
    nombre: 'MORTY',
    dialogo: ['¡El orden trae paz!', '¿Puedes mantenerlo?'],
    tiles: { floor: 10, wall: 0, obstacle: 16, carpet: 27 } // Cueva morada, rocas y felpudo amarillo
  },
  desayuno: {
    sprite: `${BASE}Graphics/characters/trchar015.png`,
    tileset: `${BASE}Graphics/tilesets/gsc gym 1a.png`,
    nombre: 'ETHAN',
    dialogo: ['¡El desayuno es la comida más importante!', '¿Tienes energía para luchar?'],
    tiles: { floor: 29, wall: 9, obstacle: 8, carpet: 30 } // Suelo de baldosas rosas y bloques metálicos
  },
  comida: {
    sprite: `${BASE}Graphics/characters/trchar010.png`,
    tileset: `${BASE}Graphics/tilesets/gsc gym 1b.png`,
    nombre: 'CHUCK',
    dialogo: ['¡Hay que comer de todo para ser fuerte!', '¡A luchar!'],
    tiles: { floor: 29, wall: 9, obstacle: 8, carpet: 30 } // Variante del gimnasio de baldosas
  },
  cena: {
    sprite: `${BASE}Graphics/characters/trchar005.png`,
    tileset: `${BASE}Graphics/tilesets/gsc gym 2c.png`,
    nombre: 'PRYCE',
    dialogo: ['Una cena ligera asegura un buen descanso.', 'Muéstrame tu rutina.'],
    tiles: { floor: 15, wall: 0, obstacle: 13, carpet: 11 } // Gimnasio de madera tono noche/morado
  }
};

// Coordenadas de los tiles
const TILE_X = (id) => (id % 8) * 32;
const TILE_Y = (id) => Math.floor(id / 8) * 32;

// Matriz 10x14 (1=Pared, 0=Suelo, 2=Obstáculo, 8=Alfombra salida)
const GYM_MAP = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,2,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,8,8,1,1,1,1],
];

const T = 32;

const GymScreen = ({ navigate, gymId, direction, aPressed }) => {
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
    x: 4, y: 12,
    dir: 3, 
    frame: 0,
    isMoving: false,
    moveProgress: 0,
    targetX: 4, targetY: 12
  });

  const assetsRef = useRef({
    tileset: null,
    player: null,
    leader: null
  });

  const currentConfig = GYM_CONFIG[gymId] || GYM_CONFIG.vestirse;

  // Carga de Assets
  useEffect(() => {
    let loaded = 0;
    const toLoad = 3;
    const checkReady = () => { if (++loaded >= toLoad) setReady(true); };

    setReady(false);

    // Tileset
    const tsImg = new Image();
    tsImg.src = currentConfig.tileset;
    tsImg.onload = () => { assetsRef.current.tileset = tsImg; checkReady(); };
    tsImg.onerror = () => { console.error("Error loading tileset:", currentConfig.tileset); checkReady(); };

    // Player
    const pImg = new Image();
    const avatarNum = String(user?.avatar || 0).padStart(3, '0');
    pImg.src = `${BASE}Graphics/characters/trchar${avatarNum}.png`;
    pImg.onload = () => { assetsRef.current.player = pImg; checkReady(); };

    // Leader
    const lImg = new Image();
    lImg.src = currentConfig.sprite;
    lImg.onload = () => { assetsRef.current.leader = lImg; checkReady(); };
  }, [gymId, user?.avatar, currentConfig]);

  // Sincronizar con Controles Globales
  useEffect(() => {
    if (direction && ready) handleDirection(direction);
  }, [direction, ready]);

  useEffect(() => {
    if (aPressed && ready) handleA();
  }, [aPressed, ready]);

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
      if (dialogue) return; 

      if (p.isMoving) {
        p.moveProgress += dt / 180;
        if (p.moveProgress >= 1) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false;
          p.moveProgress = 0;
          p.frame = 0;
          if (p.y >= 13 && GYM_MAP[p.y] && GYM_MAP[p.y][p.x] === 8) {
            navigate('city');
          }
        } else {
          p.frame = p.moveProgress < 0.5 ? 1 : 3;
        }
      }

      const dist = Math.abs(p.x - 4) + Math.abs(p.y - 1);
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

      const camX = Math.round(interpX * T + T/2 - W/2);
      const camY = Math.round(interpY * T + T/2 - H/2);
      const ox = -camX, oy = -camY;

      const ts = assetsRef.current.tileset;

      if (ts) {
        // 1. DIBUJAR CAPA BASE (SUELO)
        for(let y=0; y<14; y++) {
          for(let x=0; x<10; x++) {
            ctx.drawImage(ts, TILE_X(currentConfig.tiles.floor), TILE_Y(currentConfig.tiles.floor), 32, 32, x * T + ox, y * T + oy, T, T);
          }
        }

        // 2. DIBUJAR MAPA (PAREDES Y OBSTÁCULOS)
        GYM_MAP.forEach((row, y) => {
          row.forEach((tid, x) => {
            if (tid === 0) return; 
            const dx = x * T + ox, dy = y * T + oy;
            if (dx < -T || dx > W || dy < -T || dy > H) return;
            
            let srcId = currentConfig.tiles.floor;
            if (tid === 1) srcId = currentConfig.tiles.wall;
            if (tid === 2) srcId = currentConfig.tiles.obstacle;
            if (tid === 8) srcId = currentConfig.tiles.carpet;

            ctx.drawImage(ts, TILE_X(srcId), TILE_Y(srcId), 32, 32, dx, dy, T, T);
          });
        });
      }

      // 3. LÍDER (4, 1)
      if (assetsRef.current.leader) {
        const limg = assetsRef.current.leader;
        const fw = limg.width / 4, fh = limg.height / 4;
        ctx.drawImage(limg, 0, 0, fw, fh, 4 * T + ox, 1 * T + oy - (fh - T), T, fh * (T/fw));
        
        if (nearLeader) {
          const blink = Math.floor(Date.now() / 400) % 2;
          if (blink) {
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
            ctx.font = 'bold 16px monospace';
            ctx.strokeText('!', 4 * T + ox + T/2 - 4, 1 * T + oy - 10);
            ctx.fillText('!', 4 * T + ox + T/2 - 4, 1 * T + oy - 10);
          }
        }
      }

      // 4. JUGADOR
      if (assetsRef.current.player) {
        const pimg = assetsRef.current.player;
        const fw = pimg.width / 4, fh = pimg.height / 4;
        ctx.drawImage(pimg, p.frame * fw, p.dir * fh, fw, fh, Math.round(W / 2 - T / 2), Math.round(H / 2 - T / 2 - (fh - T)), T, fh * (T / fw));
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, dialogue, nearLeader, currentConfig]);

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
    
    // Colisión mejorada
    if (ny >= 0 && ny < GYM_MAP.length && nx >= 0 && nx < GYM_MAP[0].length) {
      const tile = GYM_MAP[ny][nx];
      // Bloquear si es pared (1) u obstáculo (2)
      // Pero permitir si es suelo (0) o alfombra (8)
      if (tile !== 1 && tile !== 2 && !(nx === 4 && ny === 1)) {
        p.targetX = nx; p.targetY = ny;
        p.isMoving = true;
      }
    }
  };

  const handleA = () => {
    if (dialogue) { advanceDialogue(); return; }
    if (nearLeader) {
      setDialogue(currentConfig.dialogo);
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
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }} />

      {/* HUD */}
      <button onClick={() => navigate('city')} style={{ position: 'absolute', top: 8, left: 8, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P",monospace', fontSize: 7, cursor: 'pointer', zIndex: 10 }}>SALIR</button>

      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#FFD700', fontFamily: '"Press Start 2P",monospace', fontSize: 7, padding: '4px 10px', border: '1px solid rgba(255,215,0,0.4)', zIndex: 10 }}>
        GYM {gymId?.toUpperCase()}
      </div>

      {/* DIÁLOGO */}
      {dialogue && (
        <div style={{ position: 'absolute', bottom: 110, left: 12, right: 12, background: 'var(--bg-panel)', border: '3px solid var(--border-color)', padding: '16px 18px', fontFamily: '"Press Start 2P",monospace', fontSize: 8, color: 'var(--text-main)', lineHeight: '1.8em', zIndex: 60, opacity: 0.95 }} onClick={advanceDialogue}>
          <div style={{ position: 'absolute', top: -16, left: 8, background: 'var(--bg-panel)', border: '2px solid var(--border-color)', padding: '2px 8px', fontSize: 7, color: 'var(--text-main)' }}> {currentConfig?.nombre} </div>
          {dialogue[dialogueIndex]}
          <div style={{ position: 'absolute', bottom: 6, right: 10, animation: 'blink 0.6s steps(1) infinite', fontSize: 10 }}>▼</div>
        </div>
      )}

      {/* BATTLE PROMPT */}
      {showBattlePrompt && (
        <div style={{ position: 'absolute', bottom: 110, left: 12, right: 12, background: 'var(--bg-panel)', border: '3px solid var(--border-color)', padding: 16, zIndex: 60, textAlign: 'center', opacity: 0.95 }}>
          <p style={{ fontFamily:'"Press Start 2P"', fontSize:8,color:'var(--text-main)', marginBottom:14 }}> ¿Aceptas el desafío? </p>
          <div style={{display:'flex',gap:10}}>
            <button onClick={() => navigate('battle', { gymId })} style={{ flex:1,padding:12, background:'#E83030',color:'#fff', border:'3px solid var(--border-color)', fontFamily:'"Press Start 2P"', fontSize:8,cursor:'pointer' }}>¡LUCHAR!</button>
            <button onClick={() => setShowBattlePrompt(false)} style={{ flex:1,padding:12, background:'var(--bg-color)',color:'var(--text-main)', border:'3px solid var(--border-color)', fontFamily:'"Press Start 2P"', fontSize:8,cursor:'pointer' }}>AHORA NO</button>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }`}</style>
    </div>
  );
};

export default GymScreen;
