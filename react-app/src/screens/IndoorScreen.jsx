import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import TileMap from '../components/TileMap';
import { INTERIORS } from '../data/interiors';

/**
 * IndoorScreen — Pantalla interior mejorada con motor de TileMap
 */
const IndoorScreen = ({ buildingType = 'house', onNavigate }) => {
  const { progress, template, user } = useGame();
  const [dialogue, setDialogue] = useState(null);

  // Mapeo de buildingType a virtual map key
  const vMapKey = buildingType === 'pokecenter' ? 'pkmn_center' : 
                  buildingType === 'pokemart' ? 'pkmn_mart' : 
                  buildingType === 'pokegym' ? 'pkmn_gym' : 'pkmn_center';
  
  const vMap = INTERIORS[vMapKey];

  const handleTrigger = (type, data) => {
    if (type === 'transfer' || type === 'exit') {
      onNavigate('MAP');
    }
    if (type === 'npc_dialogue') {
      setDialogue({
        name: data.npc.nombre,
        text: data.messages,
        index: 0,
        type: data.npc.tipo // 'boss' etc
      });
    }
  };

  const nextDialogue = () => {
    if (!dialogue) return;
    if (dialogue.index < dialogue.text.length - 1) {
      setDialogue({ ...dialogue, index: dialogue.index + 1 });
    } else {
      // Si era el boss, preguntar si luchar
      if (dialogue.type === 'boss') {
         setDialogue({
           ...dialogue,
           text: ['¿Quieres demostrar tu fuerza habitual?'],
           index: 0,
           isBattlePrompt: true
         });
      } else {
        setDialogue(null);
      }
    }
  };

  // Escuchar tecla A para avanzar diálogo
  useEffect(() => {
    const onKey = (e) => {
      if (dialogue && (e.key === 'z' || e.key === ' ' || e.key === 'Enter')) nextDialogue();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialogue]);

  return (
    <div style={s.screen}>
      <TileMap 
        mapId={`virtual_${vMapKey}`}
        startX={5} 
        startY={10} 
        onTrigger={handleTrigger}
      />

      {/* Caja de Diálogo */}
      {dialogue && (
        <div style={s.dialogueBox} onClick={!dialogue.isBattlePrompt ? nextDialogue : undefined}>
          <div style={s.diagName}>{dialogue.name.toUpperCase()}</div>
          <div style={s.diagText}>{dialogue.text[dialogue.index]}</div>
          
          {dialogue.isBattlePrompt ? (
            <div style={s.actions}>
               <button style={s.battleBtn} onClick={() => onNavigate('BATTLE', 'vestirse')}>¡LUCHAR!</button>
               <button style={s.cancelBtn} onClick={() => setDialogue(null)}>LUEGO</button>
            </div>
          ) : (
            <div style={s.diagArrow}>▼</div>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  );
};

const s = {
  screen: {
    width: '100%', height: '100%',
    position: 'relative',
    backgroundColor: '#000',
    fontFamily: '"Press Start 2P"',
  },
  dialogueBox: {
    position: 'absolute', bottom: '20px', left: '10px', right: '10px',
    backgroundColor: '#fff', border: '4px solid #333',
    padding: '12px', zIndex: 200, minHeight: '60px',
  },
  diagName: { fontSize: '8px', color: '#c0392b', marginBottom: '8px' },
  diagText: { fontSize: '9px', lineHeight: '1.4', color: '#111' },
  diagArrow: { position: 'absolute', right: '10px', bottom: '8px', fontSize: '8px', animation: 'blink 0.8s infinite' },
  exitBtn: {
    position: 'absolute', top: '10px', left: '10px',
    padding: '6px 10px', fontSize: '7px', background: 'rgba(0,0,0,0.5)',
    color: '#fff', border: '1px solid #fff', cursor: 'pointer', zIndex: 100
  },
  actions: {
    marginTop: '12px', display: 'flex', gap: '8px', 
    justifyContent: 'center', pointerEvents: 'auto'
  },
  battleBtn: {
    fontFamily: '"Press Start 2P"', fontSize: '8px',
    padding: '8px 12px', border: '2px solid #222', cursor: 'pointer',
    background: '#e74c3c', color: '#fff', boxShadow: '2px 2px 0 #333'
  },
  cancelBtn: {
    fontFamily: '"Press Start 2P"', fontSize: '8px',
    padding: '8px 12px', border: '2px solid #222', cursor: 'pointer',
    background: '#888', color: '#fff', boxShadow: '2px 2px 0 #333'
  }
};

export default IndoorScreen;
