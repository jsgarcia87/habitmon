import React from 'react';
import { getAssetPath } from '../api/assets';

const HPBar = ({ current, max, name, level, alignment = 'player', exp = 0 }) => {
  const [displayHP, setDisplayHP] = React.useState(current);

  React.useEffect(() => {
    let frame;
    const target = current;
    const animate = () => {
      setDisplayHP(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.1) return target;
        return prev + diff * 0.1; // Smooth lerp
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [current]);

  const percentage = Math.max(0, Math.min(100, (displayHP / max) * 100));
  const expPercentage = Math.min(100, (exp / (level || 1))); 
  
  let hpColor = '#32cd32'; // Green
  if (percentage < 50) hpColor = '#fdec31'; // Yellow
  if (percentage < 20) hpColor = '#e74c3c'; // Red

  const containerStyle = {
    position: 'relative',
    width: '192px',
    height: '78px',
    backgroundImage: `url(${getAssetPath(alignment === 'player' ? 'Graphics/pictures/battle/databox_normal.png' : 'Graphics/pictures/battle/databox_normal_foe.png')})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    fontFamily: '"Press Start 2P", monospace',
    color: '#333'
  };

  const nameStyle = {
    position: 'absolute',
    left: '16px',
    top: '12px',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#444'
  };

  const levelStyle = {
    position: 'absolute',
    right: '24px',
    top: '12px',
    fontSize: '9px',
    color: '#444'
  };

  const hpContainerStyle = {
    position: 'absolute',
    left: '82px',
    top: '38px',
    width: '96px',
    height: '12px',
    backgroundColor: '#000',
    border: '1px solid #111',
    borderRadius: '1px',
    overflow: 'hidden'
  };

  const hpFillStyle = {
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: hpColor,
  };

  // EXP Bar (Only for player)
  const expBarStyle = {
    position: 'absolute',
    left: '42px',
    bottom: '8px',
    width: '136px',
    height: '3px',
    backgroundColor: '#222',
    display: alignment === 'player' ? 'block' : 'none'
  };

  const expFillStyle = {
    width: `${expPercentage}%`,
    height: '100%',
    backgroundColor: '#4080F0'
  };

  const textHpStyle = {
    position: 'absolute',
    right: '24px',
    bottom: '18px',
    fontSize: '8px',
    color: '#444',
    display: alignment === 'player' ? 'block' : 'none'
  };

  return (
    <div style={containerStyle}>
      <div style={nameStyle}>{name?.toUpperCase()}</div>
      <div style={levelStyle}>Lv{level}</div>
      <div style={hpContainerStyle}>
        <div style={hpFillStyle} />
      </div>
      <div style={textHpStyle}>
        {Math.ceil(current)} / {max}
      </div>
      <div style={expBarStyle}>
        <div style={expFillStyle} />
      </div>
    </div>
  );
};

export default HPBar;
