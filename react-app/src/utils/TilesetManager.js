/**
 * TilesetManager.js
 * Utility to handle RPG Maker XP / Pokemon Essentials map data and metadata.
 */

export const TILE_SIZE = 32;

export const parseRMXPTable = (rawTable) => {
  if (!rawTable || !rawTable['@data']) return null;
  const bytes = rawTable['@data'];
  
  // Table header (RMXP Table class serialization):
  // [0..3]: Dimensions (usually 3)
  // [4..7]: Width
  // [8..11]: Height
  // [12..15]: Layers (usually 3)
  // [16..19]: Total size (w * h * l)
  
  const read32 = (offset) => {
    return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16) + (bytes[offset + 3] << 24);
  };

  const dim = read32(0);
  const width = read32(4);
  const height = read32(8);
  const layers = read32(12);
  const size = read32(16);

  // The actual data starts at index 20
  const dataStart = 20;
  const tileIds = new Int16Array(size);
  
  for (let i = 0; i < size; i++) {
    // Each tile ID is a 16-bit signed integer (2 bytes)
    const b1 = bytes[dataStart + i * 2];
    const b2 = bytes[dataStart + i * 2 + 1];
    let val = b1 + (b2 << 8);
    // Handle signed 16-bit
    if (val > 32767) val -= 65536;
    tileIds[i] = val;
  }

  return {
    width,
    height,
    layers,
    tileIds
  };
};

/**
 * Parses the raw passages '@data' array from Tilesets.json
 * RMXP Tables have a 20-byte header, followed by 2 bytes per entry.
 */
export const parseRMXPPassages = (rawPassages) => {
  const bytes = rawPassages?.['@data'] || rawPassages || [];
  if (bytes.length < 20) return [];
  
  const size = (bytes.length - 20) / 2;
  const passages = new Int16Array(size);
  for (let i = 0; i < size; i++) {
    const b1 = bytes[20 + i * 2];
    const b2 = bytes[20 + i * 2 + 1];
    passages[i] = (b1 ?? 0) | ((b2 ?? 0) << 8);
  }
  return passages;
};

/**
 * Parses the raw priorities '@data' array from Tilesets.json
 */
export const parseRMXPPriorities = (rawPriorities) => {
  const bytes = rawPriorities?.['@data'] || rawPriorities || [];
  if (bytes.length < 20) return [];
  
  const size = (bytes.length - 20) / 2;
  const priorities = new Int8Array(size);
  for (let i = 0; i < size; i++) {
    const b1 = bytes[20 + i * 2];
    // Priorities are usually 0-5, fits in a byte.
    priorities[i] = b1 ?? 0;
  }
  return priorities;
};

export const PASSAGE_BITS = {
  DOWN: 0x01,
  LEFT: 0x02,
  RIGHT: 0x04,
  UP: 0x08,
  BUSH: 0x10,
  COUNTER: 0x20
};

export const checkPassage = (passages, tileId, direction) => {
  if (!passages || tileId < 0) return true;
  if (tileId === 0) return true; // Empty tile is always passable
  
  // RMXP Logic: 
  // Indices 0-7 are for the 8 available autotiles.
  // Standard tiles start with IDs 384...
  let idx = tileId;
  if (tileId < 384) {
    // Autotile IDs are in blocks of 48, starting at 48.
    // 48..95   -> Autotile 0
    // 96..143  -> Autotile 1
    // ...
    idx = Math.floor(tileId / 48) - 1;
    if (idx < 0) return true; // Should not happen for valid map data
  }

  const flag = passages[idx] || 0;
  
  // We check the directional bit
  const dirMap = { 
    down: PASSAGE_BITS.DOWN, 
    left: PASSAGE_BITS.LEFT, 
    right: PASSAGE_BITS.RIGHT, 
    up: PASSAGE_BITS.UP 
  };
  const mask = dirMap[direction];
  
  // If the directional bit is SET (1), it means it BLOCKS movement in that direction.
  // We return true (PASSABLE) if the bit is 0.
  return (flag & mask) === 0;
};

// Autotile Helper: RMXP pattern map (48 shapes)
// This is a complex mapping of 16x16 corners to the 4 quadrants of a 32x32 tile.
// For simplicity in this first version, we'll implement the "simple" frame selection if it exists.
export const getAutotileRect = (tileId) => {
  const autotileIdx = Math.floor(tileId / 48) - 1;
  const shapeIdx = tileId % 48;
  return { autotileIdx, shapeIdx };
};
