import React from 'react';

const BattleActionMenu = ({ 
  isWild, 
  menuView, 
  setMenuView, 
  phase, 
  habitsForStage, 
  localCompleted, 
  handleHabitAttack, 
  moves = [], 
  onMoveSelect,
  setMessage, 
  navigate 
}) => {
  const isSelectPhase = phase === 'select';

  const renderMainMenu = () => (
    <div style={S.grid2x2}>
      {[
        ['LUCHAR',  () => setMenuView('moves')],
        ['MOCHILA', () => setMessage('¡No tienes objetos!')],
        ['PKMN',    () => setMessage('¡Sólo tienes un PKMN!')],
        ['HUIR',    () => navigate('city')]
      ].map(([label, fn]) => (
        <button key={label}
          disabled={!isSelectPhase}
          className="battle-btn"
          onClick={fn}>
          {label}
        </button>
      ))}
    </div>
  );

  const renderMovesMenu = () => (
    <div style={S.grid2x2}>
      {moves.map(mKey => (
        <button key={mKey}
          disabled={!isSelectPhase}
          className="battle-btn"
          onClick={() => onMoveSelect(mKey)}>
          {mKey.toUpperCase()}
        </button>
      ))}
      <button 
        className="battle-btn" 
        style={{ gridColumn: 'span 2', height: '32px', marginTop: 'auto' }}
        onClick={() => setMenuView('main')}>
        ← VOLVER
      </button>
    </div>
  );

  const renderHabitsMenu = (compact = false) => (
    <div style={{
      ...S.gridHabits,
      overflowY: compact ? 'auto' : 'visible'
    }}>
      {habitsForStage.map(h => {
        const hId = h.habito_id || h.id;
        const done = localCompleted[hId];
        return (
          <button key={hId}
            disabled={done || !isSelectPhase}
            className={compact ? "battle-btn-gym-compact" : "battle-btn-gym"}
            onClick={() => handleHabitAttack(h)}>
            <span style={{ fontSize: compact ? 14 : 16 }}>{h.icono || '⚔️'}</span>
            <span style={{ fontSize: compact ? 6 : 7, textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.2' }}>
                {(h.nombre || '').toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={S.container}>
      {isWild ? (
        menuView === 'main' ? renderMainMenu() : renderMovesMenu()
      ) : (
        renderHabitsMenu(false)
      )}
    </div>
  );
};

const S = {
  container: { flex: 1, overflow: 'hidden' },
  grid2x2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
    height: '100%', gap: 2, padding: 6, boxSizing: 'border-box'
  },
  gridHabits: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    height: '100%', gap: 6, padding: 8, boxSizing: 'border-box'
  }
};

export default BattleActionMenu;
