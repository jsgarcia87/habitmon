import React from 'react';

const HPBar = ({ current, max, label = 'HP' }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let color = '#2ecc71'; // Green
  if (percentage < 50) color = '#f1c40f'; // Yellow
  if (percentage < 20) color = '#e74c3c'; // Red

  return (
    <div style={{ width: '100%', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '8px' }}>{label}</span>
        <span style={{ fontSize: '8px' }}>{current}/{max}</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: '#ddd', 
        border: '2px solid #333',
        padding: '1px'
      }}>
        <div style={{ 
          width: `${percentage}%`, 
          height: '100%', 
          backgroundColor: color,
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
    </div>
  );
};

export default HPBar;
