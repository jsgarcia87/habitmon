import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import PokemonSprite from '../components/PokemonSprite';
import HPBar from '../components/HPBar';
import DialogBox from '../components/DialogBox';

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito } = useGame();
  
  if (!user || !habitosHoy) {
    return <div className="screen-container">Cargando datos de batalla...</div>;
  }

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild;
  const gymId = battleData?.gymId;
  const wildPk = battleData?.pokemon;

  // Data Logic
  const gymHabits = !isWild ? habitosHoy.filter(h => h.gym_id === gymId) : [];
  const totalHabits = gymHabits.length || 1;
  const initialCompleted = gymHabits.filter(h => h.completado).length;

  const enemyId = isWild ? wildPk?.id : 150 + (gymId === 'vestirse' ? 1 : gymId === 'desayuno' ? 2 : 3);
  const enemyName = isWild ? wildPk?.nombre : "LÍDER";

  // State Logic
  const [leaderHP, setLeaderHP] = useState(isWild ? 100 : 100 - (initialCompleted / totalHabits * 100));
  const [playerHP, setPlayerHP] = useState(100);
  const [message, setMessage] = useState(isWild ? `¡Un ${enemyName.toUpperCase()} salvaje apareció!` : `¡${enemyName} te desafía!`);
  const [phase, setPhase] = useState('intro'); // intro, menu, moves, attack, win, dialog
  const [enemyAnim, setEnemyAnim] = useState('slide-in'); // slide-in, normal, hit
  const [playerAnim, setPlayerAnim] = useState('normal'); // normal, lunge
  
  // Dialogue Advancement Helper
  const handleDialogNext = () => {
    if (phase === 'intro') setPhase('menu');
    else if (phase === 'win') navigate('capture', { gymId });
    else if (phase === 'dialog') setPhase('menu');
    else if (phase === 'dialog_exit') navigate('city');
    else if (phase === 'dialog_fail_flee') setPhase('menu');
  };

  const prevAPressed = useRef(false);

  useEffect(() => {
     if (aPressed && !prevAPressed.current) {
       if (phase === 'intro' || phase === 'win' || phase === 'dialog' || phase === 'dialog_exit' || phase === 'dialog_fail_flee') {
         handleDialogNext();
       }
     }
     prevAPressed.current = aPressed;
  }, [aPressed, phase]);

  useEffect(() => {
     // Intro animation
     setTimeout(() => setEnemyAnim('normal'), 600);
  }, []);

  const handleLucharClick = () => {
    setPhase('moves');
  };

  const handleHuir = () => {
    const success = Math.random() > 0.5;
    if (success) {
      setMessage("¡Escapaste con éxito!");
      setPhase('dialog_exit');
    } else {
      setMessage("¡No pudiste escapar!");
      setPhase('dialog_fail_flee');
    }
  };

  const handleCapture = () => {
     navigate('capture', { gymId: enemyId });
  };

  const handleMoveClick = async (habit) => {
    if (habit.completado) {
      setMessage(`¡"${habit.nombre}" ya está hecho!`);
      setPhase('dialog');
      return;
    }

    setPhase('attack');
    setPlayerAnim('lunge');
    setMessage(`¡${user.username} lanzó ${habit.nombre.toUpperCase()}!`);
    
    // API Call
    await completarHabito(gymId, habit.habito_id);

    setTimeout(() => {
      setPlayerAnim('normal');
      setEnemyAnim('hit');
      const dmg = 100 / totalHabits;
      const newHP = Math.max(0, leaderHP - dmg);
      setLeaderHP(newHP);

      setTimeout(() => {
        setEnemyAnim('normal');
        if (newHP <= 0) {
          setMessage(`¡El ${enemyName} se debilitó!`);
          setPhase('win');
        } else {
          setMessage("¡Es muy eficaz!");
          setPhase('dialog');
        }
      }, 500);
    }, 1000);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* AREA DE BATALLA (Flex 1) */}
      <div style={{ 
        flex: 1, position: 'relative', 
        backgroundImage: 'url(/Graphics/battlebacks/general_bg.png)',
        backgroundSize: '100% 100%',
        backgroundColor: '#F8F0D8',
        overflow: 'hidden'
      }}>
        {/* Enemy Side */}
        <div style={{ position: 'absolute', top: '20px', left: '10px', zIndex: 10 }}>
          <HPBar 
            current={leaderHP} 
            max={100} 
            name={enemyName}
            level={isWild ? (wildPk?.nivel || 5) : 30}
            alignment="enemy"
          />
        </div>
        <div style={{ 
          position: 'absolute', top: '30px', right: '40px',
          width: '120px', height: '120px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'all 0.5s',
          transform: enemyAnim === 'slide-in' ? 'translateX(200px)' : (enemyAnim === 'hit' ? 'translateX(10px) rotate(10deg)' : 'none'),
          opacity: enemyAnim === 'hit' ? 0.5 : 1
        }}>
          <PokemonSprite id={enemyId} front={true} style={{ width: '100px', height: '100px', filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,0.1))' }} />
        </div>

        {/* Player Side */}
        <div style={{ position: 'absolute', bottom: '20px', right: '10px', zIndex: 10 }}>
          <HPBar 
            current={playerHP} 
            max={100} 
            name={user.starter_nombre || 'Pokémon'}
            level={user.starter_nivel || 5}
            alignment="player"
          />
        </div>
        <div style={{ 
          position: 'absolute', bottom: '10px', left: '30px',
          width: '140px', height: '140px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transition: 'transform 0.3s',
          transform: playerAnim === 'lunge' ? 'translateY(-20px) translateX(20px)' : 'none'
        }}>
           <PokemonSprite id={user.starter_id || 1} front={false} style={{ width: '120px', height: '120px', filter: 'drop-shadow(-3px 3px 0 rgba(0,0,0,0.1))' }} />
        </div>
      </div>

      {/* DIALOG & MENU AREA (Fijo 140px) */}
      <div style={{ height: '140px', borderTop: '4px solid #333', backgroundColor: '#F8F0D8', zIndex: 10, flexShrink: 0 }}>
        {phase === 'menu' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', padding: '10px', gap: '8px' }}>
             {!isWild ? (
               <>
                <button className="gb-button primary" onClick={handleLucharClick}>LUCHAR</button>
                <button className="gb-button">MOCHILA</button>
                <button className="gb-button">PKMN</button>
                <button className="gb-button" onClick={() => navigate('city')}>HUIR</button>
               </>
             ) : (
               <>
                <button className="gb-button primary" onClick={handleCapture}>POKÉBALL</button>
                <button className="gb-button primary" onClick={handleHuir}>HUIR</button>
                <button className="gb-button">MOCHILA</button>
                <button className="gb-button">PKMN</button>
               </>
             )}
          </div>
        )}

        {phase === 'moves' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%', padding: '10px', gap: '8px' }}>
            {gymHabits.map(h => (
              <button 
                key={h.habito_id} 
                className={`gb-button ${h.completado ? 'secondary' : ''}`}
                style={{ fontSize: '8px', textAlign: 'left' }}
                onClick={() => handleMoveClick(h)}
              >
                {h.nombre.toUpperCase()} {h.completado ? ' (OK)' : ''}
              </button>
            ))}
            <button className="gb-button" onClick={() => setPhase('menu')}>ATRÁS</button>
          </div>
        )}

        {(phase === 'intro' || phase === 'attack' || phase === 'win' || phase === 'dialog' || phase === 'dialog_exit' || phase === 'dialog_fail_flee') && (
           <DialogBox 
             text={message} 
             onNext={handleDialogNext}
           />
        )}
      </div>
    </div>
  );
};

export default BattleScreen;
