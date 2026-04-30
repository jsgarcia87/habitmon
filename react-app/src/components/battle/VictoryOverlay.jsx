import React from 'react';
import { getAssetPath } from '../../api.js';

const VictoryOverlay = ({ 
  victoryData, 
  displayXp, 
  displayMonedas, 
  showContinueHint, 
  onClose 
}) => {
  if (!victoryData) return null;

  return (
    <div style={S.overlay} onClick={showContinueHint ? onClose : null}>
      <div style={S.card}>
        <div style={S.header}>¡VICTORIA!</div>
        
        <div style={S.body}>
          <div style={S.statRow}>
            <span>EXP GANADA:</span>
            <span style={S.val}>+{displayXp}</span>
          </div>
          <div style={S.statRow}>
            <span>MONEDAS:</span>
            <span style={S.val}>+{displayMonedas}</span>
          </div>
          
          {victoryData.medallaUrl && (
            <div style={S.badgeSection}>
              <div style={S.badgeLabel}>¡MEDALLA OBTENIDA!</div>
              <img 
                src={getAssetPath(victoryData.medallaUrl)} 
                alt="Medalla" 
                style={S.badgeImg} 
              />
            </div>
          )}

          {victoryData.levelUp && (
            <div style={S.levelUp}>¡SUBISTE DE NIVEL!</div>
          )}
        </div>

        {showContinueHint && (
          <div style={S.footer}>Toca para continuar...</div>
        )}
      </div>
    </div>
  );
};

const S = {
  overlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 100, cursor: 'pointer'
  },
  card: {
    width: '80%', background: '#f8f8f0', border: '4px solid #444',
    borderRadius: '8px', padding: '16px', fontFamily: '"Press Start 2P", monospace',
    boxShadow: '0 0 20px rgba(255,215,0,0.3)'
  },
  header: {
    textAlign: 'center', color: '#e67e22', fontSize: '12px', marginBottom: '16px',
    borderBottom: '2px solid #ddd', paddingBottom: '8px'
  },
  body: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '8px' },
  val: { color: '#27ae60' },
  badgeSection: { 
    marginTop: '10px', display: 'flex', flexDirection: 'column', 
    alignItems: 'center', gap: '8px', border: '1px dashed #ccc', padding: '10px'
  },
  badgeLabel: { fontSize: '6px', color: '#888' },
  badgeImg: { width: '40px', height: '40px', imageRendering: 'pixelated' },
  levelUp: { 
    textAlign: 'center', color: '#f1c40f', fontSize: '9px', 
    marginTop: '8px', animation: 'pulse 1s infinite' 
  },
  footer: { 
    textAlign: 'center', fontSize: '6px', color: '#aaa', marginTop: '16px' 
  }
};

export default VictoryOverlay;
