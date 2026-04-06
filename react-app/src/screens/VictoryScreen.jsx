import React from 'react';

const VictoryScreen = ({ reward, onNavigate }) => {
  if (!reward) return <div>Cargando recompensa...</div>;

  return (
    <div className="screen victory-screen">
      <h1 className="victory-text blink">¡VICTORIA!</h1>
      
      <div className="medal-container gb-box">
        <div className="medal-icon shake">
          {reward.icono}
        </div>
      </div>
      
      <div className="dialog-box">
        <p>¡Has obtenido la {reward.nombre}!</p>
        <p style={{ marginTop: '8px', fontSize: '8px' }}>{reward.descripcion}</p>
      </div>

      <div style={{ position: 'absolute', bottom: '60px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <button className="gb-button" onClick={() => onNavigate('MAP')}>
          CONTINUAR
        </button>
      </div>

      <style>{`
        .screen {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--gb-dark);
          position: relative;
        }
        .victory-text {
          color: var(--gb-light);
          margin-top: 40px;
          text-shadow: 4px 4px 0 var(--text-color);
          font-size: 24px;
        }
        .medal-container {
          margin-top: 60px;
          border-width: 8px;
          padding: 30px;
          background-color: var(--gb-med-light);
        }
        .medal-icon {
          font-size: 64px;
          filter: drop-shadow(4px 4px 0 var(--text-color));
        }
        /* Custom absolute override for dialog box */
        .victory-screen .dialog-box {
          height: 120px;
          bottom: 120px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default VictoryScreen;
