import React from 'react';

const HPBar = ({ current, max, name, level, alignment = 'player' }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let color = '#2ecc71'; 
  if (percentage < 50) color = '#f1c40f'; 
  if (percentage < 20) color = '#e74c3c'; 

const boxStyle = {
    backgroundColor: 'var(--bg-panel)',
    border: '4px double var(--border-color)',
    padding: '4px',
    width: '120px',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.1)',
    textAlign: 'left',
    position: 'relative',
    color: 'var(--text-main)'
  };

  return (
    <div style={boxStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span style={{ fontSize: '7px', fontWeight: 'bold', letterSpacing: '1px' }}>{name?.toUpperCase()}</span>
        <span style={{ fontSize: '7px' }}>Lv{level}</span>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        backgroundColor: '#444',
        padding: '2px',
        borderRadius: '2px'
      }}>
        <span style={{ color: '#f1c40f', fontSize: '6px', fontWeight: 'bold' }}>HP:</span>
        <div style={{ 
          flex: 1,
          height: '4px', 
          backgroundColor: '#222', 
          border: '1px solid #000',
          position: 'relative'
        }}>
          <div style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            backgroundColor: color,
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
      </div>

      {alignment === 'player' && (
        <div style={{ textAlign: 'right', fontSize: '7px', marginTop: '2px' }}>
          {Math.ceil(current)}/ {max}
        </div>
      )}
    </div>
  );
};

export default HPBar;
