import React, { useState, useEffect, useCallback } from 'react';

const LOCATIONS = [
  { id: 'Map002', name: 'Pueblo Primavera', shortName: 'PRIMAVERA', type: 'town',  x: 82, y: 40, mapId: 'Map002', spawn: { x: 12, y: 12 } },
  { id: 'Map010', name: 'Ciudad Trigal',    shortName: 'TRIGAL',    type: 'city',  x: 62, y: 20, mapId: 'Map010', spawn: { x: 21, y: 18 } },
  { id: 'Map008', name: 'Ruta 29',          shortName: 'RUTA 29',   type: 'route', x: 62, y: 40, mapId: 'Map008', spawn: { x: 21, y: 12 } },
  { id: 'Map070', name: 'Ciudad Fronsaf',   shortName: 'FRONSAF',   type: 'city',  x: 42, y: 40, mapId: 'Map070', spawn: { x: 18, y: 13 } },
  { id: 'Map029', name: 'Pueblo Ganymaho',  shortName: 'GANYMAHO',  type: 'town',  x: 62, y: 57, mapId: 'Map029', spawn: { x: 10, y: 16 } },
  { id: 'Map038', name: 'Ruta 30',          shortName: 'RUTA 30',   type: 'route', x: 62, y: 68, mapId: 'Map038', spawn: { x: 32, y: 13 } },
  { id: 'Map040', name: 'Ruta 31',          shortName: 'RUTA 31',   type: 'route', x: 62, y: 78, mapId: 'Map040', spawn: { x: 14, y: 21 } },
  { id: 'Map078', name: 'Ciudad Malva',     shortName: 'MALVA',     type: 'city',  x: 50, y: 87, mapId: 'Map078', spawn: { x: 14, y: 14 } },
  { id: 'Map013', name: 'Ruta 32',          shortName: 'RUTA 32',   type: 'route', x: 30, y: 87, mapId: 'Map013', spawn: { x: 10, y: 8  } },
];

const CONNECTIONS = [
  ['Map002', 'Map008'],
  ['Map008', 'Map010'],
  ['Map008', 'Map070'],
  ['Map008', 'Map029'],
  ['Map029', 'Map038'],
  ['Map038', 'Map040'],
  ['Map040', 'Map078'],
  ['Map078', 'Map013'],
];

const TYPE_COLOR = { city: '#FFD700', town: '#5af', route: '#888' };
const TYPE_SIZE  = { city: 12, town: 10, route: 7 };

export default function WorldMapScreen({ navigate, onFastTravel, currentMapId }) {
  const [sel, setSel] = useState(() => {
    const i = LOCATIONS.findIndex(l => l.id === currentMapId);
    return i >= 0 ? i : 0;
  });
  const [confirm, setConfirm] = useState(false);

  const travel = useCallback((loc) => {
    if (onFastTravel) onFastTravel(loc.mapId, loc.spawn);
    else navigate('city');
  }, [onFastTravel, navigate]);

  useEffect(() => {
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
  }, [sel, travel, navigate]);

  const selectedLoc = LOCATIONS[sel];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#2d5a1b',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Press Start 2P"',
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {/* Pixel grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }} />

      {/* Header */}
      <div style={{
        padding: '6px 10px', borderBottom: '3px solid #1a3a0a',
        background: '#1f4012', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 7, color: '#a8d878', letterSpacing: 1 }}>MAPA MUNDIAL</span>
        <span style={{ fontSize: 6, color: '#5a8a3a' }}>JOHTO</span>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* SVG route connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {CONNECTIONS.map(([aId, bId]) => {
            const a = LOCATIONS.find(l => l.id === aId);
            const b = LOCATIONS.find(l => l.id === bId);
            if (!a || !b) return null;
            const selA = LOCATIONS[sel]?.id === aId;
            const selB = LOCATIONS[sel]?.id === bId;
            const active = selA || selB;
            return (
              <line key={`${aId}-${bId}`}
                x1={`${a.x}%`} y1={`${a.y}%`}
                x2={`${b.x}%`} y2={`${b.y}%`}
                stroke={active ? '#d4f89a' : '#4a7a2b'}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray={active ? '' : '4,3'}
                filter={active ? 'url(#glow)' : ''}
              />
            );
          })}
        </svg>

        {/* Location markers */}
        {LOCATIONS.map((loc, i) => {
          const isSel = sel === i;
          const isCurrent = loc.id === currentMapId;
          const size = TYPE_SIZE[loc.type];
          return (
            <div
              key={loc.id}
              onClick={() => {
                if (isSel) { setConfirm(true); setTimeout(() => { travel(loc); setConfirm(false); }, 200); }
                else { setSel(i); setConfirm(false); }
              }}
              style={{
                position: 'absolute',
                left: `${loc.x}%`, top: `${loc.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer', zIndex: 3,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              {/* Dot */}
              <div style={{
                width: isSel ? size + 6 : size,
                height: isSel ? size + 6 : size,
                borderRadius: '50%',
                background: isSel ? '#fff' : TYPE_COLOR[loc.type],
                border: `2px solid ${isSel ? TYPE_COLOR[loc.type] : isCurrent ? '#0f0' : 'rgba(0,0,0,0.5)'}`,
                boxShadow: isSel
                  ? `0 0 8px ${TYPE_COLOR[loc.type]}, 0 0 16px ${TYPE_COLOR[loc.type]}66`
                  : isCurrent ? '0 0 5px #0f0' : 'none',
                transition: 'all 0.12s ease',
                position: 'relative',
              }}>
                {isCurrent && !isSel && (
                  <div style={{
                    position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 6, lineHeight: 1, color: '#0f0',
                  }}>▼</div>
                )}
              </div>
              {/* Label (only towns and cities) */}
              {loc.type !== 'route' && (
                <span style={{
                  fontSize: 5, color: isSel ? '#fff' : isCurrent ? '#7ef' : '#a8d878',
                  whiteSpace: 'nowrap', letterSpacing: 0,
                  textShadow: isSel ? `0 0 6px ${TYPE_COLOR[loc.type]}` : '1px 1px 0 #0a2005',
                }}>
                  {loc.shortName}
                </span>
              )}
              {/* Route label only when selected */}
              {loc.type === 'route' && isSel && (
                <span style={{ fontSize: 5, color: '#fff', whiteSpace: 'nowrap', textShadow: '1px 1px 0 #0a2005' }}>
                  {loc.shortName}
                </span>
              )}
            </div>
          );
        })}

        {/* Compass */}
        <div style={{
          position: 'absolute', top: 8, right: 10, zIndex: 3,
          fontSize: 7, color: '#4a7a2b',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr',
          gap: 1, width: 30, height: 30, textAlign: 'center',
        }}>
          <span/><span style={{ color: '#7aaa4a' }}>N</span><span/>
          <span style={{ color: '#7aaa4a' }}>O</span><span style={{ fontSize: 5, color: '#5a8a3a' }}>✦</span><span style={{ color: '#7aaa4a' }}>E</span>
          <span/><span style={{ color: '#7aaa4a' }}>S</span><span/>
        </div>
      </div>

      {/* Footer info panel */}
      <div style={{
        borderTop: '3px solid #1a3a0a',
        background: '#111',
        padding: '6px 10px',
        zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 48,
      }}>
        <div>
          <div style={{ fontSize: 7, color: TYPE_COLOR[selectedLoc?.type] || '#fff', marginBottom: 4 }}>
            {selectedLoc?.name}
          </div>
          <div style={{ fontSize: 5, color: '#556' }}>
            {selectedLoc?.id === currentMapId
              ? '★ UBICACIÓN ACTUAL'
              : confirm ? 'CONFIRMAR... [A] VIAJAR' : '[A] SELECCIONAR · [B] CERRAR'}
          </div>
        </div>
        <button
          onClick={() => navigate('city')}
          style={{
            background: 'none', border: '1px solid #334',
            color: '#556', fontSize: 6, fontFamily: '"Press Start 2P"',
            padding: '4px 8px', cursor: 'pointer',
          }}
        >
          [B]
        </button>
      </div>
    </div>
  );
}
