import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const DailySetupScreen = ({ onNavigate }) => {
  const { template, fetchTemplate, setupDay } = useGame();
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, []);

  useEffect(() => {
    if (template && Array.isArray(template)) {
      const initial = [];
      template.forEach(gym => {
        if (gym.habitos && Array.isArray(gym.habitos)) {
          gym.habitos.forEach(task => {
            initial.push({
              gym_id: gym.gym_id,
              habito_id: task.id,
              habito_nombre: task.nombre,
              daño: task.daño,
              activo: task.activo !== false
            });
          });
        }
      });
      setSelectedHabits(initial);
    }
  }, [template]);

  const toggleHabit = (gymId, habitId) => {
    setSelectedHabits(prev => prev.map(h => 
      (h.gym_id === gymId && h.habito_id === habitId) ? { ...h, activo: !h.activo } : h
    ));
  };

  const handleStart = async () => {
    setLoading(true);
    const updatedTemplate = template.map(gym => ({
      ...gym,
      habitos: gym.habitos.map(h => {
        const selected = selectedHabits.find(sh => sh.gym_id === gym.gym_id && sh.habito_id === h.id);
        return { ...h, activo: selected ? selected.activo : h.activo };
      })
    }));

    await setupDay(updatedTemplate);
    onNavigate('MAP');
  };

  if (!template || !Array.isArray(template)) return <div style={S.screen}>CARGANDO...</div>;

  return (
    <div className="setup-screen" style={S.screen}>
      {/* Retro Pattern Background */}
      <div className="setup-pattern" />

      <div style={S.header}>
        <div style={S.titleBox}>
          <h2 style={S.h2}>TARJETA DE DESAFÍO</h2>
        </div>
        <p style={S.sub}>SELECCIONA TUS HÁBITOS DE HOY</p>
      </div>
      
      <div className="setup-list" style={S.list}>
        {template.map(gym => (
          <div key={gym.gym_id} style={S.gymCard}>
            <div style={S.gymHeader}>
               <span style={S.gymBadge}>{gym.tiempo === 'morning' ? '☀️' : gym.tiempo === 'night' ? '🌙' : '☁️'}</span>
               <h3 style={S.gymName}>{gym.gym_nombre.toUpperCase()}</h3>
            </div>

            <div style={S.habitsGrid}>
              {gym.habitos && Array.isArray(gym.habitos) && gym.habitos.map(task => {
                const isSelected = selectedHabits.find(h => h.gym_id === gym.gym_id && h.habito_id === task.id)?.activo;
                return (
                  <div 
                    key={task.id} 
                    onClick={() => toggleHabit(gym.gym_id, task.id)}
                    style={{
                      ...S.habitItem,
                      backgroundColor: isSelected ? '#fff' : 'rgba(255,255,255,0.05)',
                      color: isSelected ? '#1a237e' : '#fff',
                      border: isSelected ? '3px solid #ffea00' : '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span style={S.habitIcon}>{task.icono || '⚔️'}</span>
                    <div style={S.habitDetails}>
                      <span style={S.habitName}>{task.nombre.toUpperCase()}</span>
                    </div>
                    <div style={{...S.check, color: isSelected ? '#3D5AFE' : 'rgba(255,255,255,0.3)'}}>
                      {isSelected ? '▶' : ' '}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={S.footer}>
        <button 
          onClick={handleStart} 
          disabled={loading}
          className="gb-button primary"
          style={S.mainBtn}
        >
          {loading ? 'SINCRONIZANDO...' : '¡A LA AVENTURA!'}
        </button>
      </div>

      <style>{CSS}</style>
    </div>
  );
};

const S = {
  screen: {
    width: '100%', height: '100%', 
    background: '#1a1a2e', 
    display: 'flex', flexDirection: 'column', 
    padding: '16px', boxSizing: 'border-box',
    fontFamily: '"Press Start 2P", cursive',
    color: '#fff',
    overflow: 'hidden',
    position: 'relative'
  },
  header: {
    textAlign: 'center', marginBottom: '20px', zIndex: 2
  },
  titleBox: {
    background: '#ffea00',
    padding: '8px',
    border: '4px solid #fff',
    marginBottom: '8px',
    transform: 'skewX(-5deg)'
  },
  h2: { 
    margin: 0, fontSize: '12px', fontWeight: 900, color: '#1a1a2e' 
  },
  sub: { 
    margin: 0, fontSize: '6px', color: '#ffea00', opacity: 0.9
  },
  list: {
    flex: 1, overflowY: 'auto', paddingRight: '4px', zIndex: 2
  },
  gymCard: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '16px',
    border: '2px solid rgba(255,255,255,0.1)',
  },
  gymHeader: {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px'
  },
  gymBadge: { fontSize: '14px' },
  gymName: { margin: 0, fontSize: '8px', color: '#ffea00' },
  
  habitsGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  habitItem: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
    borderRadius: '2px', cursor: 'pointer', transition: 'all 0.1s',
    userSelect: 'none'
  },
  habitIcon: { fontSize: '14px' },
  habitDetails: { flex: 1 },
  habitName: { fontSize: '7px', fontWeight: 700 },
  check: { fontSize: '10px' },
  
  footer: { marginTop: '16px', zIndex: 2 },
  mainBtn: {
    width: '100%', padding: '18px', fontSize: '10px'
  }
};

const CSS = `
  .setup-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image: radial-gradient(#fff 1px, transparent 1px);
    background-size: 16px 16px;
    z-index: 1;
  }
  .setup-list::-webkit-scrollbar { width: 4px; }
  .setup-list::-webkit-scrollbar-track { background: transparent; }
  .setup-list::-webkit-scrollbar-thumb { background: #ffea00; }
`;

export default DailySetupScreen;
