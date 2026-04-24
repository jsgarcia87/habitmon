import { GYM_CONFIGS, GYM_MAPS } from './gymData';

const BASE = import.meta.env.BASE_URL || '/';

// ==========================================
// 1. CONFIGURACIÓN MAESTRA DE TILES (IDs GSC 1:1)
// ==========================================

const PB = {
  EMPTY: -1,
  FLOOR: 19,
  FLOOR_SHADOW: 21,
  WALL_TOP: 0, WALL_TOP_S: 5,
  WALL_FRONT: 8, WALL_FRONT_S: 13,
  STAIRS_UP_T: 7, STAIRS_UP_B: 15, 
  EXIT: 41, 
  TV: 26,
  TABLE_TL: 24, TABLE_TR: 25, 
  TABLE_BL: 32, TABLE_BR: 33,
  LEG_L: 17, LEG_R: 18,
  FRIDGE: 22, STOVE: 21, SINK: 20, WINDOW: 2
};

const P1 = {
  EMPTY: -1,
  FLOOR: 26, 
  FLOOR_SHADOW: 21,
  WALL_TOP: 4,
  WALL_FRONT: 12, 
  STAIRS_DOWN_L: 42, STAIRS_DOWN_R: 43, 
  BED_T: 6, BED_B: 14,
  PC_T: 38, PC_B: 44,
  DESK_TL: 16, DESK_TR: 17, DESK_BL: 24, DESK_BR: 25,
  SHELF_T: 0, SHELF_B: 8,
  MAP: 31
};

// ==========================================
// 2. SISTEMA DE PROPIEDADES (Colisiones y Tipos)
// ==========================================
export const TILE_PROPERTIES = {
  house_1: { // PLANTA BAJA
    [19]: { walkable: true }, // Suelo
    [20]: { walkable: true, type: 'exit' }, // Alfombra salida
    // Escaleras
    [34]: { walkable: true, type: 'stair', target: 'house_2' },
    // Sólidos
    [2]: { walkable: false }, [3]: { walkable: false }, [22]: { walkable: false }, [26]: { walkable: false },
    [27]: { walkable: false }, [7]: { walkable: false }, [15]: { walkable: false },
    [23]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false },
    [32]: { walkable: false }, [33]: { walkable: false }, [17]: { walkable: false }, [18]: { walkable: false }
  },
  house_2: { // PLANTA ALTA
    [19]: { walkable: true }, // Suelo
    // Escaleras
    [34]: { walkable: true, type: 'stair', target: 'house_1' },
    // Sólidos
    [1]: { walkable: false }, [40]: { walkable: false }, [48]: { walkable: false },
    [8]: { walkable: false }, [16]: { walkable: false }, [41]: { walkable: false },
    [13]: { walkable: false }, [14]: { walkable: false }, [17]: { walkable: false }, [18]: { walkable: false }
  }
};

// ==========================================
// 3. MOTOR DE GENERACIÓN
// ==========================================
function createMap(w, h) {
    const m = () => Array.from({ length: h }, () => Array(w).fill(-1));
    return { width: w, height: h, layers: { base: m(), deco: m(), overlay: m() } };
}

function draw(map, layer, x, y, tile) {
  if (map.layers[layer]?.[y]?.[x] !== undefined) map.layers[layer][y][x] = tile;
}

function fill(map, layer, x, y, w, h, tile) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) draw(map, layer, x+i, y+j, tile);
}

export function generateHouse1() {
  const map = createMap(20, 15);
  const startX = 6; // Centramos un poco más
  const startY = 2;

  // Matriz exacta proporcionada por el usuario
  const matrix = [
    [7, 27, 3, 0, 2, 0, 0, 34],
    [15, 35, 26, 22, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 23, 13, 14, 23, 19, 19],
    [19, 19, 23, 32, 33, 23, 19, 19],
    [19, 19, 19, 17, 18, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 20, 20, 19, 19, 19, 19]
  ];

  matrix.forEach((row, y) => {
    row.forEach((tile, x) => {
      // Dibujamos todo en base para esta prueba de layout
      draw(map, 'base', startX + x, startY + y, tile);
    });
  });

  return map;
}

export function generateHouse2() {
  const map = createMap(20, 15);
  // Estructura Paredes
  fill(map, 'base', 5, 2, 10, 1, P1.WALL_TOP);
  fill(map, 'base', 5, 3, 10, 1, P1.WALL_FRONT);
  // Suelo con sombra
  fill(map, 'base', 5, 4, 10, 1, P1.FLOOR_SHADOW);
  fill(map, 'base', 5, 5, 10, 6, P1.FLOOR);
  
  // Cama
  draw(map, 'deco', 5, 8, P1.BED_T);
  draw(map, 'deco', 5, 9, P1.BED_B);
  
  // PC
  draw(map, 'deco', 5, 3, P1.PC_T);
  draw(map, 'deco', 5, 4, P1.PC_B);
  draw(map, 'deco', 6, 3, P1.MAP);
  
  // Escritorio
  draw(map, 'deco', 7, 3, P1.DESK_TL);
  draw(map, 'deco', 8, 3, P1.DESK_TR);
  draw(map, 'deco', 7, 4, P1.DESK_BL);
  draw(map, 'deco', 8, 4, P1.DESK_BR);
  
  // Estanterías
  draw(map, 'deco', 14, 3, P1.SHELF_T);
  draw(map, 'deco', 14, 4, P1.SHELF_B);
  
  // Escalera Bajada
  draw(map, 'deco', 14, 9, P1.STAIRS_DOWN_L);
  draw(map, 'deco', 15, 9, P1.STAIRS_DOWN_R);
  
  return map;
}

// ==========================================
// 4. EXPORTS
// ==========================================

export const INTERIOR_CONFIGS = {
  'house_1': { 
    tileset: `${BASE}Graphics/tilesets/gsc_house_1.png`,
    nombre: 'HOGAR - PB',
    spawn: { x: 8, y: 10 }, 
    tiles: { floor: 19, exit: 20, stair: 34 }
  },
  'house_2': { 
    tileset: `${BASE}Graphics/tilesets/gsc_house_2.png`,
    nombre: 'HOGAR - HABITACIÓN',
    spawn: { x: 10, y: 4 }, 
    tiles: { floor: 19, stair: 34 }
  },
  ...GYM_CONFIGS
};

export const INTERIOR_MAPS = {
  house_1: generateHouse1(),
  house_2: generateHouse2(),
  ...GYM_MAPS
};
