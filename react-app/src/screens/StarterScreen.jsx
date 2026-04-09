import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import TileMap from '../components/TileMap';

const STARTERS = [
  { 
    id: '001', nombre: 'Bulbasaur', tipo: 'Planta',
    sprite: 'Graphics/battlers/001.png',
    icon: 'Graphics/icons/001.png',
    descripcion: 'Tranquilo y constante',
    tileX: 8, tileY: 6
  },
  { 
    id: '004', nombre: 'Charmander', tipo: 'Fuego',
    sprite: 'Graphics/battlers/004.png',
    icon: 'Graphics/icons/004.png',
    descripcion: 'Valiente y enérgico',
    tileX: 10, tileY: 6
  },
  { 
    id: '007', nombre: 'Squirtle', tipo: 'Agua',
    sprite: 'Graphics/battlers/007.png',
    icon: 'Graphics/icons/007.png',
    descripcion: 'Inteligente y sereno',
    tileX: 12, tileY: 6
  }
];

const OAK_DIALOGUE = [
  "¡Bienvenido al mundo POKÉMON!",
  "Soy el Prof. OAK.",
  "Este mundo está habitado por seres llamados POKÉMON.",
  "Los humanos y POKÉMON vivimos juntos.",
  "Pero algunos POKÉMON son especiales...",
  "¡Pueden ayudarte a superar los retos del día!",
  "Estos son los 3 POKÉMON que te propongo.",
  "¡Elige el que más te guste como compañero!"
];

const StarterScreen = ({ onNavigate }) => {
  const { chooseStarter, user } = useGame();
  const [diaIdx, setDiaIdx] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [selectedPkmn, setSelectedPkmn] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [flash, setFlash] = useState(0);

  const handleDialogue = () => {
    if (diaIdx < OAK_DIALOGUE.length - 1) {
      setDiaIdx(diaIdx + 1);
    } else {
      setShowIntro(false);
    }
  };

  const onMapTrigger = (type) => {
    // If it's a starter selection
    const starter = STARTERS.find(s => {
       // We can detect proximity based on TileMap logic, 
       // but here we wait for interaction trigger.
       // Let's assume the user has to be on/adjacent to the tile.
       return type === `starter_${s.id}`;
    });

    if (starter) {
       setSelectedPkmn(starter);
       setIsConfirming(true);
    }
  };

  const handleSelection = async (confirm) => {
    if (!confirm) {
       setIsConfirming(false);
       setSelectedPkmn(null);
       return;
    }

    setAnimating(true);
    // Flash effect
    let count = 0;
    const itv = setInterval(() => {
      setFlash(f => f === 0 ? 0.8 : 0);
      count++;
      if (count > 6) {
        clearInterval(itv);
        doFinalize();
      }
    }, 150);
  };

  const doFinalize = async () => {
    try {
      const res = await chooseStarter(selectedPkmn.id, selectedPkmn.nombre);
      if (res.success) {
        onNavigate('MAP');
      } else {
        alert("¡Vaya! Algo ha fallado: " + (res.error || "Desconocido"));
        setAnimating(false);
        setIsConfirming(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el laboratorio.");
      setAnimating(false);
      setIsConfirming(false);
    }
  };

  return (
    <div style={S.container}>
      {/* Map View */}
      <div style={S.mapWrapper}>
        <TileMap 
          mapId="Map064" 
          startX={10} startY={11} startDir={3}
          starters={STARTERS}
          onTrigger={(type) => {
             // Basic interaction logic: if near a starter, trigger selection
             // This needs to be called from TileMap's interaction logic
             onMapTrigger(type);
          }}
        />
        
        {/* Overlay for Flash */}
        <div style={{...S.flash, opacity: flash}} />
      </div>

      {/* Dialogue HUD */}
      {showIntro && (
        <div style={S.dialogueBox} onClick={handleDialogue}>
          <div style={S.dialogueText}>{OAK_DIALOGUE[diaIdx]}</div>
          <div style={S.arrow}>▼</div>
        </div>
      )}

      {isConfirming && !animating && (
        <div style={S.confirmBox}>
          <div style={S.confirmTitle}>PROF. OAK:</div>
          <div style={S.confirmText}>¿Eliges a {selectedPkmn.nombre} como tu compañero?</div>
          <div style={S.btnGroup}>
             <button style={S.btnYes} onClick={() => handleSelection(true)}>SÍ</button>
             <button style={S.btnNo} onClick={() => handleSelection(false)}>NO</button>
          </div>
        </div>
      )}

      {animating && selectedPkmn && (
        <div style={S.successOverlay}>
           <div style={S.successMsg}>¡{selectedPkmn.nombre.toUpperCase()} TE HA ELEGIDO!</div>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
};

const S = {
  container: { width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  mapWrapper: { flex: 1, height: '100%', position: 'relative' },
  flash: { position: 'absolute', inset: 0, backgroundColor: '#fff', pointerEvents: 'none', transition: 'opacity 0.1s' },
  dialogueBox: {
    position: 'absolute', bottom: 10, left: 10, right: 10, height: '80px',
    backgroundColor: 'rgba(255,255,255,0.95)', border: '4px solid #333',
    borderRadius: 8, padding: 15, fontFamily: '"Press Start 2P"',
    zIndex: 10, cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
  },
  dialogueText: { fontSize: 10, lineHeight: 1.5, color: '#333' },
  arrow: { position: 'absolute', right: 15, bottom: 10, fontSize: 12, animation: 'blink 0.8s infinite' },
  confirmBox: {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '240px', backgroundColor: '#fff', border: '4px solid #333', borderRadius: 8,
    padding: 20, textAlign: 'center', zIndex: 20, fontFamily: '"Press Start 2P"'
  },
  confirmTitle: { fontSize: 8, color: '#666', marginBottom: 5, textAlign: 'left' },
  confirmText: { fontSize: 9, lineHeight: 1.6, marginBottom: 20 },
  btnGroup: { display: 'flex', justifyContent: 'space-around' },
  btnYes: { padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, borderRadius: 4 },
  btnNo: { padding: '8px 16px', background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, borderRadius: 4 },
  successOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, backgroundColor: 'rgba(0,0,0,0.2)' },
  successMsg: { fontSize: 18, color: '#fff', fontFamily: '"Press Start 2P"', textShadow: '2px 2px 0 #000' }
};

const CSS = `
  @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
`;

export default StarterScreen;
