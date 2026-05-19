import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from '../components/CityMap';
import DialogBox from '../components/DialogBox';
import PokemonSprite from '../components/PokemonSprite';
import { WORLD_DATA } from '../data/worldData';

const CityScreen = ({ 
  navigate, direction, aPressed, pPos, setPPos,
  currentMapId, setCurrentMapId, 
  lastExtMap, setLastExtMap,
  lastExtPos, setLastExtPos
}) => {
  const { habitosHoy, template, starter } = useGame();
  const [mapFade, setMapFade] = useState(false);
  
  // Custom states for the multi-page dialogue system and Speaker Names
  const [dialogs, setDialogs] = useState([]);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [eventNpcName, setEventNpcName] = useState('');
  
  // Custom state for the detailed Quest Journal overlay
  const [showQuestJournal, setShowQuestJournal] = useState(false);
  const [interactiveDialogue, setInteractiveDialogue] = useState(null);
  const [healFlash, setHealFlash] = useState(false);

  // Backward compatibility helper
  const setDialog = (msg) => {
    if (msg) {
      setDialogs([msg]);
      setDialogIndex(0);
      setEventNpcName('SISTEMA');
    } else {
      setDialogs([]);
    }
  };

  const currentMap = WORLD_DATA[currentMapId] || {
    nombre: 'Zona Desconocida',
    npcs: [],
    buildings: [],
    exits: {},
    isInterior: true
  };

  // Gym configurations and guidance data
  const gymNames = {
    'vestirse': { 
      nombre: 'Vestimenta 👕', 
      nombreMini: 'VESTIRSE 👕',
      icono: '👕',
      ubicacion: 'Pueblo Primavera',
      guiaMini: 'Cámbiate de ropa en el gimnasio.',
      guia: 'Está aquí mismo, en Pueblo Primavera. ¡Entra en la casa con el cartel de VESTIMENTA para cambiarte de ropa y ganarte tu medalla!' 
    },
    'desayuno': { 
      nombre: 'Desayuno 🥛', 
      nombreMini: 'DESAYUNO 🥛',
      icono: '🥛',
      ubicacion: 'Ruta 29',
      guiaMini: 'Ve a la casa de desayuno en la Ruta 29.',
      guia: 'Está al oeste de Pueblo Primavera, cruzando la Ruta 29. ¡Sigue el camino hacia la izquierda y desayuna bien en la casita del líder!' 
    },
    'higiene': { 
      nombre: 'Higiene 🪥', 
      nombreMini: 'HIGIENE 🪥',
      icono: '🪥',
      ubicacion: 'Ciudad Fronsaf',
      guiaMini: 'Lávate los dientes en Ciudad Fronsaf.',
      guia: 'Está en Ciudad Fronsaf. Sigue la Ruta 29 hacia la izquierda hasta llegar a la gran ciudad. ¡El Gimnasio de Higiene te enseñará a estar limpio!' 
    },
    'orden': { 
      nombre: 'Orden 🧸', 
      nombreMini: 'ORDEN 🧸',
      icono: '🧸',
      ubicacion: 'Ciudad Fronsaf',
      guiaMini: 'Recoge tu cuarto en Ciudad Fronsaf.',
      guia: 'Está en Ciudad Fronsaf. Ve al oeste por la Ruta 29. ¡La Torre del Orden te enseñará a recoger tus juguetes y hacer la cama hoy!' 
    },
    'comida': { 
      nombre: 'Comida 🥗', 
      nombreMini: 'COMIDA 🥗',
      icono: '🥗',
      ubicacion: 'Ciudad Fronsaf',
      guiaMini: 'Come sano en Ciudad Fronsaf.',
      guia: 'Está en Ciudad Fronsaf. Sigue la Ruta 29 al oeste. ¡El Gimnasio de la Comida Saludable te espera con alimentos súper sanos!' 
    },
    'fitness': { 
      nombre: 'Fitness 💪', 
      nombreMini: 'FITNESS 💪',
      icono: '💪',
      ubicacion: 'Ciudad Fronsaf',
      guiaMini: 'Haz ejercicio en Ciudad Fronsaf.',
      guia: 'Está en Ciudad Fronsaf. Ve hacia el oeste. ¡Te ayudará a entrenar tu cuerpo con ejercicios divertidos y cargarte de energía!' 
    }
  };

  const gymOrder = ['vestirse', 'desayuno', 'higiene', 'orden', 'comida', 'fitness'];

  // Calculate the immediate next pending gym
  const nextPendingGymId = useMemo(() => {
    for (const gymId of gymOrder) {
      const gymHabits = (habitosHoy || []).filter(h => h.gym_id === gymId);
      if (gymHabits.length > 0 && !gymHabits.every(h => h.completado)) {
        return gymId;
      }
    }
    const anyPending = (habitosHoy || []).find(h => !h.completado);
    return anyPending ? anyPending.gym_id : null;
  }, [habitosHoy]);

  const totalHabits = habitosHoy?.length || 0;
  const doneHabits = (habitosHoy || []).filter(h => h.completado).length;

  const companionName = starter?.starter_nombre || starter?.pokemon_nombre || 'Tu Habitmon';
  const targetInfo = nextPendingGymId ? gymNames[nextPendingGymId] : null;

  // Dynamic NPC dialogue evaluator
  const getDynamicNpcMessage = (npc) => {
    const npcName = npc.nombre;

    if (npcName === 'Guía del Pueblo' || npcName === 'Guía Abuelo' || npcName === 'Guardia') {
      if (totalHabits === 0) {
        return '¡Hola! Parece que no tienes ningún hábito configurado para hoy en el panel de control. ¡Pídele ayuda a tus papás!';
      }
      if (nextPendingGymId && targetInfo) {
        return `¡Hola, pequeño entrenador! Tu próxima misión activa es el Gimnasio de ${targetInfo.nombre}. ${targetInfo.guia} ¡Mucho éxito!`;
      }
      return `¡Increíble! Has completado tus ${doneHabits} de ${totalHabits} hábitos hoy. ¡Ya eres todo un campeón! Ahora puedes entrenar a tus Habitmon en la hierba de la Ruta 29.`;
    }

    if (npcName === 'Madre') {
      if (totalHabits === 0) {
        return '¡Hola, hijo! No olvides pedirle a tus papás que configuren tus hábitos de hoy en el ordenador o en los ajustes.';
      }
      if (nextPendingGymId && targetInfo) {
        return `¡Hola, mi cielo! Veo que estás esforzándote mucho. Para seguir avanzando, tu siguiente reto es el Gimnasio de ${targetInfo.nombre}. ${targetInfo.guia} ¡Te quiero, recuerda hacer bien tus tareas!`;
      }
      return '¡Qué orgullosa estoy de ti, hijo! Has completado todas tus tareas de hoy. ¡Eres un campeón! Toma un merecido descanso o sal a jugar.';
    }

    if (npcName === 'Guardia de la Ruta') {
      if (doneHabits > 0) {
        return '¡Excelente! Veo que ya has empezado a cumplir tus hábitos de hoy. ¡Buen viaje en tu aventura!';
      } else {
        return '¡Alto ahí! No puedes salir de la ciudad sin haber hecho al menos UN hábito. Completa una tarea de tu lista para que te deje pasar.';
      }
    }

    // Default to the predefined messages from worldData
    return npc.mensajes && npc.mensajes.length > 0 ? npc.mensajes[0] : '...';
  };

  const handleInteractiveOption = (value) => {
    if (value === 'heal') {
      setInteractiveDialogue(null);
      setHealFlash(true);
      setTimeout(() => {
        setHealFlash(false);
        setTimeout(() => {
          setInteractiveDialogue({
            name: 'ENFERMERA JOY',
            text: [
              '¡Tus Habitmon han recuperado todas sus fuerzas!',
              '¡Buena suerte en tu aventura!'
            ],
            options: [{ label: 'GRACIAS', value: 'close' }]
          });
        }, 400);
      }, 1200);
    } else if (value === 'shop') {
      setInteractiveDialogue(null);
      navigate('shop');
    } else {
      setInteractiveDialogue(null);
    }
  };

  // Memoize buildings to prevent unnecessary resets in CityMap
  const activeBuildings = useMemo(() => {
    return [...currentMap.buildings];
  }, [currentMapId, currentMap.buildings]);

  // Transition helper with smooth fades
  const transitionToMap = (mapId, spawnPos) => {
    setMapFade(true);
    setTimeout(() => {
      setCurrentMapId(mapId);
      if (setPPos && spawnPos) setPPos(spawnPos);
      setTimeout(() => {
        setMapFade(false);
      }, 100);
    }, 200);
  };

  const handleEvent = (event) => {
    if (event.type === 'gym_entry') {
      const b = event.building || currentMap.buildings.find(b => b.gymId === event.gymId);
      const safePos = b ? { x: b.x, y: b.y + 1 } : { x: pPos.x, y: pPos.y };
      
      setLastExtPos(safePos);
      if (setPPos) setPPos(safePos);

      const gymConfig = template?.find(g => g.gym_id === event.gymId);
      
      if (gymConfig && gymConfig.activo === false) {
        setDialog("Hoy no tienes que hacer este hábito.");
        return;
      }

      const gymHabits = (habitosHoy || []).filter(h => h.gym_id === event.gymId);
      const isDone = gymHabits.length > 0 && gymHabits.every(h => h.completado);
      
      if (gymHabits.length === 0) {
        setDialog("Este gimnasio no tiene retos activos hoy.");
        return;
      }

      if (isDone) {
        setDialog(`Ya has ganado la medalla del Gimnasio ${event.gymId?.toUpperCase() || ''} hoy.`);
      } else {
        navigate('home', { 
          gymId: event.gymId,
          targetMapId: event.targetMapId,
          spawn: event.spawn
        });
      }
    } else if (event.type === 'home_entry') {
      const b = event.building || currentMap.buildings.find(b => b.type === 'home');
      if (b) {
        const safePos = { x: b.x, y: b.y + 1 };
        setLastExtPos(safePos);
        if (setPPos) setPPos(safePos);
        
        if (b.targetMapId.startsWith('Map')) {
          if (!currentMap.isInterior) setLastExtMap(currentMapId);
          transitionToMap(b.targetMapId, b.spawn);
        } else {
          navigate('home', { targetMapId: b.targetMapId, spawn: b.spawn });
        }
      } else {
        navigate('home');
      }
    } else if (event.type === 'npc_talk') {
      if (event.npc.isLeader) {
        navigate('battle', { tipo: 'gym', gymId: event.npc.gymId });
      } else if (event.npc.nombre === 'Enfermera Joy') {
        setInteractiveDialogue({
          name: 'ENFERMERA JOY',
          text: [
            '¡Hola! Bienvenido al Centro Pokémon.',
            '¿Quieres que restauremos las fuerzas de tus Habitmon?'
          ],
          options: [
            { label: 'SÍ, POR FAVOR', value: 'heal', primary: true },
            { label: 'NO, GRACIAS', value: 'cancel' }
          ]
        });
      } else if (event.npc.nombre === 'Dependiente') {
        setInteractiveDialogue({
          name: 'DEPENDIENTE',
          text: ['¡Hola! Bienvenido a la tienda. ¿Qué deseas comprar hoy?'],
          options: [
            { label: 'COMPRAR', value: 'shop', primary: true },
            { label: 'SALIR', value: 'cancel' }
          ]
        });
      } else if (event.npc.nombre === 'Recepcionista') {
        setInteractiveDialogue({
          name: 'RECEPCIONISTA',
          text: ['¡Bienvenido al C.C. Trigal!', '¿Te puedo ayudar con algo hoy?'],
          options: [
            { label: 'COMPRAR', value: 'shop', primary: true },
            { label: 'SALIR', value: 'cancel' }
          ]
        });
      } else {
        setEventNpcName(event.npc.nombre);
        const dynamicMsg = getDynamicNpcMessage(event.npc);
        setDialogs([dynamicMsg]);
        setDialogIndex(0);
      }
    } else if (event.type === 'transfer') {
      if (currentMap.isInterior && event.side === 'down') {
        const targetMap = lastExtMap || 'Map002';
        const pos = lastExtPos || { x: 15, y: 8 };
        transitionToMap(targetMap, pos);
      } else if (event.targetMap) {
        if (!currentMap.isInterior) setLastExtMap(currentMapId);
        transitionToMap(event.targetMap, event.spawn);
      } else {
        const exit = currentMap.exits[event.side];
        
        // INTERCEPTION: Route Guard block in Pueblo Primavera
        if (currentMapId === 'Map002' && event.side === 'left' && doneHabits === 0 && totalHabits > 0) {
          setEventNpcName('Guardia de la Ruta');
          setDialogs([
            '¡Alto ahí! No puedes salir del pueblo sin haber hecho al menos UN hábito hoy.',
            'Completa una de tus tareas diarias en el gimnasio y vuelve para dejarte pasar.'
          ]);
          setDialogIndex(0);
          
          if (setPPos) {
            setPPos({ x: 3, y: 11 }); // Back player off away from the guard
          }
          return;
        }

        if (exit) {
          if (!currentMap.isInterior) setLastExtMap(currentMapId);
          transitionToMap(exit.targetMap, exit.spawn);
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

        {/* Local Map Fade Overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#000',
          zIndex: 99,
          opacity: mapFade ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.15s ease-in-out'
        }} />

        {/* Map Header HUD */}
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

        {/* COMPACT FLOATING QUEST BADGE */}
        <div 
          onClick={() => setShowQuestJournal(true)}
          style={{
            position: 'absolute', top: '40px', left: '10px',
            background: 'rgba(10, 10, 26, 0.95)',
            border: '2px solid #FFD700',
            color: '#fff',
            padding: '5px 8px',
            fontSize: '6px', zIndex: 10,
            fontFamily: '"Press Start 2P", monospace',
            cursor: 'pointer',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            borderRadius: '4px',
            animation: nextPendingGymId ? 'pulse 1.5s infinite alternate' : 'none'
          }}
        >
          <span>🎯</span>
          {nextPendingGymId ? (
            <span style={{ color: '#FFD700' }}>MISIONES: {gymNames[nextPendingGymId]?.nombreMini || nextPendingGymId.toUpperCase()}</span>
          ) : (
            <span style={{ color: '#85e085' }}>MISIONES: ¡LISTO! 🏅</span>
          )}
        </div>

        {/* DYNAMIC DIALOGUE BOX */}
        {dialogs && dialogs.length > 0 && (
          <div 
            onClick={() => {
              if (dialogIndex < dialogs.length - 1) {
                setDialogIndex(prev => prev + 1);
              } else {
                setDialogs([]);
              }
            }}
            className="gb-dialog animate-fade-in-up"
            style={{ 
              position: 'absolute', bottom: '15px', left: '15px', right: '15px', 
              fontSize: '8px', zIndex: 100,
              background: 'var(--bg-panel)',
              color: 'var(--text-main)',
              border: '4px solid var(--border-color)',
              fontFamily: '"Press Start 2P", monospace',
              padding: '12px',
              borderRadius: '0',
              boxShadow: 'var(--panel-shadow)',
              cursor: 'pointer'
            }}
          >
            <div style={{ color: '#FFD700', fontSize: '7px', marginBottom: '6px', borderBottom: '1px solid #444', paddingBottom: '3px' }}>
              💬 {eventNpcName ? eventNpcName.toUpperCase() : 'CHARLA'}
            </div>
            <div style={{ lineHeight: '1.5em', minHeight: '36px' }}>
              {dialogs[dialogIndex]}
            </div>
            <div className="blinker" style={{ textAlign: 'right', fontSize: '10px', color: '#FFD700', marginTop: '4px' }}>▼</div>
          </div>
        )}

        {/* DETAILED QUEST JOURNAL OVERLAY MODAL */}
        {showQuestJournal && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(5, 5, 15, 0.98)',
            zIndex: 500,
            display: 'flex', flexDirection: 'column',
            padding: '16px', boxSizing: 'border-box',
            fontFamily: '"Press Start 2P", monospace',
            overflowY: 'auto'
          }}>
            {/* Journal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #FFD700', paddingBottom: '10px', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '9px', color: '#FFD700', margin: 0 }}>📖 DIARIO DE MISIONES</h2>
              <button 
                onClick={() => setShowQuestJournal(false)}
                style={{
                  background: '#E83030', color: '#fff', border: '2px solid #fff',
                  fontFamily: '"Press Start 2P"', fontSize: '8px', padding: '4px 8px', cursor: 'pointer'
                }}
              >
                CERRAR
              </button>
            </div>

            {/* Progress Bar Panel */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid #555', padding: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#85e085', marginBottom: '6px' }}>
                <span>PROGRESO DIARIO:</span>
                <span>{doneHabits}/{totalHabits} ({totalHabits > 0 ? Math.round((doneHabits/totalHabits)*100) : 100}%)</span>
              </div>
              <div style={{ width: '100%', height: '14px', border: '2px solid #fff', background: '#111', padding: '2px', boxSizing: 'border-box' }}>
                <div style={{
                  width: `${totalHabits > 0 ? (doneHabits/totalHabits)*100 : 100}%`,
                  height: '100%',
                  background: '#40C040',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Companion Message Advice */}
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255, 215, 0, 0.08)', border: '2px dashed #FFD700', padding: '8px', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ flexShrink: 0, border: '2px solid #FFD700', background: '#000', borderRadius: '4px', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <PokemonSprite id={starter?.starter_id || starter?.pokemon_id || '001'} style={{ width: '48px', height: '48px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '6px', color: '#FFD700' }}>🐾 CONSEJO DE {companionName.toUpperCase()}:</span>
                <p style={{ fontSize: '6px', color: '#fff', lineHeight: '1.4em', margin: 0 }}>
                  {nextPendingGymId && targetInfo ? (
                    `¡Hola! Tu compañero te anima: "¡Nuestra siguiente parada es el Gimnasio de ${targetInfo.nombre.toUpperCase()}! ${targetInfo.guia}"`
                  ) : (
                    `¡Increíble! Tu compañero salta de alegría: "¡Has completado todos tus hábitos hoy! ¡Eres un súper entrenador!"`
                  )}
                </p>
              </div>
            </div>

            {/* Quest list grouping by gym */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '7px', color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '4px' }}>ESTADO DE GIMNASIOS:</span>
              {gymOrder.map(gymId => {
                const gymHabits = (habitosHoy || []).filter(h => h.gym_id === gymId);
                if (gymHabits.length === 0) return null; // No habits for this gym today
                
                const isGymDone = gymHabits.every(h => h.completado);
                const isNext = gymId === nextPendingGymId;
                const info = gymNames[gymId] || { nombre: gymId, icono: '🏆', ubicacion: 'Johto' };

                return (
                  <div 
                    key={gymId}
                    style={{
                      border: `2px solid ${isGymDone ? '#2D8A2D' : (isNext ? '#FFD700' : '#444')}`,
                      background: isGymDone ? 'rgba(45, 138, 45, 0.05)' : (isNext ? 'rgba(255, 215, 0, 0.05)' : 'rgba(255,255,255,0.01)'),
                      padding: '8px',
                      position: 'relative'
                    }}
                  >
                    {isNext && (
                      <div style={{ position: 'absolute', top: '-6px', right: '6px', background: '#FFD700', color: '#000', fontSize: '5px', padding: '2px 4px', fontWeight: 'bold' }}>
                        🎯 ACTUAL
                      </div>
                    )}
                    
                    {/* Gym Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '7px', color: isGymDone ? '#85e085' : (isNext ? '#FFD700' : '#fff'), fontWeight: 'bold' }}>
                        {info.icono} GIMNASIO {info.nombre.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '5px', color: '#888' }}>📍 {info.ubicacion.toUpperCase()}</span>
                    </div>

                    {/* Tasks Sub-list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                      {gymHabits.map(h => {
                        const hId = h.habito_id || h.id;
                        return (
                          <div key={hId} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: h.completado ? 0.6 : 1 }}>
                            <span style={{ fontSize: '8px', color: h.completado ? '#2D8A2D' : '#888' }}>
                              {h.completado ? '☑' : '☐'}
                            </span>
                            <span style={{ fontSize: '6px', color: h.completado ? '#aaa' : '#fff', textDecoration: h.completado ? 'line-through' : 'none' }}>
                              {h.icono} {h.nombre} ({h.daño || 20} DMG)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* White flash overlay for Centro Pokémon heal animation */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#fff',
          opacity: healFlash ? 1 : 0,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
          zIndex: 200
        }} />

        {/* Interactive NPC dialogue (Centro Pokémon / Tienda) */}
        {interactiveDialogue && (
          <DialogBox
            name={interactiveDialogue.name}
            text={interactiveDialogue.text}
            options={interactiveDialogue.options}
            onComplete={() => setInteractiveDialogue(null)}
            onOptionSelect={handleInteractiveOption}
          />
        )}
      </div>
    </div>
  );
};

export default CityScreen;
