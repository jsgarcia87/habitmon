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
        if (gym.pokemon && Array.isArray(gym.pokemon)) {
          gym.pokemon.forEach((pk, pkIdx) => {
            if (pk.habitos && Array.isArray(pk.habitos)) {
              pk.habitos.forEach(task => {
                initial.push({
                  gym_id: gym.gym_id,
                  pokemon_index: pkIdx,
                  habito_id: task.id,
                  habito_nombre: task.nombre,
                  daño: task.daño,
                  active: true
                });
              });
            }
          });
        }
      });
      setSelectedHabits(initial);
    }
  }, [template]);

  const toggleHabit = (gymId, habitId) => {
    setSelectedHabits(prev => prev.map(h => 
      (h.gym_id === gymId && h.habito_id === habitId) ? { ...h, active: !h.active } : h
    ));
  };

  const handleStart = async () => {
    setLoading(true);
    const activeOnes = selectedHabits.filter(h => h.active);
    await setupDay(activeOnes);
    setTimeout(() => {
      onNavigate('MAP');
    }, 500);
  };

  if (!template || !Array.isArray(template)) return <div style={S.screen}>CARGANDO DESAFÍOS...</div>;

  return (
    <div className="setup-screen" style={S.screen}>
      <div style={S.header}>
        <h2 style={S.h2}>TARJETA DE DESAFÍO</h2>
        <p style={S.sub}>Prepara tus ataques para la aventura de hoy</p>
      </div>
      
      <div className="setup-list" style={S.list}>
        {template.map(gym => (
          <div key={gym.gym_id} style={S.gymCard}>
            <div style={S.gymHeader}>
               <div style={S.gymBadge}>🏆</div>
               <div style={S.gymInfo}>
                 <h3 style={S.gymName}>{gym.gym_nombre.toUpperCase()}</h3>
                 <span style={S.gymTime}>{gym.tiempo === 'morning' ? '☀️ MAÑANA' : gym.tiempo === 'night' ? '🌙 NOCHE' : '☁️ DÍA'}</span>
               </div>
            </div>

            <div style={S.pkSection}>
              {gym.pokemon && Array.isArray(gym.pokemon) && gym.pokemon.map((pk, pkIdx) => (
                <div key={pkIdx} style={S.pkRow}>
                  <div style={S.pkAvatar}>
                    <img src={`Graphics/pokemon/${pk.id}.png`} style={S.pkImg} alt=""/>
                  </div>
                  <div style={S.habitsGrid}>
                    {pk.habitos && Array.isArray(pk.habitos) && pk.habitos.map(task => {
                      const isSelected = selectedHabits.find(h => h.gym_id === gym.gym_id && h.habito_id === task.id)?.active;
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => toggleHabit(gym.gym_id, task.id)}
                          style={{
                            ...S.habitItem,
                            backgroundColor: isSelected ? '#3D5AFE' : '#f5f5f5',
                            color: isSelected ? '#fff' : '#444',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: isSelected ? '0 4px 12px rgba(61,90,254,0.3)' : 'none'
                          }}
                        >
                          <span style={S.habitIcon}>{task.icono || '⚔️'}</span>
                          <div style={S.habitDetails}>
                            <span style={S.habitName}>{task.nombre}</span>
                            <span style={{...S.habitDmg, color: isSelected ? '#A1CAFF' : '#888'}}>PWR: {task.daño}</span>
                          </div>
                          <div style={{...S.check, opacity: isSelected ? 1 : 0.2}}>
                            {isSelected ? '●' : '○'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={S.footer}>
        <button 
          onClick={handleStart} 
          disabled={loading}
          style={{
            ...S.mainBtn,
            opacity: loading ? 0.7 : 1,
            transform: loading ? 'scale(0.98)' : 'scale(1)'
          }}
        >
          {loading ? 'SINCRONIZANDO...' : '¡COMENZAR DESAFÍO!'}
        </button>
      </div>

      <style>{CSS}</style>
    </div>
  );
};

const S = {
  screen: {
    width: '100%', height: '100%', 
    background: 'linear-gradient(135deg, #1a237e 0%, #121858 100%)', 
    display: 'flex', flexDirection: 'column', 
    padding: '12px', boxSizing: 'border-box',
    fontFamily: '"Outfit", "Roboto", sans-serif',
    color: '#fff',
    overflow: 'hidden'
  },
  header: {
    textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'
  },
  h2: { 
    margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '1px', color: '#ffea00' 
  },
  sub: { 
    margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7, fontWeight: 300 
  },
  list: {
    flex: 1, overflowY: 'auto', paddingRight: '4px'
  },
  gymCard: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
  },
  gymHeader: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'
  },
  gymBadge: {
    width: '40px', height: '40px', background: 'linear-gradient(45deg, #FFD600, #FFA000)',
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', boxShadow: '0 4px 15px rgba(255,160,0,0.4)'
  },
  gymInfo: { display: 'flex', flexDirection: 'column' },
  gymName: { margin: 0, fontSize: '14px', fontWeight: 700, color: '#fff' },
  gymTime: { fontSize: '10px', opacity: 0.6, fontWeight: 500 },
  
  pkSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  pkRow: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  pkAvatar: {
    width: '48px', height: '48px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  pkImg: { width: '40px', height: '40px', imageRendering: 'pixelated' },
  
  habitsGrid: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  habitItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none'
  },
  habitIcon: { fontSize: '18px' },
  habitDetails: { flex: 1, display: 'flex', flexDirection: 'column' },
  habitName: { fontSize: '12px', fontWeight: 600 },
  habitDmg: { fontSize: '9px', fontWeight: 700, marginTop: '2px' },
  check: { fontSize: '14px', fontWeight: 900 },
  
  footer: { marginTop: '12px' },
  mainBtn: {
    width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
    background: 'linear-gradient(45deg, #00C853, #64DD17)', color: '#fff',
    fontSize: '14px', fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,200,83,0.3)', transition: 'all 0.2s',
    fontFamily: '"Outfit", sans-serif'
  }
};

const CSS = `
  .setup-list::-webkit-scrollbar { width: 6px; }
  .setup-list::-webkit-scrollbar-track { background: transparent; }
  .setup-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
  .setup-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

export default DailySetupScreen;
