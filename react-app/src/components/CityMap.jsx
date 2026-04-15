import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { getAssetPath } from '../api';

const TILE_SIZE = 32;
const TILESET_MAP = {
  1: 'Graphics/tilesets/gsc overworld johto day.png',
  44: 'Graphics/tilesets/GSC rail station-gym a.png'
};

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
  const { gimnasiosHoy } = useGame();
  const canvasRef = useRef(null);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load Map Data
  useEffect(() => {
    setIsLoading(true);
    fetch(getAssetPath(`Data/${mapId}.json`))
      .then(r => r.json())
      .then(data => {
        setMapData(data);
        
        let tilesetSrc = TILESET_MAP[data.tileset_id] || TILESET_MAP[1];

        // PARCHE SEGURIDAD GIMNASIOS INTERIORES
        if (mapId === 'Map003') {
           tilesetSrc = 'Graphics/tilesets/GSC rail station-gym a.png';
        }

        tilesetImg.current.src = getAssetPath(tilesetSrc);
        playerImg.current.src = getAssetPath('Graphics/characters/trchar000.png');
        let loaded = 0;
        const checkLoaded = () => { if(++loaded === 2) setIsLoading(false); };
        tilesetImg.current.onload = checkLoaded;
        playerImg.current.onload = checkLoaded;
      })
      .catch(err => {
        console.error('Error loading CityMap:', err);
      });
  }, [mapId]);

  // NPC Image Cache
  useEffect(() => {
    npcs.forEach(npc => {
      if (!npcImgCache.current[npc.sprite]) {
        const img = new Image();
        img.src = getAssetPath(`Graphics/characters/${npc.sprite}.png`);
        npcImgCache.current[npc.sprite] = img;
      }
    });
  }, [npcs]);


  // Keep state in sync
  useEffect(() => {
    const p = playerState.current;
    if (!p.isMoving) {
      p.x = playerPos.x;
      p.y = playerPos.y;
      p.targetX = playerPos.x;
      p.targetY = playerPos.y;
    }
  }, [playerPos]);

  const checkCollision = (nx, ny) => {
    if (!mapData || !mapData.data) return true;
    const { width, height, data } = mapData;
    const actualData = data['@data'] || data;
    const tilesPerLayer = width * height;
    const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;
    
    // Bounds check
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return false; // Allow border exit logic

    // NPC collision
    if (npcs.some(n => n.posicion.x === nx && n.posicion.y === ny)) return true;

    // Layer collision
    for (let z = 0; z < 3; z++) {
      const i = ny * width + nx;
      const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
      const tileId = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
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
        if (activeBuilding.type === 'home') onEvent({ type: 'profile_open' });
        else onEvent({ type: 'gym_entry', gymId: activeBuilding.gymId });
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
          
          // Random Grass Encounter (5% in Wild Routes like Map008)
          if (mapId === 'Map008' && Math.random() < 0.05) {
             onEvent({ type: 'encounter' });
             // Evitar checkWarp inmediato para no salir del mapa accidentalmente
          } else {
             // Check for border exit
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
      const { width, height, data } = mapData;
      const actualData = data['@data'] || data;
      const tilesPerLayer = width * height;
      const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;
      const cw = canvasRef.current.width, ch = canvasRef.current.height;
      
      const p = playerState.current;
      const vX = p.x + (p.targetX - p.x) * p.progress;
      const vY = p.y + (p.targetY - p.y) * p.progress;
      const camX = vX * TILE_SIZE - (cw / 2) + (TILE_SIZE / 2);
      const camY = vY * TILE_SIZE - (ch / 2) + (TILE_SIZE / 2);

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      for (let z = 0; z < 2; z++) {
        for (let i = 0; i < tilesPerLayer; i++) {
          const x = i % width, y = Math.floor(i / width);
          const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
          const tid = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
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
        }
      });

      const px = vX * TILE_SIZE - camX, py = vY * TILE_SIZE - camY;
      const row = { down:0, left:1, right:2, up:3 }[p.facing];
      ctx.drawImage(playerImg.current, p.walkFrame * 32, row * 40, 32, 40, Math.floor(px), Math.floor(py - 8), 32, 40);

      // Layer 2
      for (let i = 0; i < tilesPerLayer; i++) {
        const x = i % width, y = Math.floor(i / width);
        const baseIdx = headerOffset + (2 * tilesPerLayer + i) * 2;
        const tid = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
        if (tid < 384) continue;
        const dx = x * TILE_SIZE - camX, dy = y * TILE_SIZE - camY;
        if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
          const index = tid - 384;
          ctx.drawImage(tilesetImg.current, (index % 8) * TILE_SIZE, Math.floor(index / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
        }
      }

      buildings.forEach(b => {
        const sx = b.x * TILE_SIZE - camX, sy = b.y * TILE_SIZE - camY;
        if (sx > -TILE_SIZE && sx < cw && sy > -TILE_SIZE && sy < ch) {
          const done = b.gymId ? gimnasiosHoy?.find(g => g.gym_id === b.gymId)?.completado : false;
          const labelY = sy - 40;
          ctx.fillStyle = b.type === 'home' ? '#E83030' : (done ? '#2D8A2D' : '#1A1A8A');
          ctx.fillRect(Math.floor(sx - 16), Math.floor(labelY), TILE_SIZE * 2, 14);
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 1.5; ctx.strokeRect(Math.floor(sx - 16), Math.floor(labelY), TILE_SIZE * 2, 14);
          ctx.fillStyle = '#FFD700'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
          ctx.fillText(b.nombre.toUpperCase(), Math.floor(sx + 16), Math.floor(labelY + 10));
          if (done) { ctx.font = '16px serif'; ctx.fillText('🏅', Math.floor(sx + 16), Math.floor(labelY - 4)); }
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
