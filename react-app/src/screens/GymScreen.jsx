import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import DialogBox from '../components/DialogBox';

const TILE_SIZE = 32;

const GymScreen = ({ navigate, gymId, direction, aPressed }) => {
  const { habitosHoy } = useGame();
  const canvasRef = useRef(null);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 13 }); // Spawn at bottom center
  const [isLoading, setIsLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  
  const gymData = {
    vestirse: { name: 'Gimnasio Vestirse', leader: 'Lyra', sprite: 'trchar020', tileset: 'gsc gym 1a.png', habitsCount: 2 },
    desayuno: { name: 'Gimnasio Desayuno', leader: 'Ethan', sprite: 'trchar015', tileset: 'gsc gym 1b.png', habitsCount: 3 },
    higiene: { name: 'Gimnasio Higiene', leader: 'Clair', sprite: 'trchar025', tileset: 'gsc gym 2a.png', habitsCount: 4 },
    orden: { name: 'Gimnasio Orden', leader: 'Morty', sprite: 'trchar030', tileset: 'gsc gym 2b.png', habitsCount: 3 }
  }[gymId];

  const tilesetImg = useRef(new Image());
  const leaderImg = useRef(new Image());

  useEffect(() => {
    tilesetImg.current.src = `/Graphics/tilesets/${gymData.tileset}`;
    leaderImg.current.src = `/Graphics/characters/${gymData.sprite}.png`;
    
    let loaded = 0;
    const checkLoaded = () => { if (++loaded === 2) setIsLoading(false); };
    tilesetImg.current.onload = checkLoaded;
    leaderImg.current.onload = checkLoaded;
  }, [gymId]);

  // Movement Logic (Simplified for Interior)
  useEffect(() => {
    if (!direction || isLoading || dialog) return;
    
    setPlayerPos(prev => {
      let nx = prev.x, ny = prev.y;
      if (direction === 'up') ny--;
      if (direction === 'down') ny++;
      if (direction === 'left') nx--;
      if (direction === 'right') nx++;
      
      // Boundaries (20x15 map)
      if (nx < 1 || nx > 18 || ny < 1 || ny > 13) return prev;
      
      // Collision with Leader (at 10, 3)
      if (nx === 10 && ny === 3) return prev;

      return { x: nx, y: ny };
    });
  }, [direction, isLoading, dialog]);

  // Interaction with Leader
  useEffect(() => {
    if (aPressed && !dialog) {
      const isAdjacent = Math.abs(playerPos.x - 10) + Math.abs(playerPos.y - 3) === 1;
      if (isAdjacent) {
        setDialog({
           text: `${gymData.leader.toUpperCase()}: ¡Bienvenido al ${gymData.name}! Para completar este gimnasio debes superar desafíos de hábito. ¿Estás listo?`,
           showChoices: true
        });
      }
    }
  }, [aPressed, playerPos, dialog, gymData]);

  // Render Loop
  useEffect(() => {
    if (isLoading || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.imageRendering = 'pixelated';
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw Basic Interior Map (Placeholder rendering)
    // Wall and floor tiles (simulados por colores si el tileset es manual o usando tiles fijos)
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 20; x++) {
        const isWall = x === 0 || x === 19 || y === 0 || y === 14;
        const sx = isWall ? 32 : 0; // Simple tile selection
        const sy = 0;
        ctx.drawImage(tilesetImg.current, sx, sy, TILE_SIZE, TILE_SIZE, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Draw Leader
    const lx = 10 * TILE_SIZE;
    const ly = 3 * TILE_SIZE;
    ctx.drawImage(leaderImg.current, 0, 0, 32, 32, lx, ly, TILE_SIZE, TILE_SIZE);

    // Draw Player
    ctx.fillStyle = 'red';
    ctx.fillRect(playerPos.x * TILE_SIZE + 8, playerPos.y * TILE_SIZE + 8, 16, 16);

  }, [isLoading, playerPos]);

  return (
    <div className="screen-container" style={{ padding: 0, background: '#000' }}>
      <canvas ref={canvasRef} width={640} height={480} style={{ width: '100%', height: 'auto', display: 'block', imageRendering: 'pixelated' }} />
      
      {dialog && (
        <div className="gb-dialog" style={{ position: 'absolute', bottom: '80px', left: '20px', right: '20px', padding: '15px' }}>
          <p style={{ fontSize: '10px', marginBottom: '15px' }}>{dialog.text}</p>
          {dialog.showChoices && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="gb-button primary" onClick={() => navigate('battle', { gymId })}>¡SÍ!</button>
              <button className="gb-button" onClick={() => setDialog(null)}>Ahora no</button>
            </div>
          )}
          {!dialog.showChoices && <div className="blinker" onClick={() => setDialog(null)}>▼</div>}
        </div>
      )}

      <button onClick={onBack} className="gb-button" style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '8px' }}>SALIR</button>
    </div>
  );
};

export default GymScreen;
