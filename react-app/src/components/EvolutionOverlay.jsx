import React, { useState, useEffect } from 'react';

const EvolutionOverlay = ({ fromId, toId, onComplete }) => {
  const [phase, setPhase] = useState('start'); // 'start', 'evolving', 'end'
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);

  useEffect(() => {
    // Secuencia de animación
    const sequence = async () => {
      // 1. Esperar un poco
      await new Promise(r => setTimeout(r, 1000));
      
      // 2. Destellos y crecimiento
      setPhase('evolving');
      for (let i = 0; i < 15; i++) {
        setZoom(1 + (i * 0.05));
        setBrightness(1 + (i * 0.1));
        await new Promise(r => setTimeout(r, 100));
      }

      // 3. Transformación (Flash blanco total)
      setBrightness(10);
      await new Promise(r => setTimeout(r, 300));
      
      // Cambiar a la forma final
      setPhase('end');
      setZoom(1);
      setBrightness(1);
      await new Promise(r => setTimeout(r, 2000));
      
      onComplete();
    };

    sequence();
  }, []);

  const padId = (id) => String(id).padStart(3, '0');

  return (
    <div style={ST.overlay}>
      <div style={ST.content}>
        <h2 style={ST.title}>
          {phase === 'end' ? '¡HA EVOLUCIONADO!' : '¡ESTÁ EVOLUCIONANDO!'}
        </h2>
        
        <div style={{
          ...ST.spriteContainer,
          transform: `scale(${zoom})`,
          filter: `brightness(${brightness})`
        }}>
          <img 
            src={`Graphics/battlers/${padId(phase === 'end' ? toId : fromId)}.png`} 
            style={ST.sprite}
            onError={e => e.target.src = `Graphics/pokemon/${padId(phase === 'end' ? toId : fromId)}.png`}
            alt="evo"
          />
        </div>

        {phase === 'evolving' && (
          <div style={ST.particleContainer}>
            {/* Simulación de partículas */}
            <div className="sparkle" style={{...ST.sparkle, left: '20%', top: '30%'}} />
            <div className="sparkle" style={{...ST.sparkle, left: '80%', top: '40%'}} />
            <div className="sparkle" style={{...ST.sparkle, left: '50%', top: '10%'}} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes sparkle {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
        .sparkle {
          animation: sparkle 0.5s infinite;
        }
      `}</style>
    </div>
  );
};

const ST = {
  overlay: {
    position: 'absolute', inset: 0,
    background: '#000', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Press Start 2P"', color: '#fff'
  },
  content: { textAlign: 'center', position: 'relative' },
  title: { fontSize: '12px', marginBottom: '40px', lineHeight: '1.5' },
  spriteContainer: { transition: 'transform 0.1s, filter 0.1s' },
  sprite: { width: '120px', imageRendering: 'pixelated' },
  particleContainer: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  sparkle: {
    position: 'absolute', width: '10px', height: '10px',
    background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff'
  }
};

export default EvolutionOverlay;
