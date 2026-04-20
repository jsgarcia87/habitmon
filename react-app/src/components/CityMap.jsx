import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getAssetPath } from '../api';
import { useMapData } from '../hooks/useMapData';

const TILE_SIZE = 32;
const TILESET_MAP = {
  // Overworld
  1: 'Graphics/tilesets/gsc overworld johto day.png',
  2: 'Graphics/tilesets/gsc overworld johto morning.png',
  3: 'Graphics/tilesets/gsc overworld johto nite.png',

  // Interiors & Houses
  7: 'Graphics/tilesets/gsc house 1.png',
  8: 'Graphics/tilesets/gsc house 2.png',
  9: 'Graphics/tilesets/gsc house 3.png',
  10: 'Graphics/tilesets/gsc rail station-gym a.png', // ID estándar para interiores/gimnasios
  11: 'Graphics/tilesets/gsc pkmn center.png',
  12: 'Graphics/tilesets/gsc pkmn mart.png',

  // Gyms & Premium Interiors
  15: 'Graphics/tilesets/gsc gym 1a.png',
  16: 'Graphics/tilesets/gsc gym 1b.png',
  17: 'Graphics/tilesets/gsc gym 2a.png',
  18: 'Graphics/tilesets/gsc gym 2b.png',
  20: 'Graphics/tilesets/gsc cave-gym a.png',
  21: 'Graphics/tilesets/gsc cave-gym b.png',
  22: 'Graphics/tilesets/gsc cave-gym c.png',
  23: 'Graphics/tilesets/gsc cave-gym d.png',
  24: 'Graphics/tilesets/gsc cave-gym e.png',
  44: 'Graphics/tilesets/gsc rail station-gym a.png',
  45: 'Graphics/tilesets/gsc rail station-gym b.png',
  46: 'Graphics/tilesets/gsc hide-gym a.png',
  54: 'Graphics/tilesets/gsc hall of fame.png',
  55: 'Graphics/tilesets/gsc hide-gym b.png'};

const CityMap = ({ 
  mapId = 'Map002', 
  direction, 
  aPressed, 
  onEvent, 
  playerPos, 
  setPlayerPos, 
  npcs = [], 
  buildings = [] 
}) => {
  const { user, gimnasiosHoy, notify } = useGame();
  const canvasRef = useRef(null);
  const { mapData, loading: mapLoading, error: mapError } = useMapData(mapId);
  const [facing, setFacing] = useState('down');
  
  const tilesetImg = useRef(new Image());
  const playerImg = useRef(new Image());
  const npcImgCache = useRef({});
  const playerState = useRef({
    x: playerPos.x, y: playerPos.y,
    targetX: playerPos.x, targetY: playerPos.y,
    isMoving: false,
    progress: 0, 
    facing: 'down',
    walkFrame: 0
  });

  // Responsive canvas size adjustment
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // We set the drawing buffer size to match display size for pixel perfect scaling
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
        }
      }
    };
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Set up image fallbacks
  useEffect(() => {
    tilesetImg.current.onerror = () => {
      console.error(`Failed to load tileset: ${tilesetImg.current.src}. Using safety fallback.`);
      // If a gym/cave fails, fallback to standard overworld or house tileset
      if (!tilesetImg.current.src.includes('johto')) {
          tilesetImg.current.src = getAssetPath('Graphics/tilesets/gsc overworld johto day.png');
      }
    };
    playerImg.current.onerror = () => {
      console.error(`Failed to load player sprite. Using safety fallback.`);
      playerImg.current.src = getAssetPath('Graphics/characters/trchar000.png');
    };
  }, []);

  // Helper to get time-based tileset suffix
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'morning'; // 6am - 10am
    if (hour >= 10 && hour < 18) return 'day';    // 10am - 6pm (18:00)
    return 'nite';                                // 6pm - 6am
  };

  // Load Assets
  useEffect(() => {
    if (mapError) {
      notify(`Error al cargar el mapa: ${mapError}`, 'error');
      return;
    }
    if (!mapData) return;

    tilesetImg.current = new Image();
    const baseTilesetId = mapData.tileset_id || 1;
    let tilesetSrc;
    if (baseTilesetId === 10) {
      tilesetSrc = 'Graphics/tilesets/gsc rail station-gym a.png';
    } else if ([1, 2, 3].includes(baseTilesetId)) {
      const time = getTimeOfDay();
      tilesetSrc = `Graphics/tilesets/gsc overworld johto ${time}.png`;
    } else {
      tilesetSrc = TILESET_MAP[baseTilesetId] || TILESET_MAP[1];
    }
    tilesetImg.current.src = getAssetPath(tilesetSrc);

    // Avatar dinámico
    const avatarNum = String(user?.avatar || 0).padStart(3, '0');
    playerImg.current.src = getAssetPath(`Graphics/characters/trchar${avatarNum}.png`);
  }, [mapData, mapError, notify, user?.avatar]);

  const isLoading = mapLoading || !mapData;

  // NPC Image Cache y Proximidad
  const [nearNpc, setNearNpc] = useState(null);

  useEffect(() => {
    npcs.forEach(npc => {
      if (!npcImgCache.current[npc.sprite]) {
        const img = new Image();
        img.src = getAssetPath(`Graphics/characters/${npc.sprite}.png`);
        npcImgCache.current[npc.sprite] = img;
      }
    });
  }, [npcs]);


  // Keep state in sync y detectar proximidad
  useEffect(() => {
    const p = playerState.current;
    if (!p.isMoving) {
      p.x = playerPos.x;
      p.y = playerPos.y;
      p.targetX = playerPos.x;
      p.targetY = playerPos.y;
      
      // Chequear si hay un NPC cerca para mostrar el '!'
      let tx = p.x, ty = p.y;
      if (p.facing === 'up') ty--;
      if (p.facing === 'down') ty++;
      if (p.facing === 'left') tx--;
      if (p.facing === 'right') tx++;
      const npc = npcs.find(n => n.posicion.x === tx && n.posicion.y === ty);
      setNearNpc(npc || null);
    }
  }, [playerPos, npcs]);

  const getMapDataInfo = () => {
    if (!mapData || !mapData.data) return { actualData: [], step: 1, headerOffset: 0 };
    const { width, height, data } = mapData;
    const actualData = data['@data'] || data;
    const tilesPerLayer = width * height;
    
    // Smart detection: ¿es binario (2 bytes por tile) o simple (1 byte por tile)?
    // Si la longitud es cercana a 1200 (3 capas de 400), es 1 byte.
    // Si la longitud es cercana a 2400, es 2 bytes.
    const isTwoByte = actualData.length >= (tilesPerLayer * 2 * 3);
    const step = isTwoByte ? 2 : 1;
    const headerOffset = actualData.length % (tilesPerLayer * step * 3);
    
    return { actualData, step, headerOffset, width, height, tilesPerLayer };
  };

  const checkCollision = (nx, ny) => {
    const { actualData, step, headerOffset, width, height, tilesPerLayer } = getMapDataInfo();
    if (!actualData.length) return true;
    
    // Bounds check
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false; 

    // NPC collision
    if (npcs.some(n => n.posicion.x === nx && n.posicion.y === ny)) return true;

    // Layer collision check
    for (let z = 0; z < 3; z++) {
      const i = ny * width + nx;
      const baseIdx = headerOffset + (z * tilesPerLayer + i) * step;
      let tileId = actualData[baseIdx];
      if (step === 2) tileId += (actualData[baseIdx + 1] << 8);
      
      if (tileId >= 450 && tileId < 2000) return true; 
    }
    return false;
  };

  // Border Transition (Warp) Logic
  const checkWarp = (nx, ny) => {
    if (!mapData) return;
    const { width, height } = mapData;
    
    if (nx < 0) onEvent({ type: 'transfer', side: 'left' });
    else if (nx >= width) onEvent({ type: 'transfer', side: 'right' });
    else if (ny < 0) onEvent({ type: 'transfer', side: 'up' });
    else if (ny >= height) onEvent({ type: 'transfer', side: 'down' });
  };

  useEffect(() => {
    if (aPressed) {
      const p = playerState.current;
      let tx = p.x, ty = p.y;
      if (p.facing === 'up') ty--;
      if (p.facing === 'down') ty++;
      if (p.facing === 'left') tx--;
      if (p.facing === 'right') tx++;

      const npc = npcs.find(n => n.posicion.x === tx && n.posicion.y === ty);
      if (npc) {
        onEvent({ type: 'npc_talk', npc });
        return;
      }

      const activeBuilding = buildings.find(b => tx === b.x && ty === b.y);
      if (activeBuilding) {
        if (activeBuilding.type === 'home' && !activeBuilding.targetMapId) {
          onEvent({ type: 'home_entry' });
        } else {
          onEvent({ 
            type: 'gym_entry', 
            gymId: activeBuilding.gymId, 
            targetMapId: activeBuilding.targetMapId,
            spawn: activeBuilding.spawn
          });
        }
      }
    }
  }, [aPressed, npcs, buildings, onEvent]);

  useEffect(() => {
    if (!mapData || isLoading) return;
    let lastTime = performance.now();
    let frameId;

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const p = playerState.current;

      if (p.isMoving) {
        p.progress += dt / 180;
        if (p.progress >= 1) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false; p.progress = 0; p.walkFrame = 0;
          setPlayerPos({ x: p.x, y: p.y });
          
          if (mapId === 'Map008' && Math.random() < 0.05) {
             onEvent({ type: 'encounter' });
          } else {
             checkWarp(p.x, p.y);
          }
        } else p.walkFrame = Math.floor(p.progress * 4) % 4;
      } else if (direction) {
        let nx = p.x, ny = p.y;
        if (direction === 'up') { ny--; p.facing = 'up'; }
        else if (direction === 'down') { ny++; p.facing = 'down'; }
        else if (direction === 'left') { nx--; p.facing = 'left'; }
        else if (direction === 'right') { nx++; p.facing = 'right'; }
        setFacing(p.facing);
        
        if (!checkCollision(nx, ny)) {
          p.targetX = nx; p.targetY = ny;
          p.isMoving = true; p.progress = 0;
        }
      }

      draw();
      frameId = requestAnimationFrame(loop);
    };

    const draw = () => {
      if (!canvasRef.current || !mapData) return;
      const ctx = canvasRef.current.getContext('2d');
      const { actualData, step, headerOffset, width, height, tilesPerLayer } = getMapDataInfo();
      if (!actualData.length) return;

      const cw = canvasRef.current.width, ch = canvasRef.current.height;
      const p = playerState.current;
      const vX = p.x + (p.targetX - p.x) * p.progress;
      const vY = p.y + (p.targetY - p.y) * p.progress;
      const camX = vX * TILE_SIZE - (cw / 2) + (TILE_SIZE / 2);
      const camY = vY * TILE_SIZE - (ch / 2) + (TILE_SIZE / 2);

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      // Layers 0 & 1
      for (let z = 0; z < 2; z++) {
        for (let i = 0; i < tilesPerLayer; i++) {
          const x = i % width, y = Math.floor(i / width);
          const baseIdx = headerOffset + (z * tilesPerLayer + i) * step;
          let tid = actualData[baseIdx];
          if (step === 2) tid += (actualData[baseIdx + 1] << 8);

          if (tid < 384) continue;
          const dx = x * TILE_SIZE - camX, dy = y * TILE_SIZE - camY;
          if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
            const index = tid - 384;
            ctx.drawImage(tilesetImg.current, (index % 8) * TILE_SIZE, Math.floor(index / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
          }
        }
      }

      npcs.forEach(npc => {
        const img = npcImgCache.current[npc.sprite];
        if (img && img.complete) {
          const dx = npc.posicion.x * TILE_SIZE - camX, dy = npc.posicion.y * TILE_SIZE - camY;
          ctx.drawImage(img, 0, (npc.direccion || 0) * 40, 32, 40, Math.floor(dx), Math.floor(dy - 8), 32, 40);
          
          // Indicador de diálogo si está cerca
          if (nearNpc === npc) {
             const blink = Math.floor(Date.now() / 400) % 2;
             if (blink) {
                ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                ctx.font = 'bold 16px monospace';
                ctx.strokeText('!', dx + 12, dy - 20);
                ctx.fillText('!', dx + 12, dy - 20);
             }
          }
        }
      });

      const px = vX * TILE_SIZE - camX, py = vY * TILE_SIZE - camY;
      const row = { down:0, left:1, right:2, up:3 }[p.facing];
      ctx.drawImage(playerImg.current, p.walkFrame * 32, row * 40, 32, 40, Math.floor(px), Math.floor(py - 8), 32, 40);

      // Layer 2
      for (let i = 0; i < tilesPerLayer; i++) {
        const x = i % width, y = Math.floor(i / width);
        const baseIdx = headerOffset + (2 * tilesPerLayer + i) * step;
        let tid = actualData[baseIdx];
        if (step === 2) tid += (actualData[baseIdx + 1] << 8);

        if (tid < 384) continue;
        const dx = x * TILE_SIZE - camX, dy = y * TILE_SIZE - camY;
        if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
          const index = tid - 384;
          ctx.drawImage(tilesetImg.current, (index % 8) * TILE_SIZE, Math.floor(index / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
        }
      }

      // Atmosphere Nite
      if (getTimeOfDay() === 'nite') {
        ctx.fillStyle = 'rgba(26, 26, 138, 0.25)';
        ctx.fillRect(0, 0, cw, ch);
      }

      buildings.forEach(b => {
        const sx = b.x * TILE_SIZE - camX, sy = b.y * TILE_SIZE - camY;
        if (sx > -TILE_SIZE && sx < cw && sy > -TILE_SIZE && sy < ch) {
          const done = b.gymId ? gimnasiosHoy?.find(g => g.gym_id === b.gymId)?.completado : false;
          const labelY = sy - 42;
          const labelW = TILE_SIZE * 2.5;
          const labelX = sx - (labelW / 2) + 16;
          
          // Sign Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(Math.floor(labelX + 2), Math.floor(labelY + 2), labelW, 14);
          
          // Sign Base (Johto style)
          const baseColor = b.type === 'home' ? '#A83030' : (done ? '#2D8A2D' : '#1A1A8A');
          ctx.fillStyle = baseColor;
          ctx.fillRect(Math.floor(labelX), Math.floor(labelY), labelW, 14);
          
          // Sign Border
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.strokeRect(Math.floor(labelX + 1), Math.floor(labelY + 1), labelW - 2, 12);
          
          // Text
          ctx.fillStyle = '#fff'; ctx.font = '7px "Press Start 2P"'; ctx.textAlign = 'center';
          ctx.fillText(b.nombre.toUpperCase(), Math.floor(labelX + labelW/2), Math.floor(labelY + 10));
          
          if (done) { 
            ctx.font = '14px serif'; 
            ctx.fillText('🏅', Math.floor(labelX + labelW/2), Math.floor(labelY - 5)); 
          }
          ctx.textAlign = 'left';
        }
      });
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [mapData, isLoading, gimnasiosHoy, npcs, buildings, direction, onEvent]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <canvas ref={canvasRef} width={400} height={400} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      {isLoading && <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>Explorando...</div>}
    </div>
  );
};

export default CityMap;
