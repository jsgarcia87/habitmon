import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonSprite from '../components/PokemonSprite';
import DialogBox from '../components/DialogBox';
import TileMap from '../components/TileMap';

const StarterScreen = ({ navigate, direction, aPressed }) => {
  const { elegirStarter } = useGame();
  const [mode, setMode] = useState('intro'); // intro, exploration, selection, confirmed
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isJumping, setIsJumping] = useState(false);

  const introDialogs = [
    "¡Bienvenido al mundo POKÉMON!",
    "Soy el Profesor Oak.",
    "El mundo está lleno de criaturas llamadas Pokémon.",
    "Para comenzar tu aventura, ¡necesitas un compañero!",
    "He dejado tres Pokéballs en la mesa."
  ];

  const starterData = [
    { id: 152, name: 'Chikorita', tileX: 4, tileY: 1 },
    { id: 155, name: 'Cyndaquil', tileX: 5, tileY: 1 },
    { id: 158, name: 'Totodile', tileX: 6, tileY: 1 }
  ];

  const handleNext = () => {
    if (step < introDialogs.length - 1) {
      setStep(step + 1);
    } else {
      setMode('exploration');
    }
  };

  const handleTrigger = (type, data) => {
    if (type.startsWith('starter_')) {
      const id = parseInt(type.split('_')[1]);
      const pk = starterData.find(s => s.id === id);
      setSelected(pk);
      setMode('selection');
    }
  };

  const handleConfirm = async () => {
    setIsJumping(true);
    setTimeout(async () => {
      await elegirStarter(selected.id, selected.name);
      navigate('city');
    }, 1000);
  };

  const handleCancelSelection = () => {
    setMode('exploration');
    setSelected(null);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Lab World (Flex 1) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', opacity: mode === 'intro' ? 0.3 : 1 }}>
        <TileMap 
          mapId="virtual_prof_lab"
          startX={5} startY={8}
          starters={starterData}
          onTrigger={handleTrigger}
          direction={direction}
          aPressed={aPressed}
        />

        {/* Intro Dialogs */}
        {mode === 'intro' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              width: '64px', height: '64px',
              marginBottom: '20px',
              backgroundImage: 'url(/Graphics/characters/prof_oak.png)',
              backgroundColor: '#F8F0D8',
              display: 'flex',
              flexDirection: 'column',
              backgroundSize: '128px 128px',
              backgroundPosition: '0 0',
              imageRendering: 'pixelated'
            }} />
            <DialogBox 
              text={introDialogs[step]} 
              onNext={handleNext} 
              showArrow={true} 
            />
          </div>
        )}

        {/* Selection Confirmation */}
        {mode === 'selection' && selected && (
          <div className="gb-dialog" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PokemonSprite id={selected.id} style={{ width: '60px', height: '60px' }} />
              <div style={{ fontSize: '10px' }}>
                ¿Quieres a {selected.name}, el Pokémon de tipo {selected.id === 152 ? 'PLANTA' : selected.id === 155 ? 'FUEGO' : 'AGUA'}?
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="gb-button secondary" onClick={handleCancelSelection} style={{ fontSize: '8px', padding: '5px 10px' }}>NO</button>
              <button className="gb-button primary" onClick={handleConfirm} style={{ fontSize: '8px', padding: '5px 10px' }}>SÍ</button>
            </div>
          </div>
        )}

        {/* Jump Animation on Confirm */}
        {isJumping && (
          <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ transform: 'scale(2) translateY(-20px)', transition: 'transform 0.5s ease-in' }}>
              <PokemonSprite id={selected.id} style={{ width: '80px', height: '80px' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StarterScreen;
