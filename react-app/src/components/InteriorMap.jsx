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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const tilesetImg = useRef(new Image());
  const playerImg = useRef(new Image());
  const npcImgs = useRef({});

  // Sync Initial Pos
  useEffect(() => {
    const p = playerState.current;
    if (currentMapId !== p.lastName) {
      console.log(`📍 Map change: ${p.lastName} -> ${currentMapId}`);
      p.x = initialPos?.x ?? 0;
      p.y = initialPos?.y ?? 0;
      p.targetX = initialPos?.x ?? 0;
      p.targetY = initialPos?.y ?? 0;
      p.progress = 0;
      p.isMoving = false;
      p.lastName = currentMapId;
    }
  }, [currentMapId, initialPos]);

  // Asset Loader
  useEffect(() => {
    let isMounted = true;
    const BASE = import.meta.env.BASE_URL || '/';

    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`❌ Failed to load image: ${url}`);
          resolve(null);
        };
        img.src = url;
      });
    };

    const loadAll = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fix spaces in URL for tileset
      const fixedTilesetUrl = tileset ? tileset.replace(/ /g, '%20') : null;
      
      if (!fixedTilesetUrl) {
        setError(`No tileset defined for map: ${currentMapId}`);
        setIsLoading(false);
        return;
      }

      const tsPromise = loadImage(fixedTilesetUrl);
      const playerUrl = `${BASE}Graphics/characters/trchar${String(user?.avatar || 0).padStart(3, '0')}.png`;
      const pPromise = loadImage(playerUrl);
      const npcPromises = npcs.map(npc => {
        const url = npc.sprite.startsWith('http') ? npc.sprite : `${BASE}Graphics/characters/${npc.sprite}.png`.replace(/ /g, '%20');
        return loadImage(url);
      });
      
      const [tsImg, pImg, ...nImgs] = await Promise.all([tsPromise, pPromise, ...npcPromises]);
      
      if (!isMounted) return;
      
      if (!tsImg) {
        setError(`Error cargando el tileset: ${tileset}`);
      } else {
        tilesetImg.current = tsImg;
      }
      
      if (pImg) playerImg.current = pImg;
      const npcMap = {};
      npcs.forEach((npc, idx) => { if (nImgs[idx]) npcMap[npc.id] = nImgs[idx]; });
      npcImgs.current = npcMap;
      
      setIsLoading(false);
    };

    loadAll();
    return () => { isMounted = false; };
  }, [tileset, user?.avatar, npcs, currentMapId]);

  // Main Loop
  useEffect(() => {
    if (isLoading || error || !canvasRef.current || !map) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frameId;

    const drawLayer = (layerData) => {
      if (!layerData || !Array.isArray(layerData)) return;
      const ts = tilesetImg.current;
      if (!ts || ts.naturalWidth === 0) return;
      
      const cols = Math.floor(ts.naturalWidth / TILE_SIZE);
      if (cols === 0) return;

      for (let y = 0; y < layerData.length; y++) {
        if (!layerData[y]) continue;
        for (let x = 0; x < layerData[y].length; x++) {
          const val = layerData[y][x];
          if (val === -1 || val === 'B' || val === null || typeof val === 'string') continue;
          
          const sx = (val % cols) * TILE_SIZE;
          const sy = Math.floor(val / cols) * TILE_SIZE;
          safeDrawImage(ctx, ts, sx, sy, TILE_SIZE, TILE_SIZE, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    };

    const loop = (now) => {
      try {
        const dt = now - lastTimeRef.current;
        lastTimeRef.current = now;
        const p = playerState.current;

        const currentLayers = map.layers || { base: map, deco: [], overlay: [] };
        const baseMap = currentLayers.base;
        if (!baseMap || !baseMap[0]) return;

        const mapW = baseMap[0].length;
        const mapH = baseMap.length;

        // 1. Movement logic
        if (p.isMoving) {
          p.progress += dt / 160;
          if (p.progress >= 1) {
            p.x = p.targetX; p.y = p.targetY;
            p.isMoving = false; p.progress = 0; p.walkFrame = 0;

            const currentTileId = baseMap[p.y]?.[p.x];
            const tileProps = TILE_PROPERTIES[currentMapId]?.[currentTileId] || {};
            
            if (tileProps.type === 'exit') onExit?.(); 
            if (tileProps.type === 'stair') {
              onEvent?.({ 
                type: 'stair', 
                x: p.x, 
                y: p.y,
                target: tileProps.target
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

          if (ny >= 0 && ny < mapH && nx >= 0 && nx < mapW) {
            const baseId = baseMap[ny]?.[nx];
            const decoId = currentLayers.deco?.[ny]?.[nx];
            const isBlockedByNpc = npcs.some(n => Math.round(n.x) === nx && Math.round(n.y) === ny);

            const tileProps = TILE_PROPERTIES[currentMapId]?.[baseId] || {};
            const isWalkableTile = tileProps.walkable === true;
            const isDecoEmpty = (decoId === -1 || decoId === undefined || decoId === null);
            
            if (isWalkableTile && isDecoEmpty && !isBlockedByNpc) {
              p.targetX = nx; p.targetY = ny; p.isMoving = true;
            }
          }
        }

        // 2. Render Sequence
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawLayer(currentLayers.base);
        drawLayer(currentLayers.deco);
        npcs.forEach(npc => {
          const img = npcImgs.current[npc.id];
          if (img?.complete) safeDrawImage(ctx, img, 0, 0, 32, 40, npc.x * TILE_SIZE, npc.y * TILE_SIZE - 8, 32, 40);
        });
        if (playerImg.current?.naturalWidth > 0) {
          const visualX = p.x + (p.targetX - p.x) * p.progress;
          const visualY = p.y + (p.targetY - p.y) * p.progress;
          const row = p.facing === 'down' ? 0 : p.facing === 'left' ? 1 : p.facing === 'right' ? 2 : 3;
          const frameW = 32, frameH = playerImg.current.naturalHeight / 4;
          const yOffset = frameH - 32;
          safeDrawImage(ctx, playerImg.current, p.walkFrame * frameW, row * frameH, frameW, frameH, visualX * TILE_SIZE, visualY * TILE_SIZE - yOffset, frameW, frameH);
        }
        drawLayer(currentLayers.overlay);
        frameId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Loop Error:", err);
        setError("Error en el ciclo de renderizado");
      }
    };

    const lastTimeRef = { current: performance.now() };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isLoading, error, map, npcs, direction, onExit, onEvent, currentMapId]);

  // Handle Interaction
  useEffect(() => {
    if (aPressed && map) {
      const p = playerState.current;
      let tx = p.x, ty = p.y;
      if (p.facing === 'up') ty--; else if (p.facing === 'down') ty++; else if (p.facing === 'left') tx--; else if (p.facing === 'right') tx++;
      const currentLayers = map.layers || { base: map, deco: [], overlay: [] };
      const baseMap = currentLayers.base;
      if (!baseMap) return;
      const mapW = baseMap[0]?.length || 20, mapH = baseMap.length || 15;
      const npc = npcs.find(n => Math.round(n.x) === tx && Math.round(n.y) === ty);
      if (npc) { onEvent?.({ type: 'npc_talk', npc }); return; }
      if (ty >= 0 && ty < mapH && tx >= 0 && tx < mapW) {
        const oTile = currentLayers.overlay?.[ty]?.[tx];
        const dTile = currentLayers.deco?.[ty]?.[tx];
        const bTile = currentLayers.base?.[ty]?.[tx];
        let targetTile = -1;
        if (oTile !== undefined && oTile !== -1) targetTile = oTile;
        else if (dTile !== undefined && dTile !== -1) targetTile = dTile;
        else if (bTile !== undefined && bTile !== -1) targetTile = bTile;
        if (targetTile !== -1) { onEvent?.({ type: 'object_interact', tileType: targetTile }); }
      }
    }
  }, [aPressed, npcs, map, onEvent]);

  if (error) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#222', color: '#ff4444', fontFamily: '"Press Start 2P"', fontSize: 10, textAlign: 'center', padding: 20 }}>
        <p>⚠️ ERROR DE CARGA</p>
        <p style={{ fontSize: 8, marginTop: 10 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '8px 16px', background: '#444', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: '"Press Start 2P"', fontSize: 8 }}>REINTENTAR</button>
      </div>
    );
  }

  const baseMap = map?.layers?.base || map;
  const mapW = baseMap?.[0]?.length || 20, mapH = baseMap?.length || 15;

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} width={mapW * TILE_SIZE} height={mapH * TILE_SIZE} style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      {isLoading && <div style={{ position: 'absolute', color: '#fff', fontSize: 14, fontFamily: '"Press Start 2P"' }}>CARGANDO...</div>}
    </div>
  );
};

export default InteriorMap;
