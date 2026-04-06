import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const DailySetupScreen = ({ onNavigate }) => {
  const { template, fetchTemplate, setupDay } = useGame();
  const [selectedHabits, setSelectedHabits] = useState([]);

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
    const activeOnes = selectedHabits.filter(h => h.active);
    await setupDay(activeOnes);
    onNavigate('MAP');
  };

  if (!template || !Array.isArray(template)) return <div style={screenStyle}>CARGANDO...</div>;

  return (
    <div className="setup-screen" style={screenStyle}>
      <div style={headerStyle}>
        <h2 style={h2Style}>AJUSTE DIARIO</h2>
        <p style={subStyle}>Selecciona lo que harás hoy</p>
      </div>
      
      <div className="setup-list" style={listStyle}>
        {template.map(gym => (
          <div key={gym.gym_id} style={gymBoxStyle}>
            <div style={gymHeaderStyle}>
               <span style={gymIconStyle}>🏆</span>
               <h3 style={gymH3Style}>{gym.gym_nombre}</h3>
            </div>
            {gym.pokemon && Array.isArray(gym.pokemon) && gym.pokemon.map((pk, pkIdx) => (
              <div key={pk.nombre || pkIdx} style={pkStyle}>
                <div style={pkInfoStyle}>
                   <img src={`Graphics/pokemon/${pk.id}.png`} style={pkIconStyle} alt=""/>
                   <span style={pkNameStyle}>{pk.nombre}</span>
                </div>
                <div style={habitsGridStyle}>
                  {pk.habitos && Array.isArray(pk.habitos) && pk.habitos.map(task => {
                    const isSelected = selectedHabits.find(h => h.gym_id === gym.gym_id && h.habito_id === task.id)?.active;
                    return (
                      <div 
                        key={task.id} 
                        onClick={() => toggleHabit(gym.gym_id, task.id)}
                        style={{
                          ...habitCardStyle,
                          backgroundColor: isSelected ? '#3048a8' : '#fff',
                          color: isSelected ? '#fff' : '#333',
                          borderColor: isSelected ? '#203070' : '#ccc'
                        }}
                      >
                        <span style={habitIconStyle}>{task.icono || '🐾'}</span>
                        <span style={habitLabelStyle}>{task.nombre}</span>
                        {isSelected && <span style={checkMarkStyle}>✔</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button onClick={handleStart} className="gb-button" style={buttonStyle}>
        ¡COMENZAR AVENTURA!
      </button>
    </div>
  );
};

// --- Estilos Mejorados ---
const screenStyle = { 
  width: '100%', height: '100%', backgroundColor: '#e0e0e0', 
  display: 'flex', flexDirection: 'column', padding: '15px', 
  fontFamily: '"Press Start 2P"', boxSizing: 'border-box'
};
const headerStyle = { marginBottom: '20px', textAlign: 'center' };
const h2Style = { fontSize: '12px', color: '#333', margin: '0 0 8px 0' };
const subStyle = { fontSize: '8px', color: '#666', margin: 0 };
const listStyle = { flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' };
const gymBoxStyle = { 
  border: '4px solid #333', backgroundColor: '#fff', padding: '12px', 
  marginBottom: '15px', borderRadius: '4px', boxShadow: '4px 4px 0 #999' 
};
const gymHeaderStyle = { display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #eee', paddingBottom: '8px', marginBottom: '12px' };
const gymIconStyle = { fontSize: '14px' };
const gymH3Style = { fontSize: '10px', color: '#3048a8', margin: 0 };
const pkStyle = { marginBottom: '15px' };
const pkInfoStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' };
const pkIconStyle = { width: '32px', height: '32px', imageRendering: 'pixelated' };
const pkNameStyle = { fontSize: '9px', color: '#ff1111' };
const habitsGridStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
const habitCardStyle = { 
  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', 
  border: '2px solid', cursor: 'pointer', transition: 'all 0.1s',
  borderRadius: '4px', position: 'relative'
};
const habitIconStyle = { fontSize: '16px', minWidth: '24px', textAlign: 'center' };
const habitLabelStyle = { fontSize: '8px', flex: 1, lineHeight: '1.4' };
const checkMarkStyle = { fontSize: '10px', fontWeight: 'bold' };
const buttonStyle = { 
  padding: '18px', backgroundColor: '#e4000f', color: '#fff', 
  border: '4px solid #8b0000', cursor: 'pointer', fontSize: '10px',
  boxShadow: '0 4px 0 #8b0000', activeShadow: 'none', transform: 'translateY(0)'
};

export default DailySetupScreen;
