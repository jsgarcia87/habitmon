import React, { useState } from 'react';
import CityMap from '../components/CityMap';
import { useGame } from '../context/GameContext';

const CityScreen = ({ navigate, direction, aPressed }) => {
  const { habitosHoy } = useGame();
  const [playerPos, setPlayerPos] = useState({ x: 12, y: 12 }); // Start at center
  const [dialog, setDialog] = useState(null);

  const handleEvent = (event) => {
    if (event.type === 'gym_entry') {
      const isDone = habitosHoy
        .filter(h => h.gym_id === event.gymId)
        .every(h => h.completado);
      
      if (isDone) {
        setDialog(`Ya has ganado la medalla del Gimnasio ${event.gymId.toUpperCase()} hoy.`);
      } else {
        navigate('gym', { gymId: event.gymId });
      }
    } else if (event.type === 'encounter') {
      const WILD_POKEMON = [
        {id:'016',nombre:'Pidgey',nivel:3,maxhp:20},
        {id:'019',nombre:'Rattata',nivel:3,maxhp:18},
        {id:'021',nombre:'Spearow',nivel:4,maxhp:22},
        {id:'041',nombre:'Zubat',nivel:4,maxhp:20},
        {id:'043',nombre:'Oddish',nivel:5,maxhp:25},
        {id:'054',nombre:'Psyduck',nivel:5,maxhp:28},
        {id:'060',nombre:'Poliwag',nivel:5,maxhp:25},
        {id:'069',nombre:'Bellsprout',nivel:4,maxhp:22},
        {id:'079',nombre:'Slowpoke',nivel:5,maxhp:30},
      ];
      const randomPk = WILD_POKEMON[Math.floor(Math.random() * WILD_POKEMON.length)];
      navigate('battle', { tipo: 'wild', pokemon: randomPk });
    }
  };

  return (
    <div className="screen-container" style={{ padding: 0 }}>
      {/* Background City Map */}
      <CityMap 
        direction={direction} 
        aPressed={aPressed} 
        onEvent={handleEvent}
        playerPos={playerPos}
        setPlayerPos={setPlayerPos}
      />

      {/* City Title Overlay */}
      <div style={{ 
        position: 'absolute', top: '10px', left: '10px', 
        background: 'rgba(255,255,255,0.8)', padding: '5px',
        border: '2px solid #333', fontSize: '8px', zIndex: 10
      }}>
        CIUDAD JOHTO
      </div>

      {/* Gym Medal Overlays (Check if done) */}
      <div style={{ position: 'absolute', top: '40px', left: '10px', display: 'flex', gap: '5px', zIndex: 10 }}>
        {['vestirse', 'desayuno', 'higiene', 'orden'].map(gid => {
          const done = habitosHoy.filter(h => h.gym_id === gid).every(h => h.completado);
          return done ? (
            <div key={gid} style={{ width: '10px', height: '10px', background: '#f1c40f', border: '1px solid #333', borderRadius: '50%' }} />
          ) : null;
        })}
      </div>

      {/* Simple NPC/System Dialog */}
      {dialog && (
        <div 
          onClick={() => setDialog(null)}
          className="gb-dialog"
          style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', fontSize: '10px', zIndex: 100 }}
        >
          {dialog}
          <div className="blinker" style={{ textAlign: 'right', fontSize: '14px' }}>▼</div>
        </div>
      )}
    </div>
  );
};

export default CityScreen;
