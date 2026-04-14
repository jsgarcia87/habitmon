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

import './gameboy.css';

function App() {
  const { token, user, loading } = useGame();
  const [screen, setScreen] = useState('login');
  const [screenData, setScreenData] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Input State (Global to share with screens if needed)
  const [direction, setDirection] = useState(null);
  const [aPressed, setAPressed] = useState(false);
  const [bPressed, setBPressed] = useState(false);

  // Transition Helper
  const navigate = (newScreen, data = null) => {
    setFadeOut(true);
    setTimeout(() => {
      setScreen(newScreen);
      setScreenData(data);
      setFadeOut(false);
    }, 300);
  };

  // Sync screen with Auth/User state
  useEffect(() => {
    if (loading) return;
    if (!token) {
      setScreen(showRegister ? 'register' : 'login');
    } else if (!user?.starter_id) {
      setScreen('starter');
    } else if (screen === 'login' || screen === 'register' || screen === 'starter') {
      setScreen('city');
    }
  }, [token, user, loading, showRegister]);

  if (loading) return <div className="screen-loader">Cargando...</div>;

  const renderScreen = () => {
    switch(screen) {
      case 'login': return <LoginScreen onRegisterClick={() => setShowRegister(true)} />;
      case 'register': return <RegisterScreen onLoginClick={() => setShowRegister(false)} />;
      case 'starter': return <StarterScreen navigate={navigate} direction={direction} aPressed={aPressed} />;
      case 'city': return <CityScreen navigate={navigate} direction={direction} aPressed={aPressed} />;
      case 'gym': return <GymScreen navigate={navigate} gymId={screenData?.gymId} direction={direction} aPressed={aPressed} onBack={() => navigate('city')} />;
      case 'battle': return <BattleScreen navigate={navigate} battleData={screenData} aPressed={aPressed} />;
      case 'capture': return <CaptureScreen navigate={navigate} gymId={screenData?.gymId} />;
      case 'profile': return <ProfileScreen onNavigate={(s) => navigate(String(s || '').toLowerCase())} />;
      case 'habits_edit': return <HabitEditScreen onNavigate={(s) => navigate(String(s || '').toLowerCase())} />;
      case 'admin': return <AdminScreen onNavigate={(s) => navigate(String(s || '').toLowerCase())} />;
      default: return <CityScreen navigate={navigate} />;
    }
  };

  return (
    <div className="game-container">
      {/* Black Fade Overlay */}
      <div className={`fade-overlay ${fadeOut ? 'active' : 'inactive'}`} />

      {/* Screen Area */}
      <div className="screen-layout">
        {renderScreen()}
      </div>

      {/* Global Controls (Only visible in game screens) */}
      {token && ['city', 'gym', 'starter'].includes(screen) && (
        <Controls 
          onDirectionChange={(dir) => setDirection(dir)}
          onA={() => { setAPressed(true); setTimeout(() => setAPressed(false), 100); }}
          onB={() => { setBPressed(true); setTimeout(() => setBPressed(false), 100); }}
          onStart={() => {
            if (screen === 'city') navigate('profile');
          }}
        />
      )}
    </div>
  );
}

export default App;
