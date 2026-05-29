import React, { useState, useEffect, useRef, useCallback } from 'react';
import InteriorMap from '../components/InteriorMap';
import DialogBox from '../components/DialogBox';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { sfx, initAudio } from '../utils/audioEngine';

const config = INTERIOR_CONFIGS['pokemon_center'];
const mapMatrix = INTERIOR_MAPS['pokemon_center'];

// NPC direccion: 0=down, 1=left, 2=right, 3=up

const INITIAL_NPCS = [
  // Interior 10×8 con offset (5, 3). Mostrador (única fila) en y=5. Suelo
  // desde y=6. Heal machine en (7,4)+(8,4)+(7,5)+(8,5). PC en (12,4)+(12,5).
  //
  // Joy se dibuja SOBRE el tile del mostrador (CT) en y=5. El jugador habla
  // con ella desde la fila de suelo inmediatamente debajo (y=6).
  { id: 'joy',       nombre: 'Enfermera Joy', sprite: 'char_ 05_b', x: 9,  y: 5, direccion: 0 },
  // Pescador — junto al PC en la fila de suelo, mirando a la derecha hacia el PC.
  { id: 'fisher',    nombre: 'Pescador',      sprite: 'char_ 03_b', x: 11, y: 6, direccion: 2 },
  // Caballero — paseando por el centro de la sala.
  { id: 'gentleman', nombre: 'Caballero',     sprite: 'char_ 07_b', x: 9,  y: 8, direccion: 0 },
  // Maestra — lateral izquierdo, mirando hacia la derecha.
  { id: 'teacher',   nombre: 'Maestra',       sprite: 'char_ 04_b', x: 6,  y: 7, direccion: 2 },
];

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morn';
  if (h >= 12 && h < 18) return 'day';
  return 'nite';
};

const JOY_GREETING = {
  morn: '¡Buenos días! Bienvenido al CENTRO POKÉMON.',
  day:  '¡Buenas tardes! Bienvenido al CENTRO POKÉMON.',
  nite: '¡Buenas noches! Bienvenido al CENTRO POKÉMON.'
};

const PokemonCenterScreen = ({ navigate, direction, aPressed }) => {
  const [npcs, setNpcs] = useState(INITIAL_NPCS);
  const [dialogue, setDialogue] = useState(null);
  const [healState, setHealState] = useState('idle'); // idle | healing | healed
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [machinePulse, setMachinePulse] = useState(0); // 0..1 brillo de la máquina
  const [fadeAlpha, setFadeAlpha] = useState(1);
  const timersRef = useRef([]);

  // Helper para encadenar timeouts y poder cancelarlos en cleanup.
  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Cambia la direccion de un NPC concreto.
  const turnNpc = useCallback((id, dir) => {
    setNpcs(prev => prev.map(n => (n.id === id ? { ...n, direccion: dir } : n)));
  }, []);

  useEffect(() => {
    initAudio();
    setFadeAlpha(1);
    const t = setTimeout(() => setFadeAlpha(0), 80);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
  }, [clearTimers]);

  // ----------------------------------------------------------------------
  // Coreografía de curación al estilo Crystal:
  //   1. Joy: "Vale, déjame tus Habitmon..."
  //   2. Joy gira a la IZQUIERDA hacia la máquina (dir=1).
  //   3. Pausa breve + pulsos de la máquina (3 ciclos) con flash rosa suave.
  //   4. Joy gira a ABAJO (dir=0) hacia el jugador.
  //   5. "¡Aquí los tienes!"
  //   6. Reverencia: Joy gira UP (dir=3) y vuelve a DOWN (dir=0).
  //   7. Despedida final.
  // ----------------------------------------------------------------------
  const runHealAnimation = useCallback(() => {
    setHealState('healing');
    setDialogue({
      name: 'ENFERMERA JOY',
      text: ['Vale, déjame tus Habitmon un momentito...'],
      autoCloseMs: 1400
    });

    // 1. Joy gira a la izquierda hacia la máquina (tras leer la frase).
    schedule(() => {
      turnNpc('joy', 1);
      setDialogue(null);
    }, 1400);

    // 2. Pulsos de la máquina (3 ciclos de 600ms cada uno).
    const pulseStart = 1700;
    const pulseCount = 3;
    const pulseInterval = 600;
    for (let i = 0; i < pulseCount; i++) {
      schedule(() => {
        sfx.heal();
        setMachinePulse(1);
        setFlashAlpha(0.35);
        schedule(() => {
          setMachinePulse(0.15);
          setFlashAlpha(0.08);
        }, 280);
      }, pulseStart + i * pulseInterval);
    }

    // 3. Tras los pulsos: Joy vuelve a mirar al jugador.
    const afterPulses = pulseStart + pulseCount * pulseInterval + 250;
    schedule(() => {
      setMachinePulse(0);
      setFlashAlpha(0);
      turnNpc('joy', 0);
    }, afterPulses);

    // 4. Diálogo de devolución + reverencia.
    schedule(() => {
      setDialogue({
        name: 'ENFERMERA JOY',
        text: [
          '¡Aquí los tienes! Han recuperado todas sus fuerzas.',
          '¡Cuida mucho de ellos! Que tengas un gran día.'
        ],
        onAfterClose: () => {
          // Reverencia: arriba → abajo.
          turnNpc('joy', 3);
          schedule(() => turnNpc('joy', 0), 250);
          setHealState('healed');
        }
      });
    }, afterPulses + 300);
  }, [schedule, turnNpc]);

  // ----------------------------------------------------------------------
  // Manejo de eventos del mundo (NPCs y objetos).
  // ----------------------------------------------------------------------
  const handleEvent = useCallback((event) => {
    if (event.type === 'npc_talk') {
      const id = event.npc.id;

      if (id === 'joy') {
        if (healState === 'healing') return;
        if (healState === 'healed') {
          setDialogue({
            name: 'ENFERMERA JOY',
            text: [
              'Tus Habitmon están en perfectas condiciones.',
              '¡Vuelve si necesitas curarlos otra vez!'
            ]
          });
          return;
        }
        const tod = getTimeOfDay();
        setDialogue({
          name: 'ENFERMERA JOY',
          text: [
            JOY_GREETING[tod],
            '¿Quieres que cuide de tus Habitmon para que recuperen toda su energía?'
          ],
          options: [
            { label: 'SÍ, POR FAVOR', value: 'heal', primary: true },
            { label: 'NO, GRACIAS',   value: 'cancel' }
          ]
        });
        return;
      }

      if (id === 'fisher') {
        setDialogue({
          name: 'PESCADOR',
          text: [
            'Este PC es genial. ¡Puedo guardar todos los HABITMON que quiera!',
            'Y además... ¡es gratis!'
          ]
        });
        return;
      }

      if (id === 'gentleman') {
        setDialogue({
          name: 'CABALLERO',
          text: ['Ese PC de la esquina es libre.', 'Cualquier entrenador puede usarlo.']
        });
        return;
      }

      if (id === 'teacher') {
        setDialogue({
          name: 'MAESTRA',
          text: [
            'Pronto abrirán el CENTRO DE COMUNICACIÓN en el piso de arriba.',
            '¡Podremos intercambiar HABITMON con nuestros amigos!'
          ]
        });
        return;
      }
    }

    if (event.type === 'object_interact') {
      if (event.objectType === 'pc') {
        sfx.menuOpen();
        setDialogue({
          name: 'PC',
          text: [
            'EL PC DEL ENTRENADOR ESTÁ ENCENDIDO.',
            'Puedes consultar tu COLECCIÓN desde el menú principal.'
          ]
        });
        return;
      }
      if (event.objectType === 'heal_machine' && healState !== 'healing') {
        setDialogue({
          name: 'MÁQUINA',
          text: ['La máquina de curación zumba suavemente.', 'Solo la ENFERMERA JOY puede usarla.']
        });
      }
    }
  }, [healState]);

  const handleExit = useCallback(() => {
    clearTimers();
    setFadeAlpha(1);
    setTimeout(() => navigate('city'), 300);
  }, [clearTimers, navigate]);

  const handleOptionSelect = useCallback((val) => {
    const current = dialogue;
    setDialogue(null);
    if (val === 'heal') {
      runHealAnimation();
    } else if (val === 'cancel') {
      setDialogue({
        name: 'ENFERMERA JOY',
        text: ['Está bien. ¡Vuelve cuando quieras!']
      });
    }
  }, [dialogue, runHealAnimation]);

  const handleDialogueComplete = useCallback(() => {
    const after = dialogue?.onAfterClose;
    setDialogue(null);
    if (typeof after === 'function') after();
  }, [dialogue]);

  // Auto-close dialogue tras N ms si la frase es informativa (sin opciones)
  // y el caller lo pidió explícitamente.
  useEffect(() => {
    if (dialogue?.autoCloseMs && !dialogue.options?.length) {
      const id = setTimeout(() => {
        setDialogue(null);
      }, dialogue.autoCloseMs);
      return () => clearTimeout(id);
    }
  }, [dialogue]);

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={{ floor: 28 }}
          initialPos={config.spawn}
          facing="up"
          npcs={npcs}
          exitPositions={config.exitPositions}
          onEvent={handleEvent}
          onExit={handleExit}
          direction={direction}
          aPressed={aPressed}
          currentMapId="pokemon_center"
        />
      </div>

      {/* Nombre del lugar */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)', color: '#FF6B9D',
        border: '2px solid #FF6B9D', padding: '6px 16px',
        fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4,
        whiteSpace: 'nowrap'
      }}>
        CENTRO POKÉMON
      </div>

      <button
        onClick={handleExit}
        style={{
          position: 'absolute', top: 10, left: 10, padding: '8px 12px',
          background: '#222', color: '#fff', border: '2px solid #666',
          borderRadius: 4, fontFamily: '"Press Start 2P"', fontSize: 8,
          cursor: 'pointer', zIndex: 10
        }}
      >
        SALIR
      </button>

      {/* Fade entrada/salida */}
      <div style={{
        position: 'absolute', inset: 0, background: '#000',
        opacity: fadeAlpha, transition: 'opacity 0.4s ease',
        pointerEvents: 'none', zIndex: 25
      }} />

      {/* Flash de curación (tinte rosa suave a pantalla completa) */}
      <div style={{
        position: 'absolute', inset: 0, background: '#FF9ECC',
        opacity: flashAlpha,
        transition: 'opacity 0.18s ease-out',
        pointerEvents: 'none', zIndex: 20
      }} />

      {/* Pulso luminoso focalizado sobre la máquina de curación.
          Heal machine ocupa tiles (7, 4)+(7, 5) en un mapa 20×15.
          Centro aproximado: x≈37%, y≈30%. */}
      {machinePulse > 0 && (
        <div style={{
          position: 'absolute',
          left: '37%', top: '30%',
          width: '10%', height: '8%',
          background: 'radial-gradient(circle, rgba(255,255,200,0.95) 0%, rgba(255,200,100,0.4) 50%, rgba(255,200,100,0) 80%)',
          opacity: machinePulse,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 19,
          transition: 'opacity 0.18s ease-out',
          transform: 'translate(-50%, -50%)'
        }} />
      )}

      {dialogue && (
        <DialogBox
          name={dialogue.name}
          text={dialogue.text}
          onComplete={handleDialogueComplete}
          onOptionSelect={handleOptionSelect}
          options={dialogue.options || []}
        />
      )}
    </div>
  );
};

export default PokemonCenterScreen;
