/**
 * battleEngine.js
 * The "Brain" of the combat system. Manages turn order and sequence.
 */
import { calculateDamage } from './damageCalculator.js';
import { executeMoveEffect } from './moveEffects.js';

/**
 * Determines the order of moves based on priority and speed.
 */
export const determineTurnOrder = (pMove, pPkmn, eMove, ePkmn) => {
  const pPriority = pMove?.priority || 0;
  const ePriority = eMove?.priority || 0;

  if (pPriority > ePriority) return ['player', 'enemy'];
  if (ePriority > pPriority) return ['enemy', 'player'];

  // Priority tie, use Speed
  if (pPkmn.speed > ePkmn.speed) return ['player', 'enemy'];
  if (ePkmn.speed > pPkmn.speed) return ['enemy', 'player'];

  // Speed tie, random
  return Math.random() < 0.5 ? ['player', 'enemy'] : ['enemy', 'player'];
};

/**
 * Calculates accuracy multiplier based on accuracy/evasion stages.
 */
const getAccuracyMultiplier = (accStage, evaStage) => {
  const stage = Math.max(-6, Math.min(6, accStage - evaStage));
  const num = Math.max(3, 3 + stage);
  const den = Math.max(3, 3 - stage);
  return num / den;
};

/**
 * Executes a single move and returns the summary of what happened.
 */
export const processMove = (attacker, defender, move) => {
  const summary = {
    attackerName: attacker.name,
    defenderName: defender.name,
    moveName: move.nombre,
    damageDealt: 0,
    isCritical: false,
    effectiveness: 1,
    effects: null,
    missed: false,
    unableToMove: null
  };

  // 0. Status Check (Paralysis)
  if (attacker.status === 'paralysis' && Math.random() < 0.25) {
    summary.unableToMove = '¡Está paralizado! ¡No se puede mover!';
    return summary;
  }

  // 1. Accuracy Check
  const baseAccuracy = move.accuracy || 100;
  if (baseAccuracy < 100) {
    const accStage = attacker.statStages?.accuracy || 0;
    const evaStage = defender.statStages?.evasion || 0;
    const multiplier = getAccuracyMultiplier(accStage, evaStage);
    const finalAccuracy = baseAccuracy * multiplier;

    if (Math.random() * 100 > finalAccuracy) {
      summary.missed = true;
      return summary;
    }
  }

  // 2. Damage Calculation
  const dmgResult = calculateDamage(attacker, defender, move);
  summary.damageDealt = dmgResult.finalDamage;
  summary.isCritical = dmgResult.isCritical;
  summary.effectiveness = dmgResult.effectiveness;

  // 3. Side Effects
  summary.effects = executeMoveEffect(move, attacker, defender);

  return summary;
};

/**
 * Applies end-of-turn effects like Poison damage.
 */
export const processEndTurnEffects = (pkmn) => {
  const effects = [];
  if (pkmn.status === 'poison') {
    const dmg = Math.floor(pkmn.maxHp / 8);
    effects.push({ type: 'poison', damage: dmg, message: `¡${pkmn.name} sufre por el veneno!` });
  }
  return effects;
};
