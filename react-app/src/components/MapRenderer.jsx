import React, { useEffect, useRef, useState } from 'react';

/**
 * MapRenderer Component
 * Renders the first layer of an RPG Maker XP map using HTML5 Canvas.
 * 
 * @param {string} mapId - The ID of the map to load (e.g., "Map001")
 */
const MapRenderer = ({ mapId }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapInfo, setMapInfo] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let isMounted = true;
    const loadMap = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching map data...', mapId);
        const mapResponse = await fetch(`/Data/${mapId}.json`);
        if (!mapResponse.ok) throw new Error(`Map ${mapId}.json return status ${mapResponse.status}`);
        const mapData = await mapResponse.json();
        console.log('Map data loaded:', mapData.width, 'x', mapData.height);

        console.log('Fetching tilesets...');
        const tilesetsResponse = await fetch('/Data/Tilesets.json');
        if (!tilesetsResponse.ok) throw new Error(`Tilesets.json return status ${tilesetsResponse.status}`);
        const tilesetsData = await tilesetsResponse.json();
        console.log('Tilesets loaded. Total count:', tilesetsData.length);

        if (!isMounted) return;

        const tilesetId = mapData.tileset_id;
        const tilesetInfo = tilesetsData[tilesetId];
        if (!tilesetInfo) throw new Error(`Tileset with ID ${tilesetId} not found in Tilesets.json`);

        let tilesetName = tilesetInfo.tileset_name.toLowerCase();
        
        // Parche rápido para el caos del interior del gimnasio
        if (mapId === 'MapXXX') {
          tilesetName = 'gsc interior gym';
        }

        console.log('Tileset identified:', tilesetName);
        if (!tilesetName) throw new Error('Tileset name is missing in definition');

        const img = new Image();

        img.onload = () => {
          console.log('Image loaded successfully. Starting draw loop...');
          try {
            if (!isMounted) return;

            if (!canvasRef.current) {
              throw new Error('El elemento canvas no existe en el DOM al hacer onload.');
            }

            setMapInfo({ width: mapData.width, height: mapData.height });
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const { width, height, data } = mapData;
            
            console.log('DATA SHAPE TYPE:', typeof data);
            console.log('DATA LENGTH:', data.length);
            console.log('FIRST 30 TILES:', Array.isArray(data) ? data.slice(0, 30) : data);
            
            canvas.width = width * 32;
            canvas.height = height * 32;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const tilesPerLayer = width * height;
            
            // Renderización Multi-capa (Ruby Table Planar Byte Array)
            for (let z = 0; z < 3; z++) {
              for (let i = 0; i < tilesPerLayer; i++) {
                
                // Índice base en el array de bytes (Planar: Z, luego I)
                const byteIndex = ((z * tilesPerLayer) + i) * 2;
                
                const byte1 = data[byteIndex];
                const byte2 = data[byteIndex + 1];
                
                // Reconstruir el ID del Tile (Little Endian)
                const tileId = byte1 | (byte2 << 8);

                // Ignorar espacios vacíos y autotiles (ID < 384)
                if (!tileId || tileId < 384) continue;

                const index = tileId - 384;
                const sx = (index % 8) * 32;
                const sy = Math.floor(index / 8) * 32;
                
                const dx = (i % width) * 32;
                const dy = Math.floor(i / width) * 32;

                ctx.drawImage(img, sx, sy, 32, 32, dx, dy, 32, 32);
              }
            }

            console.log('Draw loop finished successfully!');
            setLoading(false);
          } catch (error) {
            console.error('ERROR FATAL DENTRO DEL DRAW LOOP:', error);
            // Forzamos quitar el loading para ver si renderiza algo aunque falle
            setLoading(false);
          }
        };

        img.onerror = () => {
          console.error('Error cargando el PNG del tileset:', img.src);
          if (isMounted) {
            setError(`Failed to load image: ${tilesetName}.png`);
            setLoading(false);
          }
        };
        
        img.src = `/Graphics/tilesets/${tilesetName}.png`;
        console.log('Loading image:', img.src);

      } catch (err) {
        console.error('MapRenderer Error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      isMounted = false;
    };
  }, [mapId]);

  return (
    <div className="map-container" style={containerStyle}>
      {/* Overlay de Carga */}
      {loading && (
        <div style={fallbackStyle}>
          <p>Cargando mapa {mapId}...</p>
        </div>
      )}

      {/* Overlay de Error */}
      {error && (
        <div style={{ ...fallbackStyle, color: '#ff4444' }}>
          <p>Error cargando mapa: {error}</p>
        </div>
      )}

      {/* El canvas se renderiza SIEMPRE para que la Ref no sea null */}
      <canvas 
        ref={canvasRef} 
        id={`canvas-${mapId}`}
        style={{ 
          imageRendering: 'pixelated', 
          display: loading || error ? 'none' : 'block' 
        }} 
      />
    </div>
  );
};

const containerStyle = {
  overflow: 'auto',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const fallbackStyle = {
  width: '100%',
  height: '300px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#1a1a1a',
  color: '#fff',
  fontFamily: 'monospace',
  border: '2px solid #333',
  borderRadius: '8px'
};

export default MapRenderer;
