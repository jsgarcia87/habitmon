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
      result.statChanges.push({ target: 'defender', stat: 'attack', stage: -1 });
      result.message = `¡El ATAQUE de ${defender.name} bajó!`;
      break;
    case 'LEER':
      result.statChanges.push({ target: 'defender', stat: 'defense', stage: -1 });
      result.message = `¡La DEFENSA de ${defender.name} bajó!`;
      break;
    case 'TAIL_WHIP':
      result.statChanges.push({ target: 'defender', stat: 'defense', stage: -1 });
      result.message = `¡La DEFENSA de ${defender.name} bajó!`;
      break;
    case 'THUNDER_WAVE':
      if (applyStatus(defender, 'paralysis')) {
        result.statusApplied = 'paralysis';
        result.message = `¡${defender.name} está paralizado!`;
      } else {
        result.message = "¡No afectó!";
      }
      break;
    case 'POISON_POWDER':
      if (applyStatus(defender, 'poison')) {
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
