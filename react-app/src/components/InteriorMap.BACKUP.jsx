import React, { useState, useEffect, useRef } from 'react';
import { safeDrawImage } from '../utils/gfxUtils';
import { useGame } from '../context/GameContext';
import { TILE_PROPERTIES } from '../data/interiorData';

const TILE_SIZE = 32;

const InteriorMap = ({ 
  map, 
  tileset, 
  tileConfig, 
  initialPos, 
  facing: initialFacing = 'down',
  npcs = [], 
  onEvent, 
  onExit,
  direction, 
  aPressed,
  currentMapId
}) => {
  const { user } = useGame();
  const canvasRef = useRef(null);
  
  // Internal State
  const playerState = useRef({
    x: initialPos?.x ?? 0,
    y: initialPos?.y ?? 0,
    targetX: initialPos?.x ?? 0,
    targetY: initialPos?.y ?? 0,
    progress: 0,
    isMoving: false,
    facing: initialFacing,
    walkFrame: 0,
    lastName: null
  });

  useEffect(() => {
    console.log("🚀 HABITMON INTERIOR ENGINE v3.0 ACTIVE - High Fidelity Matrix Mode");
  }, []);

  const lastTimeRef = useRef(performance.now());
  const [isLoading, setIsLoading] = useState(true);
  
  const tilesetImg = useRef(new Image());
  const playerImg = useRef(new Image());
  const npcImgs = useRef({});

  // Sync Initial Pos if floor changes
  useEffect(() => {
    const p = playerState.current;
    if (currentMapId !== p.lastName) {
      p.x = initialPos?.x ?? 0;
      p.y = initialPos?.y ?? 0;
      p.targetX = initialPos?.x ?? 0;
      p.targetY = initialPos?.y ?? 0;
      p.progress = 0;
      p.isMoving = false;
      p.lastName = currentMapId;
    }
  }, [currentMapId, initialPos]);

  // Final Robust Asset Loader
  useEffect(() => {
    let isMounted = true;
    const BASE = import.meta.env.BASE_URL || '/';

    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Fallback so we don't block
        img.src = url;
      });
    };

    const loadAll = async () => {
      setIsLoading(true);
      
      const tsPromise = loadImage(tileset);
      const playerUrl = `${BASE}Graphics/characters/trchar${String(user?.avatar || 0).padStart(3, '0')}.png`;
      const pPromise = loadImage(playerUrl);
      
      const npcPromises = npcs.map(npc => {
        const url = npc.sprite.startsWith('http') ? npc.sprite : `${BASE}Graphics/characters/${npc.sprite}.png`;
        return loadImage(url);
      });
      
      const [tsImg, pImg, ...nImgs] = await Promise.all([tsPromise, pPromise, ...npcPromises]);
      
      if (!isMounted) return;

      if (tsImg) tilesetImg.current = tsImg;
      if (pImg) playerImg.current = pImg;
      
      // Map NPC images back to their IDs
      const npcMap = {};
      npcs.forEach((npc, idx) => {
        if (nImgs[idx]) npcMap[npc.id] = nImgs[idx];
      });
      npcImgs.current = npcMap;

      setIsLoading(false);
    };

    loadAll();
    return () => { isMounted = false; };
  }, [tileset, user?.avatar, npcs]);

  // Main Loop
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frameId;

    // Helper to draw a specific layer
    const drawLayer = (layerData) => {
      if (!layerData || !Array.isArray(layerData)) return;
      // console.log("Drawing layer...", layerData.length, "x", layerData[0]?.length);
      for (let y = 0; y < layerData.length; y++) {
        for (let x = 0; x < layerData[y].length; x++) {
          const val = layerData[y][x];
          if (val === -1 || val === 'B' || val === null) continue;

          let tid = val;
          // ... (tid logic)
          const ts = tilesetImg.current;
          if (!ts || ts.naturalWidth === 0) continue;
          
          let id = tid;
          const cols = Math.floor(ts.naturalWidth / TILE_SIZE);
          const sx = (id % cols) * TILE_SIZE;
          const sy = Math.floor(id / cols) * TILE_SIZE;
          
          // Debugging specific tile draw
          if (x === 9 && y === 10) {
            // console.log(`Drawing tile ${id} at 9,10. sx:${sx} sy:${sy}`);
          }

          safeDrawImage(ctx, ts, sx, sy, TILE_SIZE, TILE_SIZE, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    };

    const loop = (now) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const p = playerState.current;

      // 1. Movement logic
      if (p.isMoving) {
        p.progress += dt / 160;
        if (p.progress >= 1) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false; p.progress = 0; p.walkFrame = 0;

          const currentLayers = map.layers || { base: map };
          const baseMap = currentLayers.base;
          const currentTileId = baseMap[p.y]?.[p.x];
          
          // Lógica de Eventos v8.8 (Hardcoded IDs for User Matrix)
          const isExit = (currentTileId === 20);
          const isStair = (currentTileId === 34);
          
          if (isExit) onExit?.(); 
          if (isStair) {
            onEvent?.({ 
              type: 'stair', 
              x: p.x, 
              y: p.y,
              target: currentMapId === 'house_1' ? 'house_2' : 'house_1'
            });
          }
        } else {
          p.walkFrame = Math.floor(p.progress * 4) % 4;
        }
      } else if (direction) {
        p.facing = direction;
        let nx = p.x, ny = p.y;
        if (direction === 'up') ny--;
        else if (direction === 'down') ny++;
        else if (direction === 'left') nx--;
        else if (direction === 'right') nx++;

        if (ny >= 0 && ny < (map.layers?.base?.length || map.length) && nx >= 0 && nx < (map.layers?.base?.[0]?.length || map[0].length)) {
          const currentLayers = map.layers || { base: map, deco: map, overlay: map };
          const baseId = currentLayers.base?.[ny]?.[nx];
          const decoId = currentLayers.deco?.[ny]?.[nx];
          const overlayId = currentLayers.overlay?.[ny]?.[nx];
          
          const isBlockedByNpc = npcs.some(n => Math.round(n.x) === nx && Math.round(n.y) === ny);
          
          // Lógica de Movimiento Simplificada 1:1 con la Matriz del Usuario
          const baseId = currentLayers.base?.[ny]?.[nx];
          const decoId = currentLayers.deco?.[ny]?.[nx];
          
          // REGLAS DE ORO:
          // 1. Solo se puede caminar sobre Suelo (19), Salida (20) o Escalera (34)
          // 2. Si el tile es -1 o cualquier otro ID de mueble, BLOQUEAR.
          const isWalkableTile = (baseId === 19 || baseId === 20 || baseId === 34);
          const isDecoEmpty = (decoId === -1 || decoId === undefined);
          
          const isBlockedByNpc = npcs.some(n => Math.round(n.x) === nx && Math.round(n.y) === ny);
          
          if (isWalkableTile && isDecoEmpty && !isBlockedByNpc) {
            p.targetX = nx; p.targetY = ny; p.isMoving = true;
          }
        }
      }

      // 2. Render Sequence
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const layers = map.layers || { base: map };

      // Render Order: Base -> Deco -> [Player] -> Overlay
      drawLayer(layers.base);
      drawLayer(layers.deco);

      // Draw NPCs
      npcs.forEach(npc => {
        const img = npcImgs.current[npc.id];
        if (img?.complete) {
          safeDrawImage(ctx, img, 0, 0, 32, 40, npc.x * TILE_SIZE, npc.y * TILE_SIZE - 8, 32, 40);
        }
      });

      // Draw Player
      if (playerImg.current?.naturalWidth > 0) {
        const visualX = p.x + (p.targetX - p.x) * p.progress;
        const visualY = p.y + (p.targetY - p.y) * p.progress;
        const row = p.facing === 'down' ? 0 : p.facing === 'left' ? 1 : p.facing === 'right' ? 2 : 3;
        const frameW = 32;
        const frameH = playerImg.current.naturalHeight / 4;
        const yOffset = frameH - 32;
        
        safeDrawImage(ctx, playerImg.current, 
          p.walkFrame * frameW, row * frameH, frameW, frameH, 
          visualX * TILE_SIZE, visualY * TILE_SIZE - yOffset, frameW, frameH
        );
      }

      // Draw Overlay Top
      drawLayer(layers.overlay);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isLoading, map, npcs, direction, onExit, onEvent]);

  // Handle Interaction
  useEffect(() => {
    if (aPressed) {
      const p = playerState.current;
      let tx = p.x, ty = p.y;
      if (p.facing === 'up') ty--;
      else if (p.facing === 'down') ty++;
      else if (p.facing === 'left') tx--;
      else if (p.facing === 'right') tx++;

      const currentLayers = map.layers || { deco: map };
      const decoMap = currentLayers.deco || currentLayers.base;
      const overlayMap = currentLayers.overlay;

      // Interaction with NPCs
      const npc = npcs.find(n => Math.round(n.x) === tx && Math.round(n.y) === ty);
      if (npc) {
        onEvent?.({ type: 'npc_talk', npc });
        return;
      }

      // Interaction with Map Elements (Check overlay first, then deco)
      if (decoMap && ty >= 0 && ty < decoMap.length && tx >= 0 && tx < decoMap[0].length) {
        const oTile = overlayMap ? overlayMap[ty][tx] : null;
        const dTile = decoMap[ty][tx];
        
        // Use overlay tile if it exists, otherwise use deco
        const targetTile = (oTile !== null && oTile !== -1 && oTile !== 'B') ? oTile : dTile;

        if (targetTile !== undefined && targetTile !== -1 && targetTile !== 'B' && targetTile !== 'W' && targetTile !== 'E' && targetTile !== 'S') { 
          onEvent?.({ type: 'object_interact', tileType: targetTile });
        }
      }
    }
  }, [aPressed, npcs, map, onEvent]);

  // Dynamic dimensions based on layers or old map format
  const baseMap = map.layers?.base || map;
  const mapW = baseMap[0]?.length || 20;
  const mapH = baseMap.length || 15;

  return (
    <div style={{ 
      position: 'relative', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#000', 
      width: '100%', 
      height: '100%' 
    }}>
      <canvas 
        ref={canvasRef} 
        width={mapW * TILE_SIZE} 
        height={mapH * TILE_SIZE} 
        style={{ 
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
      {isLoading && <div style={{ position: 'absolute', color: '#fff', fontSize: 14, fontFamily: '"Press Start 2P"' }}>CARGANDO...</div>}
    </div>
  );
};

export default InteriorMap;
