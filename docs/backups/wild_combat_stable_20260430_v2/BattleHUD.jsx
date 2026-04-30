import React from 'react';
import HPBar from '../HPBar';

const BattleHUD = ({ enemyPkmn, playerPkmn, starterExp, introReady }) => {
  if (!introReady) return null;

  return (
    <>
      <div style={{ position: 'absolute', top: '8px', left: '0px', zIndex: 10 }}>
        <HPBar 
          current={enemyPkmn.hp} 
          max={enemyPkmn.maxHp} 
          name={enemyPkmn.name} 
          level={enemyPkmn.level} 
          status={enemyPkmn.status}
          alignment="enemy" 
        />
      </div>
      <div style={{ position: 'absolute', bottom: '8px', right: '0px', zIndex: 10 }}>
        <HPBar 
          current={playerPkmn.hp} 
          max={playerPkmn.maxHp} 
          name={playerPkmn.name} 
          level={playerPkmn.level} 
          status={playerPkmn.status}
          exp={starterExp} 
          alignment="player" 
        />
      </div>
    </>
  );
};

export default BattleHUD;
