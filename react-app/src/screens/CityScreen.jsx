import React, { useState } from 'react';
import CityMap from '../components/CityMap';
import { useGame } from '../context/GameContext';

const WORLD_DATA = {
  Map002: {
    nombre: 'Pueblo Primavera',
    npcs: [
      {
        nombre: 'Guía del Pueblo',
        sprite: 'char_ 00_a',
        posicion: { x: 5, y: 10 },
        direccion: 2,
        mensajes: ['¡Hola entrenado! Has empezado tu mañana con fuerza.', 'Si buscas los gimnasios de ORDEN y DESAYUNO...', '¡Cruza la Ruta 29 hacia el Oeste para llegar a Ciudad Fronsaf!']
      },
      {
        nombre: 'Madre',
        sprite: 'char_ 11_a',
        posicion: { x: 15, y: 10 },
        direccion: 0,
        mensajes: ['¡Pórtate bien y cumple tus hábitos!', 'Recuerda que en casa puedes ver tus LOGROS pulsando A frente a la puerta.']
      }
    ],
    buildings: [
      { type: 'home', nombre: 'Hogar', x: 15, y: 7 },
      { gymId: 'vestirse', nombre: 'Vestirse', x: 8, y: 5 },
      { gymId: 'higiene', nombre: 'Higiene', x: 12, y: 5 },
      { gymId: 'orden', nombre: 'Orden', x: 16, y: 5 }
    ],
    exits: {
      left: { targetMap: 'Map008', spawn: { x: 41, y: 11 } }
    }
  },
  Map008: {
    nombre: 'Ruta 29',
    npcs: [
      {
        nombre: 'Entrenador Ruta',
        sprite: 'char_ 01_a',
        posicion: { x: 30, y: 12 },
        direccion: 1,
        mensajes: ['¡El aire puro de la ruta es lo mejor!', 'Sigue hacia el oeste para llegar a la ciudad.']
      }
    ],
    buildings: [],
    exits: {
      right: { targetMap: 'Map002', spawn: { x: 1, y: 11 } },
      left: { targetMap: 'Map070', spawn: { x: 35, y: 13 } }
    }
  },
  Map070: {
    nombre: 'Ciudad Fronsaf',
    npcs: [
      {
        nombre: 'Guardia',
        sprite: 'char_ 35_A',
        posicion: { x: 20, y: 15 },
        direccion: 2,
        mensajes: ['Bienvenido a Ciudad Fronsaf.', 'Aquí encontrarás los gimnasios de DESAYUNO y ORDEN.']
      }
    ],
    buildings: [
      { gymId: 'desayuno', nombre: 'Gimnasio Desayuno', x: 16, y: 15 },
      { gymId: 'orden', nombre: 'Gimnasio Orden', x: 25, y: 10 }
    ],
    exits: {
      right: { targetMap: 'Map008', spawn: { x: 1, y: 13 } }
    }
  }
};

const CityScreen = ({ navigate, direction, aPressed, pPos, setPPos }) => {
  const { habitosHoy, template } = useGame();
  const [currentMapId, setCurrentMapId] = useState('Map002');
  const [dialog, setDialog] = useState(null);

  const currentMap = WORLD_DATA[currentMapId];

  // Identificar gimnasios activos no asignados en ningún mapa y forzarlos en Map002
  const baseBuildings = [...currentMap.buildings];
  if (currentMapId === 'Map002' && template && template.length > 0) {
    template.filter(g => g.activo).forEach((g, idx) => {
      let isAssigned = false;
      Object.values(WORLD_DATA).forEach(m => {
        if (m.buildings.some(b => b.gymId === g.gym_id)) isAssigned = true;
      });
      // Si el gym no está en ningún edificio de ningún mapa, se dibuja como fallback al sur
      if (!isAssigned) {
        baseBuildings.push({ gymId: g.gym_id, nombre: g.gym_nombre || 'Gimnasio', x: 2 + (idx * 4), y: 14 });
      }
    });
  }

  // Filtramos dinámicamente los edificios inactivos basándonos en la template global
  const activeBuildings = baseBuildings.filter(b => {
    if (b.type === 'home') return true;
    if (template && template.length > 0) {
      const gymConfig = template.find(g => g.gym_id === b.gymId);
      // Si existe config para el gimnasio y está desactivado, ocúltalo
      if (gymConfig && gymConfig.activo === false) return false;
    }
    return true; // Si no hay config o está activo, lo mostramos por defecto
  });

  const handleEvent = (event) => {
    if (event.type === 'gym_entry') {
      const gymHabits = habitosHoy.filter(h => h.gym_id === event.gymId);
      // Solución Bug Lock-out: `every` da true si la lista está vacía. Exigimos lenght > 0.
      const isDone = gymHabits.length > 0 && gymHabits.every(h => h.completado);
      
      if (isDone) {
        setDialog(`Ya has ganado la medalla del Gimnasio ${event.gymId.toUpperCase()} hoy.`);
      } else {
        navigate('gym', { gymId: event.gymId });
      }
    } else if (event.type === 'profile_open') {
      navigate('profile');
    } else if (event.type === 'npc_talk') {
      setDialog(event.npc.mensajes[0]);
    } else if (event.type === 'transfer') {
      const exit = currentMap.exits[event.side];
      if (exit) {
        setCurrentMapId(exit.targetMap);
        if(setPPos) setPPos(exit.spawn);
      }
    } else if (event.type === 'encounter') {
      const WILD_POKEMON = [
        {id:'016',nombre:'Pidgey',nivel:3,maxhp:20},
        {id:'019',nombre:'Rattata',nivel:3,maxhp:18},
        {id:'021',nombre:'Spearow',nivel:4,maxhp:22},
        {id:'043',nombre:'Oddish',nivel:5,maxhp:25},
      ];
      const randomPk = WILD_POKEMON[Math.floor(Math.random() * WILD_POKEMON.length)];
      navigate('battle', { tipo: 'wild', pokemon: randomPk });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <CityMap 
          mapId={currentMapId}
          direction={direction} 
          aPressed={aPressed} 
          onEvent={handleEvent}
          playerPos={pPos || {x:12,y:13}}
          setPlayerPos={setPPos}
          npcs={currentMap.npcs}
          buildings={activeBuildings}
        />

        {/* HUD */}
        <div style={{ 
          position: 'absolute', top: '10px', left: '10px', 
          background: 'rgba(255,255,255,0.8)', padding: '5px 10px',
          border: '2px solid #333', fontSize: '8px', zIndex: 10,
          fontFamily: '"Press Start 2P"'
        }}>
          {currentMap.nombre.toUpperCase()}
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
