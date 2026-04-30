import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { getAssetPath } from '../api/assets';
import { TILE_SIZE, parseRMXPTable, parseRMXPPassages, parseRMXPPriorities, checkPassage } from '../utils/TilesetManager';
import { safeDrawImage } from '../utils/gfxUtils';

const CityMap = ({ mapId, direction, aPressed, onEvent, playerPos, setPlayerPos, npcs = [], buildings = [], children }) => {
  const { user, gimnasiosHoy, notify } = useGame();
  const canvasRef = useRef(null);
  const worldOverlayRef = useRef(null);
  const [mapData, setMapData] = useState(null);
  const [tilesetMeta, setTilesetMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [facing, setFacing] = useState('down');
  const [graphicsLoading, setGraphicsLoading] = useState(false);
  const activeTilesetSrc = useRef(null);
  const fadeAlpha = useRef(1); // Start faded in
  
  const tilesetImg = useRef(new Image());
  const autotileImages = useRef([]);
  const playerImg = useRef(new Image());
  const npcImgCache = useRef({});
  const playerState = useRef({
    x: playerPos.x, y: playerPos.y,
    targetX: playerPos.x, targetY: playerPos.y,
    isMoving: false,
    progress: 0, 
    facing: 'down',
    walkFrame: 0,
    hasNudged: false,
    lastMapId: null
  });

  const lastEncounterRef = useRef(0);

  // Helper to get time-based tileset suffix
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'morning'; // 6am - 10am
    if (hour >= 10 && hour < 18) return 'day';    // 10am - 6pm (18:00)
    return 'nite';                                // 6pm - 6am
  };

  // Responsive canvas size adjustment
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
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

  // NEW: Load Map Data and Tileset Metadata
  useEffect(() => {
    const loadMap = async () => {
      setIsLoading(true);
      try {
        const [mapRes, tsRes] = await Promise.all([
          fetch(`Data/${mapId}.json`),
          fetch('Data/Tilesets.json')
        ]);
        
        const mData = await mapRes.json();
        const allTilesets = await tsRes.json();
        
        let table = parseRMXPTable(mData.data);
        if (table && table.isFlat) {
          table.width = mData.width;
          table.height = mData.height;
          table.layers = Math.floor(table.tileIds.length / (mData.width * mData.height));
        }
        
        const meta = allTilesets.find(t => t && t.id === mData.tileset_id);
        
        setMapData({ ...mData, table });
        
        // Load Tileset Image
        if (meta) {
          const tilesetPath = encodeURI(getAssetPath(`Graphics/tilesets/${meta.tileset_name.toLowerCase()}.png`));
          tilesetImg.current.onerror = () => console.error("FAILED to load tileset:", tilesetPath);
          tilesetImg.current.onload = () => console.log("Tileset loaded successfully:", meta.tileset_name);
          tilesetImg.current.src = tilesetPath;
          
          // Load Autotiles
          const atImages = [];
          if (meta.autotile_names) {
            meta.autotile_names.forEach((name, i) => {
              if (name && name !== '') {
                const img = new Image();
                const atPath = encodeURI(getAssetPath(`Graphics/autotiles/${name.toLowerCase()}.png`));
                img.onerror = () => console.error("FAILED to load autotile:", atPath);
                img.src = atPath;
                atImages[i] = img;
              }
            });
          }
          autotileImages.current = atImages;
        }
        
        // NEW: Process passages and priorities once
        if (meta && meta.passages) meta.processedPassages = parseRMXPPassages(meta.passages);
        if (meta && meta.priorities) meta.processedPriorities = parseRMXPPriorities(meta.priorities);
        
        setTilesetMeta(meta);

        // NEW: Load Player Image
        const avatarNum = String(user?.avatar || 0).padStart(3, '0');
        playerImg.current.src = getAssetPath(`Graphics/characters/trchar${avatarNum}.png`);

        // Initialize Player Pos and Safety Nudge
        const p = playerState.current;
        if (playerPos && playerPos.x === 0 && playerPos.y === 0) {
          p.x = 13; p.y = 13; p.targetX = 13; p.targetY = 13;
        } else if (playerPos) {
          p.x = playerPos.x; p.y = playerPos.y;
          p.targetX = playerPos.x; p.targetY = playerPos.y;
        }
        
        // Final safety check: if we are in a collision, move to safe spot
        // (Wait for tilesetMeta to be set to check actual collisions)
        p.hasNudged = true;

        setIsLoading(false);
      } catch (e) {
        console.error("Error loading map assets:", e);
      }
    };
    loadMap();
  }, [mapId, user?.avatar]);

  // NPC Image Cache y Proximidad
  const [nearNpc, setNearNpc] = useState(null);

  useEffect(() => {
    npcs.forEach(npc => {
      if (npc.sprite && !npcImgCache.current[npc.sprite]) {
        const img = new Image();
        img.src = getAssetPath(`Graphics/characters/${npc.sprite.toLowerCase()}.png`);
        npcImgCache.current[npc.sprite] = img;
      }
    });
  }, [npcs]);

  // Sync initial location ONLY on map change or MAJOR manual reset (teleport > 1.1 tiles)
  useEffect(() => {
    const p = playerState.current;
    const dist = Math.sqrt(Math.pow(p.x - playerPos.x, 2) + Math.pow(p.y - playerPos.y, 2));
    
    if (mapId !== p.lastMapId || dist > 1.1) {
      console.log("COORD SYNC: Accepted from Props", playerPos);
      p.x = playerPos.x;
      p.y = playerPos.y;
      p.targetX = playerPos.x;
      p.targetY = playerPos.y;
      p.lastMapId = mapId;
      p.hasNudged = true;
    }
  }, [mapId, playerPos]);

  const checkCollision = (nx, ny) => {
    const p = playerState.current;
    const { width, height, layers, tileIds } = mapData.table;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true;

    // NPC collision
    if (npcs.some(n => n.posicion.x === nx && n.posicion.y === ny)) return true;

    // Building/Event Exception for entry (doors)
    if (buildings.some(b => b.x === nx && b.y === ny)) return false;
    if (checkWarpEvents(nx, ny)) return false;

    if (!tilesetMeta || !tilesetMeta.processedPassages) return false;
    const passages = tilesetMeta.processedPassages;

    const moveDir = p.facing;
    const opDir = { down: 'up', up: 'down', left: 'right', right: 'left' }[moveDir];

    // RMXP Collision Logic: Check layers from TOP to BOTTOM.
    // Layer 2 is top, Layer 1 middle, Layer 0 ground.
    // If a tile is non-zero (not transparent), its passage flag determines collision.
    // If it's zero, we check the layer below.
    for (let z = layers - 1; z >= 0; z--) {
      const idx = (z * width * height) + (ny * width) + nx;
      const tid = tileIds[idx];
      
      if (tid !== 0) {
        // Tile found, check if it blocks entering from opDir
        if (!checkPassage(passages, tid, opDir)) return true;
        
        // Also check if we can exit the current tile in moveDir
        const curIdx = (z * width * height) + (p.y * width) + p.x;
        const curTid = tileIds[curIdx];
        if (curTid !== 0 && !checkPassage(passages, curTid, moveDir)) return true;
        
        // If we found a base tile (Priority 0) and we can pass it, we stop searching
        const priorities = tilesetMeta.processedPriorities || [];
        const pIdx = tid < 384 ? (Math.floor(tid / 48) - 1) : tid;
        if (priorities[pIdx] === 0) break; 
      }
    }
    return false;
  };

  // Detect warp points (doors) from JSON events (Code 201 = Transfer Player)
  const checkWarpEvents = (playerX, playerY) => {
    if (!mapData || !mapData.events) return null;
    
    // Find event at current coordinates
    const event = Object.values(mapData.events).find(ev => 
      ev.x === playerX && ev.y === playerY
    );
    if (!event) return null;
    
    // Si este evento coincide con un edificio manual, dejamos que el sistema de edificios lo maneje
    // para evitar conflictos entre checkWarpEvents y onEvent('gym_entry')
    if (buildings.some(b => b.x === playerX && b.y === playerY)) return null;

    const pages = event.pages || [];
    for (const page of pages) {
      const cmds = page.list || [];
      const transferCmd = cmds.find(c => c.code === 201);
      if (transferCmd) {
        const params = transferCmd.parameters || [];
        return {
          targetMapId: `Map${String(params[1]).padStart(3, '0')}`,
          targetX: params[2],
          targetY: params[3]
        };
      }
    }
    return null;
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

      const clickedBuilding = buildings.find(b => tx === b.x && ty === b.y);
      if (clickedBuilding) {
        console.log('Interacting with structure:', clickedBuilding.type, 'at', tx, ty);
        if (clickedBuilding.type === 'home') {
          onEvent({ type: 'home_entry', building: clickedBuilding });
        } else if (clickedBuilding.type === 'gym') {
          onEvent({ 
            type: 'gym_entry', 
            gymId: clickedBuilding.gymId, 
            building: clickedBuilding,
            targetMapId: clickedBuilding.targetMapId,
            spawn: clickedBuilding.spawn
          });
        } else {
          // Generic interaction for computer, etc.
          onEvent({ type: clickedBuilding.type, building: clickedBuilding });
        }
      }
    }
  }, [aPressed, npcs, buildings, onEvent]);

  useEffect(() => {
    if (!mapData || isLoading) return;
    let lastTime = performance.now();
    let frameId;

    const frameCounter = { val: 0 };
    const loop = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const p = playerState.current;

      frameCounter.val++;
      // Performance: Removed console.log here to prevent stutters

      if (p.isMoving) {
        p.progress += dt / 160; // Snappier movement (160ms per tile)
        if (p.progress >= 1) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false; p.progress = 0; p.walkFrame = 0;
          setPlayerPos({ x: p.x, y: p.y });
          
          // 1. CHEQUEAR EDIFICIOS (Entrada automática al pisar la puerta)
          const steppingOnBuilding = buildings.find(b => p.x === b.x && p.y === b.y);
          if (steppingOnBuilding) {
            console.log('Stepped into structure:', steppingOnBuilding.nombre);
            if (steppingOnBuilding.type === 'home') {
              onEvent({ type: 'home_entry', building: steppingOnBuilding });
            } else {
              onEvent({ 
                type: 'gym_entry', 
                gymId: steppingOnBuilding.gymId, 
                building: steppingOnBuilding,
                targetMapId: steppingOnBuilding.targetMapId,
                spawn: steppingOnBuilding.spawn
              });
            }
            return;
          }

          // 2. CHEQUEAR WARPS DINÁMICOS (Puertas en el JSON)
          const warp = checkWarpEvents(p.x, p.y);
          if (warp) {
             onEvent({
               type: 'transfer',
               targetMap: warp.targetMapId,
               spawn: { x: warp.targetX, y: warp.targetY }
             });
             return;
          }

          // 3. CHEQUEAR BORDES DE MAPA
          const edge = (p.x <= 0) ? 'left' : (p.x >= mapData.width - 1) ? 'right' : (p.y <= 0) ? 'up' : (p.y >= mapData.height - 1) ? 'down' : null;
          if (edge) {
            onEvent({ type: 'transfer', side: edge });
          }
          
          // 3. ENCUENTROS SALVAJES (Solo en Ruta 29 por ahora)
          if (mapId === 'Map008' && Math.random() < 0.05) {
             const now = Date.now();
             // 2 second cooldown after returning to map
             if (now - lastEncounterRef.current > 2000) {
               lastEncounterRef.current = now;
               onEvent({ type: 'encounter' });
             }
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

      // Update Fade Animation
      if (isLoading) {
        fadeAlpha.current = Math.min(1, fadeAlpha.current + dt / 400);
      } else {
        fadeAlpha.current = Math.max(0, fadeAlpha.current - dt / 400);
      }

      draw();
      frameId = requestAnimationFrame(loop);
    };

    const draw = () => {
      if (!canvasRef.current || !mapData || !mapData.table || !tilesetMeta) return;
      const ctx = canvasRef.current.getContext('2d');
      const { width, height, layers, tileIds } = mapData.table;
      
      const cw = canvasRef.current.width, ch = canvasRef.current.height;
      const p = playerState.current;
      const vX = p.x + (p.targetX - p.x) * p.progress;
      const vY = p.y + (p.targetY - p.y) * p.progress;
      
      let camX = Math.floor(vX * TILE_SIZE - (cw / 2) + (TILE_SIZE / 2));
      let camY = Math.floor(vY * TILE_SIZE - (ch / 2) + (TILE_SIZE / 2));
      const maxCamX = Math.max(0, width * TILE_SIZE - cw);
      const maxCamY = Math.max(0, height * TILE_SIZE - ch);
      camX = Math.max(0, Math.min(camX, maxCamX));
      camY = Math.max(0, Math.min(camY, maxCamY));

      // Sync World Overlay (for children like Pokéballs)
      if (worldOverlayRef.current) {
        worldOverlayRef.current.style.transform = `translate(${-Math.floor(camX)}px, ${-Math.floor(camY)}px)`;
      }

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      // Group Layers by Priority
      // Priority 0: Ground (Below player)
      // Priority > 0: Overlay (Above player)
      const renderTile = (tid, dx, dy) => {
        if (tid <= 0) return;
        
        // Autotiles (48-383)
        if (tid < 384) {
          const atIdx = Math.floor(tid / 48) - 1;
          const img = autotileImages.current[atIdx];
          if (img) {
            // Simplified autotile drawing (frame 0)
            safeDrawImage(ctx, img, 0, 0, 32, 32, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
          }
          return;
        }

        // Standard Tiles (384+)
        const index = tid - 384;
        const ts = tilesetImg.current;
        if (ts) {
          safeDrawImage(ctx, ts, (index % 8) * TILE_SIZE, Math.floor(index / 8) * TILE_SIZE, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
        }
      };

      // 1. Draw Priority 0 Layers
      if (tilesetMeta) {
        const priorities = tilesetMeta.processedPriorities || [];
        for (let z = 0; z < layers; z++) {
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const tid = tileIds[(z * width * height) + (y * width) + x];
              if (tid === 0) continue;

              const pIdx = tid < 384 ? (Math.floor(tid / 48) - 1) : tid;
              const pVal = priorities[pIdx] || 0;
              
              if (pVal === 0) {
                const dx = x * TILE_SIZE - camX, dy = y * TILE_SIZE - camY;
                if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
                  renderTile(tid, dx, dy);
                }
              }
            }
          }
        }
      }

      npcs.forEach(npc => {
        const img = npcImgCache.current[npc.sprite];
        if (img) {
          const dx = npc.posicion.x * TILE_SIZE - camX, dy = npc.posicion.y * TILE_SIZE - camY;
          safeDrawImage(ctx, img, 0, (npc.direccion || 0) * 40, 32, 40, Math.floor(dx), Math.floor(dy - 8), 32, 40);
        }
      });

      const px = vX * TILE_SIZE - camX, py = vY * TILE_SIZE - camY;
      const row = p.facing === 'down' ? 0 : p.facing === 'left' ? 1 : p.facing === 'right' ? 2 : 3;
      if (playerImg.current) {
        safeDrawImage(ctx, playerImg.current, p.walkFrame * 32, row * 40, 32, 40, Math.floor(px), Math.floor(py - 8), 32, 40);
      }

      // 2. Draw Priority > 0 (Overlays)
      if (tilesetMeta) {
        const priorities = tilesetMeta.processedPriorities || [];
        for (let z = 0; z < layers; z++) {
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const tid = tileIds[(z * width * height) + (y * width) + x];
              if (tid === 0) continue;

              const pIdx = tid < 384 ? (Math.floor(tid / 48) - 1) : tid;
              const pVal = priorities[pIdx] || 0;

              if (pVal > 0) {
                const dx = x * TILE_SIZE - camX, dy = y * TILE_SIZE - camY;
                if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
                  renderTile(tid, dx, dy);
                }
              }
            }
          }
        }
      }

      // Atmosphere Nite
      if (getTimeOfDay() === 'nite') {
        ctx.fillStyle = 'rgba(26, 26, 138, 0.25)';
        ctx.fillRect(0, 0, cw, ch);
      }

      // Building Labels (Gyms & Home) - ONLY use manual buildings from WORLD_DATA
      if (buildings && buildings.length > 0) {
        buildings.forEach(b => {
          // Usar las coordenadas personalizadas de label si existen, si no, usar la puerta
          const labelGridX = b.label ? b.label.x : b.x;
          const labelGridY = b.label ? b.label.y : (b.y - 1); // 1 tile arriba por defecto

          // Calcular posición en pantalla
          const sx = labelGridX * TILE_SIZE - camX;
          const sy = labelGridY * TILE_SIZE - camY;

          // Renderizar solo si está en pantalla
          if (sx > -TILE_SIZE * 3 && sx < cw + TILE_SIZE * 3 && sy > -TILE_SIZE * 3 && sy < ch + TILE_SIZE * 3) {
            ctx.save();
            const done = b.gymId ? gimnasiosHoy?.find(g => g.gym_id === b.gymId)?.completado : false;
            
            // La etiqueta se dibuja exactamente en la coordenada calculada
            // Quitamos el offset flotante y los decimales para máxima precisión en la cuadrícula
            const labelY = sy;
            const labelW = TILE_SIZE * 2.5;
            const labelX = sx - (labelW / 2) + 16;
            
            // Sign Shadow (Offset relative to animated label)
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(Math.floor(labelX + 2), Math.floor(labelY + 2), labelW, 16);
            
            // Sign Base (Johto style)
            const baseColor = b.type === 'home' ? '#A83030' : (done ? '#2D8A2D' : '#1A1A8A');
            ctx.fillStyle = baseColor;
            ctx.fillRect(Math.floor(labelX), Math.floor(labelY), labelW, 16);
            
            // Sign Border
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.strokeRect(Math.floor(labelX + 1), Math.floor(labelY + 1), labelW - 2, 14);
            
            // Text Rendering
            ctx.fillStyle = '#fff'; 
            ctx.font = '8px "Press Start 2P", monospace'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text Shadow/Stroke for extra clarity
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            const textX = Math.floor(labelX + labelW/2);
            const textY = Math.floor(labelY + 9);
            const cleanName = (b.nombre || '???').toUpperCase();
            ctx.strokeText(cleanName, textX, textY);
            ctx.fillText(cleanName, textX, textY);
            
            if (done) { 
              const bounce = Math.sin(Date.now() / 150) * 3;
              ctx.font = '14px serif'; 
              ctx.fillText('🏅', Math.floor(labelX + labelW/2), Math.floor(labelY - 12 + bounce)); 
            }
            ctx.restore();
          }
        });
      }

      // Final Fade Overlay
      if (fadeAlpha.current > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha.current})`;
        ctx.fillRect(0, 0, cw, ch);
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [mapData, isLoading, gimnasiosHoy, npcs, buildings, direction, onEvent]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000', overflow: 'hidden' }}>
      <canvas ref={canvasRef} width={400} height={400} style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} />
      
      {/* World Overlay for children elements (anchored to grid) */}
      <div 
        ref={worldOverlayRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', transformOrigin: 'top left' }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>

      {isLoading && <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>Explorando...</div>}
    </div>
  );
};

export default CityMap;
