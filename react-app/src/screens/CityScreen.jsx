import React, { useState } from 'react';
import CityMap from '../components/CityMap';
import { useGame } from '../context/GameContext';

const CITY_NPCS = [
  {
    nombre: 'Chico Local',
    sprite: 'char_ 00_a',
    posicion: { x: 10, y: 15 },
    direccion: 0,
    mensajes: ['¡Hola! Bienvenido a Ciudad Johto.', '¿Has visto lo alta que está la hierba?']
  },
  {
    nombre: 'Entrenadora',
    sprite: 'char_ 01_a',
    posicion: { x: 15, y: 10 },
    direccion: 1,
    mensajes: ['¡Estoy entrenando para el gimnasio!', 'Mis Pokémon son de tipo Planta.']
  },
  {
    nombre: 'Anciano',
    sprite: 'char_ 02_a',
    posicion: { x: 20, y: 18 },
    direccion: 3,
    mensajes: ['En mis tiempos, no había tantos hábitos.', '¡Cumplir tus deberes te hace fuerte!']
  }
];

const CityScreen = ({ navigate, direction, aPressed }) => {
  const { habitosHoy } = useGame();
  const [playerPos, setPlayerPos] = useState({ x: 12, y: 13 }); 
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
    } else if (event.type === 'npc_talk') {
      setDialog(event.npc.mensajes[0]);
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
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Canvas Area (Flex 1) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CityMap 
          direction={direction} 
          aPressed={aPressed} 
          onEvent={handleEvent}
          playerPos={playerPos}
          setPlayerPos={setPlayerPos}
          npcs={CITY_NPCS}
        />

        {/* HUD Overlays */}
        <div style={{ 
          position: 'absolute', top: '10px', left: '10px', 
          background: 'rgba(255,255,255,0.8)', padding: '5px',
          border: '2px solid #333', fontSize: '8px', zIndex: 10
        }}>
          CIUDAD JOHTO
        </div>

        {dialog && (
          <div 
            onClick={() => setDialog(null)}
            className="gb-dialog"
            style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', fontSize: '10px', zIndex: 100 }}
          >
            {dialog}
            <div className="blinker" style={{ textAlign: 'right', fontSize: '14px' }}>▼</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityScreen;
