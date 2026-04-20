/**
 * moveData.js
 * Traditional moves for wild encounters.
 */
export const MOVE_DATA = {
  TACKLE: {
    nombre: 'PLACAJE',
    power: 40,
    type: 'NORMAL',
    accuracy: 100,
    desc: 'Una embestida física básica.'
  },
  SCRATCH: {
    nombre: 'ARAÑAZO',
    power: 40,
    type: 'NORMAL',
    accuracy: 100,
    desc: 'Usa garras afiladas para herir.'
  },
  POCKET_SAND: {
    nombre: 'ATAQUE ARENA',
    power: 0,
    type: 'GROUND',
    accuracy: 100,
    desc: 'Reduce la precisión del rival.'
  },
  GROWL: {
    nombre: 'GRUÑIDO',
    power: 0,
    type: 'NORMAL',
    accuracy: 100,
    desc: 'Reduce el Ataque del rival.'
  },
  WATER_GUN: {
    nombre: 'PISTOLA AGUA',
    power: 40,
    type: 'WATER',
    accuracy: 100,
    desc: 'Rociado de agua a presión.'
  },
  EMBER: {
    nombre: 'ASCUAS',
    power: 40,
    type: 'FIRE',
    accuracy: 100,
    desc: 'Pequeñas llamas que queman.'
  },
  VINE_WHIP: {
    nombre: 'LATIGO CEPA',
    power: 45,
    type: 'GRASS',
    accuracy: 100,
    desc: 'Azota con látigos vegetales.'
  }
};

export const POKEMON_MOVES = {
  152: ['TACKLE', 'GROWL'],     // Chikorita
  155: ['TACKLE', 'EMBER'],     // Cyndaquil
  158: ['SCRATCH', 'WATER_GUN'], // Totodile
  16:  ['TACKLE', 'POCKET_SAND'], // Pidgey (Wild)
  19:  ['TACKLE', 'SCRATCH'],    // Rattata (Wild)
  25:  ['TACKLE', 'THUNDER_SHOCK'] // Pikachu (Wild)
};
