/**
 * damageCalculator.js
 * Faithful implementation of the Pokémon Gen 5 damage formula.
 */

export const TYPE_CHART = {
  NORMAL:   { ROCK: 0.5,  GHOST: 0,    STEEL: 0.5 },
  FIRE:     { FIRE: 0.5,  WATER: 0.5,  GRASS: 2,    ICE: 2,      BUG: 2,      ROCK: 0.5,  DRAGON: 0.5, STEEL: 2 },
  WATER:    { FIRE: 2,    WATER: 0.5,  GRASS: 0.5,  GROUND: 2,   ROCK: 2,     DRAGON: 0.5 },
  GRASS:    { FIRE: 0.5,  WATER: 2,    GRASS: 0.5,  POISON: 0.5, GROUND: 2,   FLYING: 0.5, BUG: 0.5,   ROCK: 2,     DRAGON: 0.5, STEEL: 0.5 },
  ELECTRIC: { WATER: 2,    GRASS: 0.5,  ELECTRIC: 0.5, GROUND: 0,   FLYING: 2,   DRAGON: 0.5 },
  ICE:      { FIRE: 0.5,  WATER: 0.5,  GRASS: 2,    ICE: 0.5,    GROUND: 2,   FLYING: 2,   DRAGON: 2,   STEEL: 0.5 },
  FIGHTING: { NORMAL: 2,   ICE: 2,      POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5,   ROCK: 2,     GHOST: 0,    STEEL: 2 },
  POISON:   { GRASS: 2,    POISON: 0.5, GROUND: 0.5, ROCK: 0.5,  GHOST: 0.5, STEEL: 0 },
  GROUND:   { FIRE: 2,    ELECTRIC: 2, GRASS: 0.5,  POISON: 2,   FLYING: 0,   BUG: 0.5,   ROCK: 2,     STEEL: 2 },
  FLYING:   { GRASS: 2,    ELECTRIC: 0.5, FIGHTING: 2, BUG: 2,     ROCK: 0.5,  STEEL: 0.5 },
  PSYCHIC:  { FIGHTING: 2, POISON: 2,   PSYCHIC: 0.5, STEEL: 0.5 },
  BUG:      { FIRE: 0.5,  GRASS: 2,    FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2,  GHOST: 0.5, STEEL: 0.5 },
  ROCK:     { FIRE: 2,    ICE: 2,      FIGHTING: 0.5, GROUND: 0.5, FLYING: 2,   BUG: 2,     STEEL: 0.5 },
  GHOST:    { NORMAL: 0,   PSYCHIC: 2,  GHOST: 2 },
  DRAGON:   { DRAGON: 2,   STEEL: 0.5 },
  STEEL:    { FIRE: 0.5,  WATER: 0.5,  ELECTRIC: 0.5, ICE: 2,      ROCK: 2,     STEEL: 0.5 }
};

/**
 * Calculates effectiveness of an attack type against a target's types.
 */
export const getEffectiveness = (attackType, targetTypes) => {
  let multiplier = 1;
  targetTypes.forEach(type => {
    if (TYPE_CHART[attackType] && TYPE_CHART[attackType][type] !== undefined) {
      multiplier *= TYPE_CHART[attackType][type];
    }
  });
  return multiplier;
};

/**
 * Main Damage Formula (Essentials/Gen 5 Style)
 */
export const calculateDamage = (attacker, defender, move) => {
  if (move.category === 'status' || move.power === 0) return 0;

  const level = attacker.level || 5;
  const power = move.power;
  
  // Choose Attack and Defense based on move category
  const A = move.category === 'special' ? (attacker.spAtk || attacker.attack) : attacker.attack;
  const D = move.category === 'special' ? (defender.spDef || defender.defense) : defender.defense;

  // Base Damage
  let damage = (((2 * level / 5 + 2) * power * A / D) / 50) + 2;

  // Modifiers
  // 1. Targets (Multi-battle check, here 1)
  // 2. Weather (Implementation pending)
  // 3. Critical (Simple 1.5x)
  const isCritical = Math.random() < 0.0625; // 1/16 chance
  if (isCritical) damage *= 1.5;

  // 4. Random (0.85 to 1.0)
  const random = 0.85 + Math.random() * 0.15;
  damage *= random;

  // 5. STAB (Same Type Attack Bonus)
  if (attacker.types.includes(move.type)) {
    damage *= 1.5;
  }

  // 6. Type Effectiveness
  const effectiveness = getEffectiveness(move.type, defender.types);
  damage *= effectiveness;

  // 7. Burn (Implementation pending)
  
  return {
    finalDamage: Math.max(1, Math.floor(damage)),
    isCritical,
    effectiveness
  };
};
