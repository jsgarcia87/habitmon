import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonSprite from '../components/PokemonSprite';
import DialogBox from '../components/DialogBox';
import CityMap from '../components/CityMap';
import { getAssetPath } from '../api';

const STARTERS = [
  { 
    id: '152', nombre: 'Chikorita', tipo: 'Planta',
    color: '#78C840',
    sprite: 'Graphics/battlers/152.png',
    tileX: 9, tileY: 5 // Posición centrada en la mesa del lab
  },
  { 
    id: '155', nombre: 'Cyndaquil', tipo: 'Fuego',
    color: '#F85888',
    sprite: 'Graphics/battlers/155.png',
    tileX: 10, tileY: 5
  },
  { 
    id: '158', nombre: 'Totodile', tipo: 'Agua',
    color: '#6890F0',
    sprite: 'Graphics/battlers/158.png',
    tileX: 11, tileY: 5
  }
];

const StarterScreen = ({ navigate, direction, aPressed }) => {
  const { elegirStarter } = useGame();
  const [selected, setSelected] = useState(null);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [mode, setMode] = useState('intro'); // intro, exploration, selection, confirmed
  const [isJumping, setIsJumping] = useState(false);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 10 });
  
  // Transformar starters en NPCs virtuales para colisión e interacción por teclado
  const pokeballsAsNpcs = STARTERS.map(s => ({
    id: `ball_${s.id}`,
    nombre: s.nombre,
    sprite: null, // No se renderiza como NPC (usamos el div de abajo)
    posicion: { x: s.tileX, y: s.tileY },
    direccion: 0,
    starter: s
  }));

  const OAK_DIALOGUE = [
    '¡Bienvenido al mundo POKÉMON!',
    'Soy el Profesor Oak.',
    'Este mundo está lleno de criaturas llamadas POKÉMON.',
    'Tú vas a comenzar tu aventura hoy.',
    '¡Pero primero necesitas un compañero!',
    'He dejado tres Pokéballs en la mesa.',
    '¡Elige la que más te guste!'
  ];

  const handleNextDialogue = () => {
    if (dialogueStep < OAK_DIALOGUE.length - 1) {
      setDialogueStep(d => d + 1);
    } else {
      setMode('exploration');
    }
  };

  // Escuchar botón A para avanzar diálogo
  React.useEffect(() => {
    if (aPressed && mode === 'intro') {
      handleNextDialogue();
    }
  }, [aPressed, mode]);

  const handleSelectPokemon = (starter) => {
    setSelected(starter);
    setMode('selection');
  };

  const handleConfirm = async () => {
    setIsJumping(true);
    await elegirStarter(selected.id, selected.nombre);
    setTimeout(() => {
      navigate('city');
    }, 1500);
  };

  const handleEvent = (event) => {
    if (event.type === 'npc_talk' && event.npc.id.startsWith('ball_')) {
      handleSelectPokemon(event.npc.starter);
    }
  };

  const handleCancelSelection = () => {
    setMode('exploration');
    setSelected(null);
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', 
      height: '100%', width: '100%', 
      backgroundColor: '#222', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      
      {/* Contenedor relativo para posicionar el fondo y el mapa */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        
        {/* El Mapa base */}
        <CityMap 
          mapId="Map064"
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          direction={direction}
          aPressed={aPressed}
          npcs={pokeballsAsNpcs}
          buildings={[]}
          onEvent={handleEvent}
        >
          {/* Pokéballs Interactivas (Alineadas con la rejilla 32px del lab) */}
          {mode === 'exploration' && (
            <>
              {STARTERS.map((s) => (
                <div 
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); handleSelectPokemon(s); }}
                  style={{ 
                    position: 'absolute', 
                    top: `${s.tileY * 32}px`, 
                    left: `${s.tileX * 32}px`, 
                    zIndex: 1000, 
                    cursor: 'pointer', 
                    width: '32px', 
                    height: '32px', 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <img src={getAssetPath('Graphics/icons/icon_item.png')} style={{ width: '24px', height: '24px' }} alt={s.nombre} />
                </div>
              ))}
            </>
          )}
        </CityMap>

        {/* Intro Overlay */}
        {mode === 'intro' && (
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', 
            justifyContent: 'flex-end', padding: '0 0 10px 0',
            zIndex: 50
          }}>
            <DialogBox 
              text={OAK_DIALOGUE[dialogueStep]} 
              onComplete={handleNextDialogue}
              showArrow={true}
            />
          </div>
        )}
      </div>

      {/* Cuadro de diálogo de selección (Pedido por el usuario) */}
      {selected && !isJumping && (
        <div style={{ 
          position: 'absolute', bottom: '20px', width: '90%', maxWidth: '400px', 
          backgroundColor: 'white', border: '4px solid black', borderRadius: '8px', 
          padding: '15px', zIndex: 200, color: 'black', fontFamily: 'monospace' 
        }}>
          <p style={{ margin: '0 0 15px 0', textAlign: 'center', fontWeight: 'bold' }}>¿Quieres a {selected.nombre} como tu compañero?</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <PokemonSprite id={selected.id} style={{ width: '64px', height: '64px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={handleConfirm}
              style={{ padding: '8px 20px', cursor: 'pointer', background: '#38A', color: '#fff', border: '2px solid #000', fontWeight: 'bold' }}
            >SÍ</button>
            <button 
              onClick={handleCancelSelection}
              style={{ padding: '8px 20px', cursor: 'pointer', background: '#DDD', color: '#000', border: '2px solid #000' }}
            >NO</button>
          </div>
        </div>
      )}

      {/* Final Jump Animation */}
      {isJumping && (
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: '#fff', zIndex: 300, 
          display: 'flex', justifyContent: 'center', alignItems: 'center' 
        }}>
          <div style={{ transform: 'scale(2) translateY(-20px)', transition: 'transform 0.5s ease-in' }}>
            <PokemonSprite id={selected.id} style={{ width: '80px', height: '80px' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StarterScreen;
