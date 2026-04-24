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
  EXIT: 20, 
  TV: 26,
  TABLE_TL: 24, TABLE_TR: 25, 
  TABLE_BL: 32, TABLE_BR: 33,
  LEG_L: 17, LEG_R: 18,
  FRIDGE: 22, STOVE: 21, SINK: 20, WINDOW: 2
};

const P1 = {
  EMPTY: -1,
  FLOOR: 19,
  WALL_TOP: 0,
  WALL_FRONT: 13,
  PC_T: 1, PC_B: 9,
  STAIRS_L_T: 7, STAIRS_L_B: 15,
  STAIRS_R_T: 27, STAIRS_R_B: 35,
  BED_T: 40, BED_B: 48,
  SHELF_T: 8, SHELF_B: 16,
  EXIT: 41
};

// ==========================================
// 2. SISTEMA DE PROPIEDADES (Colisiones y Tipos)
// ==========================================
export const TILE_PROPERTIES = {
  house_1: { // PLANTA BAJA
    [19]: { walkable: true }, // Suelo
    [20]: { walkable: true, type: 'exit' }, // Alfombra salida principal (según matriz usuario)
    [41]: { walkable: true, type: 'exit' }, // Alfombra salida alternativo
    // Escaleras
    [34]: { walkable: true, type: 'stair', target: 'house_2' },
    [7]: { walkable: false }, [15]: { walkable: false }, // Parte estática escalera
    // Sólidos
    [2]: { walkable: false }, [3]: { walkable: false }, [22]: { walkable: false }, [26]: { walkable: false },
    [27]: { walkable: false }, [23]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false },
    [32]: { walkable: false }, [33]: { walkable: false }, [17]: { walkable: false }, [18]: { walkable: false },
    [0]: { walkable: false }, [8]: { walkable: false }
  },
  house_2: { // PLANTA ALTA (HABITACIÓN) - Usando gsc_house_1.png
    [19]: { walkable: true }, // Suelo
    [41]: { walkable: true }, // Alfombra/Rug
    // Escaleras (Bajada)
    [7]: { walkable: true, type: 'stair', target: 'house_1' },
    [15]: { walkable: true, type: 'stair', target: 'house_1' },
    // Sólidos
    [1]: { walkable: false }, [9]: { walkable: false }, // PC
    [0]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false }, // Paredes
    [27]: { walkable: false }, [35]: { walkable: false }, // Lado escalera
    [40]: { walkable: false }, [48]: { walkable: false }, // Cama
    [8]: { walkable: false }, [16]: { walkable: false }, // Estantería
    [17]: { walkable: false }, [18]: { walkable: false }  // Patas/Mesa
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

export function generateHouse1() {
  const map = createMap(20, 15);
  const startX = 6; 
  const startY = 2;

  // Matriz exacta respetando la distribución y el ID 14 en la fila 4
  const matrix = [
    [7, 27, 3, 0, 2, 0, 0, 34, 19],
    [15, 35, 26, 22, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 23, 13, 14, 23, 19, 19, 19],
    [19, 19, 23, 32, 33, 23, 19, 19, 19],
    [19, 19, 19, 17, 18, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 20, 20, 19, 19, 19, 19, 19]
  ];

  matrix.forEach((row, y) => {
    row.forEach((tile, x) => {
      draw(map, 'base', startX + x, startY + y, tile);
    });
  });

  return map;
}

export function generateHouse2() {
  const map = createMap(20, 15);
  const startX = 6;
  const startY = 2;

  // Matriz exacta respetando la distribución original
  const matrix = [
    [1, 0, 0, 0, 7, 27, 0, 41, 19],
    [9, 19, 13, 14, 15, 35, 19, 19, 19],
    [19, 19, 17, 18, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 19, 19, 19, 19, 19, 19],
    [19, 19, 19, 40, 19, 19, 19, 19, 19],
    [19, 19, 19, 48, 19, 19, 19, 19, 19],
    [8, 19, 19, 19, 19, 19, 19, 19, 19],
    [16, 19, 19, 19, 19, 19, 19, 19, 19]
  ];

  matrix.forEach((row, y) => {
    row.forEach((tile, x) => {
      draw(map, 'base', startX + x, startY + y, tile);
    });
  });

  return map;
}

// ==========================================
// 4. EXPORTS
// ==========================================

export const INTERIOR_CONFIGS = {
  'house_1': { 
    tileset: `${BASE}Graphics/tilesets/gsc_house_1.png`,
    nombre: 'HOGAR - PB',
    spawn: { x: 9, y: 9 }, 
    tiles: { floor: 19, exit: 20, stair: 34 }
  },
  'house_2': { 
    tileset: `${BASE}Graphics/tilesets/gsc_house_1.png`,
    nombre: 'HOGAR - HABITACIÓN',
    spawn: { x: 10, y: 4 }, 
    tiles: { floor: 19, stair: 15 }
  },
  ...GYM_CONFIGS
};

export const INTERIOR_MAPS = {
  house_1: generateHouse1(),
  house_2: generateHouse2(),
  ...GYM_MAPS
};