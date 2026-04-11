import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

const TILE_SIZE = 32;
const MAP_ID = 'Map002';
const TILESET_SRC = '/Graphics/tilesets/gsc overworld johto day.png';

const GRASS_ZONES = [
  {x1:2, y1:8, x2:6, y2:14},
  {x1:14, y1:2, x2:20, y2:8},
  {x1:2, y1:16, x2:8, y2:22},
  {x1:16, y1:14, x2:22, y2:20},
];

const CityMap = ({ direction, aPressed, onEvent, playerPos, setPlayerPos }) => {
  const canvasRef = useRef(null);
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Smooth scroll offset
  const [facing, setFacing] = useState('down');
  const [walkFrame, setWalkFrame] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [flash, setFlash] = useState(0); // 0: none, 1-3: flash stages
  
  // Images
  const tilesetImg = useRef(new Image());
  const playerImg = useRef(new Image());

  // Load Map Data and Images
  useEffect(() => {
    fetch(`/Data/${MAP_ID}.json`)
      .then(r => r.json())
      .then(data => {
        setMapData(data);
        tilesetImg.current.src = TILESET_SRC;
        playerImg.current.src = '/Graphics/characters/trchar000.png';
        
        let loaded = 0;
        const checkLoaded = () => { if(++loaded === 2) setIsLoading(false); };
        tilesetImg.current.onload = checkLoaded;
        playerImg.current.onload = checkLoaded;
      });
  }, []);

  // Collision Logic
  const checkCollision = (nx, ny) => {
    if (!mapData || !mapData.data) return true;
    const { width, height, data } = mapData;
    const actualData = data['@data'] || data;
    const tilesPerLayer = width * height;
    const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;
    
    // Check all 3 layers for blocking tiles
    for (let z = 0; z < 3; z++) {
      const i = ny * width + nx;
      const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
      const tileId = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);
      
      // Known blocking tiles for Johto city (Approximate ranges)
      // Trees: 384+ (autotiles), Houses: 600-900, Signposts: 500
      // In Crystal, most tiles >= 500 are obstacles or decorations
      if (tileId >= 450 && tileId < 2000) return true; 
    }
    return false;
  };

  // Movement Cycle
  useEffect(() => {
    if (isMoving || !direction || isLoading) return;

    let nextX = playerPos.x;
    let nextY = playerPos.y;
    let newFacing = facing;

    if (direction === 'up') { nextY--; newFacing = 'up'; }
    if (direction === 'down') { nextY++; newFacing = 'down'; }
    if (direction === 'left') { nextX--; newFacing = 'left'; }
    if (direction === 'right') { nextX++; newFacing = 'right'; }

    setFacing(newFacing);

    // Collision & Boundary Check
    if (nextX < 0 || nextX >= mapData.width || nextY < 0 || nextY >= mapData.height) return;
    if (checkCollision(nextX, nextY)) return;

    // Start Movement Animation
    setIsMoving(true);
    setPlayerPos({ x: nextX, y: nextY });
    
    // Animate walk frames
    let frame = 0;
    const frameInterval = setInterval(() => {
       frame = (frame + 1) % 4;
       setWalkFrame(frame);
    }, 50);

    setTimeout(() => {
      clearInterval(frameInterval);
      setWalkFrame(0);
      setIsMoving(false);
      
      // Wild Encounter Logic
      const isInGrass = GRASS_ZONES.some(z => 
        nextX >= z.x1 && nextX <= z.x2 && 
        nextY >= z.y1 && nextY <= z.y2
      );

      if (isInGrass && Math.random() < 0.03) {
        // Trigger Encounter Flash
        let count = 0;
        const flashIv = setInterval(() => {
          setFlash(f => f === 1 ? 0 : 1);
          count++;
          if (count > 6) {
            clearInterval(flashIv);
            setFlash(0);
            onEvent({ type: 'encounter' });
          }
        }, 100);
      }
    }, 200);
  }, [direction, isMoving, isLoading, mapData, playerPos, setPlayerPos, onEvent, facing]);

  // Interaction Check (A Button)
  useEffect(() => {
    if (aPressed) {
      // Check Gyms at fixed coords
      const gyms = [
        { id: 'vestirse', x: 8, y: 5 },
        { id: 'desayuno', x: 16, y: 5 },
        { id: 'higiene', x: 8, y: 14 },
        { id: 'orden', x: 16, y: 14 }
      ];

      const activeGym = gyms.find(g => 
        (playerPos.x === g.x && Math.abs(playerPos.y - g.y) === 1) ||
        (playerPos.y === g.y && Math.abs(playerPos.x - g.x) === 1)
      );

      if (activeGym) {
        onEvent({ type: 'gym_entry', gymId: activeGym.id });
      }
    }
  }, [aPressed, playerPos, onEvent]);

  // Render Loop
  useEffect(() => {
    if (!mapData || isLoading || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const { width, height, data } = mapData;
    const actualData = data['@data'] || data;
    const tilesPerLayer = width * height;
    const headerOffset = actualData.length > (tilesPerLayer * 3) ? 20 : 0;

    // Camera Calculation (Center on Player)
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    const camX = playerPos.x * TILE_SIZE - (cw / 2) + (TILE_SIZE / 2);
    const camY = playerPos.y * TILE_SIZE - (ch / 2) + (TILE_SIZE / 2);

    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;

    for (let z = 0; z < 3; z++) {
      for (let i = 0; i < tilesPerLayer; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        
        // Decoding Little Endian from @data array
        const baseIdx = headerOffset + (z * tilesPerLayer + i) * 2;
        const tileId = actualData[baseIdx] + (actualData[baseIdx + 1] << 8);

        if (tileId < 384) continue;

        const index = tileId - 384;
        const sx = (index % 8) * TILE_SIZE;
        const sy = Math.floor(index / 8) * TILE_SIZE;

        const dx = x * TILE_SIZE - camX;
        const dy = y * TILE_SIZE - camY;

        if (dx > -TILE_SIZE && dx < cw && dy > -TILE_SIZE && dy < ch) {
          ctx.drawImage(tilesetImg.current, sx, sy, TILE_SIZE, TILE_SIZE, Math.floor(dx), Math.floor(dy), TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw Player Sprite (trchar000.png)
    const px = playerPos.x * TILE_SIZE - camX;
    const py = playerPos.y * TILE_SIZE - camY;
    
    const spriteRow = { down:0, left:1, right:2, up:3 }[facing];
    const spriteCol = walkFrame;

    const frameW = 32;
    const frameH = 40;

    ctx.drawImage(
      playerImg.current, 
      spriteCol * frameW, spriteRow * frameH, frameW, frameH, 
      Math.floor(px), Math.floor(py - (frameH - TILE_SIZE)),
      frameW, frameH
    );

  }, [mapData, isLoading, playerPos, isMoving, facing, walkFrame]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }} 
      />
      {isLoading && <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>Cargando Mapa...</div>}
      
      {/* Encounter Flash Overlay */}
      {flash === 1 && <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 1000 }} />}
    </div>
  );
};

export default CityMap;
