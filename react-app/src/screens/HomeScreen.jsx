import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const BASE = import.meta.env.BASE_URL || '';

const HOME_CONFIG = {
  tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
  tiles: { floor: 0, wall: 1, computer: 24, rug: 11 } // Valores estimados para interior de casa GSC
};

// Coordenadas de los tiles (suponiendo 8 columnas como los demás)
const TILE_X = (id) => (id % 8) * 32;
const TILE_Y = (id) => Math.floor(id / 8) * 32;

const HOME_MAP = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,2,1], // 2 = Ordenador/Mesa
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,8,8,1,1,1,1], // 8 = Salida
];

const T = 32;

const HomeScreen = ({ navigate, direction, aPressed }) => {
  const { user } = useGame();
  const canvasRef = useRef(null);
  const [dialogue, setDialogue] = useState(null);
  const [ready, setReady] = useState(false);

  const playerState = useRef({
    x: 4, y: 8,
    dir: 3, 
    frame: 0,
    isMoving: false,
    moveProgress: 0,
    targetX: 4, targetY: 8
  });

  const assetsRef = useRef({
    tileset: null,
    player: null
  });

  useEffect(() => {
    let loaded = 0;
    const toLoad = 2;
    const checkReady = () => { if (++loaded >= toLoad) setReady(true); };

    // Tileset
    const tsImg = new Image();
    tsImg.src = HOME_CONFIG.tileset;
    tsImg.onload = () => { assetsRef.current.tileset = tsImg; checkReady(); };

    // Player
    const pImg = new Image();
    const avatarNum = String(user?.avatar || 0).padStart(3, '0');
    pImg.src = `${BASE}Graphics/characters/trchar${avatarNum}.png`;
    pImg.onload = () => { assetsRef.current.player = pImg; checkReady(); };
  }, [user?.avatar]);

  useEffect(() => {
    if (direction && ready) handleDirection(direction);
  }, [direction, ready]);

  useEffect(() => {
    if (aPressed && ready) handleA();
  }, [aPressed, ready]);

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
          if (p.y >= 9 && HOME_MAP[p.y][p.x] === 8) {
            navigate('city');
          }
        } else {
          p.frame = p.moveProgress < 0.5 ? 1 : 3;
        }
      }
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
        // Base Floor
        for(let y=0; y<10; y++) {
          for(let x=0; x<10; x++) {
            ctx.drawImage(ts, TILE_X(HOME_CONFIG.tiles.floor), TILE_Y(HOME_CONFIG.tiles.floor), 32, 32, x * T + ox, y * T + oy, T, T);
          }
        }

        // Walls & Furniture
        HOME_MAP.forEach((row, y) => {
          row.forEach((tid, x) => {
            if (tid === 0) return;
            let srcId = HOME_CONFIG.tiles.floor;
            if (tid === 1) srcId = HOME_CONFIG.tiles.wall;
            if (tid === 2) srcId = HOME_CONFIG.tiles.computer;
            if (tid === 8) srcId = HOME_CONFIG.tiles.rug;

            ctx.drawImage(ts, TILE_X(srcId), TILE_Y(srcId), 32, 32, x * T + ox, y * T + oy, T, T);
          });
        });
      }

      // Player
      if (assetsRef.current.player) {
        const pimg = assetsRef.current.player;
        const fw = pimg.width / 4, fh = pimg.height / 4;
        ctx.drawImage(pimg, p.frame * fw, p.dir * fh, fw, fh, Math.round(W / 2 - T / 2), Math.round(H / 2 - T / 2 - (fh - T)), T, fh * (T / fw));
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, dialogue]);

  const handleDirection = (dir) => {
    if (dialogue) return;
    const p = playerState.current;
    if (p.isMoving) return;

    let dx = 0, dy = 0;
    if (dir === 'up') { dy = -1; p.dir = 3; }
    if (dir === 'down') { dy = 1; p.dir = 0; }
    if (dir === 'left') { dx = -1; p.dir = 1; }
    if (dir === 'right') { dx = 1; p.dir = 2; }

    const nx = p.x + dx, ny = p.y + dy;
    if (ny >= 0 && ny < HOME_MAP.length && nx >= 0 && nx < HOME_MAP[0].length) {
      const tile = HOME_MAP[ny][nx];
      if (tile !== 1 && tile !== 2) {
        p.targetX = nx; p.targetY = ny;
        p.isMoving = true;
      }
    }
  };

  const handleA = () => {
    if (dialogue) { setDialogue(null); return; }
    
    // Check if facing computer (at 8, 1)
    const p = playerState.current;
    let tx = p.x, ty = p.y;
    if (p.dir === 3) ty--;
    if (p.dir === 0) ty++;
    if (p.dir === 1) tx--;
    if (p.dir === 2) tx++;

    if (tx === 8 && ty === 1) {
      setDialogue(["Accediendo al Ordenador...", "Consultando progresos del entrenador..."]);
      setTimeout(() => {
        setDialogue(null);
        navigate('profile');
      }, 1500);
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

      <button onClick={() => navigate('city')} style={{ position: 'absolute', top: 8, left: 8, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P"', fontSize: 7, cursor: 'pointer', zIndex: 10 }}>SALIR</button>

      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: '"Press Start 2P"', fontSize: 7, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.4)', zIndex: 10 }}> HOGAR </div>

      {dialogue && (
        <div style={{ position: 'absolute', bottom: 110, left: 12, right: 12, background: 'var(--bg-panel)', border: '3px solid var(--border-color)', padding: '16px 18px', fontFamily: '"Press Start 2P",monospace', fontSize: 8, color: 'var(--text-main)', lineHeight: '1.8em', zIndex: 60, opacity: 0.95 }}>
          {dialogue[0]}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
