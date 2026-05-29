import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAssetPath } from '../api/assets';
import { useGame } from '../context/GameContext';
import { WORLD_DATA } from '../data/worldData';

// ─────────────────────────────────────────────────────────────────────────────
// Localizaciones visibles en el mapa de Johto.
// `type: 'city' | 'town' | 'route'` — solo ciudades y pueblos son destinos
// válidos para el teletransporte ("Vuelo" estilo Crystal).
// `relatedMaps` lista mapas interiores (gimnasios, casas, centro pokémon...)
// cuyo "padre" en el mapa mundial es esta entrada. Permite mostrar al jugador
// en la ciudad correcta aunque esté dentro de un edificio.
// ─────────────────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'Map002', name: 'Pueblo Primavera', shortName: 'PRIMAVERA', type: 'town',  x: 82, y: 70, mapId: 'Map002', spawn: { x: 12, y: 12 }, desc: 'El pueblo donde soplan vientos de un nuevo comienzo.' },
  { id: 'Map008', name: 'Ruta 29',          shortName: 'RUTA 29',   type: 'route', x: 72, y: 70, mapId: 'Map008', spawn: { x: 21, y: 12 }, desc: 'Un camino tranquilo ideal para entrenadores novatos.' },
  { id: 'Map070', name: 'Ciudad Fronsaf',   shortName: 'FRONSAF',   type: 'city',  x: 62, y: 70, mapId: 'Map070', spawn: { x: 18, y: 13 }, desc: 'Una pequeña ciudad rodeada de naturaleza.' },
  { id: 'Map038', name: 'Ruta 30',          shortName: 'RUTA 30',   type: 'route', x: 62, y: 55, mapId: 'Map038', spawn: { x: 32, y: 13 }, desc: 'Una ruta frondosa con entrenadores ocultos.' },
  { id: 'Map029', name: 'Pueblo Ganymaho',  shortName: 'GANYMAHO',  type: 'town',  x: 52, y: 55, mapId: 'Map029', spawn: { x: 10, y: 16 }, desc: 'Pueblo rural conocido por sus plantaciones.' },
  { id: 'Map040', name: 'Ruta 31',          shortName: 'RUTA 31',   type: 'route', x: 52, y: 40, mapId: 'Map040', spawn: { x: 14, y: 21 }, desc: 'Camino montañoso cercano a cuevas oscuras.' },
  { id: 'Map078', name: 'Ciudad Malva',     shortName: 'MALVA',     type: 'city',  x: 52, y: 25, mapId: 'Map078', spawn: { x: 14, y: 14 }, desc: 'Hogar del primer gimnasio. ¡Cuidado con los pájaros!' },
  { id: 'Map013', name: 'Ruta 32',          shortName: 'RUTA 32',   type: 'route', x: 42, y: 25, mapId: 'Map013', spawn: { x: 10, y: 8  }, desc: 'Una ruta larga que cruza puentes de madera.' },
  { id: 'Map010', name: 'Ciudad Trigal',    shortName: 'TRIGAL',    type: 'city',  x: 42, y: 55, mapId: 'Map010', spawn: { x: 21, y: 18 }, desc: 'La gran metrópolis con infinitas oportunidades.' },
];

// Construye el lookup mapId → LOCATIONS index, expandido recursivamente con
// los interiores que apuntan (vía exits.down) a un mapa exterior conocido.
function buildMapToLocationIndex() {
  const direct = new Map();
  LOCATIONS.forEach((loc, idx) => direct.set(loc.id, idx));

  // Para cada mapa interior, sigue su exit 'down' hasta llegar a un mapa
  // que sí está en LOCATIONS. Limita la profundidad por seguridad.
  Object.entries(WORLD_DATA || {}).forEach(([mapId, data]) => {
    if (direct.has(mapId)) return;
    if (!data?.isInterior) return;
    let cur = mapId;
    for (let depth = 0; depth < 6; depth++) {
      const node = WORLD_DATA[cur];
      const nextId = node?.exits?.down?.targetMap;
      if (!nextId) break;
      if (direct.has(nextId)) {
        direct.set(mapId, direct.get(nextId));
        return;
      }
      cur = nextId;
    }
  });

  return direct;
}

const MAP_TO_LOCATION_IDX = buildMapToLocationIndex();

// Índices de las ubicaciones aptas para teletransporte (ciudades + pueblos).
const TRAVELABLE_INDICES = LOCATIONS
  .map((l, i) => ({ l, i }))
  .filter(({ l }) => l.type !== 'route')
  .map(({ i }) => i);

export default function WorldMapScreen({
  navigate,
  onFastTravel,
  currentMapId,
  lastExtMap,
  direction,
  aPressed,
  bPressed
}) {
  const { user } = useGame();

  // Ubicación efectiva del jugador: si el mapa actual es interior, intentamos
  // resolver al outdoor padre; si nada cuadra, usamos lastExtMap.
  const currentLocIdx = useMemo(() => {
    if (MAP_TO_LOCATION_IDX.has(currentMapId)) return MAP_TO_LOCATION_IDX.get(currentMapId);
    if (lastExtMap && MAP_TO_LOCATION_IDX.has(lastExtMap)) return MAP_TO_LOCATION_IDX.get(lastExtMap);
    return -1;
  }, [currentMapId, lastExtMap]);
  const currentLoc = currentLocIdx >= 0 ? LOCATIONS[currentLocIdx] : null;

  // Cursor: arranca en la ciudad actual, o si no, en el primer destino válido.
  const [travelCursorPos, setTravelCursorPos] = useState(() => {
    if (currentLocIdx >= 0 && TRAVELABLE_INDICES.includes(currentLocIdx)) {
      return TRAVELABLE_INDICES.indexOf(currentLocIdx);
    }
    return 0;
  });

  const sel = TRAVELABLE_INDICES[travelCursorPos];
  const selectedLoc = LOCATIONS[sel];

  const [confirm, setConfirm] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [playerOffset, setPlayerOffset] = useState(0);
  const [cursorPulse, setCursorPulse] = useState(0);

  // Bouncing player + cursor pulse
  useEffect(() => {
    let frame;
    const start = Date.now();
    const loop = () => {
      const t = Date.now() - start;
      setPlayerOffset(Math.sin(t / 150) * 3);
      setCursorPulse(0.5 + Math.abs(Math.sin(t / 200)) * 0.5);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const travel = useCallback((loc) => {
    if (!loc || loc.type === 'route') return;
    if (loc.id === currentLoc?.id) return; // ya estás aquí
    setIsTraveling(true);
    setTimeout(() => {
      if (onFastTravel) onFastTravel(loc.mapId, loc.spawn);
      else navigate('city');
    }, 600);
  }, [onFastTravel, navigate, currentLoc]);

  // ─── Input (teclado) ──────────────────────────────────────────────────
  useEffect(() => {
    if (isTraveling) return;
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        navigate('city'); return;
      }
      // Navegación: izquierda/arriba → anterior; derecha/abajo → siguiente
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setTravelCursorPos(p => (p - 1 + TRAVELABLE_INDICES.length) % TRAVELABLE_INDICES.length);
        setConfirm(false);
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setTravelCursorPos(p => (p + 1) % TRAVELABLE_INDICES.length);
        setConfirm(false);
      }
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
        const loc = LOCATIONS[TRAVELABLE_INDICES[travelCursorPos]];
        if (loc.id === currentLoc?.id) return; // ignorar confirmación si es donde estás
        setConfirm(c => {
          if (c) { travel(loc); return false; }
          return true;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [travelCursorPos, travel, navigate, isTraveling, currentLoc]);

  // ─── Input (botones táctiles vía props) ───────────────────────────────
  // El D-pad y los botones A/B globales disparan setDirection/setAPressed/
  // setBPressed en App.jsx. Aquí reaccionamos a esos cambios.
  const lastDirRef = useRef(null);
  useEffect(() => {
    if (isTraveling) return;
    if (!direction) { lastDirRef.current = null; return; }
    if (direction === lastDirRef.current) return;
    lastDirRef.current = direction;
    if (direction === 'up' || direction === 'left') {
      setTravelCursorPos(p => (p - 1 + TRAVELABLE_INDICES.length) % TRAVELABLE_INDICES.length);
      setConfirm(false);
    } else if (direction === 'down' || direction === 'right') {
      setTravelCursorPos(p => (p + 1) % TRAVELABLE_INDICES.length);
      setConfirm(false);
    }
  }, [direction, isTraveling]);

  useEffect(() => {
    if (!aPressed || isTraveling) return;
    const loc = LOCATIONS[TRAVELABLE_INDICES[travelCursorPos]];
    if (loc.id === currentLoc?.id) return;
    setConfirm(c => {
      if (c) { travel(loc); return false; }
      return true;
    });
  }, [aPressed, travelCursorPos, currentLoc, travel, isTraveling]);

  useEffect(() => {
    if (!bPressed || isTraveling) return;
    // Si hay una confirmación pendiente, B sólo la cancela. Si no, sale.
    if (confirm) {
      setConfirm(false);
    } else {
      navigate('city');
    }
  }, [bPressed, navigate, isTraveling, confirm]);

  const avatarNum = String(user?.avatar || 0).padStart(3, '0');
  const isHere = selectedLoc?.id === currentLoc?.id;

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: '#2b5a6c',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Press Start 2P"',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      imageRendering: 'pixelated',
    }}>

      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #1e3a47 0%, #152b36 100%)',
        borderBottom: '2px solid #0f1c24',
        zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: 8, color: '#f8f8f8', textShadow: '1px 1px 0 #000' }}>MAPA JOHTO</span>
        <span style={{ fontSize: 6, color: '#689bb5' }}>
          {currentLoc ? `EN: ${currentLoc.shortName}` : 'EN: ???'}
        </span>
      </div>

      {/* Main Map Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

        {/* Map Background Image */}
        <div style={{
          position: 'relative',
          width: 320, height: 213,
          backgroundImage: `url(${getAssetPath('Graphics/Pictures/mapregion0.png')})`,
          backgroundSize: '100% 100%',
          border: '2px solid #111',
          boxShadow: '0 0 0 4px #4a7588, 0 4px 10px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          backgroundColor: '#8cbcd2',
        }}>

          {/* Puntos de cada localización */}
          {LOCATIONS.map((loc, i) => {
            const isCity = loc.type !== 'route';
            const isCurrent = loc.id === currentLoc?.id;
            const isSelected = i === sel;
            return (
              <div key={loc.id}
                onClick={() => {
                  if (loc.type === 'route') return; // no se puede volar a una ruta
                  const tIdx = TRAVELABLE_INDICES.indexOf(i);
                  if (tIdx < 0) return;
                  if (travelCursorPos === tIdx) {
                    if (loc.id !== currentLoc?.id) {
                      setConfirm(true);
                      travel(loc);
                    }
                  } else {
                    setTravelCursorPos(tIdx);
                    setConfirm(false);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${loc.x}%`, top: `${loc.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 18, height: 18,
                  cursor: loc.type === 'route' ? 'default' : 'pointer',
                  zIndex: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: isCity ? 9 : 4,
                  height: isCity ? 9 : 4,
                  backgroundColor: isCurrent ? '#22c55e' : isCity ? '#ef4444' : '#64748b',
                  border: `1px solid ${isSelected ? '#fbbf24' : '#fff'}`,
                  borderRadius: isCity ? '2px' : '50%',
                  boxShadow: isSelected
                    ? '0 0 6px 2px rgba(251,191,36,0.6)'
                    : '1px 1px 0 rgba(0,0,0,0.5)',
                }} />
              </div>
            );
          })}

          {/* Cabeza del jugador en la ciudad actual */}
          {currentLoc && (
            <>
              <div style={{
                position: 'absolute',
                left: `${currentLoc.x}%`,
                top: `calc(${currentLoc.y}% - 14px + ${playerOffset}px)`,
                transform: 'translate(-50%, -50%)',
                width: 16, height: 16,
                backgroundImage: `url(${getAssetPath(`Graphics/Pictures/mapplayer${avatarNum === '000' ? '000' : '001'}.png`)})`,
                backgroundSize: 'cover',
                zIndex: 8,
                filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.7))',
              }} />
              {/* Etiqueta "ESTÁS AQUÍ" debajo */}
              <div style={{
                position: 'absolute',
                left: `${currentLoc.x}%`,
                top: `calc(${currentLoc.y}% + 12px)`,
                transform: 'translateX(-50%)',
                fontSize: 5, color: '#fff',
                background: '#22c55e',
                padding: '2px 4px',
                border: '1px solid #000',
                borderRadius: 2,
                whiteSpace: 'nowrap',
                zIndex: 7,
                textShadow: '1px 1px 0 #000'
              }}>
                ¡ESTÁS AQUÍ!
              </div>
            </>
          )}

          {/* Cursor de Vuelo */}
          <div style={{
            position: 'absolute',
            left: `${selectedLoc.x}%`,
            top: `${selectedLoc.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24,
            backgroundImage: `url(${getAssetPath('Graphics/Pictures/fly_cursor.png')})`,
            backgroundSize: 'cover',
            zIndex: 9,
            transition: 'left 0.2s ease-in-out, top 0.2s ease-in-out',
            opacity: cursorPulse,
            animation: confirm ? 'pulse 0.5s infinite alternate' : 'none',
          }} />
        </div>
      </div>

      {/* Footer Info Panel. Margin-bottom para que no quede tapado por los
          Controls táctiles (D-pad + A/B) que se renderizan a ~150px desde
          el borde inferior cuando estamos en esta pantalla. */}
      <div style={{
        background: '#f8f8f8',
        borderTop: '3px solid #111',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: 65,
        marginBottom: 150,
        zIndex: 10,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px dashed #ccc', paddingBottom: '4px'
        }}>
          <span style={{ fontSize: 9, color: '#333' }}>{selectedLoc?.name}</span>
          <span style={{
            fontSize: 6, color: '#fff',
            backgroundColor:
              selectedLoc?.type === 'city' ? '#ef4444' :
              selectedLoc?.type === 'town' ? '#3b82f6' :
              '#64748b',
            padding: '4px 6px', borderRadius: '4px'
          }}>
            {selectedLoc?.type.toUpperCase()}
          </span>
        </div>

        <div style={{ fontSize: 7, color: '#666', lineHeight: '1.4' }}>
          {selectedLoc?.desc}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{
            fontSize: 6,
            color: isHere ? '#22c55e' : confirm ? '#ef4444' : '#3b82f6',
            animation: confirm && !isHere ? 'flash 0.5s infinite' : 'none'
          }}>
            {isHere
              ? '▶ ESTÁS AQUÍ'
              : confirm
                ? '▶ [A] VIAJANDO...'
                : '▶ [A] CONFIRMAR VIAJE'}
          </span>
          <button
            onClick={() => navigate('city')}
            style={{
              background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: 4,
              color: '#333', fontSize: 6, fontFamily: '"Press Start 2P"',
              padding: '6px 10px', cursor: 'pointer',
            }}
          >
            [B] VOLVER
          </button>
        </div>
      </div>

      {/* Fade out transition */}
      {isTraveling && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: '#000',
          opacity: 1,
          animation: 'fadeIn 0.5s forwards',
          zIndex: 99,
          pointerEvents: 'none'
        }} />
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); filter: brightness(1); }
          100% { transform: translate(-50%, -50%) scale(1.15); filter: brightness(1.4); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
