import React, { useState, useEffect, useCallback } from 'react';
import { getAssetPath } from '../api/assets';
import { useGame } from '../context/GameContext';

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

export default function WorldMapScreen({ navigate, onFastTravel, currentMapId }) {
  const { user } = useGame();
  
  const [sel, setSel] = useState(() => {
    const i = LOCATIONS.findIndex(l => l.id === currentMapId);
    return i >= 0 ? i : 0;
  });
  const [confirm, setConfirm] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [playerOffset, setPlayerOffset] = useState(0);

  // Bouncing player animation
  useEffect(() => {
    let frame;
    let start = Date.now();
    const loop = () => {
      const t = Date.now() - start;
      setPlayerOffset(Math.sin(t / 150) * 3);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const travel = useCallback((loc) => {
    setIsTraveling(true);
    setTimeout(() => {
      if (onFastTravel) onFastTravel(loc.mapId, loc.spawn);
      else navigate('city');
    }, 600);
  }, [onFastTravel, navigate]);

  useEffect(() => {
    if (isTraveling) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { navigate('city'); return; }
      if (e.key === 'ArrowUp')    setSel(s => Math.max(s - 1, 0));
      if (e.key === 'ArrowDown')  setSel(s => Math.min(s + 1, LOCATIONS.length - 1));
      if (e.key === 'ArrowLeft')  setSel(s => Math.max(s - 1, 0));
      if (e.key === 'ArrowRight') setSel(s => Math.min(s + 1, LOCATIONS.length - 1));
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter') {
        setConfirm(c => {
          if (c) { travel(LOCATIONS[sel]); return false; }
          return true;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sel, travel, navigate, isTraveling]);

  const selectedLoc = LOCATIONS[sel];
  const currentLoc = LOCATIONS.find(l => l.id === currentMapId);
  const avatarNum = String(user?.avatar || 0).padStart(3, '0');

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
        <span style={{ fontSize: 6, color: '#689bb5' }}>V 1.0</span>
      </div>

      {/* Main Map Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Map Background Image */}
        <div style={{
          position: 'relative',
          width: 320, height: 213, // Aspect ratio of mapregion0 (480x320 scaled down)
          backgroundImage: `url(${getAssetPath('Graphics/Pictures/mapregion0.png')})`,
          backgroundSize: '100% 100%',
          border: '2px solid #111',
          boxShadow: '0 0 0 4px #4a7588, 0 4px 10px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          backgroundColor: '#8cbcd2', // water color fallback
        }}>
          
          {/* Invisible click targets & dots (optional visual anchors) */}
          {LOCATIONS.map((loc, i) => {
            const isCity = loc.type !== 'route';
            return (
              <div key={loc.id}
                onClick={() => {
                  if (sel === i) { setConfirm(true); travel(loc); }
                  else { setSel(i); setConfirm(false); }
                }}
                style={{
                  position: 'absolute',
                  left: `${loc.x}%`, top: `${loc.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 14, height: 14,
                  cursor: 'pointer',
                  zIndex: 6,
                }}
              >
                {/* Visual marker if needed (usually mapregion0 has drawn cities, but we can overlay a dot) */}
                <div style={{
                  width: isCity ? 8 : 4, height: isCity ? 8 : 4,
                  backgroundColor: isCity ? '#ef4444' : '#64748b',
                  border: '1px solid #fff',
                  borderRadius: isCity ? '2px' : '50%',
                  margin: 'auto',
                  marginTop: isCity ? 3 : 5,
                  boxShadow: '1px 1px 0 rgba(0,0,0,0.5)'
                }} />
              </div>
            );
          })}

          {/* Current Location Player Head */}
          {currentLoc && (
            <div style={{
              position: 'absolute',
              left: `${currentLoc.x}%`,
              top: `calc(${currentLoc.y}% - 12px + ${playerOffset}px)`,
              transform: 'translate(-50%, -50%)',
              width: 16, height: 16,
              backgroundImage: `url(${getAssetPath(`Graphics/Pictures/mapplayer${avatarNum === '000' ? '000' : '001'}.png`)})`,
              backgroundSize: 'cover',
              zIndex: 4,
            }} />
          )}

          {/* Animated Cursor */}
          <div style={{
            position: 'absolute',
            left: `${selectedLoc.x}%`,
            top: `${selectedLoc.y}%`,
            transform: 'translate(-50%, -50%)',
            width: 24, height: 24,
            backgroundImage: `url(${getAssetPath('Graphics/Pictures/fly_cursor.png')})`,
            backgroundSize: 'cover',
            zIndex: 5,
            transition: 'left 0.2s ease-in-out, top 0.2s ease-in-out',
            animation: confirm ? 'pulse 0.5s infinite alternate' : 'none',
          }} />

        </div>
        
      </div>

      {/* Footer Info Panel */}
      <div style={{
        background: '#f8f8f8',
        borderTop: '3px solid #111',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: 65,
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
            backgroundColor: selectedLoc?.type === 'city' ? '#ef4444' : selectedLoc?.type === 'town' ? '#3b82f6' : '#64748b',
            padding: '4px 6px', borderRadius: '4px'
          }}>
            {selectedLoc?.type.toUpperCase()}
          </span>
        </div>
        
        <div style={{ fontSize: 7, color: '#666', lineHeight: '1.4' }}>
          {selectedLoc?.desc}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: 6, color: '#ef4444', animation: confirm ? 'flash 0.5s infinite' : 'none' }}>
            {selectedLoc?.id === currentMapId ? '▶ ESTÁS AQUÍ' : confirm ? '▶ [A] VIAJANDO...' : '▶ [A] CONFIRMAR VIAJE'}
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
          100% { transform: translate(-50%, -50%) scale(1.1); filter: brightness(1.3); }
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
