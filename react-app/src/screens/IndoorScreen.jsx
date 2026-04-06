import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

/**
 * IndoorScreen — Pantalla interior (Centro Pokémon / Casa)
 * Se activa cuando el jugador entra a un edificio en el mapa.
 *
 * Funciones:
 *  - 🏥 Curar equipo (reset de estado visual de batalla)
 *  - 🏆 Ver logros (gimnasios completados)
 *  - 📝 Editar hábitos del día
 *  - 🚪 Salir
 */
const IndoorScreen = ({ buildingType = 'house', onNavigate }) => {
  const { progress, template, user } = useGame();
  const [healing, setHealing] = useState(false);
  const [healed, setHealed] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null); // 'logros' | null

  const completedGyms = progress?.gimnasios_completados || [];
  const totalGyms = template?.length || 0;

  const handleHeal = async () => {
    if (healed) return;
    setHealing(true);
    await new Promise(r => setTimeout(r, 2000));
    setHealing(false);
    setHealed(true);
  };

  const isPokemonCenter = buildingType === 'pokecenter';

  return (
    <div style={s.screen}>
      {/* Header del edificio */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => onNavigate('MAP')}>← SALIR</button>
        <h2 style={s.title}>
          {isPokemonCenter ? '🏥 CENTRO POKÉMON' : '🏠 TU CASA'}
        </h2>
        <div style={s.headerRight} />
      </div>

      {/* Interior illustration */}
      <div style={s.interior}>
        <div style={s.floorPattern} />
        {isPokemonCenter ? (
          <div style={s.nurseArea}>
            <div style={s.nurseIcon}>👩‍⚕️</div>
            <div style={s.nurseName}>ENFERMERA JOY</div>
          </div>
        ) : (
          <div style={s.nurseArea}>
            <div style={s.nurseIcon}>🧑‍💻</div>
            <div style={s.nurseName}>TÚ</div>
          </div>
        )}
      </div>

      {/* Menú de opciones */}
      <div style={s.menuArea}>
        {activeMenu === null && (
          <div style={s.menuGrid}>

            {/* Curar equipo */}
            <button
              style={{ ...s.menuBtn, ...s.healBtn, opacity: healed ? 0.6 : 1 }}
              onClick={handleHeal}
              disabled={healed}
            >
              <span style={s.menuIcon}>🏥</span>
              <span style={s.menuLabel}>
                {healing ? 'CURANDO...' : healed ? '¡CURADO!' : 'CURAR\nEQUIPO'}
              </span>
              {healing && <div style={s.healBar}><div style={s.healFill} /></div>}
            </button>

            {/* Ver logros */}
            <button
              style={{ ...s.menuBtn, ...s.logrosBtn }}
              onClick={() => setActiveMenu('logros')}
            >
              <span style={s.menuIcon}>🏆</span>
              <span style={s.menuLabel}>
                {`VER\nLOGROS\n${completedGyms.length}/${totalGyms}`}
              </span>
            </button>

            {/* Editar hábitos */}
            <button
              style={{ ...s.menuBtn, ...s.habitsBtn }}
              onClick={() => onNavigate('EDIT_HABITS')}
            >
              <span style={s.menuIcon}>📝</span>
              <span style={s.menuLabel}>EDITAR\nHÁBITOS</span>
            </button>

            {/* Perfil */}
            <button
              style={{ ...s.menuBtn, ...s.profileBtn }}
              onClick={() => onNavigate('PROFILE')}
            >
              <span style={s.menuIcon}>👤</span>
              <span style={s.menuLabel}>VER\nPERFIL</span>
            </button>
          </div>
        )}

        {/* Sub-menú: Logros */}
        {activeMenu === 'logros' && (
          <div style={s.subMenu}>
            <button style={s.subBackBtn} onClick={() => setActiveMenu(null)}>← VOLVER</button>
            <h3 style={s.subTitle}>🏆 LOGROS DEL ENTRENADOR</h3>
            <div style={{ fontSize: '7px', color: '#888', marginBottom: '8px', textAlign: 'center' }}>
              {completedGyms.length} de {totalGyms} gimnasios conquistados
            </div>

            <div style={s.logrosGrid}>
              {(template || []).map(gym => {
                const done = completedGyms.includes(gym.gym_id);
                return (
                  <div key={gym.gym_id} style={{ ...s.logroCard, ...(!done ? s.logroLocked : {}) }}>
                    <span style={s.logroIcon}>{done ? '🏅' : '🔒'}</span>
                    <span style={s.logroName}>{gym.gym_nombre.replace('Gimnasio ', '')}</span>
                    {done
                      ? <span style={s.logroBadge}>✓ SUPERADO</span>
                      : <span style={s.logroBadgePending}>PENDIENTE</span>
                    }
                  </div>
                );
              })}
            </div>

            {/* Estadísticas */}
            <div style={s.statsBox}>
              <p style={s.statItem}>🎯 Hábitos de hoy: {progress?.habitos?.length || 0}</p>
              <p style={s.statItem}>✅ Completados: {progress?.habitos?.filter(h => h.completado).length || 0}</p>
            </div>
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
};

const s = {
  screen: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"Press Start 2P", cursive',
    backgroundColor: '#1a1a2e',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#16213e',
    borderBottom: '3px solid #0f3460',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none', border: '2px solid #e94560', color: '#e94560',
    padding: '6px 10px', fontSize: '7px',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
  },
  title: {
    fontSize: 'clamp(8px, 2.5vw, 12px)', color: '#eee', textAlign: 'center',
  },
  headerRight: { width: '80px' },

  interior: {
    height: '120px', flexShrink: 0,
    background: 'linear-gradient(to bottom, #2a1a0e 0%, #4a3020 60%, #8B6040 60%, #B88060 100%)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  floorPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 32px)',
  },
  nurseArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '4px', position: 'absolute', bottom: '8px',
  },
  nurseIcon: { fontSize: '36px' },
  nurseName: { fontSize: '7px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 6px' },

  menuArea: {
    flex: 1, overflowY: 'auto', padding: '12px',
    display: 'flex', flexDirection: 'column',
  },
  menuGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '10px', flex: 1,
  },
  menuBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '8px',
    border: '3px solid', borderRadius: '8px',
    padding: '12px', cursor: 'pointer',
    fontFamily: '"Press Start 2P", cursive',
    minHeight: '90px', transition: 'transform 0.1s, box-shadow 0.1s',
    WebkitTapHighlightColor: 'transparent',
  },
  healBtn: {
    backgroundColor: '#1a3a1a', borderColor: '#4caf50',
    color: '#4caf50', boxShadow: '0 3px 0 #2a7a2a',
  },
  logrosBtn: {
    backgroundColor: '#3a2a1a', borderColor: '#f0c020',
    color: '#f0c020', boxShadow: '0 3px 0 #8a6a00',
  },
  habitsBtn: {
    backgroundColor: '#1a2a3a', borderColor: '#4090f0',
    color: '#4090f0', boxShadow: '0 3px 0 #205090',
  },
  profileBtn: {
    backgroundColor: '#2a1a3a', borderColor: '#b060f0',
    color: '#b060f0', boxShadow: '0 3px 0 #7030a0',
  },
  menuIcon: { fontSize: 'clamp(24px, 7vw, 32px)' },
  menuLabel: {
    fontSize: 'clamp(6px, 1.6vw, 8px)',
    textAlign: 'center', lineHeight: '1.8', whiteSpace: 'pre-wrap',
  },
  healBar: {
    width: '100%', height: '6px',
    backgroundColor: '#0a2a0a', border: '1px solid #4caf50',
    borderRadius: '3px', overflow: 'hidden',
  },
  healFill: {
    height: '100%', backgroundColor: '#4caf50',
    animation: 'heal-fill 2s linear forwards',
  },

  // Sub-menu logros
  subMenu: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  subBackBtn: {
    background: 'none', border: '2px solid #888', color: '#aaa',
    padding: '6px 10px', fontSize: '7px',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
    alignSelf: 'flex-start',
  },
  subTitle: {
    fontSize: 'clamp(9px, 2.5vw, 12px)', color: '#f0c020', textAlign: 'center',
  },
  logrosGrid: {
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  logroCard: {
    display: 'flex', alignItems: 'center', gap: '8px',
    backgroundColor: '#1e3a1e', border: '2px solid #4caf50',
    borderRadius: '4px', padding: '8px 10px',
  },
  logroLocked: {
    backgroundColor: '#1a1a1a', border: '2px solid #444',
  },
  logroIcon: { fontSize: '18px' },
  logroName: { fontSize: 'clamp(6px, 1.6vw, 8px)', color: '#ddd', flex: 1 },
  logroBadge: {
    fontSize: '6px', color: '#4caf50', fontWeight: 'bold',
  },
  logroBadgePending: {
    fontSize: '6px', color: '#888',
  },
  statsBox: {
    backgroundColor: '#0f1a0f', border: '2px solid #2a4a2a',
    borderRadius: '4px', padding: '10px', marginTop: '8px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  },
  statItem: { fontSize: 'clamp(7px, 1.8vw, 9px)', color: '#ccc' },
};

const CSS = `
  @keyframes heal-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .menuBtn:active {
    transform: translate(1px, 2px);
    box-shadow: none !important;
  }
`;

export default IndoorScreen;
