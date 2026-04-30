import React, { useState, useMemo } from 'react';
import DialogBox from '../components/DialogBox';
import InteriorMap from '../components/InteriorMap';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { WORLD_DATA } from '../data/worldData';
import { getPokemonByGym } from '../data/pokemonData';

const GymScreen = ({ navigate, gymId, direction, aPressed }) => {
  const [dialogue, setDialogue] = useState(null);
  
  // v2.0 Stable Logic: Procedural Retrieval
  const config = INTERIOR_CONFIGS[gymId] || INTERIOR_CONFIGS.Map015;
  const mapMatrix = INTERIOR_MAPS[gymId] || INTERIOR_MAPS.Map015;

  const handleEvent = (event) => {
    console.log("Gym v2.0 Event:", event);
    
    if (event.type === 'npc_talk') {
      setDialogue({
        name: config.nombre,
        text: config.dialogo,
        options: [
          { label: "¡LUCHAR!", value: "battle", primary: true },
          { label: "AHORA NO", value: "cancel" }
        ]
      });
    }
  };

  const handleExit = () => {
    navigate('city');
  };

  // NPCs list for the leader (Shifted by padding)
  const npcs = useMemo(() => [
    {
      id: 'leader',
      nombre: config.nombre,
      sprite: config.sprite,
      x: 9,
      y: 2,
      isLeader: true
    }
  ], [config]);

  const tileConfig = {
    floor: config.tiles.floor,
    wall: config.tiles.wall,
    exit: config.tiles.carpet,
    stair: config.tiles.stair || 32
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap 
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={tileConfig}
          initialPos={{ x: 9, y: 13 }}
          npcs={npcs}
          onEvent={handleEvent}
          onExit={handleExit}
          direction={direction}
          aPressed={aPressed}
          name={config.nombre}
        />
      </div>

      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: '#FFD700', border: '2px solid #555', padding: '6px 16px', fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4 }}>
        GIMNASIO {gymId?.toUpperCase()}
      </div>

      <button 
        onClick={() => navigate('city')} 
        style={{ position: 'absolute', top: 10, left: 10, padding: '8px 12px', background: '#222', color: '#fff', border: '2px solid #666', borderRadius: 4, fontFamily: '"Press Start 2P"', fontSize: 8, cursor: 'pointer', zIndex: 10 }}
      >
        SALIR
      </button>

      {dialogue && (
        <DialogBox 
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => { if (!dialogue.options) setDialogue(null); }}
          onOptionSelect={(val) => {
            if (val === 'battle') {
              const pokemon = getPokemonByGym(gymId);
              navigate('battle', { gymId, leader: dialogue.name, pokemon });
            }
            else setDialogue(null);
          }}
          options={dialogue.options}
        />
      )}
    </div>
  );
};

export default GymScreen;
