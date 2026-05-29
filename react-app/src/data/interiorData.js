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
  // ---- Centro Pokémon (gsc pkmn center.png — 8 cols × 7 rows, 56 tiles) ----
  // Walkable: suelo rosa (24, 28) y decoración de suelo (26, 27)
  // Salida: tile 50 (r6c2 = alfombra entrada, opaco)
  pokemon_center: {
    [24]: { walkable: true },
    [28]: { walkable: true },
    [26]: { walkable: true },
    [27]: { walkable: true },
    [50]: { walkable: true, type: 'exit' },
  },
  // ---- Tienda Pokémon (gsc pkmn mart.png — 8 cols × 7 rows, 56 tiles) ----
  // Walkable: suelo verde (6) y alfombra-mat (14)
  // Salida: tile 49 (r6c1)
  pokemon_shop: {
    [6]:  { walkable: true },
    [14]: { walkable: true },
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

  // Rellenar todo con pared (tile 12 = negro sólido en gsc pkmn center.png)
  for (let y = 0; y < 15; y++)
    for (let x = 0; x < 20; x++)
      draw(map, 'base', x, y, 12);

  // Distribución fiel a Map031.json (RMXP original, 22x16):
  // Interior 10 tiles de ancho (cols 6-15 → xOff=5), 8 filas de contenido (rows 4-11 → yOff=3)
  // Tile IDs = map_id_RMXP - 384 (offset de autotiles RMXP)
  const xOff = 5, yOff = 3;

  const layout = [
    // y=3: fila de techo/cornisa (decoración arquitectónica superior)
    [ 0, 1, 2, 3, 3, 5, 3, 3, 3, 4],
    // y=4: fila de mostrador (Enfermera Joy aquí; tile 9 sustituye a 24 para bloquear paso)
    [ 8, 9,10, 9, 9,13, 9, 9, 9,19],
    // y=5: fila de transición entre mostrador y suelo
    [16,16,18,16,20,21,28,28,28,24],
    // y=6..10: suelo rosa (tiles 24 y 28, distribución exacta del mapa original)
    [24,24,24,24,24,24,28,28,28,28],
    [28,28,28,28,28,28,28,28,28,28],
    [28,28,28,28,28,28,28,27,27,28],
    [28,28,28,28,28,28,28,28,28,28],
    [28,28,28,26,26,28,28,27,27,28],
  ];

  layout.forEach((row, ri) => {
    row.forEach((t, ci) => draw(map, 'base', xOff + ci, yOff + ri, t));
  });

  // Alfombra de salida (tile 50 = r6c2, opaco) en el centro de la pared inferior
  draw(map, 'base', 9,  11, 50);
  draw(map, 'base', 10, 11, 50);

  return map;
}

export function generatePokemonShop() {
  const map = createMap(20, 15);

  // Rellenar todo con pared (tile 39 = negro sólido en gsc pkmn mart.png)
  for (let y = 0; y < 15; y++)
    for (let x = 0; x < 20; x++)
      draw(map, 'base', x, y, 39);

  // Distribución fiel a Map054.json (RMXP original, 24x16):
  // Interior 12 tiles de ancho (cols 6-17 → xOff=4), 8 filas de contenido (rows 4-11 → yOff=3)
  // Tile IDs = map_id_RMXP - 384
  const xOff = 4, yOff = 3;

  const layout = [
    // y=3: fila de mostrador superior (tiles 1=mostrador, 4=esquina, 0=estantería, 2/3=balda)
    [ 1, 1, 4, 0, 1, 1, 2, 3, 2, 3, 2, 3],
    // y=4: fila de mostrador inferior (9=mostrador base, 12=divisor, 8=esquina, 10/11=balda base)
    [ 9, 9,12, 8, 9, 9,10,11,10,11,10,11],
    // y=5: suelo + divisor vertical (5=divisor superior) + pared derecha
    [ 6, 6, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    // y=6: suelo + divisor (12) + pared derecha
    [ 6, 6,12, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    // y=7: estanterías izq (0) + divisor (13) + suelo + expositores (2/3) + pared der (7)
    [ 0, 0,13, 6, 2, 3, 2, 3, 2, 3, 6, 7],
    // y=8: base estanterías (8) + suelo + base expositores (10/11) + pared der (15)
    [ 8, 8, 6, 6,10,11,10,11,10,11, 6,15],
    // y=9: suelo + pared der (7)
    [ 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
    // y=10: suelo + alfombra-mat (14) + pared der (15)
    [ 6, 6, 6,14,14, 6, 6, 6, 6, 6, 6,15],
  ];

  layout.forEach((row, ri) => {
    row.forEach((t, ci) => draw(map, 'base', xOff + ci, yOff + ri, t));
  });

  // Alfombra de salida (tile 49 = r6c1) en el centro de la pared inferior
  draw(map, 'base', 9,  11, 49);
  draw(map, 'base', 10, 11, 49);

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
    spawn: { x: 9, y: 9 },
    tiles: { floor: 28, exit: 50 }
  },
  'pokemon_shop': {
    tileset: `${BASE}Graphics/tilesets/gsc pkmn mart.png`,
    nombre: 'TIENDA POKÉMON',
    spawn: { x: 9, y: 9 },
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