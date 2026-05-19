import React from 'react';
import { useGame } from '../context/GameContext';

const AgendaScreen = ({ onNavigate }) => {
  const { habitosHoy, darkMode } = useGame();

  const TIMES_ORDER = ['morning', 'midday', 'day', 'night'];
  const TIME_NAMES = {
    morning: { label: '☀️ MAÑANA', color: 'var(--retro-blue)' },
    midday: { label: '🕛 MEDIODÍA', color: 'var(--retro-gold)' },
    day: { label: '⛅ TARDE/DÍA', color: 'var(--retro-green)' },
    night: { label: '🌙 NOCHE', color: 'var(--retro-purple)' }
  };

  // Group habits by time of day (tiempo)
  const habitsByTime = habitosHoy.reduce((acc, h) => {
    const t = h.tiempo || 'day';
    if (!acc[t]) acc[t] = [];
    acc[t].push(h);
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
        {totalHabits === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', fontSize: 8, marginTop: '20px' }}>
            No hay hábitos configurados para hoy.
          </div>
        ) : (
          TIMES_ORDER.map(timeKey => {
            const habits = habitsByTime[timeKey] || [];
            if (habits.length === 0) return null;
            const timeInfo = TIME_NAMES[timeKey];

            return (
              <div key={timeKey} className="premium-card" style={{ padding: '12px', background: darkMode ? '#222' : '#fff' }}>
                <h3 style={{ fontSize: 8, color: timeInfo.color, margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '4px', fontFamily: '"Press Start 2P"' }}>
                  {timeInfo.label}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {habits.map(h => (
                    <div key={h.habito_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '14px', height: '14px', 
                        borderRadius: '50%', 
                        border: '2px solid',
                        borderColor: h.completado ? 'var(--retro-green)' : '#ccc',
                        background: h.completado ? 'var(--retro-green)' : 'transparent',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        flexShrink: 0
                      }}>
                        {h.completado && <span style={{ color: '#fff', fontSize: '8px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '10px', flexShrink: 0 }}>{h.icono || '⚔️'}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ 
                          fontSize: '8px', 
                          color: h.completado ? '#888' : 'var(--text-color)',
                          textDecoration: h.completado ? 'line-through' : 'none',
                          lineHeight: '1.4'
                        }}>
                          {h.nombre}
                        </span>
                        <span style={{ fontSize: '5px', color: '#999' }}>
                          {gymNames[h.gym_id] || h.gym_id.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
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
