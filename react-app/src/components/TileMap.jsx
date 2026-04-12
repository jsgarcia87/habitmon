import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { WORLDS } from '../data/worlds';
import { BUILDING_TEMPLATES } from '../data/buildingTemplates';

const T = 32;        // Tile size px
const tsCols = 8;    // Tileset columns
const MOVE_DURATION = 180; // ms per tile move

const TILE_COLORS = {
  0: '#D4A855',  // suelo dorado
  1: '#404040',  // pared gris oscuro
  2: '#8B4513',  // camino marrón (alfombra)
  3: '#D4A855',  // trigger líder (invisible)
};

const GYM_INTERIOR_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1],
];

const TileMap = ({ 
  mapId = 'Map002', 
  worldId = null,
  startX = 13, 
  startY = 10, 
  startDir = 0, 
  timeOfDay = 'day', 
  starters = [], 
  onTrigger,
  direction = null,
  aPressed = false
}) => {
  const { user, progress } = useGame();
  const activeWorld = WORLDS.find(w => w.mapId === mapId || w.world_id === worldId);
  const canvasRef = useRef(null);
  const mapDataRef = useRef(null);
  const tilesetPassagesRef = useRef([]);
  const [ready, setReady] = useState(false);

  const tilesetImgRef = useRef(null);
  const playerImgRef = useRef(null);
  const npcImgsRef = useRef({});
  const starterImgsRef = useRef({});
  const autotileImgsRef = useRef({});
  
  // World Specific Refs
  const worldNpcsRef = useRef([]);
  const gymPositionRef = useRef(null);
  const gymTriggerFired = useRef(false);
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  const playerState = useRef({
    x: startX, y: startY,
    dir: startDir,   // 0=abajo 1=izq 2=der 3=arriba
    frame: 0,
    isMoving: false,
    moveProgress: 0,
    targetX: startX, targetY: startY,
    isInteracting: false
  });

  const keys = useRef({});
  const directionRef = useRef(direction);
  const aPressedRef = useRef(aPressed);

  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { aPressedRef.current = aPressed; }, [aPressed]);

  const [mapData, setMapData] = useState(null);

  // ─── GAME LOGIC (TOP LEVEL FOR SCOPE) ───────────────────────────────────────
  
  const isSolid = (nx, ny, dx, dy) => {
    const map = mapDataRef.current;
    if (!map) return true;
    
    if (map.isHardcoded) {
      if (nx < 0 || nx >= 20 || ny < 0 || ny >= 15) return true;
      const tile = GYM_INTERIOR_MAP[ny][nx];
      return tile === 1; // Wall is solid
    }

    if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return true;

    const p = playerState.current;

    // NPCs del mundo sólidos
    const worldNpc = worldNpcsRef.current.find(n => n.posicion.x === nx && n.posicion.y === ny);
    if (worldNpc) return true;

    // Colisión de Edificios Dinámicos (Templates)
    const checkBuildingSolid = (tx, ty, template, isGym = false) => {
      const dx = nx - tx;
      const dy = ny - ty;
      if (dx >= 0 && dx < template[0].length && dy >= 0 && dy < template.length) {
        // En GSC, la puerta suele estar en la fila inferior, centro
        // Simplificamos: Si es la fila inferior y centro, no es sólido (puerta)
        const isDoorRow = dy === template.length - 1;
        const isDoorCol = dx === Math.floor(template[0].length / 2);
        if (isDoorRow && isDoorCol) return false;
        return true;
      }
      return false;
    };

    if (activeWorld?.gym_position) {
      if (checkBuildingSolid(activeWorld.gym_position.x - 1, activeWorld.gym_position.y - 1, BUILDING_TEMPLATES.gym, true)) return true;
    }

    if (mapId === 'Map001') {
      if (checkBuildingSolid(5, 5, BUILDING_TEMPLATES.pokemon_center)) return true;
      if (checkBuildingSolid(20, 5, BUILDING_TEMPLATES.pokemart)) return true;
      if (checkBuildingSolid(5, 20, BUILDING_TEMPLATES.house)) return true;
      if (checkBuildingSolid(20, 20, BUILDING_TEMPLATES.house)) return true;
    }

    // Eventos del mapa sólidos
    const ev = Object.values(map.events || {})
      .find(e => e.x === nx && e.y === ny && !e.pages?.[0]?.through);
    if (ev) return true;

    const passages = tilesetPassagesRef.current;
    // If no passages data available, allow movement to avoid being stuck
    if (!passages || passages.length === 0) return false;

    for (let z = 0; z < 3; z++) {
      const currentTid = map.getTile(p.x, p.y, z);
      const targetTid = map.getTile(nx, ny, z);
      const currentPass = passages[currentTid] ?? 0;
      const targetPass = passages[targetTid] ?? 0;
      
      // If target is blocked in ALL directions (0x0F)
      if ((targetPass & 0x0F) === 0x0F) return true;
      
      // Directional blocking
      if (dy ===  1 && (targetPass & 0x08)) return true; // Blocked from above
      if (dy === -1 && (targetPass & 0x01)) return true; // Blocked from below
      if (dx === -1 && (targetPass & 0x04)) return true; // Blocked from right
      if (dx ===  1 && (targetPass & 0x02)) return true; // Blocked from left
    }
    return false;
  };

  const checkTrigger = (x, y) => {
    const map = mapDataRef.current;
    if (!map || !onTriggerRef.current) return;

    // Check for Gym entry
    if (activeWorld?.gym_position && x === activeWorld.gym_position.x && y === activeWorld.gym_position.y) {
       onTriggerRef.current('gym_enter', { gym_id: activeWorld?.gym_id, gym_nombre: activeWorld?.nombre });
       return;
    }

    if (map.isHardcoded) {
      if (y <= 1 && x === 9) {
        // Leader interaction
        const gymId = activeWorld?.gym_id || 'vestirse';
        onTriggerRef.current?.('npc_dialogue', { 
          npc: { nombre: 'LÍDER', tipo: 'boss' }, 
          messages: ["¿Estás listo para el desafío?"] 
        });
      }
      if (y >= 14) {
        onTriggerRef.current?.('transfer', { mapId: 'city' });
      }
      return;
    }

    // Check for other building entries (Map001)
    if (mapId === 'Map001') {
      if (x === 7 && y === 8) { // Puerta PC
        onTriggerRef.current('transfer', { mapId: 'Map006', x: 8, y: 12, dir: 3 });
        return;
      }
      if (x === 22 && y === 8) { // Puerta Mart
        onTriggerRef.current('transfer', { mapId: 'Map007', x: 8, y: 12, dir: 3 });
        return;
      }
    }

    const ev = Object.values(map.events || {}).find(e => e.x === x && e.y === y);
    if (ev) {
      const transferCmd = ev.pages?.[0]?.list?.find(c => c.code === 201);
      if (transferCmd && transferCmd.parameters[0] === 0) {
        const [direct, targetMapId, tx, ty, tdir] = transferCmd.parameters;
        const finalDir = tdir > 0 ? (tdir/2)-1 : playerState.current.dir; 
        onTriggerRef.current('transfer', {
          mapId: `Map${String(targetMapId).padStart(3, '0')}`,
          x: tx, y: ty, dir: finalDir
        });
        return;
      }
      onTriggerRef.current?.('interact', { name: ev.name.toLowerCase().replace(/\s/g, '_'), ev }); 
      return; 
    }
  };

  // ─── CARGA DE DATOS DEL MAPA ──────────────────────────────────────────────

  useEffect(() => {
    setReady(false);
    mapDataRef.current = null;
    tilesetImgRef.current = null;

    if (String(mapId).startsWith('virtual_')) {
      if (mapId === 'virtual_pkmn_gym') {
        const data = { 
          width: 20, height: 15, 
          isHardcoded: true,
          getTile: (x, y) => GYM_INTERIOR_MAP[y]?.[x] ?? 1 
        };
        mapDataRef.current = data;
        setMapData(data);
        setReady(true);
        return;
      }

      const vKey = mapId.replace('virtual_', '');
      import('../data/interiors').then(({ INTERIORS }) => {
        const vMap = INTERIORS[vKey];
        if (vMap) {
          const width = vMap.width;
          const height = vMap.height;
          const getTile = (x, y, z) => {
            if (z > 0) return 0;
            if (x < 0 || x >= width || y < 0 || y >= height) return 0;
            return vMap.data[y][x];
          };
          const data = { ...vMap, getTile };
          mapDataRef.current = data;
          setMapData(data);
          worldNpcsRef.current = vMap.npcs || [];
        }
      });
    } else {
      const world = WORLDS.find(w => w.world_id === worldId || w.mapId === mapId);
      if (world) {
        worldNpcsRef.current = world.npcs || [];
        gymPositionRef.current = world.gym_position;
      }

      fetch(`Data/${mapId}.json`)
        .then(async r => {
          const text = await r.text();
          // Detect corrupted Ruby placeholder files
          if (text.startsWith('"#<RPG::Map')) {
            throw new Error(`Map ${mapId}.json contains Ruby object placeholder, not valid JSON.`);
          }
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error(`Failed to parse ${mapId}.json: ${e.message}`);
          }
        })
        .then(mapJson => {
          const rawTable = mapJson.data?.['@data'] || mapJson.data || [];
          const width = mapJson.width || 20;
          const height = mapJson.height || 20;
          const offset = 20;
          const getTile = (x, y, z) => {
            if (x < 0 || x >= width || y < 0 || y >= height) return 0;
            const idx = offset + (x + y * width + z * width * height) * 2;
            return (rawTable[idx] ?? 0) | ((rawTable[idx + 1] ?? 0) << 8);
          };
          const data = { ...mapJson, width, height, getTile };
          mapDataRef.current = data;
          setMapData(data);
        })
        .catch(err => {
          console.error("Critical: Error loading map JSON:", err);
          // Fallback to minimal valid map to avoid total freeze
          const fallbackData = {
            width: 20, height: 20,
            getTile: () => 0,
            tileset_id: 1,
            events: {}
          };
          mapDataRef.current = fallbackData;
          setMapData(fallbackData);
        });
    }
  }, [mapId, worldId]);

  // ─── CARGA DE IMÁGENES ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapData) return;

    let loaded = 0;
    const toLoad = 2; // Tileset + Player
    const checkReady = () => { loaded++; if (loaded >= toLoad) setReady(true); };

    // 1. Tileset
    const loadTileset = (tsName, tsId) => {
      const img = new Image();
      let finalName = tsName.toLowerCase();
      if (mapId === 'Map001') {
        if (timeOfDay === 'morning') finalName = 'gsc overworld johto morning';
        else if (timeOfDay === 'night') finalName = 'gsc overworld johto nite';
        else finalName = 'gsc overworld johto day';
      }
      img.src = `Graphics/tilesets/${encodeURIComponent(finalName)}.png`;
      img.onload = () => { tilesetImgRef.current = img; checkReady(); };
      img.onerror = () => {
        console.warn("Retrying original tileset name:", tsName);
        img.src = `Graphics/tilesets/${encodeURIComponent(tsName.toLowerCase())}.png`;
        img.onerror = () => { 
          console.error("Critical: Tileset failed to load.");
          checkReady(); // Continue anyway to avoid being stuck
        };
      };
    };

    if (String(mapId).startsWith('virtual_')) {
      loadTileset(mapData.tileset_name);
    } else {
      fetch('Data/Tilesets.json').then(r => r.json()).then(tsData => {
        const ts = tsData.find(t => t && t.id === mapData.tileset_id);
        if (ts) {
          loadTileset(ts.tileset_name);
          // Passages
          const rawP = ts.passages?.['@data'] || [];
          const passages = [];
          for (let i = 20; i < rawP.length; i += 2)
            passages.push((rawP[i] ?? 0) | ((rawP[i + 1] ?? 0) << 8));
          tilesetPassagesRef.current = passages;
        } else checkReady();
      });
    }

    // 2. Player
    const pImg = new Image();
    pImg.src = `Graphics/characters/trchar00${user?.avatar ?? 0}.png`;
    pImg.onload = () => { playerImgRef.current = pImg; checkReady(); };
    pImg.onerror = () => checkReady();

    // 3. NPCs (Lazy load)
    const loadNPC = (name) => {
      if (!name || npcImgsRef.current[name]) return;
      const img = new Image();
      img.src = `Graphics/characters/${encodeURIComponent(name.toLowerCase())}.png`;
      img.onload = () => { npcImgsRef.current[name] = img; };
    };
    worldNpcsRef.current?.forEach(n => loadNPC(n.sprite));
    Object.values(mapData.events || {}).forEach(ev => loadNPC(ev.pages?.[0]?.graphic?.character_name));

    // 4. Starters (Pokémon Icons)
    starters.forEach(st => {
      const img = new Image();
      // Usamos el icono o el sprite del Pokémon inicial
      const path = st.sprite?.startsWith('Graphics/') ? st.sprite : `Graphics/icons/${st.id}.png`;
      img.src = path;
      img.onload = () => { starterImgsRef.current[st.id] = img; };
    });

    // Cleanup listeners
    const onDown = (e) => {
      // Map keys to normalized strings
      const key = e.key;
      keys.current[key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','z',' ','Enter', 'Escape'].includes(key))
        e.preventDefault();
    };
    const onUp = (e) => { 
      keys.current[e.key] = false; 
    };

    window.addEventListener('keydown', onDown, { capture: true });
    window.addEventListener('keyup', onUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', onDown, { capture: true });
      window.removeEventListener('keyup', onUp, { capture: true });
    };
  }, [mapData, user, timeOfDay]);

  // Auto-unstuck
  useEffect(() => {
    if (!ready) return;
    setTimeout(() => {
      const p = playerState.current;
      if (isSolid(p.x, p.y, 0, 0)) {
        for(let d=1; d<5; d++) {
          if (!isSolid(p.x+d, p.y, 0, 0)) { p.x += d; p.targetX += d; break; }
          if (!isSolid(p.x-d, p.y, 0, 0)) { p.x -= d; p.targetX -= d; break; }
          if (!isSolid(p.x, p.y+d, 0, 0)) { p.y += d; p.targetY += d; break; }
          if (!isSolid(p.x, p.y-d, 0, 0)) { p.y -= d; p.targetY -= d; break; }
        }
      }
    }, 500);
  }, [ready]);

  // ── checkInteraction ───────────────────────────────────────────────────────
  const checkInteraction = () => {
    const p = playerState.current;
    const ix = p.x + (p.dir === 2 ? 1 : p.dir === 1 ? -1 : 0);
    const iy = p.y + (p.dir === 0 ? 1 : p.dir === 3 ? -1 : 0);
    
    const nearNpc = worldNpcsRef.current.find(npc => {
      const dx = Math.abs(p.x - npc.posicion.x);
      const dy = Math.abs(p.y - npc.posicion.y);
      return (dx <= 1 && dy === 0) || (dy <= 1 && dx === 0);
    });

    if (nearNpc) {
      onTriggerRef.current?.('npc_dialogue', { npc: nearNpc, messages: nearNpc.mensajes });
      return;
    }

    const map = mapDataRef.current;
    if (map) {
      const ev = Object.values(map.events || {}).find(e => e.x === ix && e.y === iy);
      if (ev) { onTriggerRef.current?.('interact', { name: ev.name.toLowerCase().replace(/\s/g, '_'), ev }); return; }
    }

    const starter = starters.find(s => s.tileX === ix && s.tileY === iy);
    if (starter) onTriggerRef.current?.(`starter_${starter.id}`);
  };

  // ─── RESIZE ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        canvas.width  = Math.floor(e.contentRect.width);
        canvas.height = Math.floor(e.contentRect.height);
      }
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // ─── GAME LOOP ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frameId;
    let lastTime = null;

    // ── update ─────────────────────────────────────────────────────────────────
    const update = (dt) => {
      const p = playerState.current;

      if (p.isMoving) {
        p.moveProgress += dt;
        if (p.moveProgress >= MOVE_DURATION) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false;
          p.moveProgress = 0;
          p.frame = 0;
          checkTrigger(p.x, p.y);
        } else {
          const t = p.moveProgress / MOVE_DURATION;
          p.frame = t < 0.5 ? 1 : 3;
        }
        return;
      }

      const dir = directionRef.current;
      let dx = 0, dy = 0;
      if      (keys.current['ArrowUp']    || keys.current['w'] || dir === 'up')    { dy = -1; p.dir = 3; }
      else if (keys.current['ArrowDown']  || keys.current['s'] || dir === 'down')  { dy =  1; p.dir = 0; }
      else if (keys.current['ArrowLeft']  || keys.current['a'] || dir === 'left')  { dx = -1; p.dir = 1; }
      else if (keys.current['ArrowRight'] || keys.current['d'] || dir === 'right') { dx =  1; p.dir = 2; }

      if (dx !== 0 || dy !== 0) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!isSolid(nx, ny, dx, dy)) {
          p.targetX = nx; p.targetY = ny;
          p.isMoving = true; p.moveProgress = 0;
        }
        p.frame = 1;
      } else {
        p.frame = 0;
      }

      const actionJustPressed = (keys.current['z'] || keys.current[' '] || keys.current['Enter'] || aPressedRef.current);
      if (actionJustPressed && !p.isInteracting) {
        p.isInteracting = true;
        checkInteraction();
        setTimeout(() => { p.isInteracting = false; }, 300);
      }
    };

    // ── draw ───────────────────────────────────────────────────────────────────
    const draw = () => {
      const map = mapDataRef.current;
      if (!map) return;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const p = playerState.current;
      const t = p.isMoving ? p.moveProgress / MOVE_DURATION : 0;
      const interpX = p.x + (p.targetX - p.x) * t;
      const interpY = p.y + (p.targetY - p.y) * t;

      const camX = interpX * T + T / 2 - W / 2;
      const camY = interpY * T + T / 2 - H / 2;
      const ox = -Math.round(camX);
      const oy = -Math.round(camY);

      // ── Helper: drawBuilding ──
      const drawBuilding = (tx, ty, buildingTemplate) => {
        if (!tilesetImgRef.current) return;
        const tsImg = tilesetImgRef.current;
        buildingTemplate.forEach((templateRow, dy) => {
          templateRow.forEach((tid, dx) => {
            if (tid === 0) return;
            const lid = tid - 384;
            const sx = (tx + dx) * T + ox;
            const sy = (ty + dy) * T + oy;
            if (sx > -T && sx < W && sy > -T && sy < H) {
              ctx.drawImage(tsImg, (lid % tsCols) * 32, Math.floor(lid / tsCols) * 32, 32, 32, sx, sy, T, T);
            }
          });
        });
      };

      const sX_v = Math.max(0, Math.floor(camX / T));
      const sY_v = Math.max(0, Math.floor(camY / T));
      const eX_v = Math.min(map.width  - 1, Math.ceil((camX + W) / T));
      const eY_v = Math.min(map.height - 1, Math.ceil((camY + H) / T));

      if (map.isHardcoded) {
        GYM_INTERIOR_MAP.forEach((row, y) => {
          row.forEach((tile, x) => {
            const sx = x * T + ox;
            const sy = y * T + oy;
            
            ctx.fillStyle = TILE_COLORS[tile] || TILE_COLORS[0];
            ctx.fillRect(Math.floor(sx), Math.floor(sy), T, T);
            
            if(tile === 0 || tile === 2 || tile === 3) {
              ctx.strokeStyle = 'rgba(0,0,0,0.1)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(Math.floor(sx), Math.floor(sy), T, T);
            }
          });
        });

        // Draw Player
        const pImg = playerImgRef.current;
        if (pImg) {
          const fw = pImg.width / 4, fh = pImg.height / 4;
          ctx.drawImage(pImg, p.frame * fw, p.dir * fh, fw, fh, Math.round(W / 2 - T / 2), Math.round(H / 2 - T / 2 - (fh - T)), T, fh * (T / fw));
        }
        return;
      }

      for (let z = 0; z < 3; z++) {
        for (let my = sY_v; my <= eY_v; my++) {
          for (let mx = sX_v; mx <= eX_v; mx++) {
            const tid = map.getTile(mx, my, z);
            if (tid === 0) continue;
            const dx = mx * T + ox, dy = my * T + oy;
            if (tid < 384) {
              const atId = Math.floor((tid - 48) / 48);
              const img = autotileImgsRef.current[atId];
              if (img) ctx.drawImage(img, 0, 0, 32, 32, dx, dy, T, T);
            } else {
              const lid = tid - 384;
              if (tilesetImgRef.current)
                ctx.drawImage(tilesetImgRef.current, (lid % tsCols) * 32, Math.floor(lid / tsCols) * 32, 32, 32, dx, dy, T, T);
            }
          }
        }

        if (z === 1) {
          // 1. Draw RPG Maker Events
          Object.values(map.events || {}).forEach(ev => {
            const g = ev.pages?.[0]?.graphic;
            if (!g?.character_name) return;
            const img = npcImgsRef.current[g.character_name];
            if (!img) return;
            const fw = img.width / 4, fh = img.height / 4;
            const row = g.direction === 2 ? 0 : g.direction === 4 ? 1 : g.direction === 6 ? 2 : 3;
            ctx.drawImage(img, (g.pattern ?? 0) * fw, row * fh, fw, fh, ev.x * T + ox, ev.y * T + oy - (fh - T), T, fh * (T / fw));
          });

          // 2. Draw World NPCs from worlds.js
          worldNpcsRef.current?.forEach(npc => {
            const sx = npc.posicion.x * T + ox;
            const sy = npc.posicion.y * T + oy;
            
            if (npc.sprite && npcImgsRef.current[npc.sprite]) {
              const img = npcImgsRef.current[npc.sprite];
              const fw = img.width / 4, fh = img.height / 4;
              ctx.drawImage(img, fw, 0, fw, fh, sx, sy - (fh - T), T, fh * (T / fw));
            } else if (!npc.sprite) {
              // NPC objeto (!):
              ctx.fillStyle = '#FFD700'; ctx.fillRect(sx + 8, sy - 8, 16, 20);
              ctx.fillStyle = '#111'; ctx.font = 'bold 14px monospace'; ctx.fillText('!', sx + 14, sy + 8);
            }

            // Chat pulse indicator
            const dist = Math.abs(p.x - npc.posicion.x) + Math.abs(p.y - npc.posicion.y);
            if (dist <= 1.5) {
              const blink = Math.floor(Date.now()/500) % 2;
              if (blink) {
                ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(sx-4, sy-28, 40, 16, 4); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#111'; ctx.font = '8px "Press Start 2P"'; ctx.fillText('!', sx+16, sy-15);
              }
            }
          });

          // 3. Draw Player
          const pImg = playerImgRef.current;
          if (pImg) {
            const fw = pImg.width / 4, fh = pImg.height / 4;
            ctx.drawImage(pImg, p.frame * fw, p.dir * fh, fw, fh, Math.round(W / 2 - T / 2), Math.round(H / 2 - T / 2 - (fh - T)), T, fh * (T / fw));
          }

          // 4. Dibujar Edificios Dinámicos (Task 2)
          
          // Dibujar Gimnasio si aplica
          if (activeWorld?.gym_position) {
            drawBuilding(activeWorld.gym_position.x - 1, activeWorld.gym_position.y - 1, BUILDING_TEMPLATES.gym);
          }

          // Otros edificios si estamos en el mapa exterior
          if (mapId === 'Map001') {
            drawBuilding(5, 5, BUILDING_TEMPLATES.pokemon_center);
            drawBuilding(20, 5, BUILDING_TEMPLATES.pokemart);
            drawBuilding(5, 20, BUILDING_TEMPLATES.house);
            drawBuilding(20, 20, BUILDING_TEMPLATES.house);
          }

          // 5. Starters
          starters.forEach(st => {
            const img = starterImgsRef.current[st.id];
            if (!img) return;
            const sx = st.tileX * T + ox, sy = st.tileY * T + oy;
            const sz = 48; const offset = (sz - T) / 2;
            ctx.drawImage(img, sx - offset, sy - offset, sz, sz);
            const dist = Math.sqrt(Math.pow(p.x - st.tileX, 2) + Math.pow(p.y - st.tileY, 2));
            if (dist < 2) {
               ctx.fillStyle = '#fff'; ctx.font = '12px "Press Start 2P"';
               const bounce = Math.sin(Date.now() / 200) * 3;
               ctx.fillText('▼', sx + T/2 - 6, sy - 10 + bounce);
            }
          });
        }
        // 5. Overlay Graphics / Indicators
        if (z === 2) {
          if (activeWorld && activeWorld.gym_position) {
            const gymPos = activeWorld.gym_position;
            const gymScreenX = gymPos.x * T + ox;
            const gymScreenY = gymPos.y * T + oy;

            // Sello COMPLETADO / Flecha de indicador
            const gymCompletado = progress?.gimnasios_completados?.includes(world.gym_id);
            if (gymCompletado) {
              ctx.fillStyle = 'rgba(0,180,0,0.8)';
              ctx.fillRect(gymScreenX - 30, gymScreenY - 48, 60, 14);
              ctx.fillStyle = '#fff'; ctx.font = '6px "Press Start 2P"';
              ctx.textAlign = 'center'; ctx.fillText('MEDALLA 🏅', gymScreenX + T/2, gymScreenY - 38);
              ctx.textAlign = 'start';
            } else {
              const dist = Math.sqrt(Math.pow(p.x - gymPos.x, 2) + Math.pow(p.y - gymPos.y, 2));
              if (dist < 4) {
                const blink = Math.floor(Date.now() / 400) % 2;
                if (blink) {
                  ctx.fillStyle = '#FF4444'; ctx.font = '16px serif';
                  ctx.textAlign = 'center'; ctx.fillText('▼', gymScreenX + T/2, gymScreenY - 24);
                  ctx.textAlign = 'start';
                }
              }
            }
          }
        }
      }

      if (timeOfDay === 'morning') { ctx.fillStyle = 'rgba(255, 140, 50, 0.15)'; ctx.fillRect(0, 0, W, H); }
      else if (timeOfDay === 'night') { ctx.fillStyle = 'rgba(0, 0, 40, 0.45)'; ctx.fillRect(0, 0, W, H); }
    };

    const loop = (timestamp) => {
      const dt = lastTime === null ? 0 : Math.min(timestamp - lastTime, 50);
      lastTime = timestamp; update(dt); draw(); frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, timeOfDay, worldId, starters]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%',
                  overflow: 'hidden', backgroundColor: '#000' }}>
      <canvas
        ref={canvasRef}
        width={480} height={320}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }}
      />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Press Start 2P"', fontSize: 10, color: '#9BBC0F'
        }}>
          CARGANDO...
        </div>
      )}
    </div>
  );
};

export default TileMap;
