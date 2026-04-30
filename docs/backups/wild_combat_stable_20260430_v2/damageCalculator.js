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
 * Calculates a stat value considering its stage (-6 to +6).
 */
const getStatWithStage = (baseValue, stage) => {
  if (stage === 0) return baseValue;
  const num = Math.max(2, 2 + stage);
  const den = Math.max(2, 2 - stage);
  return Math.floor(baseValue * (num / den));
};

/**
 * Main Damage Formula (Essentials/Gen 5 Style)
 */
export const calculateDamage = (attacker, defender, move) => {
  const result = {
    finalDamage: 0,
    isCritical: false,
    effectiveness: 1
  };

  if (move.category === 'status' || move.power === 0) return result;

  const level = attacker.level || 5;
  const power = move.power;
  
  // Stats with stages
  const attackStat = move.category === 'special' ? (attacker.spAtk || attacker.attack) : attacker.attack;
  const attackStage = move.category === 'special' ? (attacker.statStages?.spAtk || 0) : (attacker.statStages?.attack || 0);
  const A = getStatWithStage(attackStat, attackStage);

  const defenseStat = move.category === 'special' ? (defender.spDef || defender.defense) : defender.defense;
  const defenseStage = move.category === 'special' ? (defender.statStages?.spDef || 0) : (defender.statStages?.defense || 0);
  const D = getStatWithStage(defenseStat, defenseStage);

  // Base Damage
  let damage = (((2 * level / 5 + 2) * power * A / D) / 50) + 2;

  // Critical Hit (approx 6.25% in Gen 5+)
  if (Math.random() < 0.0625) {
    result.isCritical = true;
    damage *= 1.5;
  }

  // Random factor (0.85 to 1.0)
  const random = 0.85 + Math.random() * 0.15;
  damage *= random;

  // STAB (Same Type Attack Bonus)
  if (attacker.types && attacker.types.includes(move.type)) {
    damage *= 1.5;
  }

  // Type Effectiveness
  const effectiveness = getEffectiveness(move.type, defender.types || []);
  damage *= effectiveness;
  result.effectiveness = effectiveness;

  // Status Modifiers
  if (attacker.status === 'burn' && move.category === 'physical') {
    damage *= 0.5;
  }

  result.finalDamage = Math.max(1, Math.floor(damage));
  return result;
};
