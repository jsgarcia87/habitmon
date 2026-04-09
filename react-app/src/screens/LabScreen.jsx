import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SpriteAvatar } from '../components/GBSprite';

const LabScreen = ({ onNavigate }) => {
  const { chooseStarter, user } = useGame();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const starters = [
    { id: 1, name: 'BULBASAUR', img: 'Graphics/battlers/001.png', color: '#44BB44' },
    { id: 4, name: 'CHARMANDER', img: 'Graphics/battlers/004.png', color: '#FF8844' },
    { id: 7, name: 'SQUIRTLE', img: 'Graphics/battlers/007.png', color: '#4488FF' }
  ];

  const dialogues = [
    `¡Hola, ${user?.username?.toUpperCase() || 'ENTRENADOR'}! Bienvenido al mundo de HABITMON.`,
    "Soy el PROF. OAK, el experto en hábitos y rutinas saludables.",
    "Para comenzar tu aventura, necesitas un compañero que te ayude a combatir el desorden.",
    "Aquí tengo tres POKéMON. Por favor, ¡elige sabiamente!"
  ];

  const handleNextDialogue = () => {
    if (step < dialogues.length - 1) {
      setStep(step + 1);
    } else {
      setStep('choose');
    }
  };

  const handleSelection = async (st) => {
    if (!window.confirm(`¿Quieres elegir a ${st.name}?`)) return;
    setLoading(true);
    const res = await chooseStarter(st.id, st.name);
    if (res.success) {
      onNavigate('MAP');
    } else {
      alert("Error al elegir: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div style={S.screen}>
      {/* Background / Lab visual */}
      <div style={S.labVisual}>
        <div style={S.oakWrapper}>
           <SpriteAvatar 
             path="Graphics/characters/prof_oak.png" 
             size={80} 
             col={0} 
             row={0} 
           />
        </div>
        
        {step === 'choose' && (
          <div style={S.starterGrid}>
            {starters.map(st => (
               <div key={st.id} style={S.pokeballCard} onClick={() => handleSelection(st)}>
                  <div style={S.pokeballIcon}>🔴</div>
                  <img src={st.img} alt={st.name} style={S.pkmnPreview} />
                  <span style={{...S.pkmnName, color: st.color}}>{st.name}</span>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue Box */}
      {step !== 'choose' ? (
        <div style={S.dialogBox} onClick={handleNextDialogue}>
          <p style={S.text}>{dialogues[step]}</p>
          <div style={S.arrow}>▼</div>
        </div>
      ) : (
        <div style={S.dialogBox}>
           <p style={S.text}>PROF. OAK: ¡Adelante! Escoge tu primer POKéMON.</p>
        </div>
      )}

      <style>{CSS}</style>
    </div>
  );
};

const S = {
  screen: {
    width: '100%', height: '100%',
    backgroundColor: '#78C840', display: 'flex', flexDirection: 'column',
    fontFamily: '"Press Start 2P", monospace', overflow: 'hidden'
  },
  labVisual: {
    flex: 1, position: 'relative',
    backgroundImage: "url('Graphics/tilesets/gsc lab-gym.png')",
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    border: '5px solid #333',
    margin: '10px', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  oakWrapper: {
    position: 'absolute', top: '35%', left: '50%',
    transform: 'translateX(-50%)', textAlign: 'center'
  },
  oakImg: {
    display: 'none' // Removed in favor of SpriteAvatar
  },
  dialogBox: {
    height: '100px', backgroundColor: '#fff',
    border: '4px solid #111', borderRadius: '8px',
    margin: '0 10px 10px 10px', padding: '15px',
    position: 'relative', cursor: 'pointer',
    boxShadow: 'inset -3px -3px 0 #888'
  },
  text: {
    fontSize: '9px', lineHeight: '1.6em', color: '#111', margin: 0
  },
  arrow: {
    position: 'absolute', right: '15px', bottom: '10px',
    fontSize: '10px', animation: 'blink 0.8s infinite steps(1)'
  },
  starterGrid: {
    position: 'absolute', bottom: '10px', width: '100%',
    display: 'flex', justifyContent: 'space-around', padding: '0 10px'
  },
  pokeballCard: {
    backgroundColor: 'rgba(255,255,255,0.9)', border: '3px solid #333',
    padding: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '5px', width: '30%', borderRadius: '4px'
  },
  pkmnPreview: { width: '40px', imageRendering: 'pixelated' },
  pkmnName: { fontSize: '6px', fontWeight: 'bold' },
  pokeballIcon: { fontSize: '12px' }
};

const CSS = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

export default LabScreen;
