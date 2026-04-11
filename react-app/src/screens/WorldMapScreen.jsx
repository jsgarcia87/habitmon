import React, { useRef, useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { WORLDS } from '../data/worlds';

const WorldMapScreen = ({ onNavigate }) => {
  const { progress, timeOfDay } = useGame();
  const canvasRef = useRef(null);
  const [selectedWorld, setSelectedWorld] = useState(null);
  const [message, setMessage] = useState('Selecciona un destino...');

  const WORLD_POSITIONS = {
    habitacion:    { x: 80,  y: 100 },
    bano:          { x: 160, y: 100 },
    cocina:        { x: 240, y: 140 },
    colegio:       { x: 160, y: 200 },
    parque:        { x: 80,  y: 240 },
    salon:         { x: 240, y: 240 },
    bano_noche:    { x: 120, y: 320 },
    comedor_noche: { x: 200, y: 320 },
    dormitorio:    { x: 160, y: 380 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    let frame = 0;
    const render = () => {
      frame++;
      // Background: Pokémon GBC Town Map Green
      ctx.fillStyle = '#8CC84B';
      ctx.fillRect(0, 0, W, H);

      // Draw Grid / Border Decorative
      ctx.strokeStyle = '#7AA83B';
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
      }
      for (let i = 0; i < H; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
      }

      // Draw connections (Paths)
      ctx.strokeStyle = '#4A7A2B';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      
      // Draw Connections between same time periods
      const drawPath = (from, to) => {
        const p1 = WORLD_POSITIONS[from];
        const p2 = WORLD_POSITIONS[to];
        if(!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      };
      
      drawPath('habitacion', 'bano');
      drawPath('bano', 'cocina');
      drawPath('cocina', 'colegio');
      drawPath('colegio', 'parque');
      drawPath('parque', 'salon');
      drawPath('salon', 'bano_noche');
      drawPath('bano_noche', 'comedor_noche');
      drawPath('comedor_noche', 'dormitorio');

      ctx.setLineDash([]);

      // Draw Worlds
      WORLDS.forEach(world => {
        const pos = WORLD_POSITIONS[world.world_id];
        if (!pos) return;

        const isCompleted = progress?.gimnasios_completados?.includes(world.gym_id);
        const isAvailable = world.tiempo === timeOfDay;
        const isSelected = selectedWorld === world.world_id;

        // Building Icon
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = isCompleted ? '#FFD700' : (isAvailable ? '#FFFFFF' : '#666666');
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#FF0000' : '#000000';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Inner marker
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = isCompleted ? '#E6B800' : (isAvailable ? '#44AA44' : '#444444');
        ctx.fill();

        // Icon/Emoji
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText(isCompleted ? '🏅' : (isAvailable ? '!' : '🔒'), pos.x, pos.y + 5);

        // Label
        ctx.font = '7px "Press Start 2P"';
        ctx.fillStyle = '#000';
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(world.nombre, pos.x, pos.y + 32);
        ctx.shadowBlur = 0;
        
        // Pulse selection
        if(isSelected) {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          const s = 18 + Math.sin(frame * 0.1) * 3;
          ctx.strokeRect(pos.x - s/2, pos.y - s/2, s, s);
        }
      });

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedWorld, progress, timeOfDay]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found = null;
    Object.keys(WORLD_POSITIONS).forEach(id => {
      const pos = WORLD_POSITIONS[id];
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      if (dist < 25) found = id;
    });

    if (found) {
      if (found === selectedWorld) {
        handleSelectWorld(found);
      } else {
        setSelectedWorld(found);
        const world = WORLDS.find(w => w.world_id === found);
        setMessage(world.nombre.toUpperCase());
      }
    }
  };

  const handleSelectWorld = (worldId) => {
    const world = WORLDS.find(w => w.world_id === worldId);
    if (!world) return;

    if (world.tiempo !== timeOfDay) {
      const period = world.tiempo === 'morning' ? 'Mañana' : (world.tiempo === 'day' ? 'Tarde' : 'Noche');
      setMessage(`SOLO POR LA ${period.toUpperCase()}`);
      return;
    }

    onNavigate('MAP', worldId);
  };

  const currentPeriodName = timeOfDay === 'morning' ? 'Mañana' : (timeOfDay === 'day' ? 'Tarde' : 'Noche');

  return (
    <div className="world-map-container" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>MAPA DE RUTINAS</h2>
        <div style={styles.periodBadge}>
          {currentPeriodName}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={450}
        onClick={handleCanvasClick}
        style={styles.canvas}
      />

      <div style={styles.footer}>
        <div style={styles.messageBox}>
          {message}
        </div>
        <div style={styles.btnRow}>
          <button 
            className="gb-button" 
            onClick={() => onNavigate('SETUP')}
            style={{...styles.actionBtn, backgroundColor: '#34495e'}}
          >
            ⚙️ SETUP
          </button>
          <button 
            className="gb-button" 
            onClick={() => selectedWorld && handleSelectWorld(selectedWorld)}
            style={styles.actionBtn}
          >
            VIAJAR (A)
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    background: '#8CC84B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px 0',
  },
  header: {
    padding: '10px',
    textAlign: 'center',
    width: '100%',
  },
  title: {
    margin: 0,
    fontFamily: '"Press Start 2P"',
    fontSize: '12px',
    color: '#111',
    textShadow: '2px 2px #fff',
  },
  periodBadge: {
    marginTop: '5px',
    display: 'inline-block',
    padding: '4px 10px',
    background: '#111',
    color: '#fff',
    fontSize: '8px',
    fontFamily: '"Press Start 2P"',
    borderRadius: '4px',
  },
  canvas: {
    background: '#fff',
    border: '6px double #333',
    maxWidth: '90%',
    height: 'auto',
    cursor: 'pointer',
    imageRendering: 'pixelated',
  },
  footer: {
    marginTop: 'auto',
    padding: '10px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.1)',
  },
  btnRow: { 
    display: 'flex', 
    gap: '10px', 
    width: '90%', 
    justifyContent: 'center' 
  },
  messageBox: {
    background: '#fff',
    border: '3px solid #111',
    padding: '8px',
    width: '80%',
    textAlign: 'center',
    fontFamily: '"Press Start 2P"',
    fontSize: '8px',
    minHeight: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  actionBtn: {
    padding: '10px 20px',
    fontSize: '10px',
  }
};

export default WorldMapScreen;
