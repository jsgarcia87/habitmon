import React, { useState } from 'react';
import CityMap from '../components/CityMap';
import DialogBox from '../components/DialogBox';
import { WORLD_DATA } from '../data/worldData';

const HomeScreen = ({ navigate, direction, aPressed }) => {
  const [currentMapId, setCurrentMapId] = useState('Map003'); // 1F por defecto
  const [playerPos, setPlayerPos] = useState({ x: 4, y: 8 });
  const [dialogue, setDialogue] = useState(null);

  const handleEvent = (event) => {
    if (event.type === 'transfer') {
      if (event.side === 'down' || event.targetMap === 'Map002') {
        navigate('city');
      } else if (event.targetMap) {
        setCurrentMapId(event.targetMap);
        setPlayerPos(event.spawn);
      }
    } else if (event.type === 'npc_talk') {
      setDialogue({ name: event.npc.nombre, text: event.npc.mensajes });
    } else if (event.type === 'stair') {
      // Cambio de planta 1F <-> 2F
      const nextMap = currentMapId === 'Map003' ? 'Map004' : 'Map003';
      setCurrentMapId(nextMap);
      setPlayerPos({ x: 1, y: 8 }); // Posición estándar cerca de escaleras
    } else if (event.type === 'computer') {
       setDialogue({ 
         text: ["Accediendo al ordenador principal...", "Sincronizando con el servidor de hábitos..."], 
         onComplete: () => navigate('profile') 
       });
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

      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', border: '1px solid #fff', fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10 }}>
        {WORLD_DATA[currentMapId]?.nombre || 'HOGAR'}
      </div>
      
      <button onClick={() => navigate('city')} style={{ position: 'absolute', top: 10, left: 10, padding: '5px 10px', background: '#000', color: '#fff', border: '2px solid #555', fontFamily: '"Press Start 2P"', fontSize: 8, cursor: 'pointer', zIndex: 10 }}>SALIR</button>

      {dialogue && (
        <DialogBox 
          key={Array.isArray(dialogue.text) ? dialogue.text[0] : dialogue.text} 
          name={dialogue.name} text={dialogue.text} 
          onComplete={() => { const cb = dialogue.onComplete; setDialogue(null); if (cb) cb(); }} 
        />
      )}
    </div>
  );
};

export default HomeScreen;
