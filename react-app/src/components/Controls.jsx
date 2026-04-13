import React, { useState, useEffect, useCallback } from 'react';

const Controls = ({ onDirectionChange, onA, onB, onStart }) => {
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);
  const [activeDir, setActiveDir] = useState(null);

  const calculateDirection = (dx, dy) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 15) return null;
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle > -45 && angle <= 45) return 'right';
    else if (angle > 45 && angle <= 135) return 'down';
    else if (angle > 135 || angle <= -135) return 'left';
    else if (angle > -135 && angle <= -45) return 'up';
    return null;
  };

  const onJoystickStart = (e) => {
    setJoystickActive(true);
    handleInput(e);
  };

  const onJoystickMove = (e) => {
    if (!joystickActive) return;
    handleInput(e);
  };

  const onJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    if (activeDir) {
      setActiveDir(null);
      onDirectionChange?.(null);
    }
  };

  const handleInput = (e) => {
    const rect = e.currentTarget.closest('.joystick-container').getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - (rect.left + rect.width / 2);
    const dy = touch.clientY - (rect.top + rect.height / 2);
    
    // Limit joystick visually
    const dist = Math.sqrt(dx * dx + dy * dy);
    const max = 30;
    const lx = dist > max ? (dx / dist) * max : dx;
    const ly = dist > max ? (dy / dist) * max : dy;
    
    setJoystickPos({ x: lx, y: ly });
    
    const dir = calculateDirection(dx, dy);
    if (dir !== activeDir) {
      setActiveDir(dir);
      onDirectionChange?.(dir);
    }
  };

  const handleKey = (key, state) => {
    if (state === 'down') {
      if (key === 'z') onA?.();
      if (key === 'x') onB?.();
    }
  };

  // Keyboard fallbacks
  useEffect(() => {
    const handleKD = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') onDirectionChange?.('up');
      if (key === 's' || key === 'arrowdown') onDirectionChange?.('down');
      if (key === 'a' || key === 'arrowleft') onDirectionChange?.('left');
      if (key === 'd' || key === 'arrowright') onDirectionChange?.('right');
      if (key === 'z') onA?.();
      if (key === 'x') onB?.();
      if (key === 'enter') onStart?.();
    };
    const handleKU = (e) => {
      const key = e.key.toLowerCase();
      if (['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
        onDirectionChange?.(null);
      }
    };
    window.addEventListener('keydown', handleKD);
    window.addEventListener('keyup', handleKU);
    return () => {
      window.removeEventListener('keydown', handleKD);
      window.removeEventListener('keyup', handleKU);
    };
  }, [onDirectionChange, onA, onB, onStart]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 50
    }}>
      {/* D-PAD — esquina inferior izquierda */}
      <div className="joystick-container" style={{
        position: 'absolute',
        bottom: 40,
        left: 30,
        pointerEvents: 'auto'
      }}>
        <div
          onTouchStart={onJoystickStart}
          onTouchMove={onJoystickMove}
          onTouchEnd={onJoystickEnd}
          onMouseDown={onJoystickStart}
          onMouseMove={onJoystickMove}
          onMouseUp={onJoystickEnd}
          onMouseLeave={onJoystickEnd}
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            touchAction: 'none'
          }}
        >
          {/* Punto central del joystick */}
          <div style={{
            width: 35,
            height: 35,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            border: '2px solid rgba(255,255,255,0.6)',
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            transition: joystickActive ? 'none' : 'transform 0.1s ease'
          }}/>
        </div>
      </div>

      {/* BOTONES A/B — esquina inferior derecha */}
      <div style={{
        position: 'absolute',
        bottom: 44,
        right: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center',
        pointerEvents: 'auto'
      }}>
        <button
          onTouchStart={() => handleKey('z','down')}
          onTouchEnd={() => handleKey('z','up')}
          onMouseDown={() => handleKey('z','down')}
          onMouseUp={() => handleKey('z','up')}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'rgba(220,50,50,0.6)',
            border: '2px solid rgba(255,100,100,0.8)',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: '"Press Start 2P"',
            fontSize: 12,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >A</button>

        <button
          onTouchStart={() => handleKey('x','down')}
          onTouchEnd={() => handleKey('x','up')}
          onMouseDown={() => handleKey('x','down')}
          onMouseUp={() => handleKey('x','up')}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(50,50,180,0.5)',
            border: '2px solid rgba(100,100,220,0.7)',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: '"Press Start 2P"',
            fontSize: 10,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >B</button>
      </div>

      {/* START/SELECT — centro inferior */}
      <div style={{
        position: 'absolute',
        bottom: 35,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12,
        pointerEvents: 'auto'
      }}>
        <button
          onClick={() => onStart?.()}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: '"Press Start 2P"',
            fontSize: 7,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >START</button>
      </div>
    </div>
  );
};

export default Controls;
