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
  // ---- Centro Pokémon (gsc pkmn center.png — 8 cols × 7 rows = IDs 0-55) ----
  // ID 28 = suelo rosa claro con cuadros (verificado visualmente)
  // ID 26 = tapete rojo salida, IDs 0-15 = mostrador/maquinaria (sólido)
  // ID 40 = pared azul lateral izq, ID 41 = pared azul lateral der
  pokemon_center: {
    [28]: { walkable: true },               // suelo rosa claro cuadros (principal)
    [26]: { walkable: true, type: 'exit' }, // tapete rojo salida
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png — 8 cols × 7 rows = IDs 0-55) ----
  // Auditado pixel a pixel:
  // ID 36 = suelo beige limpio, ID 34 = tapete rojo salida
  // IDs 0-15 = estanterías/mostrador (sólidos)
  pokemon_shop: {
    [35]: { walkable: true },               // suelo beige
    [36]: { walkable: true },               // suelo beige (principal)
    [37]: { walkable: true },               // suelo beige
    [38]: { walkable: true },               // suelo beige
    [34]: { walkable: true, type: 'exit' }, // tapete rojo salida
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
//    Auditado pixel a pixel con Playwright — IDs verificados visualmente
//
//    gsc pkmn center.png (8×7=56 tiles):
//      ID 24 = suelo rosa con cuadros (principal)
//      ID 26 = tapete rojo salida
//      IDs 0-7  = maquinaria trasera (fila 0 del tileset)
//      IDs 8-15 = mostrador (fila 1 del tileset)
//      ID 40,41 = paredes azules laterales (fila 5 col 0-1)
//
//    gsc pkmn mart.png (8×7=56 tiles):
//      ID 36 = suelo beige limpio (principal)
//      ID 34 = tapete rojo salida
//      IDs 0-7  = estanterías/pared trasera (fila 0)
//      IDs 8-15 = mostrador/estanterías bajas (fila 1)
//      ID 16,24,32 = estanterías laterales izq (col 0, filas 2-4)
// ==========================================

export function generatePokemonCenter() {
  const map = createMap(20, 15);
  // Sala: x=5-14 (10 tiles de ancho), y=2-12
  const X0 = 5, X1 = 14;

  // Fila 2: maquinaria trasera — IDs 0-7 repartidos en 10 tiles
  // Usamos los 8 tiles del tileset rellenando el ancho de 10
  const topRow = [0, 0, 1, 2, 3, 4, 5, 6, 7, 7];
  topRow.forEach((tile, i) => draw(map, 'base', X0 + i, 2, tile));

  // Fila 3: mostrador — IDs 8-15 en 10 tiles
  const counterRow = [8, 8, 9, 9, 9, 11, 12, 13, 14, 14];
  counterRow.forEach((tile, i) => draw(map, 'base', X0 + i, 3, tile));

  // Suelo rosa claro (filas 4-11): ID 28
  for (let y = 4; y <= 11; y++)
    for (let x = X0; x <= X1; x++)
      draw(map, 'base', x, y, 28);

  // Paredes azules laterales: ID 40 (izq) y 41 (der)
  for (let y = 4; y <= 11; y++) {
    draw(map, 'base', X0, y, 40);
    draw(map, 'base', X1, y, 41);
  }

  // Fila 12: suelo + tapete rojo centrado (ID 26)
  for (let x = X0; x <= X1; x++) draw(map, 'base', x, 12, 28);
  draw(map, 'base', 9,  12, 26);
  draw(map, 'base', 10, 12, 26);

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);
  // Sala: x=5-14 (10 tiles de ancho), y=2-12
  const X0 = 5, X1 = 14;

  // Fila 2: estanterías traseras — IDs 0-7 del mart en 10 tiles
  const topRow = [0, 0, 1, 2, 3, 4, 5, 6, 7, 7];
  topRow.forEach((tile, i) => draw(map, 'base', X0 + i, 2, tile));

  // Fila 3: mostrador — IDs 8-15 en 10 tiles
  const counterRow = [8, 8, 9, 10, 11, 12, 13, 14, 15, 15];
  counterRow.forEach((tile, i) => draw(map, 'base', X0 + i, 3, tile));

  // Suelo beige (filas 4-11): ID 36
  for (let y = 4; y <= 11; y++)
    for (let x = X0; x <= X1; x++)
      draw(map, 'base', x, y, 36);

  // Sin estanterías laterales — el suelo beige llena toda la sala

  // Fila 12: suelo + tapete rojo centrado (ID 34)
  for (let x = X0; x <= X1; x++) draw(map, 'base', x, 12, 36);
  draw(map, 'base', 9,  12, 34);
  draw(map, 'base', 10, 12, 34);

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
    spawn: { x: 9, y: 8 },
    tiles: { floor: 28, exit: 26 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    spawn: { x: 9, y: 8 },
    tiles: { floor: 36, exit: 34 }
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