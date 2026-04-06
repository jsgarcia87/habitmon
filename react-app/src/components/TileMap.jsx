import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';

const T = 32;
const tsCols = 8;
const MOVE_DURATION = 180;

// ── Time-of-day config ─────────────────────────────────────────────────────
// Tileset names must match the actual PNG filename (lowercase) in Graphics/tilesets/
const TIME_CONFIG = {
  morning: {
    mapId: 'Map002',
    tileset: 'gsc overworld johto morning',  // overrides map's tileset_id
    overlay: null,
    bgColor: '#E8C870',
    startX: 13, startY: 15,
  },
  day: {
    mapId: 'Map008',
    tileset: 'gsc national park day',
    overlay: null,
    bgColor: '#7EC850',
    startX: 10, startY: 12,
  },
  night: {
    mapId: 'Map002',                         // reuse Map002 with night tileset
    tileset: 'gsc overworld johto nite',
    overlay: 'rgba(0, 0, 30, 0.35)',
    bgColor: '#1A1A3E',
    startX: 13, startY: 15,
  },
};

const TileMap = ({ onTrigger, timeOfDay = 'morning', completedGyms = [] }) => {
  const { user } = useGame();
  const canvasRef        = useRef(null);
  const mapDataRef       = useRef(null);
  const tilesetPassRef   = useRef([]);
  const tilesetImgRef    = useRef(null);
  const playerImgRef     = useRef(null);
  const npcImgsRef       = useRef({});
  const autotileImgsRef  = useRef({});
  const [ready, setReady] = useState(false);
  const configRef        = useRef(TIME_CONFIG[timeOfDay] || TIME_CONFIG.morning);

  const playerState = useRef({
    x: configRef.current.startX,
    y: configRef.current.startY,
    dir: 0, frame: 0,
    isMoving: false, moveProgress: 0,
    targetX: configRef.current.startX,
    targetY: configRef.current.startY,
    isInteracting: false, nearEvent: null,
  });

  const keys = useRef({});

  // ── Load assets when timeOfDay or user.avatar changes ─────────────────────
  useEffect(() => {
    const cfg = TIME_CONFIG[timeOfDay] || TIME_CONFIG.morning;
    configRef.current = cfg;

    // Reset player to map start
    const p = playerState.current;
    p.x = cfg.startX; p.y = cfg.startY;
    p.targetX = cfg.startX; p.targetY = cfg.startY;
    p.isMoving = false; p.frame = 0;

    setReady(false);
    tilesetImgRef.current  = null;
    npcImgsRef.current     = {};
    autotileImgsRef.current = {};

    let assetsReady = 0;
    const tryReady = () => { assetsReady++; if (assetsReady >= 2) setReady(true); };

    // ── Load map JSON ───────────────────────────────────────────────────────
    fetch(`Data/${cfg.mapId}.json`)
      .then(r => r.json())
      .then(mapJson => {
        const rawTable = mapJson.data?.['@data'] || mapJson.data || [];
        const width  = mapJson.width;
        const height = mapJson.height;
        const offset = 20;
        const getTile = (x, y, z) => {
          if (x < 0 || x >= width || y < 0 || y >= height) return 0;
          const idx = offset + (x + y * width + z * width * height) * 2;
          return (rawTable[idx] ?? 0) | ((rawTable[idx + 1] ?? 0) << 8);
        };
        mapDataRef.current = { ...mapJson, getTile };

        // Load NPC sprites
        Object.values(mapJson.events || {}).forEach(ev => {
          const name = ev?.pages?.[0]?.graphic?.character_name;
          if (name && !npcImgsRef.current[name]) {
            const img = new Image();
            img.src = `Graphics/characters/${encodeURIComponent(name.toLowerCase())}.png`;
            img.onload = () => { npcImgsRef.current[name] = img; };
          }
        });

        // ── Load TILESET — use cfg.tileset override instead of map's tileset_id ─
        const img = new Image();
        img.src = `Graphics/tilesets/${encodeURIComponent(cfg.tileset)}.png`;
        img.onload = () => { tilesetImgRef.current = img; tryReady(); };
        img.onerror = () => {
          // Fallback: try the original tileset from Tilesets.json
          fetch('Data/Tilesets.json')
            .then(r => r.json())
            .then(tsData => {
              const tsList = Array.isArray(tsData) ? tsData : Object.values(tsData);
              const ts = tsList.find(t => t && t.id === mapJson.tileset_id);
              if (ts) {
                const fb = new Image();
                fb.src = `Graphics/tilesets/${ts.tileset_name.toLowerCase()}.png`;
                fb.onload = () => { tilesetImgRef.current = fb; tryReady(); };
                fb.onerror = tryReady;
                // Passages
                const rawP = ts.passages?.['@data'] || [];
                const passes = [];
                for (let i = 20; i < rawP.length; i += 2)
                  passes.push((rawP[i] ?? 0) | ((rawP[i + 1] ?? 0) << 8));
                tilesetPassRef.current = passes;
                // Autotiles
                ts.autotile_names?.forEach((name, i) => {
                  if (!name) return;
                  const ai = new Image();
                  ai.src = `Graphics/autotiles/${name.toLowerCase()}.png`;
                  ai.onload = () => { autotileImgsRef.current[i] = ai; };
                });
              } else tryReady();
            })
            .catch(tryReady);
        };

        // Load passages from Tilesets.json for the main tileset
        fetch('Data/Tilesets.json')
          .then(r => r.json())
          .then(tsData => {
            const tsList = Array.isArray(tsData) ? tsData : Object.values(tsData);
            const ts = tsList.find(t => t && t.id === mapJson.tileset_id);
            if (!ts) return;
            const rawP = ts.passages?.['@data'] || [];
            const passes = [];
            for (let i = 20; i < rawP.length; i += 2)
              passes.push((rawP[i] ?? 0) | ((rawP[i + 1] ?? 0) << 8));
            tilesetPassRef.current = passes;
            ts.autotile_names?.forEach((name, i) => {
              if (!name) return;
              const ai = new Image();
              ai.src = `Graphics/autotiles/${name.toLowerCase()}.png`;
              ai.onload = () => { autotileImgsRef.current[i] = ai; };
            });
          })
          .catch(() => {});

        tryReady();
      })
      .catch(tryReady);

    // ── Load player sprite ─────────────────────────────────────────────────
    const pImg = new Image();
    pImg.src = `Graphics/characters/trchar00${user?.avatar ?? 0}.png`;
    pImg.onload = () => { playerImgRef.current = pImg; tryReady(); };
    pImg.onerror = tryReady;

    // ── Keyboard ────────────────────────────────────────────────────────────
    const onDown = e => {
      keys.current[e.key] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','z',' ','Enter'].includes(e.key))
        e.preventDefault();
    };
    const onUp = e => { keys.current[e.key] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [timeOfDay, user?.avatar]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;
    const update = (w, h) => { canvas.width = Math.floor(w); canvas.height = Math.floor(h); };
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width > 0) update(rect.width, rect.height);
    const ro = new ResizeObserver(entries => {
      for (const e of entries) if (e.contentRect.width > 0) update(e.contentRect.width, e.contentRect.height);
    });
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    const canvas  = canvasRef.current;
    const cfg     = configRef.current;
    let frameId;
    let lastTime  = null;

    // isSolid
    const isSolid = (x, y, dx, dy) => {
      const map = mapDataRef.current;
      if (!map) return true;
      if (x < 0 || x >= map.width || y < 0 || y >= map.height) return true;
      const p    = playerState.current;
      const ev   = Object.values(map.events || {})
        .find(e => e?.x === x && e?.y === y && !e?.pages?.[0]?.through);
      if (ev) return true;
      const passes = tilesetPassRef.current;
      if (!passes.length) return false;
      for (let z = 0; z < 3; z++) {
        const tid = map.getTile(x, y, z);
        if (tid === 0) continue;
        const pass = tid < 384 ? (passes[Math.floor((tid-48)/48)] ?? 0) : (passes[tid] ?? 0);
        if (z === 0 && pass === 0) continue;
        if (dy ===  1 && (pass & 0x01)) return true;
        if (dy === -1 && (pass & 0x08)) return true;
        if (dx === -1 && (pass & 0x02)) return true;
        if (dx ===  1 && (pass & 0x04)) return true;
        if ((pass & 0x0f) === 0x0f) return true;
      }
      for (let z = 0; z < 3; z++) {
        const tid = map.getTile(p.x, p.y, z);
        if (tid === 0) continue;
        const pass = tid < 384 ? (passes[Math.floor((tid-48)/48)] ?? 0) : (passes[tid] ?? 0);
        if (dy ===  1 && (pass & 0x01)) return true;
        if (dy === -1 && (pass & 0x08)) return true;
        if (dx === -1 && (pass & 0x02)) return true;
        if (dx ===  1 && (pass & 0x04)) return true;
      }
      return false;
    };

    const checkTrigger = (x, y) => {
      const map = mapDataRef.current;
      if (!map || !onTrigger) return;
      const ev = Object.values(map.events || {}).find(e => e?.x === x && e?.y === y);
      if (ev) onTrigger(ev.name.toLowerCase().replace(/\s/g, '_'));
    };

    const checkInteraction = () => {
      const p = playerState.current;
      const ix = p.x + (p.dir === 2 ? 1 : p.dir === 1 ? -1 : 0);
      const iy = p.y + (p.dir === 0 ? 1 : p.dir === 3 ? -1 : 0);
      const map = mapDataRef.current;
      if (!map || !onTrigger) return;
      const ev = Object.values(map.events || {}).find(e => e?.x === ix && e?.y === iy);
      if (ev) onTrigger(ev.name.toLowerCase().replace(/\s/g, '_'));
    };

    const update = (dt) => {
      const p = playerState.current;
      if (p.isMoving) {
        p.moveProgress += dt;
        if (p.moveProgress >= MOVE_DURATION) {
          p.x = p.targetX; p.y = p.targetY;
          p.isMoving = false; p.moveProgress = 0; p.frame = 0;
          checkTrigger(p.x, p.y);
        } else {
          p.frame = p.moveProgress / MOVE_DURATION < 0.5 ? 1 : 3;
        }
        return;
      }
      let dx = 0, dy = 0;
      if      (keys.current['ArrowUp']    || keys.current['w']) { dy = -1; p.dir = 3; }
      else if (keys.current['ArrowDown']  || keys.current['s']) { dy =  1; p.dir = 0; }
      else if (keys.current['ArrowLeft']  || keys.current['a']) { dx = -1; p.dir = 1; }
      else if (keys.current['ArrowRight'] || keys.current['d']) { dx =  1; p.dir = 2; }
      if (dx !== 0 || dy !== 0) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!isSolid(nx, ny, dx, dy)) {
          p.targetX = nx; p.targetY = ny;
          p.isMoving = true; p.moveProgress = 0;
        }
        p.frame = 1;
      } else { p.frame = 0; }
      const ix  = p.x + (p.dir === 2 ? 1 : p.dir === 1 ? -1 : 0);
      const iy  = p.y + (p.dir === 0 ? 1 : p.dir === 3 ? -1 : 0);
      const map = mapDataRef.current;
      p.nearEvent = Object.values(map?.events || {})
        .find(e => e?.x === ix && e?.y === iy) || null;
      if ((keys.current['z'] || keys.current[' '] || keys.current['Enter']) && !p.isInteracting) {
        p.isInteracting = true;
        checkInteraction();
        setTimeout(() => { p.isInteracting = false; }, 300);
      }
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const map = mapDataRef.current;
      if (!map) return;
      const W = canvas.width, H = canvas.height;

      // Background fill
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, W, H);

      const p = playerState.current;
      const t = p.isMoving ? p.moveProgress / MOVE_DURATION : 0;
      const interX = p.x + (p.targetX - p.x) * t;
      const interY = p.y + (p.targetY - p.y) * t;
      const camX   = interX * T + T / 2 - W / 2;
      const camY   = interY * T + T / 2 - H / 2;
      const ox     = -Math.round(camX);
      const oy     = -Math.round(camY);

      const startX = Math.max(0, Math.floor(camX / T));
      const startY = Math.max(0, Math.floor(camY / T));
      const endX   = Math.min(map.width  - 1, Math.ceil((camX + W) / T));
      const endY   = Math.min(map.height - 1, Math.ceil((camY + H) / T));

      // Draw tiles
      for (let z = 0; z < 3; z++) {
        for (let my = startY; my <= endY; my++) {
          for (let mx = startX; mx <= endX; mx++) {
            const tid = map.getTile(mx, my, z);
            if (tid === 0) continue;
            const dx = mx * T + ox, dy = my * T + oy;
            if (tid < 384) {
              const atId = Math.floor((tid - 48) / 48);
              const img  = autotileImgsRef.current[atId];
              if (img) ctx.drawImage(img, 0, 0, 32, 32, dx, dy, T, T);
            } else if (tilesetImgRef.current) {
              const lid = tid - 384;
              ctx.drawImage(tilesetImgRef.current,
                (lid % tsCols) * 32, Math.floor(lid / tsCols) * 32, 32, 32,
                dx, dy, T, T);
            }
          }
        }

        // Sprites between layer 1 and 2
        if (z === 1) {
          // NPCs
          Object.values(map.events || {}).forEach(ev => {
            const g = ev?.pages?.[0]?.graphic;
            if (!g?.character_name) return;
            const img = npcImgsRef.current[g.character_name];
            if (!img) return;
            const fw = img.width / 4, fh = img.height / 4;
            const row = g.direction === 2 ? 0 : g.direction === 4 ? 1
                      : g.direction === 6 ? 2 : 3;
            ctx.drawImage(img, (g.pattern ?? 0) * fw, row * fh, fw, fh,
              ev.x * T + ox, ev.y * T + oy - (fh - T), T, fh * (T / fw));

            // ── Medal over completed gym ───────────────────────────────────
            const evName = ev.name?.toLowerCase().replace(/\s/g, '_') || '';
            const isGymEvent = evName.startsWith('gym_');
            if (isGymEvent && completedGyms.length > 0) {
              // Match event name to gym_id: "gym_vestirse" → "vestirse", also "higiene_m"
              const evBase = evName.replace('gym_', '');
              const isDone = completedGyms.some(gid => {
                const evKey = gid.replace('_m', '').replace('_n', '');
                return gid === evBase || evKey === evBase;
              });
              if (isDone) {
                const bx = ev.x * T + ox + T / 2;
                const by = ev.y * T + oy - 18;
                ctx.save();
                ctx.beginPath();
                ctx.arc(bx, by, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#f0c020';
                ctx.fill();
                ctx.strokeStyle = '#8a6000';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', bx, by);
                ctx.restore();
              }
            }
          });

          // Player — always centered
          const img = playerImgRef.current;
          if (img) {
            const fw = img.width / 4, fh = img.height / 4;
            ctx.drawImage(img, p.frame * fw, p.dir * fh, fw, fh,
              Math.round(W / 2 - T / 2),
              Math.round(H / 2 - T / 2 - (fh - T)),
              T, fh * (T / fw));
          }

          // Interaction indicator
          if (p.nearEvent) {
            const ev   = p.nearEvent;
            const floatY = Math.sin(Date.now() / 200) * 4;
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.beginPath();
            ctx.roundRect(ev.x * T + ox + 6, ev.y * T + oy - 25 + floatY, 20, 20, 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Z', ev.x * T + ox + 16, ev.y * T + oy - 11 + floatY);
          }
        }
      }

      // ── Night overlay ──────────────────────────────────────────────────────
      if (cfg.overlay) {
        ctx.fillStyle = cfg.overlay;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const loop = (timestamp) => {
      const dt = lastTime === null ? 0 : Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [ready, onTrigger, completedGyms]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%',
                  overflow: 'hidden', backgroundColor: configRef.current.bgColor }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }}
      />
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Press Start 2P"', fontSize: 10,
          color: configRef.current.bgColor === '#1A1A3E' ? '#a0b0ff' : '#9BBC0F',
          background: configRef.current.bgColor,
        }}>
          CARGANDO...
        </div>
      )}
    </div>
  );
};

export default TileMap;
