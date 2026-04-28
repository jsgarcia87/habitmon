import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api/assets';
import { safeDrawImage } from '../utils/gfxUtils';
import { MOVE_DATA, POKEMON_MOVES } from '../data/moveData';
import { createBattlePokemon, getPokemonByGym } from '../data/pokemonData';
import { determineTurnOrder, processMove, processEndTurnEffects } from '../utils/battleEngine';
import { 
  ANIM_TYPES, 
  updateBattleAnimations, 
  drawBattleAnimations, 
  getMoveAnimation,
  createAnimation
} from '../utils/battleAnimations';

const INTRO_STATES = {
  FADE_IN:        'fadeIn',
  TRAINER_ENTER:  'trainerEnter',
  TRAINER_THROW:  'trainerThrow',
  BALL_FLY:       'ballFly',
  BALL_FLASH:     'ballFlash',
  POKEMON_APPEAR: 'pokemonAppear',
  HUD_SLIDE:      'hudSlide',
  READY:          'ready'
};

const BATTLE_PHASES = {
  SELECT: 'select',
  RESOLVING: 'resolving',
  FINISHED: 'finished'
};

const BattleScreen = ({ navigate, battleData, aPressed }) => {
  const { user, habitosHoy, completarHabito, starter, capturarPokemon, completarGimnasio, ganarBatalla } = useGame();
  
  if (!user || !habitosHoy || !starter) {
    return (
      <div style={{width:'100vw', height:'100dvh', background:'#000', color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Press Start 2P"', fontSize: 8, gap: 20}}>
        <div>Cargando datos del combate...</div>
        <button 
          onClick={() => navigate('city')}
          style={{ padding: '8px 16px', background: '#333', color: '#fff', border: '1px solid #666', cursor: 'pointer', fontSize: 8 }}
        >
          VOLVER AL MAPA
        </button>
      </div>
    );
  }

  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;
  
  // FIX: Define habitsForStage by filtering habitosHoy for the current gym
  const habitsForStage = (habitosHoy || []).filter(h => h.gym_id === gymId);

  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main');
  const [message, setMessage] = useState('');
  // introReady is React state (not ref) so JSX re-renders when HUDs need to appear
  const [introReady, setIntroReady] = useState(false);
  // Victory summary overlay: null while hidden, object with reward data when shown
  const [victoryData, setVictoryData] = useState(null);
  
  // Essentials Battle Instances
  const [playerPkmn, setPlayerPkmn] = useState(null);
  const [enemyPkmn, setEnemyPkmn] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [teamIndex, setTeamIndex] = useState(0);
  
  const [localCompleted, setLocalCompleted] = useState({});
  const activeAnimsRef = useRef([]);
  const playerOffsetRef = useRef({ x: 0, y: 0 });
  const enemyOffsetRef = useRef({ x: 0, y: 0 });
  const isFlashingRef = useRef(false);

  // Victory display values for count-up animation
  const [displayXp, setDisplayXp] = useState(0);
  const [displayMonedas, setDisplayMonedas] = useState(0);
  const [showContinueHint, setShowContinueHint] = useState(false);
  
  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  
  const introRef = useRef({
    state: INTRO_STATES.FADE_IN,
    timer: 0, fadeAlpha: 1, trainerX: -80, ballVisible: false, ballX: 0, ballY: 0,
    ballAngle: 0, enemyOpacity: 0, enemyScale: 1, enemyOffsetX: 0, flashAlpha: 0,
    enemyHudX: -200, playerHudX: 430, playerScale: 0.1
  });

  // Initialization - ONLY ON MOUNT or when battleData changes radically
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Assets
    const bg = new Image(); bg.src = getAssetPath('Graphics/battlebacks/general_bg.png'); bg.onload = () => { bgImgRef.current = bg; };
    const avatarNum = String(user?.avatar || 0).padStart(3,'0');
    const tr = new Image(); tr.src = getAssetPath(`Graphics/trainers/trback${avatarNum === '000' ? '000' : '001'}.png`); tr.onload = () => { trainerImgRef.current = tr; };
    
    // Core Data Initialization
    const pInst = createBattlePokemon(starter.starter_id, starter.starter_nivel);
    let eTeam = [];
    if (isWild) {
      eTeam = [createBattlePokemon(battleData?.pokemon?.id || 16, battleData?.pokemon?.nivel || 5)];
    } else {
      const gymPokes = getPokemonByGym(gymId);
      eTeam = Array.isArray(gymPokes) ? gymPokes : [gymPokes];
    }

    setPlayerPkmn(pInst);
    setEnemyPkmn(eTeam[0]);
    setEnemyTeam(eTeam);
    setTeamIndex(0);

    const enemyFormattedId = String(eTeam[0].id).padStart(3, '0');
    const en = new Image(); en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`); en.onload = () => { enemyImgRef.current = en; };

    const pPk = new Image(); const starterId = String(pInst.id).padStart(3, '0');
    pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`); pPk.onload = () => { playerPkImgRef.current = pPk; };

  }, []); // Only run once on mount for the specific battle instance

  // Victory count-up effect
  useEffect(() => {
    if (!victoryData) {
      setDisplayXp(0);
      setDisplayMonedas(0);
      setShowContinueHint(false);
      return;
    }

    let xp = 0;
    let coins = 0;
    const targetXp = victoryData.xpGained;
    const targetCoins = victoryData.monedas;
    
    const interval = setInterval(() => {
      let changed = false;
      if (xp < targetXp) {
        xp = Math.min(targetXp, xp + Math.ceil(targetXp / 20));
        setDisplayXp(xp);
        changed = true;
      }
      if (coins < targetCoins) {
        coins = Math.min(targetCoins, coins + Math.ceil(targetCoins / 15));
        setDisplayMonedas(coins);
        changed = true;
      }
      
      if (!changed) {
        clearInterval(interval);
        setTimeout(() => setShowContinueHint(true), 500);
      }
    }, 40);
    
    return () => clearInterval(interval);
  }, [victoryData]);

  // Game Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameId;
    const loop = (now) => {
      const dt = now - lastTime; lastTime = now;
      if (battleCanvasRef.current) {
        const ctx = battleCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 300, 200);
        updateIntro(dt);
        const { nextAnims, offsets } = updateBattleAnimations(activeAnimsRef.current, dt);
        activeAnimsRef.current = nextAnims;
        playerOffsetRef.current = offsets.player;
        enemyOffsetRef.current = offsets.enemy;
        drawIntro(ctx, 300, 200);
        drawBattleAnimations(ctx, activeAnimsRef.current, 300, 200);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const updateIntro = (dt) => {
    const intro = introRef.current;
    if (intro.state === INTRO_STATES.READY) return;
    intro.timer += dt;
    switch(intro.state) {
      case INTRO_STATES.FADE_IN:
        intro.fadeAlpha = Math.max(0, 1 - intro.timer / 400);
        if(intro.timer > 400) { intro.state = INTRO_STATES.TRAINER_ENTER; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_ENTER:
        // Slide trainer from left and enemy from right
        intro.trainerX = Math.min(300 * 0.22, -100 + (intro.timer / 800) * (300 * 0.22 + 100));
        intro.enemyOpacity = Math.min(1, intro.timer / 800);
        intro.enemyOffsetX = Math.max(0, 150 - (intro.timer / 800) * 150);
        intro.enemyScale = 1; // Ensure enemy is full size when sliding in
        if(intro.timer > 800) { intro.state = INTRO_STATES.TRAINER_THROW; intro.timer = 0; }
        break;
      case INTRO_STATES.TRAINER_THROW:
        // Animate frames 0 -> 4
        intro.trainerFrame = Math.min(4, Math.floor(intro.timer / 100));
        if(intro.timer > 500) { 
            intro.ballVisible = true; intro.ballX = intro.trainerX + 40; intro.ballY = 200 * 0.65; 
            intro.state = INTRO_STATES.BALL_FLY; intro.timer = 0; 
        }
        break;
      case INTRO_STATES.BALL_FLY:
        // Ball flies from trainer hand → player Pokemon spawn center (W*0.22=66, H*0.70=140)
        const t = Math.min(1, intro.timer / 600);
        const bStartX = intro.trainerX + 50;
        const bStartY = 200 * 0.52;
        intro.ballX = bStartX + (300 * 0.22 - bStartX) * t;
        intro.ballY = bStartY + (200 * 0.70 - bStartY) * t - Math.sin(t * Math.PI) * 55;
        intro.ballAngle += 0.28;
        // Slide trainer off screen faster as ball flies to avoid overlap
        intro.trainerX -= 4.5;
        if(intro.timer > 600) { 
          intro.ballVisible = false; 
          intro.state = INTRO_STATES.BALL_FLASH; 
          intro.timer = 0;
          // Initialize sparkles for the flash
          intro.sparkles = Array.from({length: 8}, (_, i) => ({
            angle: (i / 8) * Math.PI * 2,
            dist: 0,
            speed: 2 + Math.random() * 2
          }));
        }
        break;

      case INTRO_STATES.BALL_FLASH:
        // Flash is peak at start, then fades
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300);
        
        // Update sparkles expansion
        if (intro.sparkles) {
          intro.sparkles.forEach(s => s.dist += s.speed);
        }

        // Pokemon pops in after a small delay (Peak of flash)
        if (intro.timer > 50) {
          const tPop = intro.timer - 50;
          if (tPop < 200) {
            intro.playerScale = 0.1 + (tPop / 200) * 1.05; // overshoot to 1.15
            // Add a small camera shake when it "pops"
            intro.playerShake = Math.sin(intro.timer * 0.1) * 2;
          } else {
            intro.playerScale = Math.max(1, 1.15 - ((tPop - 200) / 100) * 0.15); // settle to 1.0
            intro.playerShake = 0;
          }
        } else {
          intro.playerScale = 0.1;
          intro.playerShake = 0;
        }

        if(intro.timer > 400) { intro.state = INTRO_STATES.POKEMON_APPEAR; intro.timer = 0; }
        break;
      case INTRO_STATES.POKEMON_APPEAR:
        if(intro.timer > 400) { 
          const name = enemyPkmn?.name.toUpperCase() || 'ENEMIGO';
          if (isWild) setMessage(`¡${name} SALVAJE APARECIÓ!`); 
          else setMessage(`¡EL LÍDER TE DESAFÍA CON ${name}!`);
          intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0; 
        }
        break;
      case INTRO_STATES.HUD_SLIDE:
        intro.enemyHudX = Math.min(8, -200 + (intro.timer/400) * 208); 
        intro.playerHudX = Math.max(300-192-8, 430 - (intro.timer / 400) * 330);
        if(intro.timer > 400) { intro.state = INTRO_STATES.READY; setMessage(''); setIntroReady(true); }
        break;
      default: break;
    }
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;
    
    // Background — fallback to GSC gray if image not loaded yet
    if (bgImgRef.current) {
      safeDrawImage(ctx, bgImgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#d8d0c0';
      ctx.fillRect(0, 0, W, H);
      // Draw platform lines like GSC
      ctx.fillStyle = '#b8a898';
      ctx.fillRect(0, H * 0.58, W, 3);
      ctx.fillRect(0, H * 0.82, W, 3);
    }

    // Shadows — aligned to sprite feet
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    // Player shadow: at feet of back sprite (W*0.22, sprite bottom at H*0.70+48=188, shadow at ~H*0.82)
    ctx.beginPath();
    ctx.ellipse(W * 0.22 + playerOffsetRef.current.x, H * 0.83, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Enemy shadow: at feet of front sprite (W*0.73, sprite bottom at H*0.38+48=124, shadow at ~H*0.57)
    ctx.beginPath();
    ctx.ellipse(W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0), H * 0.57, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trainer (player back sprite) — shown until READY
    if (intro.state !== INTRO_STATES.READY && trainerImgRef.current) {
      const img = trainerImgRef.current;
      const frameW = img.width / 5;
      const frame  = intro.trainerFrame || 0;
      // Position: left side, standing on bottom platform
      safeDrawImage(ctx, img, frame * frameW, 0, frameW, img.height,
        intro.trainerX, H * 0.38, 80, 108);
    }

    // Enemy Pokémon sprite — slides in from right, center at (W*0.73, H*0.38)
    // Sprite 96x96: y-range = H*0.38-48=28  to  H*0.38+48=124 ✔
    if (intro.enemyOpacity > 0 && enemyImgRef.current && enemyOffsetRef.current.visible) {
      ctx.save();
      ctx.globalAlpha = intro.enemyOpacity * (enemyOffsetRef.current.opacity ?? 1);
      const eScale = (enemyOffsetRef.current.scale ?? 1) * (intro.enemyScale || 1);
      ctx.translate(
        W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0),
        H * 0.38 + enemyOffsetRef.current.y
      );
      ctx.scale(eScale, eScale);
      safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Player Pokémon back sprite — appears after ball flash (READY state)
    // Center at (W*0.22, H*0.70): y-range = H*0.70-48=92  to  H*0.70+48=188 ✔ (canvas H=200)
    // Player Pokémon back sprite
    // Drawn from BALL_FLASH onward so the scale-in animation is visible after the flash
    const showPlayerSprite = [
      INTRO_STATES.BALL_FLASH,
      INTRO_STATES.POKEMON_APPEAR,
      INTRO_STATES.HUD_SLIDE,
      INTRO_STATES.READY
    ].includes(intro.state);
    if (showPlayerSprite && playerPkImgRef.current && playerOffsetRef.current.visible) {
      ctx.save();
      ctx.globalAlpha = playerOffsetRef.current.opacity ?? 1;
      const pScale = (playerOffsetRef.current.scale ?? 1) * (intro.playerScale || 1);
      ctx.translate(
        W * 0.22 + playerOffsetRef.current.x + (intro.playerShake || 0),
        H * 0.70 + playerOffsetRef.current.y
      );
      ctx.scale(pScale, pScale);
      safeDrawImage(ctx, playerPkImgRef.current, -48, -48, 96, 96);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Intro Pokéball (thrown by trainer)
    if (intro.ballVisible) {
      ctx.save();
      ctx.translate(intro.ballX, intro.ballY);
      ctx.rotate(intro.ballAngle);
      const r = 8; // bigger = more visible
      ctx.fillStyle = '#E8190C'; // red top
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; // white bottom
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // White flash overlay & Sparkles (ball opens)
    if (intro.flashAlpha > 0) {
      // 1. Draw expansion sparkles
      if (intro.sparkles) {
        ctx.fillStyle = '#fff';
        const centerX = W * 0.22;
        const centerY = H * 0.70;
        intro.sparkles.forEach(s => {
          const x = centerX + Math.cos(s.angle) * s.dist;
          const y = centerY + Math.sin(s.angle) * s.dist;
          ctx.beginPath();
          ctx.arc(x, y, 3 * intro.flashAlpha, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      // 2. Draw full screen flash
      ctx.fillStyle = `rgba(255,255,255,${intro.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Initial black fade-in
    if (intro.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
  };

  // Turn Resolution Logic
  const resolveTurn = async (pMoveKey) => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    setPhase(BATTLE_PHASES.RESOLVING);

    const pMove = MOVE_DATA[pMoveKey];
    const eMoves = POKEMON_MOVES[enemyPkmn.id] || ['TACKLE'];
    const eMoveKey = eMoves[Math.floor(Math.random() * eMoves.length)];
    const eMove = MOVE_DATA[eMoveKey];

    const order = determineTurnOrder(pMove, playerPkmn, eMove, enemyPkmn);
    const sequence = order.map(side => ({
      side,
      move: side === 'player' ? pMove : eMove,
      attacker: side === 'player' ? playerPkmn : enemyPkmn,
      defender: side === 'player' ? enemyPkmn : playerPkmn
    }));

    for (const step of sequence) {
      if (playerPkmn.hp <= 0 || enemyPkmn.hp <= 0) break;

      setMessage(`¡${step.attacker.name.toUpperCase()} USÓ ${step.move.nombre}!`);
      activeAnimsRef.current = getMoveAnimation(step.move.id, step.side === 'player', 300, 200);
      
      await new Promise(r => setTimeout(r, 800));

      const result = processMove(step.attacker, step.defender, step.move);
      
      if (result.missed) {
        setMessage("¡Pero falló!");
      } else {
        if (result.damageDealt > 0) {
          isFlashingRef.current = true; setTimeout(() => isFlashingRef.current = false, 100);
          
          const isPlayerDefending = step.side === 'enemy';
          if (isPlayerDefending) {
            setPlayerPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
          } else {
            setEnemyPkmn(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
          }

          activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, { 
            text: `-${result.damageDealt}`, 
            x: isPlayerDefending ? 300 * 0.25 : 300 * 0.75, 
            y: isPlayerDefending ? 200 * 0.7 - 20 : 200 * 0.35 - 20, 
            color: '#f00', duration: 800 
          }));

          if (result.isCritical) setMessage("¡Un golpe crítico!");
          if (result.effectiveness > 1) setMessage("¡Es súper efectivo!");
          if (result.effectiveness < 1 && result.effectiveness > 0) setMessage("No es muy efectivo...");
        }

        if (result.effects?.message) {
          await new Promise(r => setTimeout(r, 1000));
          setMessage(result.effects.message);
        }
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    // End turn effects
    if (playerPkmn.hp > 0 && enemyPkmn.hp > 0) {
      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    } else {
      endBattle(enemyPkmn.hp <= 0);
    }
  };

  const handleHabitAttack = async (h) => {
    if (phase !== BATTLE_PHASES.SELECT || localCompleted[h.habito_id || h.id]) return;
    setPhase(BATTLE_PHASES.RESOLVING);
    const hId = h.habito_id || h.id;
    setLocalCompleted(prev => ({...prev, [hId]: true}));
    
    // Pokemon-style message
    setMessage(`¡${playerPkmn.name.toUpperCase()} usó ${h.nombre.toUpperCase()}!`);
    
    // More dynamic habit animation
    activeAnimsRef.current = [
      createAnimation(ANIM_TYPES.BOUNCE, { target: 'player', duration: 300, amount: 20 }),
      createAnimation(ANIM_TYPES.STRIKE, { x: 300 * 0.75, y: 200 * 0.35, duration: 600, color: '#00ff00' }),
      createAnimation(ANIM_TYPES.SHAKE, { target: 'enemy', duration: 400, amount: 15 }),
      createAnimation(ANIM_TYPES.FLASH_SPRITE, { target: 'enemy', duration: 400 })
    ];
    
    // Add extra particles for impact
    for(let i=0; i<12; i++) {
        activeAnimsRef.current.push(createAnimation(ANIM_TYPES.PARTICLE, {
            x: 300 * 0.75, y: 200 * 0.35,
            vx: (Math.random()-0.5)*150, vy: (Math.random()-0.5)*150,
            duration: 600, color: '#00ff00', size: 4
        }));
    }

    try {
      const res = await completarHabito(gymId, hId);
      if (res?.subio_nivel) {
         setTimeout(() => setMessage("¡SUBISTE DE NIVEL!"), 1500);
      }
    } catch (e) { console.error(e); }

    setTimeout(() => {
      isFlashingRef.current = true; setTimeout(() => isFlashingRef.current = false, 150);
      
      const initialHabitsCount = habitsForStage.length || 1;
      const damageTaken = Math.ceil(enemyPkmn.maxHp / initialHabitsCount);
      
      setEnemyPkmn(prev => {
        const nextHp = Math.max(0, prev.hp - damageTaken);
        
        // Count how many habits are actually done (local + already done)
        const totalDone = Object.keys(localCompleted).length + 1; // +1 because the current one is still in localCompleted logic
        
        if (nextHp <= 0 || totalDone >= initialHabitsCount) {
            const finalHp = 0;
            setTimeout(() => {
                setMessage(`¡${enemyPkmn.name.toUpperCase()} enemigo se debilitó!`);
                setTimeout(() => endBattle(true), 1500);
            }, 1000);
            return { ...prev, hp: 0 };
        } else {
            setTimeout(() => { 
                setPhase(BATTLE_PHASES.SELECT); 
                setMessage(''); 
            }, 1000);
            return { ...prev, hp: nextHp };
        }
      });

      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, { text: `-${damageTaken}`, x: 300 * 0.75, y: 200 * 0.35 - 20, color: '#f00', duration: 800 }));
    }, 600);
  };

  const endBattle = async (win) => {
    setPhase(BATTLE_PHASES.FINISHED);
    
    if (!win) {
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'player', duration: 1000 }));
      await new Promise(r => setTimeout(r, 1200));
      setMessage(`¡${playerPkmn.name.toUpperCase()} se debilitó!`);
      await new Promise(r => setTimeout(r, 1500));
      setMessage('Te apresuras al Centro Pokémon...');
      setTimeout(() => navigate('city'), 2000);

    } else if (isWild) {
      setMessage(`¡${enemyPkmn.name.toUpperCase()} se debilitó!`);
      await new Promise(r => setTimeout(r, 1000));
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.CAPTURE, {
        target: 'enemy', targetX: 300 * 0.73, targetY: 200 * 0.38, duration: 2500
      }));
      await new Promise(r => setTimeout(r, 2700));
      setMessage(`¡${enemyPkmn.name.toUpperCase()} fue capturado!`);
      const reward = await ganarBatalla().catch(() => ({}));
      setVictoryData({
        type: 'wild',
        enemyName: enemyPkmn.name,
        xpGained:  reward?.xp_gained  ?? reward?.xp  ?? 20,
        newXp:     reward?.new_xp     ?? 0,
        newLevel:  reward?.new_level  ?? playerPkmn.level,
        levelUp:   reward?.level_up   ?? (reward?.new_level > playerPkmn.level),
        monedas:   reward?.monedas    ?? 0,
      });

    } else {
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'enemy', duration: 1000 }));
      await new Promise(r => setTimeout(r, 1200));
      setMessage(`¡${enemyPkmn.name.toUpperCase()} fue derrotado!`);
      await new Promise(r => setTimeout(r, 1000));

      // Check if there are more pokemon in the team
      if (teamIndex + 1 < enemyTeam.length) {
        const nextIdx = teamIndex + 1;
        const nextPkmn = enemyTeam[nextIdx];
        setTeamIndex(nextIdx);
        setEnemyPkmn(nextPkmn);
        
        // Load next sprite
        const nextId = String(nextPkmn.id).padStart(3, '0');
        const nextImg = new Image();
        nextImg.src = getAssetPath(`Graphics/battlers/${nextId}.png`);
        nextImg.onload = () => { enemyImgRef.current = nextImg; };
        
        // Reset intro state for the next pokemon to slide in
        introRef.current.state = INTRO_STATES.HUD_SLIDE;
        introRef.current.timer = 0;
        introRef.current.enemyOffsetX = 150;
        introRef.current.enemyOpacity = 0;
        setIntroReady(false);
        setMessage(`¡EL LÍDER ENVÍA A ${nextPkmn.name.toUpperCase()}!`);
        
        setTimeout(() => {
            setPhase(BATTLE_PHASES.SELECT);
        }, 2000);
        return;
      }

      const gymReward = await completarGimnasio(gymId, starter.starter_id, starter.starter_nombre).catch(() => ({}));
      const reward    = await ganarBatalla().catch(() => ({}));
      setVictoryData({
        type: 'gym',
        enemyName: enemyPkmn.name,
        gymName:   battleData?.gymName || 'GIMNASIO',
        xpGained:  reward?.xp_gained  ?? reward?.xp  ?? 40,
        newXp:     reward?.new_xp     ?? 0,
        newLevel:  reward?.new_level  ?? playerPkmn.level,
        levelUp:   reward?.level_up   ?? (reward?.new_level > playerPkmn.level),
        monedas:   reward?.monedas    ?? (gymReward?.monedas ?? 0),
        medallaUrl: gymReward?.medalla_imagen ?? null,
      });
    }
  };

  if (!playerPkmn || !enemyPkmn) return null;

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222', overflow: 'hidden', fontFamily:'"Press Start 2P"' }}>
      <div style={{ width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        
        <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
          <canvas ref={battleCanvasRef} width={300} height={200} style={{width:'100%',height:'100%', imageRendering:'pixelated'}} />
          
          {introReady && (
            <>
              <div style={{ position: 'absolute', top: '8px', left: '0px' }}>
                <HPBar current={enemyPkmn.hp} max={enemyPkmn.maxHp} name={enemyPkmn.name} level={enemyPkmn.level} alignment="enemy" />
              </div>
              <div style={{ position: 'absolute', bottom: '8px', right: '0px' }}>
                <HPBar current={playerPkmn.hp} max={playerPkmn.maxHp} name={playerPkmn.name} level={playerPkmn.level} exp={starter.starter_exp} alignment="player" />
              </div>
            </>
          )}

        </div>

        <div style={{
          flex: '0 0 42%',
          background: '#f0f0f0',
          borderTop: '4px solid #333',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>

          {/* Message bar */}
          <div style={{
            background: '#f8f8f0',
            borderBottom: '3px solid #444',
            padding: '10px 16px',
            minHeight: '52px',
            display: 'flex',
            alignItems: 'center',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 9,
            color: '#222',
            lineHeight: '1.5em',
            wordBreak: 'break-word'
          }}>
            {message || (isWild ? '¿QUÉ DEBE HACER?' : '¡COMPLETA TUS HÁBITOS!')}
          </div>

          {/* Action area */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {isWild ? (
              menuView === 'main' ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  height: '100%',
                  gap: 2,
                  padding: 6,
                  boxSizing: 'border-box'
                }}>
                  {[['LUCHAR',  () => setMenuView('moves')],
                    ['MOCHILA', () => setMessage('¡No tienes objetos!')],
                    ['PKMN',    () => setMessage('¡Sólo tienes un PKMN!')],
                    ['HUIR',    () => navigate('city')]
                  ].map(([label, fn]) => (
                    <button key={label}
                      disabled={phase !== BATTLE_PHASES.SELECT}
                      className="battle-btn"
                      onClick={fn}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  height: '100%',
                  gap: 2,
                  padding: 6,
                  boxSizing: 'border-box',
                  gridTemplateRows: 'repeat(auto-fill, minmax(0, 1fr))'
                }}>
                  {(POKEMON_MOVES[playerPkmn.id] || ['TACKLE']).map(mKey => (
                    <button key={mKey}
                      disabled={phase !== BATTLE_PHASES.SELECT}
                      className="battle-btn battle-btn--move"
                      onClick={() => resolveTurn(mKey)}>
                      {MOVE_DATA[mKey]?.nombre || mKey}
                    </button>
                  ))}
                  <button
                    className="battle-btn"
                    style={{ gridColumn: 'span 2' }}
                    onClick={() => setMenuView('main')}>
                    ← VOLVER
                  </button>
                </div>
              )
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                padding: 8,
                height: '100%',
                boxSizing: 'border-box'
              }}>
                {habitsForStage.map(h => {
                  const done = h.completado || localCompleted[h.habito_id || h.id];
                  return (
                    <button key={h.id}
                      disabled={done || phase !== BATTLE_PHASES.SELECT}
                      className="battle-btn-gym"
                      onClick={() => handleHabitAttack(h)}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{h.icono || '⚔️'}</span>
                      <span style={{ fontSize: 7, lineHeight: '1.2em', wordBreak: 'break-all' }}>
                        {(h.nombre || '').toUpperCase().substring(0, 12)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <style>{`
          .battle-btn {
            background: #e8e8d8;
            border: 2px solid #666;
            border-radius: 3px;
            font-family: "Press Start 2P", monospace;
            font-size: 8px;
            color: #222;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 4px 2px;
            line-height: 1.3em;
            overflow: hidden;
          }
          .battle-btn:hover:not(:disabled) { background: #d0d0c0; }
          .battle-btn:disabled { opacity: 0.35; cursor: default; }
          .battle-btn--move {
            font-size: 7px;
            flex-direction: column;
            gap: 2px;
          }
          .battle-btn-gym {
            background: #fff;
            border: 2px solid #555;
            border-radius: 6px;
            font-family: "Press Start 2P", monospace;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 4px;
            overflow: hidden;
          }
          .battle-btn-gym:disabled { opacity: 0.4; cursor: default; background: #ddd; }
          .battle-btn-gym:hover:not(:disabled) { background: #eef; }
        `}</style>

        {/* ── Victory Summary Overlay ─────────────────────────────── */}
        {victoryData && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
            fontFamily: '"Press Start 2P", monospace',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Main Banner */}
            <div className="victory-banner animate-fade-in-up" style={{ color: 'var(--retro-yellow)' }}>
              {victoryData.type === 'gym' ? '¡VICTORIA!' : '¡CAPTURADO!'}
            </div>

            <div className="premium-card animate-fade-in-up" style={{
              width: '88%',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              background: '#f8f8f0',
              border: '4px solid #333'
            }}>

              {/* Header Info */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 7, color: '#888', marginBottom: 8 }}>RESUMEN DEL COMBATE</div>
                <div style={{ fontSize: 10, color: '#333', borderBottom: '2px solid #ddd', paddingBottom: '8px' }}>
                  {victoryData.enemyName?.toUpperCase()}
                </div>
              </div>

              {/* Rewards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* XP Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 8, color: '#555' }}>EXPERIENCIA</span>
                  <span style={{ fontSize: 9, color: 'var(--retro-blue)' }}>+{displayXp} EXP</span>
                </div>
                
                {/* XP Progress Bar (Visual) */}
                <div style={{ height: '8px', background: '#ddd', border: '2px solid #333', padding: '1px' }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'var(--retro-blue)', 
                    width: `${Math.min(100, (displayXp / (victoryData.xpGained || 1)) * 100)}%`,
                    transition: 'width 0.1s'
                  }} />
                </div>

                {/* Level up banner */}
                {victoryData.levelUp && (
                  <div style={{
                    background: 'var(--retro-yellow)', 
                    color: '#333',
                    border: '3px solid #333',
                    padding: '10px',
                    textAlign: 'center', 
                    fontSize: 8,
                    animation: 'pulse 0.6s ease infinite alternate',
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
                  }}>
                    ⬆ ¡NIVEL {victoryData.newLevel} ALCANZADO!
                  </div>
                )}

                {/* Coins row */}
                {victoryData.monedas > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '2px dashed #ddd'
                  }}>
                    <span style={{ fontSize: 8, color: '#555' }}>MONEDAS</span>
                    <span style={{ fontSize: 9, color: 'var(--retro-gold)' }}>$ {displayMonedas}</span>
                  </div>
                )}
              </div>

              {/* Continue button */}
              <button
                onClick={() => navigate('city')}
                className="gb-button primary"
                style={{
                  width: '100%', 
                  padding: '14px',
                  marginTop: '10px',
                  fontSize: 10,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                CONTINUAR
                {showContinueHint && (
                  <span className="blinker" style={{ fontSize: 12 }}>▶</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleScreen;
