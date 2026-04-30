import React from 'react';
import { useGame } from '../context/GameContext';

const AgendaScreen = ({ onNavigate }) => {
  const { habitosHoy, darkMode } = useGame();

  // Group habits by Gym
  const habitsByGym = habitosHoy.reduce((acc, h) => {
    if (!acc[h.gym_id]) acc[h.gym_id] = [];
    acc[h.gym_id].push(h);
    return acc;
  }, {});

  const gymNames = {
    'vestirse': 'Gimnasio Vestirse',
    'desayuno': 'Gimnasio Desayuno',
    'higiene': 'Gimnasio Higiene',
    'orden': 'Gimnasio Orden'
  };

  // Check if all habits are completed
  const totalHabits = habitosHoy.length;
  const completedHabits = habitosHoy.filter(h => h.completado).length;
  const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  return (
    <div className="screen-container" style={{
      background: 'var(--bg-color)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      overflowY: 'auto'
    }}>
      
      {/* HEADER */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px'
      }}>
        <h2 style={{ fontSize: 10, color: 'var(--retro-gold)', margin: 0 }}>AGENDA DIARIA</h2>
        <div style={{ fontSize: 8, color: '#888' }}>
          {completedHabits} / {totalHabits}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ width: '100%', maxWidth: '340px', background: '#333', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--retro-green)', transition: 'width 0.3s ease' }} />
      </div>

      {/* HABIT LIST */}
      <div style={{
        width: '100%',
        maxWidth: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {Object.keys(habitsByGym).length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 8, marginTop: '20px' }}>
            No hay hábitos configurados para hoy.
          </div>
        ) : (
          Object.keys(habitsByGym).map(gymId => (
            <div key={gymId} className="premium-card" style={{ padding: '12px', background: darkMode ? '#222' : '#fff' }}>
              <h3 style={{ fontSize: 8, color: 'var(--retro-blue)', margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                {gymNames[gymId] || gymId.toUpperCase()}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {habitsByGym[gymId].map(h => (
                  <div key={h.habito_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '16px', height: '16px', 
                      borderRadius: '50%', 
                      border: '2px solid',
                      borderColor: h.completado ? 'var(--retro-green)' : '#ccc',
                      background: h.completado ? 'var(--retro-green)' : 'transparent',
                      display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }}>
                      {h.completado && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '12px' }}>{h.icono || '⚔️'}</span>
                    <span style={{ 
                      fontSize: '8px', 
                      color: h.completado ? '#888' : 'var(--text-color)',
                      textDecoration: h.completado ? 'line-through' : 'none'
                    }}>
                      {h.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ width: '100%', maxWidth: '340px', marginTop: 'auto', paddingTop: '20px' }}>
        <button
          onClick={() => onNavigate('city')}
          className="gb-button secondary"
          style={{ width: '100%', padding: '12px' }}
        >
          VOLVER AL MAPA
        </button>
      </div>

    </div>
  );
};

export default AgendaScreen;
