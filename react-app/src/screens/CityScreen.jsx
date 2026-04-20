import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from '../components/CityMap';
import DialogBox from '../components/DialogBox';
import { WORLD_DATA } from '../data/worldData';

const CityScreen = ({ 
  navigate, direction, aPressed, pPos, setPPos,
  currentMapId, setCurrentMapId, 
  lastExtMap, setLastExtMap,
  lastExtPos, setLastExtPos
}) => {
  const { habitosHoy, template } = useGame();
  const [dialog, setDialog] = useState(null);

  const currentMap = WORLD_DATA[currentMapId];

  // Memoizar edificios para evitar reinicios innecesarios en CityMap
  const activeBuildings = useMemo(() => {
    // Audit: solo devolvemos los edificios definidos manualmente en WORLD_DATA.
    // Esto asegura que "solo las casas" son interactivas.
    return [...currentMap.buildings];
  }, [currentMapId, currentMap.buildings]);

  const handleEvent = (event) => {
    const totalHabits = habitosHoy?.length || 0;
    const doneHabits = (habitosHoy || []).filter(h => h.completado).length;
    const progress = totalHabits > 0 ? doneHabits / totalHabits : 1;

    if (event.type === 'gym_entry') {
      const b = event.building || currentMap.buildings.find(b => b.gymId === event.gymId);
      const safePos = b ? { x: b.x, y: b.y + 1 } : { x: pPos.x, y: pPos.y };
      
      setLastExtPos(safePos);
      if (setPPos) setPPos(safePos);

      const gymConfig = template?.find(g => g.gym_id === event.gymId);
      
      if (gymConfig && gymConfig.activo === false) {
        setDialog("Hoy no te tienes que hacer este hábito.");
        return;
      }

      const gymHabits = (habitosHoy || []).filter(h => h.gym_id === event.gymId);
      const isDone = gymHabits.length > 0 && gymHabits.every(h => h.completado);
      
      if (isDone) {
        setDialog(`Ya has ganado la medalla del Gimnasio ${event.gymId?.toUpperCase() || ''} hoy.`);
      } else {
        // Redirigir al motor especializado de gimnasios
        navigate('gym', { gymId: event.gymId });
      }
    } else if (event.type === 'home_entry') {
      const b = event.building || currentMap.buildings.find(b => b.type === 'home');
      if (b) {
        const safePos = { x: b.x, y: b.y + 1 };
        setLastExtPos(safePos);
        if (setPPos) setPPos(safePos);
      }
      navigate('home');
    } else if (event.type === 'npc_talk') {
      if (event.npc.isLeader) {
        navigate('battle', { tipo: 'gym', gymId: event.npc.gymId });
      } else {
        setDialog(event.npc.mensajes[0]);
      }
    } else if (event.type === 'transfer') {
      // Detección centralizada de tipo de mapa (Interior -> Exterior)
      if (currentMap.isInterior && event.side === 'down') {
        const targetMap = lastExtMap || 'Map002';
        setCurrentMapId(targetMap);
        
        const pos = lastExtPos || { x: 15, y: 8 };
        if (setPPos) setPPos(pos);
      } else if (event.targetMap) {
        // Detección automática (Puertas/Warps dinámicos del JSON)
        if (!currentMap.isInterior) setLastExtMap(currentMapId);
        setCurrentMapId(event.targetMap);
        if (setPPos) setPPos(event.spawn);
      } else {
        // Detección manual (Bordes de mapa configurados en WORLD_DATA)
        const exit = currentMap.exits[event.side];
        if (exit) {
          if (!currentMap.isInterior) setLastExtMap(currentMapId);
          setCurrentMapId(exit.targetMap);
          if (setPPos) setPPos(exit.spawn);
        }
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
          background: 'var(--bg-panel)', padding: '5px 10px',
          border: '2px solid var(--border-color)', 
          color: 'var(--text-main)',
          fontSize: '8px', zIndex: 10,
          fontFamily: '"Press Start 2P"',
          opacity: 0.9,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.2)'
        }}>
          {currentMap.nombre.toUpperCase()}
        </div>

        {dialog && (
          <div 
            onClick={() => setDialog(null)}
            className="gb-dialog"
            style={{ 
              position: 'absolute', bottom: '20px', left: '20px', right: '20px', 
              fontSize: '10px', zIndex: 100,
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              border: '4px solid var(--border-color)'
            }}
          >
            {dialog}
            <div className="blinker" style={{ textAlign: 'right', fontSize: '14px', color: 'var(--text-main)' }}>▼</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityScreen;
