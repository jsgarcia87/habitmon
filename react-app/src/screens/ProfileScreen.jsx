import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import CalendarView from '../components/CalendarView';

const ProfileScreen = ({ onNavigate }) => {
  const { user, starter, coleccion, gimnasiosHoy, stats, darkMode, toggleDarkMode } = useGame();
  const [isFlipped, setIsFlipped] = useState(false);

  const formatID = (id) => String(id || 0).padStart(5, '0');

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
        <h2 style={{ fontSize: 10, color: 'var(--retro-gold)', margin: 0 }}>FICHA ENTRENADOR</h2>
        <button 
          onClick={toggleDarkMode}
          className="gb-button"
          style={{ padding: '6px 10px', fontSize: 7, minWidth: '40px' }}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* TRAINER CARD CONTAINER */}
      <div 
        className={`premium-card animate-fade-in-up ${isFlipped ? 'flipped' : ''}`}
        style={{
          width: '100%',
          maxWidth: '340px',
          minHeight: '200px',
          padding: '24px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#f8f8d8', // Auténtico color beige de ficha GSC
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
        }}
      >
        {!isFlipped ? (
          <>
            {/* FRONT SIDE */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Left: Avatar Section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '80px',
                  height: '100px',
                  background: '#fff',
                  border: '3px solid #333',
                  boxShadow: 'inset 2px 2px 0px rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>

                  <div style={{
                    width: 32, height: 40,
                    backgroundImage: `url(Graphics/characters/trchar${String(user?.avatar || 0).padStart(3, '0')}.png)`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '0 0',
                    imageRendering: 'pixelated',
                    transform: 'scale(2)',
                  }} />
                </div>
                <div style={{ fontSize: 7, color: '#666' }}>ID No. {formatID(user?.id)}</div>
              </div>

              {/* Right: Info Section */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: 6, color: '#888', marginBottom: '4px' }}>NOMBRE:</div>
                  <div style={{ fontSize: 10, color: '#222', borderBottom: '2px solid #ddd', paddingBottom: '4px' }}>
                    {user?.username?.toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: 6, color: '#888', marginBottom: '4px' }}>DINERO:</div>
                  <div style={{ fontSize: 9, color: 'var(--retro-green)' }}>
                    $ {user?.monedas || 0}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 6, color: '#888', marginBottom: '4px' }}>POKÉDEX:</div>
                  <div style={{ fontSize: 9, color: '#222' }}>
                    {coleccion?.length || 0} PKMN
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div style={{
              marginTop: '8px',
              border: '2px solid #eee',
              borderRadius: '4px',
              padding: '10px',
              background: 'rgba(0,0,0,0.02)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                const badgeId = `gym${i}`;
                const hasBadge = gimnasiosHoy?.some(g => g.gym_id === badgeId && g.completado) || stats?.medallas_ganadas?.includes(badgeId);
                return (
                  <div key={i} style={{
                    aspectRatio: '1',
                    background: hasBadge ? 'var(--retro-gold)' : '#e0e0e0',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '12px',
                    filter: hasBadge ? 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' : 'none',
                    opacity: hasBadge ? 1 : 0.3,
                    border: hasBadge ? '2px solid #fff' : '2px dashed #ccc'
                  }}>
                    {hasBadge ? '🏅' : ''}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* BACK SIDE (Stats & Calendar) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: 8, color: 'var(--retro-blue)', margin: '0 0 8px 0' }}>ESTADÍSTICAS DE HÁBITOS</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 7, color: '#666' }}>HÁBITOS TOTALES:</span>
              <span style={{ fontSize: 8, color: '#333' }}>{stats?.total_habitos || 0}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 7, color: '#666' }}>RACHA ACTUAL:</span>
              <span style={{ fontSize: 8, color: 'var(--retro-red)' }}>7 DÍAS</span>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: 6, color: '#888', marginBottom: '8px' }}>CALENDARIO RECIENTE:</div>
              <div style={{ transform: 'scale(0.9)', transformOrigin: 'top left' }}>
                <CalendarView history={stats?.historial || {}} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="gb-button primary"
          style={{ width: '100%', padding: '12px' }}
        >
          {isFlipped ? '◀ VER FRENTE' : 'VER ESTADÍSTICAS ▶'}
        </button>

        <button 
          onClick={() => onNavigate('admin')}
          className="gb-button"
          style={{ width: '100%', padding: '12px', color: 'var(--retro-blue)', borderColor: 'var(--retro-blue)' }}
        >
          ⚙️ CONFIGURAR HÁBITOS
        </button>

        <button
          onClick={() => onNavigate('city')}
          className="gb-button secondary"
          style={{ width: '100%', padding: '12px', marginTop: '10px' }}
        >
          VOLVER AL MAPA
        </button>
      </div>

      <style>{`
        .flipped {
          transform: rotateY(10deg); /* Subtle effect since we change content */
        }
      `}</style>
    </div>
  );
};

export default ProfileScreen;
