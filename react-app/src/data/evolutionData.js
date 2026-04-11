/**
 * evolutionData.js
 * 
 * Define las cadenas de evolución de los Habitmon.
 */

export const EVOLUTION_DATA = {
  // Bulbasaur -> Ivysaur -> Venusaur
  "001": { next: "002", level: 16 },
  "002": { next: "003", level: 32 },
  
  // Charmander -> Charmeleon -> Charizard
  "004": { next: "005", level: 16 },
  "005": { next: "006", level: 36 },
  
  // Squirtle -> Wartortle -> Blastoise
  "007": { next: "008", level: 16 },
  "008": { next: "009", level: 36 },

  // Chikorita -> Bayleef -> Meganium
  "152": { next: "153", level: 16 },
  "153": { next: "154", level: 32 },

  // Cyndaquil -> Quilava -> Typhlosion
  "155": { next: "156", level: 14 },
  "156": { next: "157", level: 36 },

  // Totodile -> Croconaw -> Feraligatr
  "158": { next: "159", level: 18 },
  "159": { next: "160", level: 30 },

  // Pidgey -> Pidgeotto -> Pidgeot
  "016": { next: "017", level: 18 },
  "017": { next: "018", level: 36 },

  // Caterpie -> Metapod -> Butterfree
  "010": { next: "011", level: 7 },
  "011": { next: "012", level: 10 }
};

export const getEvolution = (pokemonId, level) => {
  const evo = EVOLUTION_DATA[pokemonId];
  if (evo && level >= evo.level) {
    return evo.next;
  }
  return null;
};
