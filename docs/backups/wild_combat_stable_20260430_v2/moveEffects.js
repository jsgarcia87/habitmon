/**
 * moveEffects.js
 * Logic for non-damaging effects (Status, Stat Stages).
 */

export const applyStatus = (target, status) => {
  if (target.status) return null; // Already has a status
  
  // Type-based immunities
  if (status === 'poison' && (target.types.includes('POISON') || target.types.includes('STEEL'))) return null;
  if (status === 'paralysis' && target.types.includes('ELECTRIC')) return null;
  
  target.status = status;
  return status;
};

/**
 * Handles specific move effects beyond simple damage.
 * Returns an object with the changes made to be displayed in messages.
 */
export const executeMoveEffect = (move, attacker, defender) => {
  const result = {
    message: null,
    statChanges: [],
    statusApplied: null
  };

  switch (move.id) {
    case 'GROWL':
      if ((defender.statStages?.attack || 0) > -6) {
        result.statChanges.push({ target: 'defender', stat: 'attack', stage: -1 });
        result.message = `¡El ATAQUE de ${defender.name} bajó!`;
      } else {
        result.message = `¡El ATAQUE de ${defender.name} no puede bajar más!`;
      }
      break;
    case 'LEER':
    case 'TAIL_WHIP':
      if ((defender.statStages?.defense || 0) > -6) {
        result.statChanges.push({ target: 'defender', stat: 'defense', stage: -1 });
        result.message = `¡La DEFENSA de ${defender.name} bajó!`;
      } else {
        result.message = `¡La DEFENSA de ${defender.name} no puede bajar más!`;
      }
      break;
    case 'THUNDER_WAVE':
      if (!defender.status) {
        result.statusApplied = 'paralysis';
        result.message = `¡${defender.name} está paralizado!`;
      } else {
        result.message = "¡No afectó!";
      }
      break;
    case 'SAND_ATTACK':
      if ((defender.statStages?.accuracy || 0) > -6) {
        result.statChanges.push({ target: 'defender', stat: 'accuracy', stage: -1 });
        result.message = `¡La PRECISIÓN de ${defender.name} bajó!`;
      } else {
        result.message = `¡La PRECISIÓN de ${defender.name} no puede bajar más!`;
      }
      break;
    case 'POISON_POWDER':
      if (!defender.status && !defender.types.includes('POISON') && !defender.types.includes('STEEL')) {
        result.statusApplied = 'poison';
        result.message = `¡${defender.name} ha sido envenenado!`;
      } else {
        result.message = "¡No afectó!";
      }
      break;
    // Add more effects as needed...
    default:
      break;
  }

  return result;
};
