import React, { useState, useEffect, useRef } from 'react';

const Controls = ({ onDirectionChange, onA, onB, onStart }) => {
  const joystickRef = useRef(null);
  const [activeDir, setActiveDir] = useState(null);

  const handleTouch = (e) => {
    if (!joystickRef.current) return;
    const touch = e.touches[0];
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    let dir = null;
    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      if (angle > -45 && angle <= 45) dir = 'right';
      else if (angle > 45 && angle <= 135) dir = 'down';
      else if (angle > 135 || angle <= -135) dir = 'left';
      else if (angle > -135 && angle <= -45) dir = 'up';
    }
    
    if (dir !== activeDir) {
      setActiveDir(dir);
      if (onDirectionChange) onDirectionChange(dir);
    }
  };

  const handleEnd = () => {
    setActiveDir(null);
    if (onDirectionChange) onDirectionChange(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') onDirectionChange?.('up');
      if (key === 's' || key === 'arrowdown') onDirectionChange?.('down');
      if (key === 'a' || key === 'arrowleft') onDirectionChange?.('left');
      if (key === 'd' || key === 'arrowright') onDirectionChange?.('right');
      if (key === 'z') onA?.();
      if (key === 'x') onB?.();
      if (key === 'enter') onStart?.();
    };

    const handleKeyUp = (e) => {
      onDirectionChange?.(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onDirectionChange, onA, onB, onStart]);

  return (
    <div className="controls-container">
      {/* Joystick Area */}
      <div 
        className="d-pad" 
        ref={joystickRef}
        onTouchMove={handleTouch}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const handleMouse = (me) => {
             const dx = me.clientX - (rect.left + rect.width/2);
             const dy = me.clientY - (rect.top + rect.height/2);
             let dir = null;
             if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
               if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? 'right' : 'left';
               else dir = dy > 0 ? 'down' : 'up';
             }
             if (dir !== activeDir) {
               setActiveDir(dir);
               onDirectionChange?.(dir);
             }
          };
          window.addEventListener('mousemove', handleMouse);
          window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', handleMouse);
            setActiveDir(null);
            onDirectionChange?.(null);
          }, { once: true });
        }}
        style={{
          background: 'radial-gradient(circle, #444 0%, #222 100%)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '4px solid #111'
        }}
      >
        <div style={{
          width: '50px',
          height: '50px',
          background: '#555',
          borderRadius: '50%',
          transform: activeDir ? 
            (activeDir === 'up' ? 'translateY(-20px)' : 
             activeDir === 'down' ? 'translateY(20px)' :
             activeDir === 'left' ? 'translateX(-20px)' : 'translateX(20px)') 
            : 'none',
          transition: 'transform 0.1s'
        }} />
      </div>

      {/* Start/Select Area */}
      <div style={{ position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', pointerEvents: 'auto', zIndex: 2000 }}>
         <div onPointerDown={onStart} onClick={onStart} style={{ 
           width: '65px', height: '25px', background: '#e67e22', 
           borderRadius: '12px', transform: 'rotate(-25deg)',
           border: '3px solid #111', cursor: 'pointer',
           display: 'flex', justifyContent: 'center', alignItems: 'center',
           boxShadow: '3px 3px 0 #111'
         }}>
           <span style={{ fontSize: '4px', color: '#fff' }}>START</span>
         </div>
         <div style={{ 
           width: '40px', height: '12px', background: '#444', 
           borderRadius: '6px', transform: 'rotate(-25deg)',
           border: '2px solid #111', opacity: 0.5
         }}>
            <span style={{ fontSize: '4px', color: '#fff', marginLeft: '8px' }}>SELECT</span>
         </div>
      </div>

      {/* Buttons */}
      <div className="action-buttons">
        <div className="btn-circle btn-a" onPointerDown={onA}>A</div>
        <div className="btn-circle btn-b" onPointerDown={onB}>B</div>
      </div>
    </div>
  );
};

export default Controls;
