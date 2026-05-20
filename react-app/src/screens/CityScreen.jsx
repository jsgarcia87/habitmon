import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import CityMap from '../components/CityMap';
import DialogBox from '../components/DialogBox';
import PokemonSprite from '../components/PokemonSprite';
import { SpriteAvatar } from '../components/GBSprite';
import { WORLD_DATA } from '../data/worldData';
import { api, getAssetPath } from '../api';

const GYM_LIST = [
  { id: 'vestirse', icon: '👕', name: 'VESTIRSE' },
  { id: 'desayuno', icon: '🥛', name: 'DESAYUNO' },
  { id: 'higiene', icon: '🪥', name: 'HIGIENE' },
  { id: 'orden',   icon: '🧸', name: 'ORDEN'    },
  { id: 'comida',  icon: '🥗', name: 'COMIDA'   },
  { id: 'fitness', icon: '💪', name: 'FITNESS'  },
];

const CityScreen = ({
  navigate, direction, aPressed, pPos, setPPos,
  currentMapId, setCurrentMapId, 
  lastExtMap, setLastExtMap,
  lastExtPos, setLastExtPos
}) => {
  const { habitosHoy, template, starter, token, racha } = useGame();
  const [irisPhase, setIrisPhase] = useState(null); // null | 'closing' | 'opening'
  const irisCanvasRef = useRef(null);
  const irisAnimRef = useRef(null);

  useEffect(() => {
    const canvas = irisCanvasRef.current;
    if (!canvas) return;
    cancelAnimationFrame(irisAnimRef.current);

    const ctx = canvas.getContext('2d');
    if (!irisPhase) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const parent = canvas.parentElement;
    const W = canvas.width = parent?.offsetWidth || 320;
    const H = canvas.height = parent?.offsetHeight || 568;
    const maxR = Math.hypot(W, H) / 2 + 4;
    const cx = W / 2, cy = H / 2;
    const DURATION = 280;
    let startTime = null;

    const animate = (now) => {
      if (!startTime) startTime = now;
      const t = Math.min(1, (now - startTime) / DURATION);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const r = irisPhase === 'closing' ? maxR * (1 - t) : maxR * t;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (t < 1) irisAnimRef.current = requestAnimationFrame(animate);
    };
    irisAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(irisAnimRef.current);
  }, [irisPhase]);
  
  // Custom states for the multi-page dialogue system and Speaker Names
  const [dialogs, setDialogs] = useState([]);
  const [dialogIndex, setDialogIndex] = useState(0);
  const [eventNpcName, setEventNpcName] = useState('');
  
  // Custom state for the detailed Quest Journal overlay
  const [showQuestJournal, setShowQuestJournal] = useState(false);
  const [interactiveDialogue, setInteractiveDialogue] = useState(null);
  const [healFlash, setHealFlash] = useState(false);

  // MMO — amigos online en el mapa actual
  const [amigosEnMapa, setAmigosEnMapa] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null); // amigo seleccionado (A-press)
  const lastFacingRef = useRef(0);   // 0=down 1=left 2=right 3=up
  const posRef = useRef(pPos);
  useEffect(() => { posRef.current = pPos; }, [pPos]);
  useEffect(() => {
    if (direction) lastFacingRef.current = { up:3, down:0, left:1, right:2 }[direction] ?? 0;
  }, [direction]);

  // MMO polling — actualiza posición propia y recibe amigos en el mapa cada 4 s
  useEffect(() => {
    if (!token) return;
    const sync = async () => {
      const pos = posRef.current || { x: 12, y: 12 };
      const result = await api.actualizarPosicion({
        mapa_id: currentMapId,
        x: pos.x, y: pos.y,
        direccion: lastFacingRef.current
      });
      if (result?.success) setAmigosEnMapa(result.amigos_en_mapa || []);
    };
    sync();
    const id = setInterval(sync, 4000);
    return () => clearInterval(id);
  }, [token, currentMapId]);

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
    setIrisPhase('closing');
    setTimeout(() => {
      setCurrentMapId(mapId);
      if (setPPos && spawnPos) setPPos(spawnPos);
      setIrisPhase('opening');
      setTimeout(() => setIrisPhase(null), 300);
    }, 300);
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
    } else if (event.type === 'friend_talk') {
      setActiveFriend(event.friend);
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
          onlineFriends={amigosEnMapa}
        />

        {/* Iris-wipe transition canvas */}
        <canvas
          ref={irisCanvasRef}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            zIndex: 99, pointerEvents: 'none'
          }}
        />

        {/* Map Header HUD */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          display: 'flex', alignItems: 'flex-start', gap: '4px', zIndex: 10
        }}>
          {/* Nombre del mapa — Crystal dialog box style */}
          <div style={{
            background: '#f8f8f0', padding: '4px 8px',
            border: '3px solid #333',
            color: '#111', fontSize: '7px',
            fontFamily: '"Press Start 2P"',
            boxShadow: '3px 3px 0 #000'
          }}>
            {currentMap.nombre.toUpperCase()}
          </div>
          {/* Racha badge — solo visible si racha > 0 */}
          {racha > 0 && (
            <div style={{
              background: racha >= 7 ? '#f80000' : racha >= 3 ? '#f87800' : '#f8c800',
              padding: '4px 6px',
              border: '3px solid #333',
              color: '#fff', fontSize: '6px',
              fontFamily: '"Press Start 2P"',
              boxShadow: '3px 3px 0 #000',
              whiteSpace: 'nowrap'
            }}>
              🔥{racha}
            </div>
          )}
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

        {/* MMO — Friend profile overlay */}
        {activeFriend && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Press Start 2P", monospace',
            padding: '16px', boxSizing: 'border-box'
          }}>
            <div style={{
              background: '#0a0a1a',
              border: '4px solid #00e5ff',
              boxShadow: '0 0 20px #00e5ff66',
              padding: '16px',
              width: '100%', maxWidth: '280px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00e5ff', paddingBottom: '8px' }}>
                <span style={{ fontSize: '8px', color: '#00e5ff' }}>👤 ENTRENADOR</span>
                <button onClick={() => setActiveFriend(null)} style={{ background: '#E83030', color: '#fff', border: '2px solid #fff', fontFamily: '"Press Start 2P"', fontSize: '8px', padding: '2px 6px', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ border: '3px solid #00e5ff', background: '#000', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #00e5ff44' }}>
                  <SpriteAvatar
                    src={getAssetPath(`Graphics/characters/char_ ${String(activeFriend.avatar || 1).padStart(2,'0')}_a.png`)}
                    direction={activeFriend.direccion ?? 0}
                    size={48}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8px', color: '#fff' }}>{(activeFriend.username || '???').toUpperCase()}</span>
                  <span style={{ fontSize: '6px', color: '#aaa' }}>🐾 {(activeFriend.pokemon_nombre || '?').toUpperCase()}</span>
                  <span style={{ fontSize: '6px', color: '#aaa' }}>LV.{activeFriend.partner_level || '?'}</span>
                </div>
              </div>

              {/* Gym medals grid */}
              <div>
                <span style={{ fontSize: '6px', color: '#aaa', display: 'block', marginBottom: '6px' }}>MEDALLAS DE HOY:</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px' }}>
                  {GYM_LIST.map(g => {
                    const done = (activeFriend.gimnasios_completados || []).includes(g.id);
                    return (
                      <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px', border: `2px solid ${done ? '#2D8A2D' : '#444'}`, background: done ? 'rgba(45,138,45,0.15)' : 'transparent' }}>
                        <span style={{ fontSize: '12px', opacity: done ? 1 : 0.3 }}>{g.icon}</span>
                        <span style={{ fontSize: '5px', color: done ? '#85e085' : '#666' }}>{g.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Challenge button */}
              <button
                onClick={() => {
                  const friend = activeFriend;
                  setActiveFriend(null);
                  navigate('battle', {
                    tipo: 'wild',
                    pokemon: { id: friend.pokemon_id, nivel: friend.partner_level || 5 }
                  });
                }}
                style={{
                  background: '#E83030', color: '#fff',
                  border: '3px solid #fff',
                  fontFamily: '"Press Start 2P"',
                  fontSize: '7px', padding: '8px',
                  cursor: 'pointer', width: '100%'
                }}
              >
                ⚔️ ¡RETAR A DUELO!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityScreen;
