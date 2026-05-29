import React, { useState, useEffect, useRef } from 'react';
import InteriorMap from '../components/InteriorMap';
import DialogBox from '../components/DialogBox';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { sfx, initAudio } from '../utils/audioEngine';

const config = INTERIOR_CONFIGS['pokemon_center'];
const mapMatrix = INTERIOR_MAPS['pokemon_center'];

const NURSE_JOY = {
  id: 'joy',
  nombre: 'Enfermera Joy',
  sprite: 'char_ 05_b',
  x: 9,
  y: 3,
  direccion: 0
};

const PokemonCenterScreen = ({ navigate, direction, aPressed }) => {
  const [dialogue, setDialogue] = useState(null);
  const [healState, setHealState] = useState('idle'); // idle | healing | healed
  const [flashAlpha, setFlashAlpha] = useState(0);
  const flashTimerRef = useRef(null);

  useEffect(() => {
    initAudio();
    // Fade-in on enter
    setFlashAlpha(1);
    const t = setTimeout(() => setFlashAlpha(0), 50);
    return () => {
      clearTimeout(t);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const runHealAnimation = () => {
    setHealState('healing');
    setFlashAlpha(0);
    let pulses = 0;
    const doPulse = () => {
      sfx.heal();
      setFlashAlpha(0.7);
      flashTimerRef.current = setTimeout(() => {
        setFlashAlpha(0.1);
        pulses++;
        if (pulses < 3) {
          flashTimerRef.current = setTimeout(doPulse, 450);
        } else {
          flashTimerRef.current = setTimeout(() => {
            setFlashAlpha(0);
            setHealState('healed');
            setDialogue({
              name: 'ENFERMERA JOY',
              text: [
                '¡Tus Habitmon han recuperado todas sus fuerzas!',
                '¡Buena suerte en tu aventura!'
              ]
            });
          }, 400);
        }
      }, 350);
    };
    // Brief white flash before the healing sequence
    setFlashAlpha(1);
    flashTimerRef.current = setTimeout(doPulse, 250);
  };

  const handleEvent = (event) => {
    if (event.type === 'npc_talk' && event.npc.id === 'joy') {
      if (healState === 'healed') {
        setDialogue({
          name: 'ENFERMERA JOY',
          text: ['¡Tus Pokémon están en perfectas condiciones!', '¡Vuelve cuando quieras!']
        });
        return;
      }
      setDialogue({
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
    }
  };

  const handleExit = () => {
    setFlashAlpha(1);
    setTimeout(() => navigate('city'), 300);
  };

  const handleOptionSelect = (val) => {
    setDialogue(null);
    if (val === 'heal') runHealAnimation();
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={{ floor: 36, exit: 54 }}
          initialPos={config.spawn}
          npcs={[NURSE_JOY]}
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

      {/* Flash / healing overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: '#FF9ECC',
        opacity: flashAlpha,
        transition: healState === 'healing' ? 'opacity 0.3s ease' : 'opacity 0.4s ease',
        pointerEvents: 'none', zIndex: 20
      }} />

      {dialogue && (
        <DialogBox
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => setDialogue(null)}
          onOptionSelect={handleOptionSelect}
          options={dialogue.options || []}
        />
      )}
    </div>
  );
};

export default PokemonCenterScreen;
