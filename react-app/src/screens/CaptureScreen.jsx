import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PokemonSprite from '../components/PokemonSprite';

const CaptureScreen = ({ navigate, gymId }) => {
  const { user, capturarPokemon } = useGame();
  const [step, setStep] = useState(0); 
  const [expProgress, setExpProgress] = useState(user?.starter_exp || 0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  if (!user) return <div className="screen-container">Cargando...</div>;

  // Pokemon details (mock for victory)
  const pkName = gymId === 'vestirse' ? 'Chikorita' : gymId === 'desayuno' ? 'Cyndaquil' : 'Totodile';
  const pkId = gymId === 'vestirse' ? 152 : gymId === 'desayuno' ? 155 : 158;

  useEffect(() => {
    // Capture sequence timing
    const timers = [
      setTimeout(() => setStep(1), 1000), // Ball falls
      setTimeout(() => setStep(2), 2000), // Wobble 1
      setTimeout(() => setStep(3), 2500), // Wobble 2
      setTimeout(() => setStep(4), 3000), // Gotcha!
      setTimeout(() => {
        setStep(5);
        capturarPokemon(pkId, pkName);
      }, 4000)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const handleGainExp = () => {
     setStep(6);
     // Simulate EXP gain animation
     let current = expProgress;
     const interval = setInterval(() => {
        current += 2;
        if (current >= 100) {
           clearInterval(interval);
           setExpProgress(0);
           setShowLevelUp(true);
        } else if (current >= (expProgress + 30)) {
           clearInterval(interval);
           setExpProgress(current);
        }
     }, 50);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-color)',
      overflow: 'hidden'
    }}>
      {/* Capture Scene Area (Flex 1) */}
      <div style={{ 
        flex: 1, position: 'relative', 
        display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center' 
      }}>
        
        {/* Animated Scene */}
        {step < 5 && (
          <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
            <div style={{ opacity: step === 0 ? 1 : 0, transition: 'opacity 0.5s' }}>
              <PokemonSprite id={pkId} style={{ width: '120px', height: '120px' }} />
            </div>
            
            <div style={{
              position: 'absolute', top: step === 0 ? '-100px' : '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'top 0.5s ease-in',
              display: step > 0 ? 'block' : 'none'
            }}>
               <img src="/Graphics/characters/pokeball.png" alt="ball" style={{ 
                 width: '32px', 
                 animation: (step > 1 && step < 4) ? 'wobble 0.5s infinite' : 'none',
                 imageRendering: 'pixelated'
               }} />
            </div>
          </div>
        )}

        {/* Results Window */}
        {step >= 5 && (
          <div className="gb-window" style={{ width: '90%', maxWidth: '300px', color: '#333' }}>
             {step === 5 ? (
               <>
                 <p style={{ fontSize: '10px' }}>¡{pkName.toUpperCase()} fue capturado!</p>
                 <p style={{ fontSize: '8px', marginTop: '10px' }}>¡{pkName} fue añadido a tu POKÉDEX!</p>
                 <button className="gb-button primary" style={{ marginTop: '20px', width: '100%' }} onClick={handleGainExp}>SIGUIENTE</button>
               </>
             ) : (
               <>
                  <p style={{ fontSize: '10px' }}>{user.starter_nombre.toUpperCase()} ganó 350 EXP.</p>
                  <div style={{ height: '10px', background: '#eee', border: '2px solid #333', marginTop: '15px', position: 'relative' }}>
                     <div style={{ width: `${expProgress}%`, height: '100%', background: '#3498db', transition: 'width 0.1s' }} />
                  </div>
                  {showLevelUp && <p style={{ color: '#e74c3c', fontSize: '10px', marginTop: '10px' }} className="blinker">¡SUBIÓ AL NIVEL {user.starter_nivel + 1}!</p>}
                  <button className="gb-button primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => navigate('city')}>CONTINUAR</button>
               </>
             )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes wobble {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default CaptureScreen;
