import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import PokemonSprite from '../components/PokemonSprite';
import DialogBox from '../components/DialogBox';

const StarterScreen = ({ navigate }) => {
  const { elegirStarter } = useGame();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isJumping, setIsJumping] = useState(false);

  const dialogs = [
    "¡Bienvenido al mundo POKÉMON!",
    "Soy el Profesor Oak.",
    "El mundo está lleno de criaturas llamadas Pokémon.",
    "Tú vas a comenzar tu aventura hoy.",
    "Pero primero... ¡necesitas un compañero!",
    "Elige tu Pokémon inicial:"
  ];

  const starters = [
    { id: 152, name: 'Chikorita', type: 'PLANTA' },
    { id: 155, name: 'Cyndaquil', type: 'FUEGO' },
    { id: 158, name: 'Totodile', type: 'AGUA' }
  ];

  const handleNext = () => {
    if (step < dialogs.length - 1) {
      setStep(step + 1);
    }
  };

  const handleSelect = (pk) => {
    setSelected(pk);
    setStep(dialogs.length); // Transition to selection confirmation
  };

  const handleConfirm = async () => {
    setIsJumping(true);
    setTimeout(async () => {
      await elegirStarter(selected.id, selected.name);
      navigate('city');
    }, 1000);
  };

  return (
    <div className="screen-container" style={{ backgroundColor: '#F8F0D8', justifyContent: 'center' }}>
      
      {/* Background Lab Visual (Mockup) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, zIndex: 0 }}>
        {/* Aquí podría ir un tilemap básico de lab */}
      </div>

      <div style={{ zIndex: 1, textAlign: 'center' }}>
        {/* Prof Oak Sprite */}
        {step < dialogs.length && (
          <div style={{
            width: '64px', height: '64px',
            margin: '0 auto 20px',
            backgroundImage: 'url(/Graphics/characters/prof_oak.png)',
            backgroundSize: '128px 128px',
            backgroundPosition: '0 0',
            imageRendering: 'pixelated'
          }} />
        )}

        {/* Pokémon Selection Grid */}
        {step === dialogs.length - 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            {starters.map(pk => (
              <div key={pk.id} onClick={() => handleSelect(pk)} style={{ cursor: 'pointer' }}>
                <PokemonSprite id={pk.id} style={{ width: '80px', height: '80px' }} />
                <div style={{ fontSize: '8px', marginTop: '5px' }}>{pk.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Pokémon Animation */}
        {selected && step === dialogs.length && (
          <div style={{
            transform: isJumping ? 'scale(1.5) translateY(-50px)' : 'none',
            transition: 'all 0.5s',
            opacity: isJumping ? 0 : 1
          }}>
            <PokemonSprite id={selected.id} style={{ width: '120px', height: '120px', margin: '0 auto' }} />
            <div style={{ fontSize: '10px', marginTop: '10px' }}>¡{selected.name} te ha elegido!</div>
            <button className="gb-button primary" onClick={handleConfirm} style={{ marginTop: '20px' }}>¡VAMOS!</button>
          </div>
        )}

        {/* Dialogue Box */}
        {step < dialogs.length && (
          <DialogBox 
            text={dialogs[step]} 
            onNext={handleNext} 
            showArrow={step < dialogs.length - 1} 
          />
        )}
      </div>
    </div>
  );
};

export default StarterScreen;
