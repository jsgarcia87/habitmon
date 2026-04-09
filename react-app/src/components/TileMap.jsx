import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

const T = 32;        // Tile size px
const tsCols = 8;    // Tileset columns
const MOVE_DURATION = 180; // ms per tile move

const TileMap = ({ mapId = 'Map002', startX = 13, startY = 10, startDir = 0, timeOfDay = 'day', starters = [], onTrigger }) => {
  const { user } = useGame();
  const canvasRef = useRef(null);
  const mapDataRef = useRef(null);       // usar ref en vez de state para el loop
  const tilesetPassagesRef = useRef([]); // igual
  const [ready, setReady] = useState(false);

  const tilesetImgRef = useRef(null);
  const playerImgRef = useRef(null);
  const npcImgsRef = useRef({});
  const starterImgsRef = useRef({});
  const autotileImgsRef = useRef({});

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

  // ─── CARGA ASSETS ────────────────────────────────────────────────────────────
  useEffect(() => {
    let assetsReady = 0;
    const tryReady = () => { assetsReady++; if (assetsReady >= 2) setReady(true); };

    // Cargar mapa
    fetch(`Data/${mapId}.json`)
      .then(r => r.json())
      .then(mapJson => {
        const rawTable = mapJson.data?.['@data'] || mapJson.data || [];
        const width = mapJson.width;
        const height = mapJson.height;
        const offset = 20;
        const getTile = (x, y, z) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return 0;
          const idx = offset + (x + y * width + z * width * height) * 2;
          return (rawTable[idx] ?? 0) | ((rawTable[idx + 1] ?? 0) << 8);
        };
        mapDataRef.current = { ...mapJson, getTile };

        // NPCs
        Object.values(mapJson.events || {}).forEach(ev => {
          const name = ev.pages?.[0]?.graphic?.character_name;
          if (name && !npcImgsRef.current[name]) {
            const img = new Image();
            img.src = `Graphics/characters/${encodeURIComponent(name.toLowerCase())}.png`;
            img.onload = () => { npcImgsRef.current[name] = img; };
          }
        });

        // Tileset
        fetch('Data/Tilesets.json')
          .then(r => r.json())
          .then(tsData => {
            const ts = tsData.find(t => t && t.id === mapJson.tileset_id);
            if (!ts) { tryReady(); return; }

            const img = new Image();
            img.src = `Graphics/tilesets/${ts.tileset_name.toLowerCase()}.png`;
            img.onload = () => { tilesetImgRef.current = img; tryReady(); };
            img.onerror = () => tryReady();

            const rawP = ts.passages?.['@data'] || [];
            const passages = [];
            const pOffset = 20; // Correct: Skip Table header
            for (let i = pOffset; i < rawP.length; i += 2)
              passages.push((rawP[i] ?? 0) | ((rawP[i + 1] ?? 0) << 8));
            tilesetPassagesRef.current = passages;

            ts.autotile_names?.forEach((name, i) => {
              if (!name) return;
              const ai = new Image();
              ai.src = `Graphics/autotiles/${name.toLowerCase()}.png`;
              ai.onload = () => { autotileImgsRef.current[i] = ai; };
            });
          })
          .catch(() => tryReady());
      })
      .catch(() => tryReady());

    // Jugador
    const pImg = new Image();
    pImg.src = `Graphics/characters/trchar00${user?.avatar ?? 0}.png`;
    pImg.onload = () => { playerImgRef.current = pImg; tryReady(); };
    pImg.onerror = () => tryReady();

    // Starters
    starters.forEach(st => {
       if (!starterImgsRef.current[st.id]) {
          const img = new Image();
          img.src = st.sprite;
          img.onload = () => { starterImgsRef.current[st.id] = img; };
       }
    });

    // Teclado
    const onDown = (e) => {
      keys.current[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
           'w','a','s','d','z',' ','Enter'].includes(e.key))
        e.preventDefault();
    };
    const onUp = (e) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [mapId, user]);

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
    // ⚠️  FIX PRINCIPAL: iniciar lastTime a null para ignorar el primer delta
    let lastTime = null;

    // ── isSolid ────────────────────────────────────────────────────────────────
    const isSolid = (nx, ny, dx, dy) => {
      const map = mapDataRef.current;
      if (!map) return true;
      if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return true;

      const p = playerState.current;

      // Eventos sólidos (destino)
      const ev = Object.values(map.events || {})
        .find(e => e.x === nx && e.y === ny && !e.pages?.[0]?.through);
      if (ev) return true;

      const passages = tilesetPassagesRef.current;
      if (!passages.length) return false;

      for (let z = 0; z < 3; z++) {
        const currentTid = map.getTile(p.x, p.y, z);
        const targetTid = map.getTile(nx, ny, z);
        
        const currentPass = passages[currentTid] ?? 0;
        const targetPass = passages[targetTid] ?? 0;
        
        // Bloqueo total (X)
        if ((targetPass & 0x10)) return true;

        // RPG Maker XP Directional Passages:
        // 0x01: Down, 0x02: Left, 0x04: Right, 0x08: Up
        
        if (dy ===  1) { // Moviendo abajo
          if (currentPass & 0x01) return true; // No puede salir de actual hacia abajo
          if (targetPass & 0x08) return true;  // No puede entrar a destino desde arriba
        }
        if (dy === -1) { // Moviendo arriba
          if (currentPass & 0x08) return true; // No puede salir de actual hacia arriba
          if (targetPass & 0x01) return true;  // No puede entrar a destino desde abajo
        }
        if (dx === -1) { // Moviendo izquierda
          if (currentPass & 0x02) return true; // No puede salir de actual hacia izquierda
          if (targetPass & 0x04) return true;  // No puede entrar a destino desde derecha
        }
        if (dx ===  1) { // Moviendo derecha
          if (currentPass & 0x04) return true; // No puede salir de actual hacia derecha
          if (targetPass & 0x02) return true;  // No puede entrar a destino desde izquierda
        }
      }
      return false;
    };

    // ── checkTrigger ───────────────────────────────────────────────────────────
    const checkTrigger = (x, y) => {
      const map = mapDataRef.current;
      if (!map || !onTrigger) return;
      const ev = Object.values(map.events || {}).find(e => e.x === x && e.y === y);
      if (ev) {
        // Interpret Map Transfer (201)
        const transferCmd = ev.pages?.[0]?.list?.find(c => c.code === 201);
        if (transferCmd && transferCmd.parameters[0] === 0) {
          const [direct, targetMapId, tx, ty, tdir] = transferCmd.parameters;
          // If direction is 0 (retain), keep current
          const finalDir = tdir > 0 ? (tdir/2)-1 : playerState.current.dir; 
          onTrigger({
            type: 'TRANSFER',
            mapId: `Map${String(targetMapId).padStart(3, '0')}`,
            x: tx, y: ty, dir: finalDir
          });
          return;
        }

        // Generic event step
        onTrigger({ type: 'INTERACT', name: ev.name.toLowerCase().replace(/\s/g, '_'), ev }); 
        return; 
      }
      // Puertas genéricas visuales sin evento transfer explícito
      for (let z = 0; z < 3; z++) {
        const tid = map.getTile(x, y, z);
        if (tid > 0 && tid < 48) { onTrigger({ type: 'INTERACT', name: 'puerta_' + tid }); return; }
      }
    };

    // ── checkInteraction ───────────────────────────────────────────────────────
    const checkInteraction = () => {
      const p = playerState.current;
      const ix = p.x + (p.dir === 2 ? 1 : p.dir === 1 ? -1 : 0);
      const iy = p.y + (p.dir === 0 ? 1 : p.dir === 3 ? -1 : 0);
      const map = mapDataRef.current;
      if (!map || !onTrigger) return;

      // Check map events
      const ev = Object.values(map.events || {}).find(e => e.x === ix && e.y === iy);
      if (ev) { onTrigger({ type: 'INTERACT', name: ev.name.toLowerCase().replace(/\s/g, '_'), ev }); return; }

      // Check external starters
      const starter = starters.find(s => s.tileX === ix && s.tileY === iy);
      if (starter) onTrigger(`starter_${starter.id}`);
    };

    // ── update ─────────────────────────────────────────────────────────────────
    const update = (dt) => {
      const p = playerState.current;

      if (p.isMoving) {
        p.moveProgress += dt;
        if (p.moveProgress >= MOVE_DURATION) {
          p.x = p.targetX;
          p.y = p.targetY;
          p.isMoving = false;
          p.moveProgress = 0;
          p.frame = 0;
          checkTrigger(p.x, p.y);
        } else {
          const t = p.moveProgress / MOVE_DURATION;
          p.frame = t < 0.5 ? 1 : 3;
        }
        return; // no leer teclado mientras se mueve
      }

      // Leer dirección
      let dx = 0, dy = 0;
      if      (keys.current['ArrowUp']    || keys.current['w']) { dy = -1; p.dir = 3; }
      else if (keys.current['ArrowDown']  || keys.current['s']) { dy =  1; p.dir = 0; }
      else if (keys.current['ArrowLeft']  || keys.current['a']) { dx = -1; p.dir = 1; }
      else if (keys.current['ArrowRight'] || keys.current['d']) { dx =  1; p.dir = 2; }

      if (dx !== 0 || dy !== 0) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!isSolid(nx, ny, dx, dy)) {
          p.targetX = nx;
          p.targetY = ny;
          p.isMoving = true;
          p.moveProgress = 0;
        }
        p.frame = 1; // pie levantado aunque esté bloqueado
      } else {
        p.frame = 0; // quieto
      }

      // Interacción
      if ((keys.current['z'] || keys.current[' '] || keys.current['Enter'])
          && !p.isInteracting) {
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

      // Tiles visibles
      const startX = Math.max(0, Math.floor(camX / T));
      const startY = Math.max(0, Math.floor(camY / T));
      const endX   = Math.min(map.width  - 1, Math.ceil((camX + W) / T));
      const endY   = Math.min(map.height - 1, Math.ceil((camY + H) / T));

      for (let z = 0; z < 3; z++) {
        for (let my = startY; my <= endY; my++) {
          for (let mx = startX; mx <= endX; mx++) {
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
                ctx.drawImage(tilesetImgRef.current,
                  (lid % tsCols) * 32, Math.floor(lid / tsCols) * 32, 32, 32,
                  dx, dy, T, T);
            }
          }
        }

        // NPCs y jugador entre capas
        if (z === 1) {
          // NPCs
          Object.values(map.events || {}).forEach(ev => {
            const g = ev.pages?.[0]?.graphic;
            if (!g?.character_name) return;
            const img = npcImgsRef.current[g.character_name];
            if (!img) return;
            const fw = img.width / 4, fh = img.height / 4;
            const row = g.direction === 2 ? 0 : g.direction === 4 ? 1
                      : g.direction === 6 ? 2 : 3;
            ctx.drawImage(img, (g.pattern ?? 0) * fw, row * fh, fw, fh,
              ev.x * T + ox, ev.y * T + oy - (fh - T), T, fh * (T / fw));
          });

          // Jugador — siempre en el centro exacto de la pantalla
          const img = playerImgRef.current;
          if (img) {
            const fw = img.width / 4, fh = img.height / 4;
            ctx.drawImage(img, p.frame * fw, p.dir * fh, fw, fh,
              Math.round(W / 2 - T / 2),
              Math.round(H / 2 - T / 2 - (fh - T)),
              T, fh * (T / fw));
          }
        }

        // Starters Layer (on top of map, under/over player depending on Y, but let's keep it simple at layer 2)
        if (z === 1) {
          starters.forEach(st => {
            const img = starterImgsRef.current[st.id];
            if (!img) return;
            const sx = st.tileX * T + ox;
            const sy = st.tileY * T + oy;
            
            // Draw Pokemon (48x48) - Centered on 32px tile
            const sz = 48;
            const offset = (sz - T) / 2;
            ctx.drawImage(img, sx - offset, sy - offset, sz, sz);

            // Proximity indicator
            const dist = Math.sqrt(Math.pow(p.x - st.tileX, 2) + Math.pow(p.y - st.tileY, 2));
            if (dist < 2) {
               ctx.fillStyle = '#fff';
               ctx.font = '12px "Press Start 2P"';
               const bounce = Math.sin(Date.now() / 200) * 3;
               ctx.fillText('▼', sx + T/2 - 6, sy - 10 + bounce);
            }
          });
        }
      }

      // ── Tinte / Clima estilo GBA (Time of Day) ────────────────────────────────
      // Aplicamos un overlay global imitando el paso del tiempo de Pokémon Oro/Plata
      if (timeOfDay === 'morning') {
        ctx.fillStyle = 'rgba(255, 140, 50, 0.15)'; // Tinte amanecer cálido/naranja
        ctx.fillRect(0, 0, W, H);
      } else if (timeOfDay === 'night') {
        ctx.fillStyle = 'rgba(0, 0, 40, 0.45)'; // Tinte noche oscura con azul
        ctx.fillRect(0, 0, W, H);
      }
      // 'day' no requiere tinte, se ve natural
    };

    // ── loop ───────────────────────────────────────────────────────────────────
    const loop = (timestamp) => {
      // ⚠️  Primer frame: lastTime=null → dt=0, no hay salto
      const dt = lastTime === null ? 0 : Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, onTrigger, timeOfDay]);

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
