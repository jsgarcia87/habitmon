import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from '../components/CityMap';
import DialogBox from '../components/DialogBox';
import { WORLD_DATA } from '../data/worldData';

const GYM_ID_TO_MAP = {
  vestirse: 'Map005',
  higiene: 'Map085',
  orden: 'Map006',
  desayuno: 'Map082',
  comida: 'Map084',
  cena: 'Map086'
};

const GymScreen = ({ navigate, gymId, direction, aPressed }) => {
  const currentMapId = GYM_ID_TO_MAP[gymId] || 'Map005';
  const [playerPos, setPlayerPos] = useState({ x: 4, y: 12 });
  const [dialogue, setDialogue] = useState(null);

  const handleEvent = (event) => {
    if (event.type === 'transfer') {
      if (event.side === 'down' || event.targetMap === 'Map002' || event.targetMap === 'Map008' || event.targetMap === 'Map070') {
        navigate('city');
      }
    } else if (event.type === 'npc_talk') {
      if (event.npc.isLeader) {
        setDialogue({
          name: event.npc.nombre,
          text: ["¿Aceptas el desafío?"],
          options: [
            { label: "¡LUCHAR!", value: "battle", primary: true },
            { label: "AHORA NO", value: "cancel" }
          ]
        });
      } else {
        setDialogue({ name: event.npc.nombre, text: event.npc.mensajes });
      }
    }
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      <CityMap 
        mapId={currentMapId}
        playerPos={playerPos}
        setPlayerPos={setPlayerPos}
        direction={direction}
        aPressed={aPressed}
        onEvent={handleEvent}
      />

      <button onClick={() => navigate('city')} style={{ position: 'absolute', top: 8, left: 8, padding: '4px 10px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P",monospace', fontSize: 7, cursor: 'pointer', zIndex: 10 }}>SALIR</button>

      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#FFD700', fontFamily: '"Press Start 2P",monospace', fontSize: 7, padding: '4px 10px', border: '1px solid rgba(255,215,0,0.4)', zIndex: 10 }}>
        {WORLD_DATA[currentMapId]?.nombre || `GYM ${gymId?.toUpperCase()}`}
      </div>

      {dialogue && (
        <DialogBox 
          key={Array.isArray(dialogue.text) ? dialogue.text[0] : dialogue.text}
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => {
            if (!dialogue.options) setDialogue(null);
          }}
          onOptionSelect={(val) => {
            if (val === 'battle') navigate('battle', { gymId });
            else setDialogue(null);
          }}
          options={dialogue.options}
        />
      )}
    </div>
  );
};

export default GymScreen;
