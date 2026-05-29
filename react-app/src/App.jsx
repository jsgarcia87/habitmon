import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import Controls from './components/Controls';
import { SpriteAvatar } from './components/GBSprite';
import { getAssetPath } from './api';

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
import AgendaScreen from './screens/AgendaScreen';
import ShopScreen from './screens/ShopScreen';
import BagScreen from './screens/BagScreen';
import FriendsScreen from './screens/FriendsScreen';
import PokedexScreen from './screens/PokedexScreen';
import StartMenu from './components/StartMenu';
import { useDebouncedInput } from './hooks/useDebouncedInput';
import LandingPage from './screens/LandingPage';
import WorldMapScreen from './screens/WorldMapScreen';
import EvolutionScreen from './screens/EvolutionScreen';
import PokemonCenterScreen from './screens/PokemonCenterScreen';
import PokemonShopScreen from './screens/PokemonShopScreen';
import VincularProfesorScreen from './screens/VincularProfesorScreen';
import ProfesorRegister from './screens/profesor/ProfesorRegister';
import ProfesorDashboard from './screens/profesor/ProfesorDashboard';
import ProfesorMensaje from './screens/profesor/ProfesorMensaje';


const LoadingScreen = () => (
  <div className="screen-container loading-screen">
    <SpriteAvatar 
      path={getAssetPath('/Graphics/characters/trchar000.png')} 
      width={32}
      height={40}
      col={0}
      row={0}
      style={{
        transform: 'scale(2)',
        marginBottom: '20px'
      }}
    />
    <div style={{ fontSize: 10, letterSpacing: 2 }}>LOADING...</div>
    <div className="loading-bar">
      <div className="loading-progress"></div>
    </div>
  </div>
);

function App() {
  const { token, user, loading, notification, starter, timeOfDay } = useGame();
  const [screen, setScreen] = useState('login');
  const [screenData, setScreenData] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
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
      // Sin sesión: permitir las pantallas públicas (login, register, profesor_register).
      if (!['login', 'register', 'profesor_register'].includes(screen)) {
        setScreen(showRegister ? 'register' : 'login');
      }
    } else if (user?.tipo_cuenta === 'professor') {
      // Cuentas de Profesor: viven en su propio set de pantallas.
      if (!screen.startsWith('profesor_')) {
        setScreen('profesor_dashboard');
      }
    } else if (user && !user.starter_id) {
      setScreen('starter');
    } else if (user && user.starter_id && (
      screen === 'login' || screen === 'register' || screen === 'starter' ||
      screen.startsWith('profesor_')
    )) {
      setScreen('city');
    }
  }, [token, user, loading, showRegister, screen]);

  const renderScreen = () => {
    // Only block with LoadingScreen if we have NO user/token and are supposedly logged in
    // or if it's the very first time we're fetching auth data.
    if (loading && token && (!user || (user.starter_id && !starter))) return <LoadingScreen />;

    switch (screen) {
      case 'login': return <LoginScreen onRegisterClick={() => setShowRegister(true)} onProfesorClick={() => navigate('profesor_register')} />;
      case 'register': return <RegisterScreen onLoginClick={() => setShowRegister(false)} />;
      case 'profesor_register': return <ProfesorRegister navigate={navigate} />;
      case 'profesor_dashboard': return <ProfesorDashboard navigate={navigate} />;
      case 'profesor_mensaje': return <ProfesorMensaje navigate={navigate} screenData={screenData} />;
      case 'vincular_profesor': return <VincularProfesorScreen navigate={navigate} />;
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
      case 'evolution': return (
        <EvolutionScreen
          navigate={navigate}
          fromId={screenData?.fromId}
          toId={screenData?.toId}
          fromName={screenData?.fromName}
          toName={screenData?.toName}
        />
      );
      case 'profile': return <ProfileScreen onNavigate={(s) => navigate(String(s || '').toLowerCase())} />;
      case 'admin': return <AdminScreen onNavigate={navigate} />;
      case 'agenda': return <AgendaScreen onNavigate={navigate} />;
      case 'habitedit': return <HabitEditScreen onNavigate={navigate} />;
      case 'shop': return <ShopScreen navigate={navigate} />;
      case 'pokemon_center': return <PokemonCenterScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} bPressed={debouncedBPressed} />;
      case 'pokemon_shop': return <PokemonShopScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} bPressed={debouncedBPressed} />;
      case 'bag': return <BagScreen navigate={navigate} />;
      case 'friends': return <FriendsScreen onNavigate={navigate} />;
      case 'pokedex': return <PokedexScreen navigate={navigate} />;
      case 'pokemon': return <PokedexScreen navigate={navigate} />;
      case 'worldmap': return (
        <WorldMapScreen
          navigate={navigate}
          currentMapId={globalMapId}
          lastExtMap={lastExtMap}
          direction={debouncedDirection}
          aPressed={debouncedAPressed}
          bPressed={debouncedBPressed}
          onFastTravel={(mapId, spawn) => {
            setGlobalMapId(mapId);
            setGlobalPlayerPos(spawn);
            // Tras teletransportar, el mapa nuevo se convierte en el último
            // exterior conocido (a no ser que sea interior, lo que no debería
            // pasar porque sólo se vuela a ciudades/pueblos).
            setLastExtMap(mapId);
            navigate('city');
          }}
        />
      );
      case 'home': return <HomeScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} screenData={screenData} />;
      default: return <HomeScreen navigate={navigate} direction={debouncedDirection} aPressed={debouncedAPressed} screenData={screenData} />;
    }
  };

  if (!token) {
    if (showLanding) {
      return (
        <LandingPage 
          screen={screen}
          setScreen={setScreen}
          showRegister={showRegister}
          setShowRegister={setShowRegister}
          onExitLanding={(target) => {
            setShowLanding(false);
            setScreen(target);
            if (target === 'register') {
              setShowRegister(true);
            } else {
              setShowRegister(false);
            }
          }}
          renderGameBoy={() => (
            <div className="game-container" style={{ width: '100%', height: '100%', maxWidth: '100%', margin: '0 auto', border: 'none', boxShadow: 'none' }}>
              <div className="scanlines"></div>
              <div className={`fade-overlay ${fadeOut ? 'active' : 'inactive'}`} />
              
              {/* Notifications */}
              {notification && (
                <div className={`notification-toast ${notification.type}`}>
                  {notification.message}
                </div>
              )}

              <div className="screen-layout" style={{ height: '100%' }}>
                {renderScreen()}
              </div>
            </div>
          )}
        />
      );
    } else {
      return (
        <div className="standalone-login-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#030712', position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background Mesh matching landing page */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 40%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Floating Back Button */}
          <button 
            onClick={() => setShowLanding(true)}
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              color: '#9ca3af',
              padding: '10px 20px',
              fontFamily: '"Outfit", sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = '#fff'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = '#9ca3af'; 
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ← Volver a la Web
          </button>

          {/* Center Original Game Screen Viewport */}
          <div className="game-container" style={{ margin: '0 auto', zIndex: 1, position: 'relative' }}>
            <div className="scanlines"></div>
            <div className={`fade-overlay ${fadeOut ? 'active' : 'inactive'}`} />
            
            {/* Notifications */}
            {notification && (
              <div className={`notification-toast ${notification.type}`}>
                {notification.message}
              </div>
            )}

            <div className="screen-layout">
              {renderScreen()}
            </div>
          </div>
        </div>
      );
    }
  }

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

      {user && user.tipo_cuenta !== 'professor' && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.8)', color: '#00FF00', border: '2px solid #555', padding: '6px 16px', fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Indicador de momento del día — refleja la hora real del jugador */}
          <span title={`Es ${timeOfDay}`} style={{ fontSize: 11 }}>
            {timeOfDay === 'morning' ? '🌅' : timeOfDay === 'night' ? '🌙' : '☀️'}
          </span>
          <span style={{ color: '#555' }}>|</span>
          <span style={{color:'#FFD700'}}>$</span> {user.monedas || 0}
        </div>
      )}

      {/* Global Controls (Only visible in game screens) */}
      {token && ['city', 'gym', 'starter', 'home', 'worldmap', 'pokemon_center', 'pokemon_shop'].includes(screen) && (
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
