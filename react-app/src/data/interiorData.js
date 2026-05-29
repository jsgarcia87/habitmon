import { GYM_CONFIGS, GYM_MAPS, GYM_TILE_PROPERTIES } from './gymData';

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
  },
  house_pokemon: { // Casa del Sr. Pokémon
    [19]: { walkable: true },
    [20]: { walkable: true, type: 'exit' },
    [0]: { walkable: false }, [8]: { walkable: false }, [13]: { walkable: false }, [14]: { walkable: false },
    [22]: { walkable: false }, [26]: { walkable: false }, [32]: { walkable: false }, [33]: { walkable: false }
  },
  // ---- Centro Pokémon (gsc pkmn center.png — 8 cols × 7 rows) ----
  // Tiles 36-55 son transparentes en este tileset → NO usarlos
  // Suelo rosa: 24 y 28 | Transición entrada: 41 | Salida: 50
  pokemon_center: {
    [24]: { walkable: true },
    [28]: { walkable: true },
    [41]: { walkable: true },
    [50]: { walkable: true, type: 'exit' },
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png — 8 cols × 7 rows) ----
  // Suelo verde: 6 y 16 | Salida: 49
  pokemon_shop: {
    [6]:  { walkable: true },
    [16]: { walkable: true },
    [49]: { walkable: true, type: 'exit' },
  },
  ...GYM_TILE_PROPERTIES
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
// 4. INTERIORES POKÉMON CENTER Y TIENDA
//    Tilesets: gsc pkmn center.png / gsc pkmn mart.png
//    Ambos: 256×224px → 8 cols × 7 rows = 56 tiles (IDs 0-55)
//    Cols: 0=wall,1=wall,2=wall,3=window,4=window,5=heal,6=pc,7=wall
//    Rows: 0-1=techo,2=mostrador,3=interior-mostrador,4-5=suelo,6=suelo+salida
// ==========================================

export function generatePokemonCenter() {
  const map = createMap(20, 15);

  // gsc pkmn center.png — tiles identificados por muestreo de píxeles:
  // 12=negro sólido (pared), 11=mostrador (rosa/negro), 25=máquina heal izq (rojo),
  // 26=máquina heal der (rojo), 24=suelo rosa A, 28=suelo rosa B, 41=transición entrada, 50=salida
  const WALL = 12, COUNTER = 11, HEAL_L = 25, HEAL_R = 26;
  const FLOOR_A = 24, FLOOR_B = 28, TRANS = 41, EXIT = 50;

  const x0 = 4, x1 = 15, y0 = 2, y1 = 13;

  // Paredes superior y laterales
  for (let x = x0; x <= x1; x++) draw(map, 'base', x, y0, WALL);
  for (let y = y0; y <= y1; y++) {
    draw(map, 'base', x0, y, WALL);
    draw(map, 'base', x1, y, WALL);
  }

  // Mostrador (fila y0+1)
  for (let x = x0 + 1; x <= x1 - 1; x++) draw(map, 'base', x, y0 + 1, COUNTER);
  draw(map, 'base', x0 + 4, y0 + 1, HEAL_L);
  draw(map, 'base', x0 + 5, y0 + 1, HEAL_R);

  // Suelo con patrón alternado rosa
  for (let y = y0 + 2; y <= y1 - 2; y++) {
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      draw(map, 'base', x, y, (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B);
    }
  }

  // Fila de transición antes de la salida
  for (let x = x0 + 1; x <= x1 - 1; x++) draw(map, 'base', x, y1 - 1, TRANS);

  // Pared inferior con alfombra de salida en el centro
  for (let x = x0; x <= x1; x++) draw(map, 'base', x, y1, WALL);
  draw(map, 'base', 9,  y1, EXIT);
  draw(map, 'base', 10, y1, EXIT);

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);

  // gsc pkmn mart.png — tiles identificados por muestreo de píxeles:
  // 39=negro sólido (pared), 0=estantería gris, 36=mostrador gris oscuro,
  // 37=mostrador gris claro, 6=suelo verde A, 16=suelo verde B (ligeramente más oscuro),
  // 34=expositor rojo (producto), 41=base expositor naranja/rojo, 49=alfombra salida (roja)
  const WALL = 39, SHELF = 0, COUNTER = 36, COUNTER2 = 37;
  const FLOOR_A = 6, FLOOR_B = 16, DISP = 34, DISP_B = 41, EXIT = 49;

  const x0 = 4, x1 = 15, y0 = 2, y1 = 13;

  // Paredes superior y laterales
  for (let x = x0; x <= x1; x++) draw(map, 'base', x, y0, WALL);
  for (let y = y0; y <= y1; y++) {
    draw(map, 'base', x0, y, WALL);
    draw(map, 'base', x1, y, WALL);
  }

  // Mostrador del dependiente (esquina superior derecha)
  for (let x = x0 + 1; x <= x1 - 1; x++) draw(map, 'base', x, y0 + 1, COUNTER2);

  // Estanterías izquierda (2 columnas de ancho, toda la altura)
  for (let y = y0 + 1; y <= y1 - 1; y++) {
    draw(map, 'base', x0 + 1, y, SHELF);
    draw(map, 'base', x0 + 2, y, SHELF);
  }

  // Suelo central con patrón verde alternado
  for (let y = y0 + 2; y <= y1 - 1; y++) {
    for (let x = x0 + 3; x <= x1 - 1; x++) {
      draw(map, 'base', x, y, (x + y) % 2 === 0 ? FLOOR_A : FLOOR_B);
    }
  }

  // Expositores de productos (3 en fila, con base)
  const dY = y0 + 4;
  for (const dX of [x0 + 4, x0 + 6, x0 + 8]) {
    draw(map, 'base', dX, dY,     DISP);
    draw(map, 'base', dX, dY + 1, DISP_B);
  }

  // Pared inferior con alfombra de salida en el centro
  for (let x = x0; x <= x1; x++) draw(map, 'base', x, y1, WALL);
  draw(map, 'base', 9,  y1, EXIT);
  draw(map, 'base', 10, y1, EXIT);

  return map;
}

// ==========================================
// 5. EXPORTS
// ==========================================

export const INTERIOR_CONFIGS = {
  'house_1': { 
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'HOGAR - PB',
    spawn: { x: 9, y: 9 }, 
    tiles: { floor: 19, exit: 20, stair: 34 }
  },
  'house_2': { 
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'HOGAR - HABITACIÓN',
    spawn: { x: 10, y: 4 }, 
    tiles: { floor: 19, stair: 15 }
  },
  'house_pokemon': {
    tileset: `${BASE}Graphics/tilesets/gsc house 1.png`,
    nombre: 'CASA SR. POKÉMON',
    spawn: { x: 9, y: 9 },
    tiles: { floor: 19, exit: 20 }
  },
  'pokemon_center': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn center.png`,
    nombre: 'CENTRO POKÉMON',
    spawn: { x: 9, y: 11 },
    tiles: { floor: 24, exit: 50 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    spawn: { x: 9, y: 11 },
    tiles: { floor: 6, exit: 49 }
  },
  ...GYM_CONFIGS
};

export const INTERIOR_MAPS = {
  house_1: generateHouse1(),
  house_2: generateHouse2(),
  house_pokemon: generateHouse1(),
  pokemon_center: generatePokemonCenter(),
  pokemon_shop: generatePokemonShop(),
  ...GYM_MAPS
};