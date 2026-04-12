import React, { useState, useEffect, useRef } from 'react';
import { BUILDING_TEMPLATES } from '../data/buildingTemplates';
import { useGame } from '../context/GameContext';

const TILE_SIZE = 32;
const MAP_ID = 'Map002';
const TILESET_SRC = '/Graphics/tilesets/gsc overworld johto day.png';

const GRASS_ZONES = [
  {x1:2, y1:8, x2:6, y2:14},
  {x1:14, y1:2, x2:20, y2:8},
  {x1:2, y1:16, x2:8, y2:22},
  {x1:16, y1:14, x2:22, y2:20},
];

const BUILDINGS = [
  { gym_id:'vestirse', nombre:'Vestirse', tileX:3, tileY:3 },
  { gym_id:'desayuno', nombre:'Desayuno', tileX:14, tileY:3 },
  { gym_id:'higiene', nombre:'Higiene', tileX:3, tileY:14 },
  { gym_id:'orden', nombre:'Orden', tileX:14, tileY:14 },
];

function drawGymBuilding(ctx, screenX, screenY, gymId, nombre, completado) {
  const T = 32; // tamaño tile
  
  // Colores por tipo de gimnasio
  const COLORS = {
    vestirse:  { roof:'#C84040', wall:'#F8D878', door:'#8B4513' },
    desayuno:  { roof:'#4040C8', wall:'#78C878', door:'#8B4513' },
    higiene:   { roof:'#40C8C8', wall:'#F8F8A0', door:'#8B4513' },
    orden:     { roof:'#C840C8', wall:'#C8A078', door:'#8B4513' },
  };
  const c = COLORS[gymId] || COLORS.vestirse;
  
  // TECHO (3 tiles ancho, 1 tile alto base + triángulo)
  ctx.fillStyle = c.roof;
  ctx.fillRect(screenX, screenY, T*3, T);
  // Línea borde techo
  ctx.fillStyle = '#000';
  ctx.fillRect(screenX, screenY, T*3, 3);
  ctx.fillRect(screenX, screenY+T-3, T*3, 3);
  // Triángulo techo
  ctx.fillStyle = c.roof;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + T*1.5, screenY - T*0.6);
  ctx.lineTo(screenX + T*3, screenY);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // PAREDES (3 tiles ancho, 2 tiles alto)
  ctx.fillStyle = c.wall;
  ctx.fillRect(screenX, screenY+T, T*3, T*2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX, screenY+T, T*3, T*2);
  
  // VENTANAS (2 ventanas)
  ctx.fillStyle = '#A0D8F0';
  ctx.fillRect(screenX+6, screenY+T+8, T-8, T-8);
  ctx.fillRect(screenX+T*2+6, screenY+T+8, T-8, T-8);
  // Cruz ventana
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX+T/2 + 6, screenY+T+8);
  ctx.lineTo(screenX+T/2 + 6, screenY+T*2);
  ctx.moveTo(screenX+6, screenY+T+T/2);
  ctx.lineTo(screenX+T, screenY+T+T/2);
  ctx.stroke();
  
  // PUERTA (centro)
  ctx.fillStyle = c.door;
  ctx.fillRect(screenX+T+8, screenY+T*2, T-8, T);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX+T+8, screenY+T*2, T-8, T);
  // Pomo puerta
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(screenX+T+10, screenY+T*2+T/2, 3, 0, Math.PI*2);
  ctx.fill();
  
  // LETRERO encima del edificio
  const labelY = screenY - T*0.6 - 18;
  ctx.fillStyle = completado ? '#2D8A2D' : '#1A1A8A';
  ctx.fillRect(screenX+T/2, labelY, T*2, 14);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX+T/2, labelY, T*2, 14);
  ctx.fillStyle = '#FFD700';
  ctx.font = '6px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(
    nombre.toUpperCase(),
    screenX + T*1.5,
    labelY + 10
  );
  
  // Medalla si completado
  if(completado) {
    ctx.font = '16px serif';
    ctx.fillText('🏅', screenX+T*1.5, labelY-4);
  }
  
  ctx.textAlign = 'left';
}

const CityMap = ({ direction, aPressed, onEvent, playerPos, setPlayerPos, npcs = [] }) => {
  const { gimnasiosHoy } = useGame();
  const canvasRef = useRef(null);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facing, setFacing] = useState('down');
  const [flash, setFlash] = useState(0); 
  
  // Refs for non-reactive state (Game Loop)
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

  // 1. Initial Data Loading
  useEffect(() => {
    fetch(`/Data/${MAP_ID}.json`)
      .then(r => r.json())
      .then(data => {
        setMapData(data);
        tilesetImg.current.src = TILESET_SRC;
        playerImg.current.src = '/Graphics/characters/trchar000.png';
        
        let loaded = 0;
        const checkLoaded = () => { if(++loaded === 2) setIsLoading(false); };
        tilesetImg.current.onload = checkLoaded;
        playerImg.current.onload = checkLoaded;
      });
  }, []);

  // 2. NPC Image Cache
  useEffect(() => {
    npcs.forEach(npc => {
      if (!npcImgCache.current[npc.sprite]) {
        const img = new Image();
        img.src = `/Graphics/characters/${npc.sprite}.png`;
        npcImgCache.current[npc.sprite] = img;
      }
    });
  }, [npcs]);

  // 3. Keep logical pos in sync (for teleports)
  useEffect(() => {
    const p = playerState.current;
    if (!p.isMoving) {
      p.x = playerPos.x;
      p.y = playerPos.y;
      p.targetX = playerPos.x;
      p.targetY = playerPos.y;
    }
  }, [playerPos]);

  // 4. Collision Logic
  const checkCollision = (nx, ny) => {
    if (!mapData || !mapData.data) return true;
    const { width, height, data } = mapData;
    const actualData = data['@data'] || data;
    const tilesPerLayer = width * height;
    const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;
    
    // NPC collision
    if (npcs.some(n => n.posicion.x === nx && n.posicion.y === ny)) return true;

    // Building collision (simple check for hardcoded buildings area)
    const isInsideBuilding = BUILDINGS.some(b => {
      return nx >= b.tileX && nx < b.tileX + 3 && ny >= b.tileY && ny < b.tileY + 3;
    });
    if (isInsideBuilding) {
       // Allow door at tile (center x, bottom y)
       const isDoor = BUILDINGS.some(b => nx === b.tileX + 1 && ny === b.tileY + 2);
       if (!isDoor) return true;
    }

    // Layer collisions (Blocking tiles > 450)
    for (let z = 0; z < 3; z++) {
      const i = ny * width + nx;
      const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
      const tileId = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
      if (tileId >= 450 && tileId < 2000) return true; 
    }
    return false;
  };

  // 5. Interaction Logic (A Button)
  useEffect(() => {
    if (aPressed) {
      const p = playerState.current;
      let tx = p.x;
      let ty = p.y;
      if (p.facing === 'up') ty--;
      if (p.facing === 'down') ty++;
      if (p.facing === 'left') tx--;
      if (p.facing === 'right') tx++;

      const npc = npcs.find(n => n.posicion.x === tx && n.posicion.y === ty);
      if (npc) {
        onEvent({ type: 'npc_talk', npc });
        return;
      }

      const activeGym = BUILDINGS.find(b => tx === b.tileX + 1 && ty === b.tileY + 2);
      if (activeGym) {
        onEvent({ type: 'gym_entry', gymId: activeGym.gym_id });
      }
    }
  }, [aPressed, npcs, onEvent]);

  // 6. Main Game Loop (Movement + Render)
  useEffect(() => {
    if (!mapData || isLoading) return;

    let lastTime = performance.now();
    let frameId;

    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      
      const p = playerState.current;

      // Handle Smooth Movement
      if (p.isMoving) {
        p.progress += dt / 180; // Walk speed
        if (p.progress >= 1) {
          p.x = p.targetX;
          p.y = p.targetY;
          p.isMoving = false;
          p.progress = 0;
          p.walkFrame = 0;
          setPlayerPos({ x: p.x, y: p.y });

          // Grass triggers
          const inGrass = GRASS_ZONES.some(z => p.x >= z.x1 && p.x <= z.x2 && p.y >= z.y1 && p.y <= z.y2);
          if (inGrass && Math.random() < 0.05) {
             onEvent({ type: 'encounter' });
          }
        } else {
          p.walkFrame = Math.floor(p.progress * 4) % 4;
        }
      } else if (direction) {
        let nx = p.x;
        let ny = p.y;
        if (direction === 'up') { ny--; p.facing = 'up'; }
        else if (direction === 'down') { ny++; p.facing = 'down'; }
        else if (direction === 'left') { nx--; p.facing = 'left'; }
        else if (direction === 'right') { nx++; p.facing = 'right'; }
        
        setFacing(p.facing); // For UI reactivity

        if (nx >= 0 && nx < mapData.width && ny >= 0 && ny < mapData.height && !checkCollision(nx, ny)) {
          p.targetX = nx; p.targetY = ny;
          p.isMoving = true; p.progress = 0;
        }
      }

      draw();
      frameId = requestAnimationFrame(loop);
    };

    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const { width, height, data } = mapData;
      const actualData = data['@data'] || data;
      const tilesPerLayer = width * height;
      const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;

      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      
      const p = playerState.current;
      const vX = p.x + (p.targetX - p.x) * p.progress;
      const vY = p.y + (p.targetY - p.y) * p.progress;

      const camX = vX * TILE_SIZE - (cw / 2) + (TILE_SIZE / 2);
      const camY = vY * TILE_SIZE - (ch / 2) + (TILE_SIZE / 2);

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      // Layer 0 & 1
      for (let z = 0; z < 2; z++) {
        for (let i = 0; i < tilesPerLayer; i++) {
          const x = i % width;
          const y = Math.floor(i / width);
          const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
          const tid = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
          if (tid < 384) continue;
          
          const dx = x * TILE_SIZE - camX;
          const dy = y * TILE_SIZE - camY;
          if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
            const index = tid - 384;
            ctx.drawImage(tilesetImg.current, (index % 8) * TILE_SIZE, Math.floor(index / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // Custom Gym Buildings
      BUILDINGS.forEach(b => {
        const sx = b.tileX * TILE_SIZE - camX;
        const sy = b.tileY * TILE_SIZE - camY;
        
        if (sx > -TILE_SIZE * 4 && sx < cw + TILE_SIZE && sy > -TILE_SIZE * 4 && sy < ch + TILE_SIZE) {
          const gymStatus = gimnasiosHoy?.find(g => g.gym_id === b.gym_id);
          drawGymBuilding(ctx, Math.floor(sx), Math.floor(sy), b.gym_id, b.nombre, gymStatus?.completado);
        }
      });

      // NPCs
      npcs.forEach(npc => {
        const img = npcImgCache.current[npc.sprite];
        if (img && img.complete) {
          const dx = npc.posicion.x * TILE_SIZE - camX, dy = npc.posicion.y * TILE_SIZE - camY;
          ctx.drawImage(img, 0, (npc.direccion || 0) * 40, 32, 40, Math.floor(dx), Math.floor(dy - 8), 32, 40);
        }
      });

      // Player
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
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [mapData, isLoading, gimnasiosHoy, npcs, direction, onEvent]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <canvas ref={canvasRef} width={400} height={400} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      {isLoading && <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>Cargando Mapa...</div>}
      {flash === 1 && <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 1000 }} />}
    </div>
  );
};

export default CityMap;
