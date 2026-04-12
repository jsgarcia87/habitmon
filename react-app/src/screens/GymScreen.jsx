import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import DialogBox from '../components/DialogBox';
import TileMap from '../components/TileMap';

const GymScreen = ({ navigate, gymId, direction, aPressed, onBack }) => {
  const { habitosHoy } = useGame();
  const [dialog, setDialog] = useState(null);
  const [isBossDetected, setIsBossDetected] = useState(false);

  const gymData = {
    vestirse: { name: 'Gimnasio Vestirse', leader: 'Lyra' },
    desayuno: { name: 'Gimnasio Desayuno', leader: 'Ethan' },
    higiene: { name: 'Gimnasio Higiene', leader: 'Clair' },
    orden: { name: 'Gimnasio Orden', leader: 'Morty' }
  }[gymId];

  const handleTrigger = (type, data) => {
    if (type === 'npc_dialogue') {
      setDialog({ text: data.messages[0], npc: data.npc });
      if (data.npc.tipo === 'boss') {
        setIsBossDetected(true);
      }
    } else if (type === 'transfer') {
      navigate('city');
    }
  };

  const handleStartBattle = () => {
    navigate('battle', { gymId });
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
      {/* Map Area (Flex 1) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TileMap 
          mapId="virtual_pkmn_gym"
          startX={5} startY={11}
          onTrigger={handleTrigger}
          direction={direction}
          aPressed={aPressed}
        />

        {dialog && (
          <div className="gb-dialog" style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', padding: '15px', zIndex: 100 }}>
            <p style={{ fontSize: '10px', marginBottom: '10px' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{dialog.npc.nombre}:</strong>
              {dialog.text}
            </p>
            
            {isBossDetected ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="gb-button primary" onClick={handleStartBattle} style={{ fontSize: '8px', padding: '5px 10px' }}>¡COMBATIR!</button>
                <button className="gb-button" onClick={() => { setDialog(null); setIsBossDetected(false); }} style={{ fontSize: '8px', padding: '5px 10px' }}>Ahora no</button>
              </div>
            ) : (
              <div className="blinker" onClick={() => setDialog(null)} style={{ textAlign: 'right', cursor: 'pointer' }}>▼</div>
            )}
          </div>
        )}

        <button 
          onClick={onBack || (() => navigate('city'))} 
          className="gb-button" 
          style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '8px', zIndex: 10, padding: '4px 8px' }}
        >
          SALIR
        </button>
      </div>
    </div>
  );
};

export default GymScreen;
