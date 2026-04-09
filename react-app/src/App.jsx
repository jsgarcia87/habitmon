import React, { useState, useEffect, useRef } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import MapScreen from './screens/MapScreen';
import BattleScreen from './screens/BattleScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DailySetupScreen from './screens/DailySetupScreen';
import IndoorScreen from './screens/IndoorScreen';
import HabitEditScreen from './screens/HabitEditScreen';
import LabScreen from './screens/LabScreen';
import StarterScreen from './screens/StarterScreen';

const AppContent = () => {
  const { token, progress, user, coleccion } = useGame();
  const [currentScreen, setCurrentScreen] = useState('MAP');
  const [activeGymId, setActiveGymId] = useState(null);
  const [buildingType, setBuildingType] = useState('house');

  // Touch controls only on MAP
  const showTouchControls = ['MAP', 'STARTER', 'INDOOR', 'LAB'].includes(currentScreen);
  // Footer nav only on MAP / PROFILE
  const showFooter = currentScreen === 'MAP' || currentScreen === 'PROFILE';

  const handleTouch = (key, type) => {
    const codes = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, z: 90, Escape: 27 };
    window.dispatchEvent(new KeyboardEvent(type, {
      key, code: key, keyCode: codes[key] || 0, which: codes[key] || 0, bubbles: true, cancelable: true,
    }));
  };

  const joystickRef = useRef({ active: false, startX: 0, startY: 0, currentKey: null });

  const onJoystickStart = (e) => {
    const t = e.touches[0];
    joystickRef.current = { active: true, startX: t.clientX, startY: t.clientY, currentKey: null };
  };

  const onJoystickMove = (e) => {
    const j = joystickRef.current;
    if (!j.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - j.startX;
    const dy = t.clientY - j.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 18) {
      const newKey = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
        : (dy > 0 ? 'ArrowDown' : 'ArrowUp');

      if (newKey !== j.currentKey) {
        if (j.currentKey) handleTouch(j.currentKey, 'keyup');
        handleTouch(newKey, 'keydown');
        j.currentKey = newKey;
      }
    }
    const angle = Math.atan2(dy, dx);
    const moveDist = Math.min(dist, 40);
    const el = e.currentTarget;
    el.style.setProperty('--jx', `${Math.cos(angle) * moveDist}px`);
    el.style.setProperty('--jy', `${Math.sin(angle) * moveDist}px`);
  };

  const onJoystickEnd = (e) => {
    const j = joystickRef.current;
    if (j.currentKey) handleTouch(j.currentKey, 'keyup');
    j.active = false;
    j.currentKey = null;
    e.currentTarget.style.setProperty('--jx', '0px');
    e.currentTarget.style.setProperty('--jy', '0px');
  };

  // Flow controller
  useEffect(() => {
    if (!token) {
      if (currentScreen !== 'REGISTER') setCurrentScreen('LOGIN');
    } else if (user && !user.pokemon_inicial_id && currentScreen !== 'STARTER') {
      setCurrentScreen('STARTER');
    } else if (progress?.setup_required) {
      setCurrentScreen('SETUP');
    } else if (['LOGIN', 'REGISTER', 'SETUP', 'LAB'].includes(currentScreen)) {
      setCurrentScreen('MAP');
    }
  }, [token, user, progress, coleccion, currentScreen]);

  const navigateTo = (screen, gymId = null) => {
    if (screen === 'BATTLE' && gymId !== null) setActiveGymId(gymId);
    if (screen === 'INDOOR' && gymId !== null) setBuildingType(gymId); // gymId = buildingType here
    setCurrentScreen(screen);
  };

  if (!token) {
    return currentScreen === 'REGISTER'
      ? <RegisterScreen onNavigate={navigateTo} />
      : <LoginScreen onNavigate={navigateTo} />;
  }

  if (progress?.setup_required && currentScreen !== 'EDIT_HABITS') {
    return <DailySetupScreen onNavigate={navigateTo} />;
  }

  return (
    <div className="gameboy-container">
      {currentScreen === 'MAP'         && <MapScreen         onNavigate={navigateTo} />}
      {currentScreen === 'BATTLE'      && <BattleScreen      gymId={activeGymId} onNavigate={navigateTo} />}
      {currentScreen === 'PROFILE'     && <ProfileScreen     onNavigate={navigateTo} />}
      {currentScreen === 'INDOOR'      && <IndoorScreen      buildingType={buildingType} onNavigate={navigateTo} />}
      {currentScreen === 'EDIT_HABITS' && <HabitEditScreen   onNavigate={navigateTo} />}
      {currentScreen === 'LAB'         && <LabScreen         onNavigate={navigateTo} />}
      {currentScreen === 'STARTER'     && <StarterScreen     onNavigate={navigateTo} />}

      {/* Touch Controls — solo en el Mapa */}
      {showTouchControls && (
        <div className="touch-controls">
          <div
            className="joystick-base"
            onTouchStart={onJoystickStart}
            onTouchMove={onJoystickMove}
            onTouchEnd={onJoystickEnd}
          >
            <div className="joystick-handle" />
          </div>
          <div className="action-buttons">
            <button className="b-btn"
              onTouchStart={() => handleTouch('Escape', 'keydown')}
              onTouchEnd={() => handleTouch('Escape', 'keyup')}
              onMouseDown={() => handleTouch('Escape', 'keydown')}
              onMouseUp={() => handleTouch('Escape', 'keyup')}
              onMouseLeave={() => handleTouch('Escape', 'keyup')}
            >B</button>
            <button className="a-btn"
              onTouchStart={() => handleTouch('z', 'keydown')}
              onTouchEnd={() => handleTouch('z', 'keyup')}
              onMouseDown={() => handleTouch('z', 'keydown')}
              onMouseUp={() => handleTouch('z', 'keyup')}
              onMouseLeave={() => handleTouch('z', 'keyup')}
            >A</button>
          </div>
        </div>
      )}

      {/* Footer nav */}
      {showFooter && (
        <div className="footer-nav">
          <button className="gb-button nav-btn" onClick={() => navigateTo('MAP')}
            style={{ opacity: currentScreen === 'MAP' ? 0.5 : 1 }}>
            🗺 MAPA
          </button>
          <button className="gb-button nav-btn" onClick={() => navigateTo('INDOOR', 'house')}
            style={{ opacity: currentScreen === 'INDOOR' ? 0.5 : 1 }}>
            🏠 CASA
          </button>
          <button className="gb-button nav-btn" onClick={() => navigateTo('PROFILE')}
            style={{ opacity: currentScreen === 'PROFILE' ? 0.5 : 1 }}>
            👤 PERFIL
          </button>
        </div>
      )}

      <style>{appCSS}</style>
    </div>
  );
};

const appCSS = `
  .gameboy-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .footer-nav {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-around;
    padding: 6px 12px;
    z-index: 500;
    pointer-events: none;
    background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%);
  }

  .nav-btn {
    pointer-events: auto !important;
    padding: 7px 12px !important;
    font-size: clamp(6px, 1.8vw, 9px) !important;
    background: rgba(248,248,248,0.93) !important;
    border: 2px solid #333 !important;
    cursor: pointer;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.4) !important;
  }

  .nav-btn:hover, .nav-btn:active {
    background: #fff !important;
  }
`;

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
