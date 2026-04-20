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
            background: joystickActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            border: joystickActive ? '2px solid rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            touchAction: 'none',
            transition: 'all 0.1s ease',
            transform: joystickActive ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {/* Marcadores de dirección sutiles */}
          <div style={{ position: 'absolute', top: 5, fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P"' }}>▲</div>
          <div style={{ position: 'absolute', bottom: 5, fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P"' }}>▼</div>
          <div style={{ position: 'absolute', left: 5, fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P"' }}>◀</div>
          <div style={{ position: 'absolute', right: 5, fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P"' }}>▶</div>

          {/* Punto central del joystick */}
          <div style={{
            width: 35,
            height: 35,
            borderRadius: '50%',
            background: joystickActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)',
            border: '2px solid rgba(255,255,255,0.8)',
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
            transition: joystickActive ? 'none' : 'transform 0.1s ease',
            boxShadow: joystickActive ? '0 0 15px rgba(255,255,255,0.3)' : 'none'
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
        gap: 15,
        alignItems: 'center',
        pointerEvents: 'auto'
      }}>
        <button
          onTouchStart={() => handleKey('z','down')}
          onTouchEnd={() => handleKey('z','up')}
          onMouseDown={() => handleKey('z','down')}
          onMouseUp={() => handleKey('z','up')}
          className="gb-control-btn btn-a"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #e74c3c, #c0392b)',
            border: '3px solid #fff',
            color: '#fff',
            fontFamily: '"Press Start 2P"',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            boxShadow: '0 6px 0 #922b21, 0 10px 15px rgba(0,0,0,0.4)',
            transition: 'all 0.05s active',
            outline: 'none'
          }}
        >A</button>

        <button
          onTouchStart={() => handleKey('x','down')}
          onTouchEnd={() => handleKey('x','up')}
          onMouseDown={() => handleKey('x','down')}
          onMouseUp={() => handleKey('x','up')}
          className="gb-control-btn btn-b"
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #3498db, #2980b9)',
            border: '3px solid #fff',
            color: '#fff',
            fontFamily: '"Press Start 2P"',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            boxShadow: '0 6px 0 #1f618d, 0 10px 15px rgba(0,0,0,0.4)',
            transition: 'all 0.05s active',
            outline: 'none'
          }}
        >B</button>
      </div>

      <style>{`
        .gb-control-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #7b241c, 0 5px 10px rgba(0,0,0,0.4) !important;
        }
        .btn-b:active {
          box-shadow: 0 2px 0 #1a5276, 0 5px 10px rgba(0,0,0,0.4) !important;
        }
      `}</style>

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
