import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import Controls from './components/Controls';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import StarterScreen from './screens/StarterScreen';
import CityScreen from './screens/CityScreen';
import GymScreen from './screens/GymScreen';
import BattleScreen from './screens/BattleScreen';
import CaptureScreen from './screens/CaptureScreen';
import ProfileScreen from './screens/ProfileScreen';
import HabitEditScreen from './screens/HabitEditScreen';
import AdminScreen from './screens/AdminScreen';
import HomeScreen from './screens/HomeScreen';
import StartMenu from './components/StartMenu';
import { useDebouncedInput } from './hooks/useDebouncedInput';

const LoadingScreen = () => (
  <div className="screen-container loading-screen">
    <img src="Graphics/characters/trchar000.png" style={{ imageRendering: 'pixelated', transform: 'scale(2)', marginBottom: 20 }} />
    <div style={{ fontSize: 10, letterSpacing: 2 }}>LOADING...</div>
    <div className="loading-bar">
      <div className="loading-progress"></div>
    </div>
  </div>
);

function App() {
  const { token, user, loading, notification, starter } = useGame();
  const [screen, setScreen] = useState('login');
  const [screenData, setScreenData] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Global Player & World State (survives CityScreen unmount)
  const [globalPlayerPos, setGlobalPlayerPos] = useState({ x: 12, y: 13 });
  const [globalMapId, setGlobalMapId] = useState('Map002');
  const [lastExtMap, setLastExtMap] = useState('Map002');
  const [lastExtPos, setLastExtPos] = useState({ x: 12, y: 13 });

  // Input State (Global to share with screens if needed)
  const [direction, setDirection] = useState(null);
  const [aPressed, setAPressed] = useState(false);
  const [bPressed, setBPressed] = useState(false);

  // Debounced Inputs
  const debouncedDirection = useDebouncedInput(direction, 100);
  const debouncedAPressed = useDebouncedInput(aPressed, 50);
  const debouncedBPressed = useDebouncedInput(bPressed, 50);

  // Transition Helper
  const navigate = (newScreen, data = null) => {
    const normalizedScreen = String(newScreen || '').toLowerCase();
    setFadeOut(true);
    setTimeout(() => {
      setScreen(normalizedScreen);
      setScreenData(data);
      setFadeOut(false);
    }, 300);
  };

  // Sync screen with Auth/User state
  useEffect(() => {
    if (loading) return;
    if (!token) {
      setScreen(showRegister ? 'register' : 'login');
    } else if (user && !user.starter_id) {
      setScreen('starter'); 
    } else if (user && user.starter_id && (screen === 'login' || screen === 'register' || screen === 'starter')) {
      setScreen('city');
    }
  }, [token, user, loading, showRegister, screen]);

  const renderScreen = () => {
    // Only block with LoadingScreen if we have NO user/token and are supposedly logged in
    // or if it's the very first time we're fetching auth data.
    if (loading && token && (!user || (user.starter_id && !starter))) return <LoadingScreen />;

    switch (screen) {
      case 'login': return <LoginScreen onRegisterClick={() => setShowRegister(true)} />;
      case 'register': return <RegisterScreen onLoginClick={() => setShowRegister(false)} />;
      case 'starter': return <StarterScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} />;
      case 'city': return (
        <CityScreen
          navigate={navigate}
          direction={debouncedDirection}
          aPressed={debouncedAPressed}
          pPos={globalPlayerPos}
          setPPos={setGlobalPlayerPos}
          currentMapId={globalMapId}
          setCurrentMapId={setGlobalMapId}
          lastExtMap={lastExtMap}
          setLastExtMap={setLastExtMap}
          lastExtPos={lastExtPos}
          setLastExtPos={setLastExtPos}
        />
      );
      case 'gym': return <GymScreen navigate={navigate} gymId={screenData?.gymId} screenData={screenData} direction={debouncedDirection} aPressed={debouncedAPressed} onBack={() => navigate('city')} />;
      case 'battle': return <BattleScreen navigate={navigate} battleData={screenData} aPressed={debouncedAPressed} />;
      case 'capture': return <CaptureScreen navigate={navigate} gymId={screenData?.gymId} />;
      case 'profile': return <ProfileScreen onNavigate={(s) => navigate(String(s || '').toLowerCase())} />;
      case 'admin': return <AdminScreen onNavigate={navigate} />;
      case 'habitedit': return <HabitEditScreen onNavigate={navigate} />;
      case 'home': return <HomeScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} screenData={screenData} />;
      default: return <HomeScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} screenData={screenData} />;
    }
  };

  return (
    <div className="game-container">
      <div className="scanlines"></div>

      {/* Black Fade Overlay */}
      <div className={`fade-overlay ${fadeOut ? 'active' : 'inactive'}`} />

      <StartMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={navigate}
        user={user}
      />

      {/* Notifications */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Screen Area */}
      <div className="screen-layout">
        {renderScreen()}
      </div>

      {user && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.8)', color: '#00FF00', border: '2px solid #555', padding: '6px 16px', fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{color:'#FFD700'}}>$</span> {user.monedas || 0}
        </div>
      )}

      {/* Global Controls (Only visible in game screens) */}
      {token && ['city', 'gym', 'starter', 'home'].includes(screen) && (
        <Controls
          onDirectionChange={(dir) => {
            console.log('Direction changed:', dir);
            setDirection(dir);
          }}
          onA={() => {
            console.log('Button A pressed');
            setAPressed(true);
            setTimeout(() => setAPressed(false), 100);
          }}
          onB={() => {
            console.log('Button B pressed');
            setBPressed(true);
            setTimeout(() => setBPressed(false), 100);
          }}
          onStart={() => {
            console.log('Start button pressed');
            if (screen === 'city' || screen === 'home' || screen === 'gym') setIsMenuOpen(!isMenuOpen);
          }}
        />
      )}
    </div>
  );
}

export default App;
