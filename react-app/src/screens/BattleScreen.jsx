import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import HPBar from '../components/HPBar';
import { getAssetPath } from '../api/assets';
import { safeDrawImage, drawTintedImage } from '../utils/gfxUtils';
import { MOVE_DATA, POKEMON_MOVES } from '../data/moveData';
import { createBattlePokemon, getPokemonByGym } from '../data/pokemonData';
import { GYM_CONFIGS } from '../data/gymData';
import { getEvolution } from '../data/evolutionData';
import { POKEMON_SPECIES } from '../data/pokemonData';
import { determineTurnOrder, processMove, processEndTurnEffects } from '../utils/battleEngine';
import {
  ANIM_TYPES,
  updateBattleAnimations,
  drawBattleAnimations,
  getMoveAnimation,
  createAnimation,
  getStatusTint,
  getSleepZzzText
} from '../utils/battleAnimations';
import { sfx, initAudio } from '../utils/audioEngine';

// New Modular Components
import BattleHUD from '../components/battle/BattleHUD';
import BattleActionMenu from '../components/battle/BattleActionMenu';
import VictoryOverlay from '../components/battle/VictoryOverlay';

const INTRO_STATES = {
  ENCOUNTER_FLASH: 'encounterFlash', // 3 white flashes before battle (wild only, GSC style)
  FADE_IN:        'fadeIn',
  VS_SCREEN:      'vsScreen',        // trainer portrait VS screen (trainer battles only)
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
  const { user, usarObjeto, capturarPokemon, habitosHoy, completarHabito, starter, ganarBatalla, completarGimnasio } = useGame();
  
  const isWild = battleData?.tipo === 'wild' || battleData?.isWild || battleData?.type === 'encounter';
  const gymId = battleData?.gymId;

  const [phase, setPhase] = useState(BATTLE_PHASES.SELECT);
  const [menuView, setMenuView] = useState('main');
  const [pendingEvolution, setPendingEvolution] = useState(null);
  const [message, setMessage] = useState('');
  const [introReady, setIntroReady] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  // Clima global de batalla (Crystal: 5 turnos por defecto)
  const [weather, setWeather] = useState({ type: 'none', turns: 0 });
  
  const [playerPkmn, setPlayerPkmn] = useState(null);
  const [enemyPkmn, setEnemyPkmn] = useState(null);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [teamIndex, setTeamIndex] = useState(0);
  const [localCompleted, setLocalCompleted] = useState({});

  // Memoize habits to prevent flickering or recalculation errors
  const habitsForStage = useMemo(() => {
    if (!habitosHoy) return [];
    const normalizedGymId = String(gymId || '').toLowerCase();
    return habitosHoy.filter(h => {
      const isOfGym = gymId ? String(h.gym_id || '').toLowerCase() === normalizedGymId : true;
      const isActive = h.activo !== false && h.activo !== 0 && h.activo !== '0';
      return isOfGym && isActive;
    });
  }, [habitosHoy, gymId]);

  const activeAnimsRef = useRef([]);
  const playerOffsetRef = useRef({ x: 0, y: 0, visible: true, opacity: 1, scale: 1, tintColor: null, tintAlpha: 0 });
  const enemyOffsetRef = useRef({ x: 0, y: 0, visible: true, opacity: 1, scale: 1, tintColor: null, tintAlpha: 0 });
  const screenOffsetRef = useRef({ x: 0, y: 0 });
  const isFlashingRef = useRef(false);
  const statusPulseRef = useRef(0); // ms accumulator for status-effect animations

  const [displayXp, setDisplayXp] = useState(0);
  const [displayMonedas, setDisplayMonedas] = useState(0);
  const [showContinueHint, setShowContinueHint] = useState(false);

  // Typewriter system
  const [displayedMsg, setDisplayedMsg] = useState('');
  const [isMsgTyping, setIsMsgTyping] = useState(false);
  const [waitingForA, setWaitingForA] = useState(false);
  const advanceResolveRef = useRef(null);
  const typewriterTimerRef = useRef(null);
  const isMsgTypingRef = useRef(false);
  const waitingForARef = useRef(false);
  const currentMsgRef = useRef('');
  const enemyPkmnRef = useRef(null);

  const battleCanvasRef = useRef(null);
  const trainerImgRef = useRef(null);
  const enemyImgRef = useRef(null);
  const bgImgRef = useRef(null);
  const playerPkImgRef = useRef(null);
  const enemyTrainerImgRef = useRef(null);

  const introRef = useRef({
    state: isWild ? INTRO_STATES.ENCOUNTER_FLASH : INTRO_STATES.FADE_IN,
    timer: 0, fadeAlpha: 1, trainerX: -80, ballVisible: false, ballX: 0, ballY: 0,
    ballAngle: 0, enemyOpacity: 0, enemyScale: 1, enemyOffsetX: 0, flashAlpha: 0,
    enemyHudX: -200, playerHudX: 430, playerScale: 0.1, encounterFlashAlpha: 0,
    vsPlayerX: -120, vsEnemyX: 420, vsLogoScale: 0, vsFlashAlpha: 0, silhouetteAlpha: 0
  });

  const initializedRef = useRef(false);

  // Sync enemyPkmnRef so async callbacks always read the latest hp
  useEffect(() => { enemyPkmnRef.current = enemyPkmn; }, [enemyPkmn]);

  // Typewriter: whenever `message` changes, start the animation
  useEffect(() => {
    if (typewriterTimerRef.current) { clearTimeout(typewriterTimerRef.current); typewriterTimerRef.current = null; }
    if (!message) {
      setDisplayedMsg('');
      isMsgTypingRef.current = false;
      waitingForARef.current = false;
      setIsMsgTyping(false);
      setWaitingForA(false);
      return;
    }
    currentMsgRef.current = message;
    isMsgTypingRef.current = true;
    waitingForARef.current = false;
    setDisplayedMsg('');
    setIsMsgTyping(true);
    setWaitingForA(false);
    let i = 0;
    const tick = () => {
      i++;
      setDisplayedMsg(message.slice(0, i));
      if (i % 2 === 0) sfx.dialog(); // bleep every other character
      if (i < message.length) {
        typewriterTimerRef.current = setTimeout(tick, 28);
      } else {
        typewriterTimerRef.current = null;
        isMsgTypingRef.current = false;
        waitingForARef.current = true;
        setIsMsgTyping(false);
        setWaitingForA(true);
      }
    };
    typewriterTimerRef.current = setTimeout(tick, 28);
    return () => { if (typewriterTimerRef.current) clearTimeout(typewriterTimerRef.current); };
  }, [message]);

  // aPressed advances the message (skip typing or resolve)
  useEffect(() => {
    if (!aPressed) return;
    if (isMsgTypingRef.current) {
      if (typewriterTimerRef.current) { clearTimeout(typewriterTimerRef.current); typewriterTimerRef.current = null; }
      setDisplayedMsg(currentMsgRef.current);
      isMsgTypingRef.current = false;
      waitingForARef.current = true;
      setIsMsgTyping(false);
      setWaitingForA(true);
    } else if (waitingForARef.current && advanceResolveRef.current) {
      const resolve = advanceResolveRef.current;
      advanceResolveRef.current = null;
      waitingForARef.current = false;
      setWaitingForA(false);
      resolve();
    }
  }, [aPressed]);

  // showMessage: typewriter + wait for A press before resolving
  const showMessage = (text) => new Promise((resolve) => {
    advanceResolveRef.current = resolve;
    setMessage(text);
  });

  // handleAdvance: called on tap of the message box
  const handleAdvance = () => {
    if (isMsgTypingRef.current) {
      if (typewriterTimerRef.current) { clearTimeout(typewriterTimerRef.current); typewriterTimerRef.current = null; }
      setDisplayedMsg(currentMsgRef.current);
      isMsgTypingRef.current = false;
      waitingForARef.current = true;
      setIsMsgTyping(false);
      setWaitingForA(true);
    } else if (waitingForARef.current && advanceResolveRef.current) {
      const resolve = advanceResolveRef.current;
      advanceResolveRef.current = null;
      waitingForARef.current = false;
      setWaitingForA(false);
      resolve();
    }
  };

  // Unlock Web Audio on first interaction and play encounter sound
  useEffect(() => {
    initAudio();
    if (isWild) setTimeout(() => sfx.encounter(), 120);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const bg = new Image(); bg.src = getAssetPath('Graphics/battlebacks/general_bg.png'); bg.onload = () => { bgImgRef.current = bg; };
      // Map avatar id (0-3) to available trainer back sprites.
      // trback000 = avatar 0; trback001 = avatar 1; trback044 = avatars 2/3 (alt look)
      const avatarId = Number(user?.avatar || 0);
      const trbackId = avatarId === 0 ? '000' : avatarId === 1 ? '001' : '044';
      const tr = new Image(); tr.src = getAssetPath(`Graphics/trainers/trback${trbackId}.png`); tr.onload = () => { trainerImgRef.current = tr; };
      
      const pInst = createBattlePokemon(starter.starter_id, starter.starter_nivel);
      let eTeam = [];
      if (isWild) {
        eTeam = [createBattlePokemon(battleData?.pokemon?.id || 16, battleData?.pokemon?.nivel || 5)];
      } else {
        const gymPokes = getPokemonByGym(gymId);
        eTeam = Array.isArray(gymPokes) ? gymPokes : [gymPokes];
      }

      pInst.moves = POKEMON_MOVES[Number(pInst.id)] || ['TACKLE'];
      
      // Ensure we set full state
      setPlayerPkmn({ ...pInst });
      setEnemyPkmn({ ...eTeam[0] });
      setEnemyTeam([...eTeam]);
      setTeamIndex(0);

      const enemyFormattedId = String(eTeam[0].id).padStart(3, '0');
      const en = new Image(); en.src = getAssetPath(`Graphics/battlers/${enemyFormattedId}.png`); en.onload = () => { enemyImgRef.current = en; };

      const pPk = new Image(); const starterId = String(pInst.id || 16).padStart(3, '0');
      pPk.src = getAssetPath(`Graphics/battlers/${starterId}b.png`); pPk.onload = () => { playerPkImgRef.current = pPk; };

      // Load enemy trainer sprite for VS screen (gym battles only)
      if (!isWild && gymId) {
        const gymCfg = Object.values(GYM_CONFIGS).find(cfg => cfg.id === gymId) ||
                       GYM_CONFIGS[gymId];

        // Preferimos el battle_sprite (un single-frame de batalla) — los hay
        // en Graphics/trainers/trainerNNN.png. Si no existe o falla la carga,
        // fallback al char overworld (4×4 grid en Graphics/characters/).
        if (gymCfg?.battle_sprite) {
          const bs = new Image();
          bs.onload = () => {
            enemyTrainerImgRef.current = bs;
            enemyTrainerImgRef.isBattleSprite = true;
          };
          bs.onerror = () => {
            // Cae al overworld si el battle sprite no carga.
            if (gymCfg?.sprite) {
              const et = new Image();
              et.src = getAssetPath(`Graphics/characters/${gymCfg.sprite}.png`);
              et.onload = () => {
                enemyTrainerImgRef.current = et;
                enemyTrainerImgRef.isBattleSprite = false;
              };
            }
          };
          bs.src = getAssetPath(`Graphics/trainers/${gymCfg.battle_sprite}.png`);
        } else if (gymCfg?.sprite) {
          const et = new Image();
          et.src = getAssetPath(`Graphics/characters/${gymCfg.sprite}.png`);
          et.onload = () => {
            enemyTrainerImgRef.current = et;
            enemyTrainerImgRef.isBattleSprite = false;
          };
        }
      }
    } catch (err) {
      console.error("Battle Init Error:", err);
    }
  }, []);

  useEffect(() => {
    if (!victoryData) return;
    let xp = 0, coins = 0;
    const targetXp = victoryData.xpGained, targetCoins = victoryData.monedas;
    const interval = setInterval(() => {
      let changed = false;
      if (xp < targetXp) { xp = Math.min(targetXp, xp + Math.ceil(targetXp / 20)); setDisplayXp(xp); changed = true; }
      if (coins < targetCoins) { coins = Math.min(targetCoins, coins + Math.ceil(targetCoins / 15)); setDisplayMonedas(coins); changed = true; }
      if (!changed) { clearInterval(interval); setTimeout(() => setShowContinueHint(true), 500); }
    }, 40);
    return () => clearInterval(interval);
  }, [victoryData]);

  useEffect(() => {
    let lastTime = performance.now(), frameId;
    const loop = (now) => {
      const dt = now - lastTime; lastTime = now;
      if (battleCanvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = battleCanvasRef.current;
        if (canvas.width !== 300 * dpr) {
          canvas.width = 300 * dpr;
          canvas.height = 200 * dpr;
        }
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, 300, 200);
        updateIntro(dt);
        const { nextAnims, offsets } = updateBattleAnimations(activeAnimsRef.current, dt);
        activeAnimsRef.current = nextAnims;
        if (nextAnims.length === 0 && introRef.current.state === INTRO_STATES.READY) {
          const breathe = Math.sin(now / 600) * 1.5;
          offsets.player.y = breathe;
          offsets.enemy.y = breathe * 0.8;
        }
        playerOffsetRef.current = offsets.player;
        enemyOffsetRef.current = offsets.enemy;
        screenOffsetRef.current = offsets.screen || { x: 0, y: 0 };
        statusPulseRef.current += dt;
        
        ctx.save();
        ctx.translate(screenOffsetRef.current.x, screenOffsetRef.current.y);
        drawIntro(ctx, 300, 200);
        drawBattleAnimations(ctx, activeAnimsRef.current, 300, 200);
        ctx.restore();
        ctx.restore();
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
      case INTRO_STATES.ENCOUNTER_FLASH: {
        // GSC-style 3 white flashes before wild battle (120ms on / 120ms off)
        const cycle = 240;
        const flashIdx = Math.floor(intro.timer / cycle);
        const withinCycle = intro.timer % cycle;
        if (withinCycle < 120 && flashIdx < 3) {
          if (!intro[`flash${flashIdx}Played`]) {
            sfx.cursor();
            intro[`flash${flashIdx}Played`] = true;
          }
        }
        intro.encounterFlashAlpha = (flashIdx < 3 && withinCycle < 120) ? 1 : 0;
        if (intro.timer > 720) {
          intro.encounterFlashAlpha = 0;
          intro.state = INTRO_STATES.FADE_IN;
          intro.timer = 0;
        }
        break;
      }
      case INTRO_STATES.FADE_IN:
        intro.fadeAlpha = Math.max(0, 1 - intro.timer / 400);
        if(intro.timer > 400) {
          intro.fadeAlpha = 0;
          if (!isWild) {
            intro.state = INTRO_STATES.VS_SCREEN;
            intro.vsPlayerX = -120; intro.vsEnemyX = 420;
            intro.vsLogoScale = 0; intro.vsFlashAlpha = 0;
            sfx.encounter();
          } else {
            intro.state = INTRO_STATES.TRAINER_ENTER;
          }
          intro.timer = 0;
        }
        break;
      case INTRO_STATES.VS_SCREEN: {
        // Canvas is 300×200 — use fixed dims
        const BW = 300;
        // 0-400ms: trainers slide in from both sides
        // 400-700ms: VS logo pops in
        // 700-1100ms: hold
        // 1100-1300ms: flash white → end
        if (intro.timer < 400) {
          const tSlide = Math.min(1, intro.timer / 400);
          const ease = 1 - Math.pow(1 - tSlide, 3);
          intro.vsPlayerX = -120 + ease * (BW * 0.18 + 120);
          intro.vsEnemyX = BW + 120 - ease * (BW * 0.38 + 120);
          intro.vsLogoScale = 0;
        } else if (intro.timer < 700) {
          const tLogo = Math.min(1, (intro.timer - 400) / 200);
          intro.vsLogoScale = tLogo < 0.5 ? 2 * tLogo * tLogo : 1 - Math.pow(-2 * tLogo + 2, 2) / 2;
          intro.vsLogoScale = Math.min(1.15, intro.vsLogoScale * 1.15);
        } else if (intro.timer > 1100) {
          intro.vsFlashAlpha = Math.min(1, (intro.timer - 1100) / 200);
        }
        if (intro.timer > 1300) {
          intro.vsFlashAlpha = 0;
          intro.state = INTRO_STATES.TRAINER_ENTER;
          intro.timer = 0;
        }
        break;
      }
      case INTRO_STATES.TRAINER_ENTER: {
        const t = Math.min(1, intro.timer / 800);
        const easeCubic = 1 - Math.pow(1 - t, 3); // decelerating cubic ease-out
        const easeBack = 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2); // elastic overshoot
        
        intro.trainerX = -100 + easeCubic * (300 * 0.22 + 100);
        intro.enemyOpacity = Math.min(1, t);
        intro.enemyOffsetX = 150 - easeCubic * 150;
        if(intro.timer > 800) { intro.state = INTRO_STATES.TRAINER_THROW; intro.timer = 0; }
        break;
      }
      case INTRO_STATES.TRAINER_THROW:
        intro.trainerFrame = Math.min(4, Math.floor(intro.timer / 100));
        if (intro.timer > 0 && !intro.throwMsgShown) {
          intro.throwMsgShown = true;
          const pkName = playerPkmn?.name?.toUpperCase() || 'POKÉMON';
          setMessage(`¡Vamos, ${pkName}!`);
        }
        if (intro.timer > 500) {
          intro.ballVisible = true;
          // Capturar posición inicial de la pokéball UNA SOLA VEZ al iniciar el
          // arco, no cada frame. Si se recalculaba en BALL_FLY usando un
          // trainerX que también se movía, la bola "se pegaba" al entrenador.
          intro.ballStartX = intro.trainerX + 40;
          intro.ballStartY = 200 * 0.52;
          intro.ballX = intro.ballStartX;
          intro.ballY = intro.ballStartY;
          intro.state = INTRO_STATES.BALL_FLY;
          intro.timer = 0;
        }
        break;
      case INTRO_STATES.BALL_FLY: {
        const t = Math.min(1, intro.timer / 600);
        const bStartX = intro.ballStartX;
        const bStartY = intro.ballStartY;
        const bEndX = 300 * 0.22;
        const bEndY = 200 * 0.70;
        intro.ballX = bStartX + (bEndX - bStartX) * t;
        intro.ballY = bStartY + (bEndY - bStartY) * t - Math.sin(t * Math.PI) * 55;
        intro.ballAngle += 0.28;
        // Entrenador sale rápido por la izquierda (en Crystal se va antes de
        // que la bola aterrice).
        intro.trainerX -= 7;
        if (intro.timer > 600) {
          intro.ballVisible = false;
          intro.state = INTRO_STATES.BALL_FLASH;
          intro.timer = 0;
          // Fuerza el entrenador fuera de pantalla para que no se solape con
          // el flash ni con el sprite del Pokémon emergiendo.
          intro.trainerOffScreen = true;
          // Decelerating sparkle particle spread
          intro.sparkles = Array.from({length: 10}, (_, i) => ({
            angle: (i / 10) * Math.PI * 2,
            dist: 0,
            speed: 5 + Math.random() * 4
          }));
        }
        break;
      }
      case INTRO_STATES.BALL_FLASH:
        intro.flashAlpha = Math.max(0, 1 - intro.timer / 300);
        if (intro.sparkles) {
          intro.sparkles.forEach(s => {
            s.speed *= 0.94; // apply friction drag to particles
            s.dist += s.speed;
          });
        }
        if (intro.timer > 50) {
          const tPop = intro.timer - 50;
          if (tPop < 200) { intro.playerScale = 0.1 + (tPop / 200) * 1.05; intro.playerShake = Math.sin(intro.timer * 0.1) * 2; }
          else { intro.playerScale = Math.max(1, 1.15 - ((tPop - 200) / 100) * 0.15); intro.playerShake = 0; }
        }
        // Silhouette: Pokémon emerges as black shape first
        intro.silhouetteAlpha = 1;
        if(intro.timer > 400) { intro.state = INTRO_STATES.POKEMON_APPEAR; intro.timer = 0; }
        break;
      case INTRO_STATES.POKEMON_APPEAR: {
        // Silhouette dissolves to full color during first 350ms
        intro.silhouetteAlpha = Math.max(0, 1 - intro.timer / 350);
        if(intro.timer > 500) {
          intro.silhouetteAlpha = 0;
          setMessage('');
          const name = enemyPkmn?.name.toUpperCase() || 'ENEMIGO';
          setMessage(isWild ? `¡${name} SALVAJE APARECIÓ!` : `¡EL LÍDER TE DESAFÍA CON ${name}!`);
          intro.state = INTRO_STATES.HUD_SLIDE; intro.timer = 0;
        }
        break;
      }
      case INTRO_STATES.HUD_SLIDE: {
        const t = Math.min(1, intro.timer / 400);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        intro.enemyHudX = -200 + ease * 208;
        intro.playerHudX = 430 - ease * 330;
        if(intro.timer > 400) { intro.state = INTRO_STATES.READY; setMessage(''); setIntroReady(true); }
        break;
      }
      default: break;
    }
  };

  const drawIntro = (ctx, W, H) => {
    const intro = introRef.current;

    // VS Screen — full override drawing for trainer battles intro
    if (intro.state === INTRO_STATES.VS_SCREEN) {
      // Split diagonal background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
      // Left half (player side — warm dark red)
      ctx.fillStyle = '#3a1a1a';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.55, 0); ctx.lineTo(W * 0.45, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // Right half (enemy side — dark blue)
      ctx.fillStyle = '#1a1a3a';
      ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W * 0.55, 0); ctx.lineTo(W * 0.45, H); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();

      // Player trainer (left side) — uses back sprite
      if (trainerImgRef.current) {
        const img = trainerImgRef.current;
        const frameW = img.width / 5;
        const destW = 72, destH = Math.round(72 * img.height / frameW);
        ctx.save();
        ctx.translate(intro.vsPlayerX, H * 0.5 - destH * 0.5);
        safeDrawImage(ctx, img, 0, 0, frameW, img.height, 0, 0, destW, destH);
        ctx.restore();
      }

      // Enemy trainer (right side). Si es un battle sprite (single image)
      // lo dibujamos completo. Si es un overworld sprite (4×4 grid), tomamos
      // sólo el frame "down idle".
      if (enemyTrainerImgRef.current) {
        const img = enemyTrainerImgRef.current;
        const isBattle = enemyTrainerImgRef.isBattleSprite;
        let sprW, sprH;
        if (isBattle) {
          sprW = img.width;
          sprH = img.height;
        } else {
          // Character sprite: 4 columnas (frames) × 4 filas (direcciones).
          sprW = Math.floor(img.width / 4);
          sprH = Math.floor(img.height / 4);
        }
        // Escalamos manteniendo proporción para sprites de batalla altos.
        const destH = isBattle ? 80 : Math.round(56 * sprH / sprW);
        const destW = isBattle ? Math.round(destH * sprW / sprH) : 56;
        ctx.save();
        ctx.translate(intro.vsEnemyX - destW, H * 0.5 - destH * 0.5);
        safeDrawImage(ctx, img, 0, 0, sprW, sprH, 0, 0, destW, destH);
        ctx.restore();
      }

      // VS logo in the center
      if (intro.vsLogoScale > 0) {
        ctx.save();
        ctx.translate(W * 0.5, H * 0.5);
        ctx.scale(intro.vsLogoScale, intro.vsLogoScale);
        // Shadow
        ctx.font = 'bold 22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText('VS', 2, 2);
        // Main text gradient
        ctx.fillStyle = '#FFD700';
        ctx.fillText('VS', 0, 0);
        ctx.restore();
      }

      // End flash
      if (intro.vsFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${intro.vsFlashAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    if (bgImgRef.current) safeDrawImage(ctx, bgImgRef.current, 0, 0, W, H);
    else { ctx.fillStyle = '#d8d0c0'; ctx.fillRect(0, 0, W, H); }
    const pShadowScale = Math.max(0, 1 - Math.max(0, -playerOffsetRef.current.y) / 40);
    const pShadowAlpha = 0.20 * (playerOffsetRef.current.opacity ?? 1);
    if (pShadowAlpha > 0 && pShadowScale > 0 && (playerOffsetRef.current.scale ?? 1) > 0.1) {
      ctx.fillStyle = `rgba(0,0,0,${pShadowAlpha})`;
      ctx.beginPath(); ctx.ellipse(W * 0.22 + playerOffsetRef.current.x, H * 0.83, 32 * pShadowScale, 7 * pShadowScale, 0, 0, Math.PI * 2); ctx.fill();
    }
    const eShadowScale = Math.max(0, 1 - Math.max(0, -enemyOffsetRef.current.y) / 40);
    const eShadowAlpha = 0.20 * (enemyOffsetRef.current.opacity ?? 1) * intro.enemyOpacity;
    if (eShadowAlpha > 0 && eShadowScale > 0 && (enemyOffsetRef.current.scale ?? 1) > 0.1) {
      ctx.fillStyle = `rgba(0,0,0,${eShadowAlpha})`;
      ctx.beginPath(); ctx.ellipse(W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0), H * 0.57, 28 * eShadowScale, 6 * eShadowScale, 0, 0, Math.PI * 2); ctx.fill();
    }
    
    // Dibuja al entrenador SÓLO mientras está en pantalla (antes/durante el
    // lanzamiento). Una vez se entra en BALL_FLASH ya está fuera de campo y
    // dibujarlo creaba un solape con la bola y con el sprite del Pokémon.
    const trainerStillVisible = (
      intro.state === INTRO_STATES.TRAINER_ENTER ||
      intro.state === INTRO_STATES.TRAINER_THROW ||
      intro.state === INTRO_STATES.BALL_FLY
    );
    if (trainerStillVisible && trainerImgRef.current) {
      const img = trainerImgRef.current, frameW = img.width / 5, frame = intro.trainerFrame || 0;
      safeDrawImage(ctx, img, frame * frameW, 0, frameW, img.height, intro.trainerX, H * 0.38, 80, 108);
    }
    
    // Enemy pokemon drawing with full color-tint support
    if (intro.enemyOpacity > 0 && enemyImgRef.current && enemyOffsetRef.current.visible) {
      const eOpacity = intro.enemyOpacity * (enemyOffsetRef.current.opacity ?? 1);
      const eScale = (enemyOffsetRef.current.scale ?? 1) * (intro.enemyScale || 1);
      if (eOpacity > 0 && eScale > 0) {
      ctx.save(); ctx.globalAlpha = eOpacity;
      ctx.translate(W * 0.73 + enemyOffsetRef.current.x + (intro.enemyOffsetX || 0), H * 0.38 + enemyOffsetRef.current.y);
      ctx.scale(eScale, eScale);
      
      const tintColor = enemyOffsetRef.current.tintColor;
      const tintAlpha = enemyOffsetRef.current.tintAlpha;
      if (tintColor && tintAlpha > 0) {
        drawTintedImage(ctx, enemyImgRef.current, 0, 0, enemyImgRef.current.width, enemyImgRef.current.height, -48, -48, 96, 96, tintColor, tintAlpha);
        if (tintAlpha < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - tintAlpha;
          safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96);
          ctx.restore();
        }
      } else {
        safeDrawImage(ctx, enemyImgRef.current, -48, -48, 96, 96);
      }
      // Persistent status effect tint (PSN/PAR/BRN/FRZ)
      const eSt = enemyPkmnRef.current?.status;
      if (eSt && eSt !== 'sleep' && enemyImgRef.current) {
        const st = getStatusTint(eSt, statusPulseRef.current);
        if (st && st.alpha > 0) drawTintedImage(ctx, enemyImgRef.current, 0, 0, enemyImgRef.current.width, enemyImgRef.current.height, -48, -48, 96, 96, st.color, st.alpha);
      }
      // ZZZ for sleep
      if (eSt === 'sleep') {
        const zzz = getSleepZzzText(statusPulseRef.current, 0, -48);
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        zzz.forEach(z => { ctx.globalAlpha = z.alpha; ctx.fillStyle = '#a8a878'; ctx.fillText(z.text, z.x, z.y); });
        ctx.restore();
      }
      ctx.restore();
      } // end eOpacity/eScale guard
    }

    // Player pokemon drawing with energy discharge popping and damage flashes
    if ([INTRO_STATES.BALL_FLASH, INTRO_STATES.POKEMON_APPEAR, INTRO_STATES.HUD_SLIDE, INTRO_STATES.READY].includes(intro.state) && playerPkImgRef.current && playerOffsetRef.current.visible) {
      const pOpacity = playerOffsetRef.current.opacity ?? 1;
      const pScale = (playerOffsetRef.current.scale ?? 1) * (intro.playerScale || 1);
      if (pOpacity > 0 && pScale > 0) {
      ctx.save(); ctx.globalAlpha = pOpacity;
      ctx.translate(W * 0.22 + playerOffsetRef.current.x + (intro.playerShake || 0), H * 0.70 + playerOffsetRef.current.y);
      ctx.scale(pScale, pScale);
      
      // Silhouette takes priority: black tint while emerging from Poké Ball
      const silAlpha = intro.silhouetteAlpha || 0;
      const isBallOpeningFlash = intro.state === INTRO_STATES.BALL_FLASH;
      let tintColor, tintAlpha;
      if (silAlpha > 0) {
        tintColor = '#000000';
        tintAlpha = silAlpha;
      } else {
        tintColor = playerOffsetRef.current.tintColor || (isBallOpeningFlash ? '#00f3ff' : null);
        tintAlpha = playerOffsetRef.current.tintAlpha || (isBallOpeningFlash ? Math.max(0, 1 - intro.timer / 400) : 0);
      }
      
      if (tintColor && tintAlpha > 0) {
        drawTintedImage(ctx, playerPkImgRef.current, 0, 0, playerPkImgRef.current.width, playerPkImgRef.current.height, -48, -48, 96, 96, tintColor, tintAlpha);
        if (tintAlpha < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - tintAlpha;
          safeDrawImage(ctx, playerPkImgRef.current, -48, -48, 96, 96);
          ctx.restore();
        }
      } else {
        safeDrawImage(ctx, playerPkImgRef.current, -48, -48, 96, 96);
      }
      // Persistent status effect tint for player Pokémon
      const pSt = playerPkmn?.status;
      if (pSt && pSt !== 'sleep' && playerPkImgRef.current) {
        const st = getStatusTint(pSt, statusPulseRef.current);
        if (st && st.alpha > 0) drawTintedImage(ctx, playerPkImgRef.current, 0, 0, playerPkImgRef.current.width, playerPkImgRef.current.height, -48, -48, 96, 96, st.color, st.alpha);
      }
      if (pSt === 'sleep') {
        const zzz = getSleepZzzText(statusPulseRef.current, 0, -48);
        ctx.save();
        ctx.font = '8px "Press Start 2P", monospace';
        zzz.forEach(z => { ctx.globalAlpha = z.alpha; ctx.fillStyle = '#a8a878'; ctx.fillText(z.text, z.x, z.y); });
        ctx.restore();
      }
      ctx.restore();
      } // end pOpacity/pScale guard
    }

    if (intro.ballVisible) {
      ctx.save(); ctx.translate(intro.ballX, intro.ballY); ctx.rotate(intro.ballAngle);
      ctx.fillStyle = '#E8190C'; ctx.beginPath(); ctx.arc(0, 0, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    if (intro.flashAlpha > 0) {
      if (intro.sparkles) { 
        ctx.fillStyle = '#00f3ff'; // matching electrical discharge color
        intro.sparkles.forEach(s => { 
          ctx.beginPath(); 
          ctx.arc(W*0.22+Math.cos(s.angle)*s.dist, H*0.7+Math.sin(s.angle)*s.dist, 3*intro.flashAlpha, 0, Math.PI*2); 
          ctx.fill(); 
        }); 
      }
      ctx.fillStyle = `rgba(255,255,255,${intro.flashAlpha})`; ctx.fillRect(0, 0, W, H);
    }
    if (intro.encounterFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${intro.encounterFlashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (intro.fadeAlpha > 0) { ctx.fillStyle = `rgba(0,0,0,${intro.fadeAlpha})`; ctx.fillRect(0, 0, W, H); }
  };

  const resolveTurn = async (pMoveKey) => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    sfx.confirm();
    setPhase(BATTLE_PHASES.RESOLVING);

    const pMove = MOVE_DATA[pMoveKey];
    const eMoves = POKEMON_MOVES[Number(enemyPkmn.id)] || ['TACKLE'];
    const eMove = MOVE_DATA[eMoves[Math.floor(Math.random() * eMoves.length)]];
    const order = determineTurnOrder(pMove, playerPkmn, eMove, enemyPkmn);

    for (const side of order) {
      if (playerPkmn.hp <= 0 || enemyPkmn.hp <= 0) break;
      const attacker       = side === 'player' ? playerPkmn  : enemyPkmn;
      const defender       = side === 'player' ? enemyPkmn   : playerPkmn;
      const move           = side === 'player' ? pMove        : eMove;
      const attackerSetter = side === 'player' ? setPlayerPkmn : setEnemyPkmn;
      const defenderSetter = side === 'player' ? setEnemyPkmn  : setPlayerPkmn;

      // 1. Mensaje de ataque + animación
      await showMessage(`¡${attacker.name.toUpperCase()} USÓ ${move.nombre.toUpperCase()}!`);
<<<<<<< Updated upstream
      activeAnimsRef.current = getMoveAnimation(move.id, side === 'player', 300, 200, move.type);
=======
      const moveAnim = getMoveAnimation(move.id, side === 'player', 300, 200, move.type);
      activeAnimsRef.current = moveAnim.anims;
      const impactDelay = moveAnim.impactDelay || 280;
      const totalDuration = moveAnim.totalDuration || (impactDelay + 400);
>>>>>>> Stashed changes

      const result = processMove(attacker, defender, move, { weather });

      // Wait for the strike animation to hit before applying damage
      const animDelay = move.category === 'Status' ? 400 : 550;
      await new Promise(r => setTimeout(r, animDelay));

      // 2. Actualizar estado volátil derivado del resultado (antes de mostrar mensajes)
      if (result.wakeUp)         attackerSetter(prev => ({ ...prev, status: null, sleepTurns: 0 }));
      if (result.decrementSleep) attackerSetter(prev => ({ ...prev, sleepTurns: Math.max(0, (prev.sleepTurns || 1) - 1) }));
      if (result.thawed)         attackerSetter(prev => ({ ...prev, status: null }));
      if (result.confusionCleared) attackerSetter(prev => ({ ...prev, confused: false, confuseTurns: 0 }));
      if (result.newConfuseTurns > 0) attackerSetter(prev => ({ ...prev, confuseTurns: result.newConfuseTurns }));

      // 3. Para movimientos sin impacto (status/buff/heal) sólo dejamos que se
      //    reproduzca la animación completa antes de mostrar el mensaje.
      if (!moveAnim.hasImpact) {
        await new Promise(r => setTimeout(r, totalDuration));
      } else {
        // Esperar hasta el momento del impacto.
        await new Promise(r => setTimeout(r, impactDelay));
      }

      // 4. No puede moverse (sueño, congelación, parálisis) o falla
      if (result.unableToMove || result.missed) {
        if (result.missed) sfx.cancel?.();
        await showMessage(result.unableToMove || `¡El ataque de ${attacker.name.toUpperCase()} falló!`);
        continue;
      }

      // 5. Auto-golpe por confusión — reemplaza el movimiento normal
      if (result.confusionSelfHit > 0) {
        await showMessage(`¡${attacker.name.toUpperCase()} está confundido y se golpea a sí mismo!`);
        sfx.hit();
        isFlashingRef.current = true;
        setTimeout(() => isFlashingRef.current = false, 100);
        attackerSetter(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.confusionSelfHit) }));
        activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, {
          text: `-${result.confusionSelfHit}`,
          x: side === 'player' ? 300 * 0.25 : 300 * 0.75,
          y: side === 'player' ? 200 * 0.7 - 20 : 200 * 0.35 - 20,
          color: '#f00', duration: 800
        }));
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      // 6. Daño — ahora sincronizado con el impacto visual
      if (result.damageDealt > 0) {
<<<<<<< Updated upstream
        if (move.type === 'FIRE') sfx.fireHit();
        else if (move.type === 'WATER' || move.type === 'ICE') sfx.waterHit();
        else if (move.type === 'ELECTRIC') sfx.electricHit();
        else if (move.category === 'Special') sfx.specialHit();
        else sfx.hit();
=======
        // Si es crítico, el flash blanco se pinta JUSTO ANTES del golpe
        // (Crystal feel: el destello aparece y luego viene el shake del defensor).
        if (result.isCritical) {
          activeAnimsRef.current.push(createAnimation(ANIM_TYPES.CRITICAL_FLASH, { duration: 350 }));
          activeAnimsRef.current.push(createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 500, amount: 12 }));
          sfx.critical();
        } else {
          sfx.hit();
        }

>>>>>>> Stashed changes
        isFlashingRef.current = true;
        setTimeout(() => isFlashingRef.current = false, 100);

        // Pequeña pausa antes de mostrar el número de daño y vaciar PS
        // — da espacio para que el sprite del defensor parpadee.
        defenderSetter(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.damageDealt) }));
        activeAnimsRef.current.push(createAnimation(ANIM_TYPES.TEXT, {
          text: `-${result.damageDealt}`,
          x: side === 'enemy' ? 300 * 0.25 : 300 * 0.75,
          y: side === 'enemy' ? 200 * 0.7 - 20 : 200 * 0.35 - 20,
          color: '#f00', duration: 900
        }));

        // Espera la animación de la barra de PS (HPBar tiene 600ms de transition)
        await new Promise(r => setTimeout(r, 650));

        if (result.hitCount > 1) await showMessage(`¡Golpeó ${result.hitCount} veces!`);
        if (result.isCritical)                                  await showMessage('¡Un golpe crítico!');
        if (result.effectiveness > 1)                           await showMessage('¡Es muy eficaz!');
        else if (result.effectiveness < 1 && result.effectiveness > 0) await showMessage('No es muy eficaz...');
        else if (result.effectiveness === 0)                    await showMessage('¡No afecta!');
      } else if (moveAnim.hasImpact) {
        // Damage 0 pero el move tenía impacto previsto (raro): sólo el sonido.
        sfx.hit();
      }

      // 6. Retroceso (recoil)
      if (result.recoilDamage > 0) {
        attackerSetter(prev => ({ ...prev, hp: Math.max(0, prev.hp - result.recoilDamage) }));
        await showMessage(`¡${attacker.name.toUpperCase()} sufrió daño por el retroceso!`);
      }

      // 7. Efectos secundarios
      if (result.effects) {
        const {
          message: effectMsg, statChanges,
          statusApplied, sleepTurns: sleepTurnsVal,
          toxicApplied, confused: targetConfused,
          healAmount, weatherSet, screenSet, leechSeed,
        } = result.effects;

        if (statusApplied) {
          if (statusApplied === 'sleep') {
            defenderSetter(prev => ({ ...prev, status: 'sleep', sleepTurns: sleepTurnsVal || 3 }));
          } else {
            defenderSetter(prev => ({ ...prev, status: statusApplied }));
          }
        }
        if (toxicApplied) {
          defenderSetter(prev => ({ ...prev, status: 'toxic', toxicCounter: 1 }));
        }
        if (targetConfused) {
          const confuseTurns = 2 + Math.floor(Math.random() * 4);
          defenderSetter(prev => ({ ...prev, confused: true, confuseTurns }));
        }
        if (statChanges && statChanges.length > 0) {
          statChanges.forEach(sc => {
            const ts = sc.target === 'attacker' ? attackerSetter : defenderSetter;
            ts(prev => ({
              ...prev,
              statStages: {
                ...prev.statStages,
                [sc.stat]: Math.max(-6, Math.min(6, (prev.statStages?.[sc.stat] || 0) + sc.stage))
              }
            }));
          });
        }
        if (healAmount > 0) {
          attackerSetter(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));
          activeAnimsRef.current.push(createAnimation(ANIM_TYPES.STRIKE, {
            x: side === 'player' ? 300 * 0.22 : 300 * 0.73,
            y: side === 'player' ? 200 * 0.70 : 200 * 0.38,
            duration: 500, color: '#10b981'
          }));
        }
        if (weatherSet) setWeather(weatherSet);
        if (screenSet) {
          attackerSetter(prev => ({
            ...prev,
            screens: { ...prev.screens, [screenSet.type]: screenSet.turns }
          }));
        }
        if (leechSeed) {
          defenderSetter(prev => ({ ...prev, leeched: true }));
        }
        if (effectMsg) await showMessage(effectMsg);
      }
    }

    // 8. Efectos de fin de turno (veneno, quemadura, tóxico, látex, clima)
    for (const s of ['player', 'enemy']) {
      const pkmn           = s === 'player' ? playerPkmn   : enemyPkmn;
      const setter         = s === 'player' ? setPlayerPkmn : setEnemyPkmn;
      const opponentSetter = s === 'player' ? setEnemyPkmn  : setPlayerPkmn;
      if (pkmn.hp > 0) {
        for (const eff of processEndTurnEffects(pkmn, weather)) {
          if (eff.damage) {
            setter(prev => ({ ...prev, hp: Math.max(0, prev.hp - eff.damage) }));
            isFlashingRef.current = true;
            setTimeout(() => isFlashingRef.current = false, 100);
          }
          if (eff.leechHeal) {
            opponentSetter(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + eff.leechHeal) }));
          }
          if (eff.toxicCounter) {
            setter(prev => ({ ...prev, toxicCounter: eff.toxicCounter }));
          }
          await showMessage(eff.message);
        }
      }
    }

    // 9. Decrementar clima
    if (weather.type !== 'none' && weather.turns > 0) {
      const newTurns = weather.turns - 1;
      if (newTurns <= 0) {
        setWeather({ type: 'none', turns: 0 });
        const weatherNames = { rain: 'la lluvia', sun: 'el sol intenso', sandstorm: 'la tormenta de arena' };
        await showMessage(`¡Terminó ${weatherNames[weather.type] || 'el clima especial'}!`);
      } else {
        setWeather(prev => ({ ...prev, turns: newTurns }));
      }
    }

    // 10. Decrementar pantallas al final del turno
    setPlayerPkmn(prev => ({
      ...prev,
      screens: {
        reflect:     Math.max(0, (prev.screens?.reflect     || 0) - 1),
        lightScreen: Math.max(0, (prev.screens?.lightScreen || 0) - 1),
      }
    }));
    setEnemyPkmn(prev => ({
      ...prev,
      screens: {
        reflect:     Math.max(0, (prev.screens?.reflect     || 0) - 1),
        lightScreen: Math.max(0, (prev.screens?.lightScreen || 0) - 1),
      }
    }));

    if (playerPkmn.hp > 0 && enemyPkmn.hp > 0) {
      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    } else {
      endBattle(enemyPkmn.hp <= 0);
    }
  };

  const handleHabitAttack = async (h) => {
    const hId = h.habito_id || h.id;
    if (phase !== BATTLE_PHASES.SELECT || localCompleted[hId] || h.completado) return;
    setPhase(BATTLE_PHASES.RESOLVING);
    setLocalCompleted(prev => ({...prev, [hId]: true}));

    const totalInBattle = habitsForStage.length || 1;
    const totalTeamMaxHp = enemyTeam.reduce((sum, p) => sum + (Number(p.maxHp) || 50), 0);
    let damageDealt = Math.ceil(totalTeamMaxHp / totalInBattle);
    const alreadyDoneBeforeSession = habitsForStage.filter(h2 => {
      const hId2 = h2.habito_id || h2.id;
      return h2.completado && !localCompleted[hId2];
    }).length;
    const completableCount = habitsForStage.length - alreadyDoneBeforeSession;
    if (Object.keys(localCompleted).length + 1 === completableCount) {
      damageDealt = Number(enemyPkmnRef.current?.hp ?? enemyPkmn.hp) + 10;
    }

    const startX = 300 * 0.22, startY = 200 * 0.68;
    const endX = 300 * 0.75, endY = 200 * 0.38;
    const habitAnims = [
      createAnimation(ANIM_TYPES.LUNGE, { attacker: 'player', target: 'enemy', duration: 350, amount: 28 }),
      createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 600, amount: 12 }),
      createAnimation(ANIM_TYPES.FLASH_SPRITE, { target: 'enemy', duration: 600 }),
      createAnimation(ANIM_TYPES.SHAKE, { target: 'enemy', duration: 500, amount: 18 }),
      createAnimation(ANIM_TYPES.TEXT, { text: `-${damageDealt}`, x: endX, y: endY - 20, color: '#10b981', duration: 1000 })
    ];
    const GYM_COLORS = {
      'gym_1': ['#a8b820', '#10b981'], // bug/grass
      'gym_2': ['#a8a878', '#f59e0b'], // normal
      'gym_3': ['#f08030', '#f59e0b'], // fire
      'gym_4': ['#f8d030', '#fff'],    // electric
    };
    const colors = GYM_COLORS[h.gym_id] || ['#10b981', '#f59e0b'];
    
    for (let i = 0; i < 18; i++) {
      habitAnims.push(createAnimation(ANIM_TYPES.PARTICLE, {
        x: startX + (Math.random() - 0.5) * 15, y: startY + (Math.random() - 0.5) * 15,
        vx: (endX - startX) * (0.8 + Math.random() * 0.3) + (Math.random() - 0.5) * 35,
        vy: (endY - startY) * (0.8 + Math.random() * 0.3) + (Math.random() - 0.5) * 35,
        duration: 400 + i * 25, color: i % 2 === 0 ? colors[0] : colors[1],
        shape: 'star', size: 5 + Math.random() * 4, gravity: 0
      }));
    }
    habitAnims.push(createAnimation(ANIM_TYPES.STRIKE, { x: endX, y: endY, duration: 400, color: colors[0] }));
    habitAnims.push(createAnimation(ANIM_TYPES.STRIKE, { x: endX + 10, y: endY - 8, duration: 450, delay: 100, color: colors[1] }));

    await showMessage(`¡${playerPkmn.name.toUpperCase()} USÓ ${h.nombre.toUpperCase()}!`);
    activeAnimsRef.current = habitAnims;
    completarHabito(h.gym_id, hId).catch(console.error);

    await new Promise(r => setTimeout(r, 700));
    isFlashingRef.current = true;
    setTimeout(() => isFlashingRef.current = false, 150);

    const currentHp = enemyPkmnRef.current?.hp ?? 0;
    const newHp = Math.max(0, currentHp - damageDealt);
    setEnemyPkmn(prev => ({ ...prev, hp: newHp }));
    await new Promise(r => setTimeout(r, 350));

    if (newHp > 0) {
      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    } else if (teamIndex < enemyTeam.length - 1) {
      const nextIdx = teamIndex + 1;
      const nextPkmn = enemyTeam[nextIdx];
      const carry = damageDealt - currentHp;
      await showMessage(`¡${(enemyPkmnRef.current?.name ?? '').toUpperCase()} se debilitó!`);
      
      // Animate faint
      sfx.faint();
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'enemy', targetX: 300 * 0.73, targetY: 200 * 0.38, duration: 1400 }));
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.HIDE_SPRITE, { target: 'enemy', duration: 99999, delay: 1400 }));
      await new Promise(r => setTimeout(r, 1500));
      
      setTeamIndex(nextIdx);
      setEnemyPkmn({ ...nextPkmn, hp: Math.max(0, nextPkmn.maxHp - carry) });
      const img = new Image();
      img.src = getAssetPath(`Graphics/battlers/${String(nextPkmn.id).padStart(3, '0')}.png`);
      img.onload = () => { enemyImgRef.current = img; };
      await showMessage(`¡El líder envía a ${nextPkmn.name.toUpperCase()}!`);
      
      // Fade in new pokemon smoothly
      activeAnimsRef.current = [createAnimation(ANIM_TYPES.SLIDE_IN, { target: 'enemy', duration: 800, startX: 150, endX: 0 })];
      enemyOffsetRef.current = { x: 150, y: 0, visible: true, opacity: 0, scale: 1, tintColor: null, tintAlpha: 0 };
      
      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    } else {
      await showMessage(`¡${(enemyPkmnRef.current?.name ?? '').toUpperCase()} se debilitó!`);
      endBattle(true);
    }
  };

  const handleUseItemInBattle = async (itemId) => {
    if (phase !== BATTLE_PHASES.SELECT) return;
    
    const count = user?.inventario?.[itemId] ?? 0;
    if (count <= 0) {
      setMessage(`¡No tienes ${itemId.toUpperCase()}!`);
      return;
    }

    if (itemId === 'pokeball' || itemId === 'superball') {
      if (!isWild) {
        await showMessage('¡No puedes robar los Pokémon de un líder!');
        setMenuView('main');
        setMessage('');
        return;
      }

      setPhase(BATTLE_PHASES.RESOLVING);
      setMenuView('main');
      await showMessage(`¡Lanzaste una ${itemId.toUpperCase()}!`);

      const startX = 300 * 0.22, startY = 200 * 0.68;
      const endX = 300 * 0.75, endY = 200 * 0.38;

      sfx.throwBall();
      activeAnimsRef.current = [createAnimation(ANIM_TYPES.THROW_POKEBALL, { startX, startY, endX, endY, duration: 600, ballType: itemId })];
      await new Promise(r => setTimeout(r, 600));
      activeAnimsRef.current = [createAnimation(ANIM_TYPES.CAPTURE_SUCK, { endX, endY, duration: 800, ballType: itemId })];
      await new Promise(r => setTimeout(r, 800));
      activeAnimsRef.current = [createAnimation(ANIM_TYPES.HIDE_SPRITE, { endX, endY, duration: 10000, ballType: itemId, showBall: true })];

      const r = await capturarPokemon(enemyPkmn.id, enemyPkmn.name, itemId);
      const shakes = r.success ? 3 : Math.max(1, Math.floor(Math.random() * 3));

      for (let i = 0; i < shakes; i++) {
        sfx.wobble();
        activeAnimsRef.current = [createAnimation(ANIM_TYPES.CAPTURE_SHAKE, { endX, endY, duration: 400, ballType: itemId })];
        await new Promise(r => setTimeout(r, 400));
        activeAnimsRef.current = [createAnimation(ANIM_TYPES.HIDE_SPRITE, { endX, endY, duration: 800, ballType: itemId, showBall: true })];
        await new Promise(r => setTimeout(r, 800));
      }

      if (r.success) {
        sfx.catchSuccess();
        activeAnimsRef.current = [createAnimation(ANIM_TYPES.CAPTURE_SUCCESS, { endX, endY, duration: 1000, ballType: itemId })];
        await showMessage(`¡Atrapaste a ${enemyPkmn.name.toUpperCase()} exitosamente!`);
        navigate('capture', { gymId: enemyPkmn.id });
      } else {
        activeAnimsRef.current = [createAnimation(ANIM_TYPES.CAPTURE_BREAKOUT, { endX, endY, duration: 800, ballType: itemId })];
        await new Promise(r => setTimeout(r, 800));
        await showMessage('¡Oh no! El Pokémon salvaje se ha escapado de la bola.');
        setPhase(BATTLE_PHASES.SELECT);
        setMessage('');
      }
    } else if (itemId === 'potion' || itemId === 'superpotion') {
      setPhase(BATTLE_PHASES.RESOLVING);
      setMenuView('main');
      const healAmount = itemId === 'potion' ? 20 : 50;

      await showMessage(`¡Usaste ${itemId.toUpperCase()} en ${playerPkmn.name.toUpperCase()}!`);
      await usarObjeto(itemId);

      activeAnimsRef.current = [createAnimation(ANIM_TYPES.STRIKE, { x: 300 * 0.22, y: 200 * 0.68, duration: 500, color: '#10b981' })];
      await new Promise(r => setTimeout(r, 600));
      setPlayerPkmn(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));

      await showMessage(`¡Se restauraron los PS de ${playerPkmn.name.toUpperCase()}!`);

      if (isWild) {
        await showMessage(`¡${enemyPkmn.name.toUpperCase()} salvaje ataca!`);
        const enemyDmg = 8 + Math.floor(Math.random() * 8);
        const newPlayerHp = Math.max(0, playerPkmn.hp - enemyDmg);
        setPlayerPkmn(prev => ({ ...prev, hp: newPlayerHp }));
        isFlashingRef.current = true;
        setTimeout(() => isFlashingRef.current = false, 150);
        await new Promise(r => setTimeout(r, 600));
        if (newPlayerHp <= 0) { endBattle(false); return; }
      }

      setPhase(BATTLE_PHASES.SELECT);
      setMessage('');
    }
  };

  const endBattle = async (win) => {
    setPhase(BATTLE_PHASES.FINISHED);
    if (!win) {
      sfx.faint();
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, {
        target: 'player', duration: 1000, persist: true
      }));
      await new Promise(r => setTimeout(r, 1100));
      await showMessage(`¡${playerPkmn.name.toUpperCase()} se debilitó!`);
      navigate('city');
    } else {
      sfx.faint();
<<<<<<< Updated upstream
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, { target: 'enemy', targetX: 300 * 0.73, targetY: 200 * 0.38, duration: 1400 }));
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.HIDE_SPRITE, { target: 'enemy', duration: 99999, delay: 1400 }));
      await new Promise(r => setTimeout(r, 1600));
      const gymReward = !isWild ? await completarGimnasio(gymId, starter.starter_id, starter.starter_nombre).catch(() => ({})) : {};
      const reward = await ganarBatalla().catch(() => ({}));
      const newLevel = gymReward?.nuevo_nivel || reward?.new_level || playerPkmn.level;
      const leveledUp = gymReward?.subio_nivel || reward?.subio_nivel;
=======
      activeAnimsRef.current.push(createAnimation(ANIM_TYPES.FAINT, {
        target: 'enemy', duration: 1200, persist: true
      }));

      // OPTIMIZACIÓN clave: lanzamos las peticiones HTTP de recompensa AL
      // MISMO TIEMPO que arranca la animación de faint. Antes se hacían
      // SECUENCIALMENTE después de esperar 1400 ms → en redes lentas el
      // jugador veía la pantalla "congelada" 3-5 segundos.
      //
      // Además: race con timeout de 5s para garantizar que setVictoryData
      // se dispara SIEMPRE, aunque la API no responda. Sin esto, una
      // petición que nunca resuelve dejaba la pantalla en FINISHED para
      // siempre, sin overlay → el bug que reporta el usuario.
      const TIMEOUT_MS = 5000;
      const apiPromise = Promise.all([
        !isWild
          ? completarGimnasio(gymId, starter.starter_id, starter.starter_nombre).catch(() => ({}))
          : Promise.resolve({}),
        ganarBatalla().catch(() => ({}))
      ]);
      const timeoutPromise = new Promise(resolve =>
        setTimeout(() => resolve([{}, {}]), TIMEOUT_MS)
      );

      // Esperamos en paralelo: la animación mínima (~1100ms) y las APIs.
      // Cuando ambos terminan (lo que ocurra DESPUÉS), mostramos el overlay.
      const [_, [gymReward, reward]] = await Promise.all([
        new Promise(r => setTimeout(r, 1100)),
        Promise.race([apiPromise, timeoutPromise])
      ]);

      const safeGym = gymReward || {};
      const safeReward = reward || {};
      const newLevel = safeGym.nuevo_nivel || safeReward.new_level || playerPkmn.level;
      const leveledUp = safeGym.subio_nivel || safeReward.subio_nivel;

>>>>>>> Stashed changes
      setVictoryData({
        type: isWild ? 'wild' : 'gym',
        enemyName: enemyPkmn.name,
        gymName: battleData?.gymName || 'GIMNASIO',
        xpGained: (safeGym.exp_ganada || 0) + (safeReward.xp_ganada || 20),
        newXp: safeGym.new_xp || safeReward.new_xp || 0,
        newLevel,
        levelUp: leveledUp,
        monedas: (safeGym.monedas_ganadas || 0) + (safeReward.monedas_ganadas || 0),
        medallaUrl: safeGym.medalla_imagen || null,
      });

      if (leveledUp) {
        const currentId = String(starter.starter_id || starter.pokemon_id || '').padStart(3, '0');
        const evoId = getEvolution(currentId, newLevel);
        if (evoId) {
          const fromName = starter.starter_nombre || starter.pokemon_nombre || '';
          const toName = POKEMON_SPECIES?.[evoId]?.name || `#${evoId}`;
          setPendingEvolution({ fromId: currentId, toId: evoId, fromName, toName });
        }
      }
    }
  };

  if (!playerPkmn || !enemyPkmn) return null;

  return (
    <div style={{ width: '100vw', height: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#222', overflow: 'hidden', fontFamily:'"Press Start 2P"' }}>
      <div style={{ width: '100%', maxWidth: '480px', height: '100%', display: 'flex', flexDirection: 'column', background: '#000', position: 'relative' }}>
        <div style={{flex: '0 0 58%', position:'relative', overflow: 'hidden'}}>
          <canvas ref={battleCanvasRef} width={300} height={200} style={{width:'100%',height:'100%', imageRendering:'pixelated'}} />
          <BattleHUD enemyPkmn={enemyPkmn} playerPkmn={playerPkmn} starterExp={starter.starter_exp} introReady={introReady} />
        </div>
        <div style={{ flex: '0 0 42%', background: '#f0f0f0', borderTop: '4px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            onClick={handleAdvance}
            style={{ background: '#f8f8f0', borderBottom: '3px solid #444', padding: '10px 16px', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: '#222', lineHeight: '1.5em', cursor: (isMsgTyping || waitingForA) ? 'pointer' : 'default', userSelect: 'none' }}
          >
            <span>{message ? displayedMsg : (isWild ? '¿QUÉ DEBE HACER?' : '¡COMPLETA TUS HÁBITOS!')}</span>
            {waitingForA && advanceResolveRef.current && (
              <span className="battle-cursor">▼</span>
            )}
          </div>
          <BattleActionMenu isWild={isWild} menuView={menuView} setMenuView={setMenuView} phase={phase} habitsForStage={habitsForStage} localCompleted={localCompleted} handleHabitAttack={handleHabitAttack} moves={playerPkmn?.moves || []} onMoveSelect={resolveTurn} setMessage={setMessage} navigate={navigate} user={user} handleUseItemInBattle={handleUseItemInBattle} />
        </div>
        <VictoryOverlay victoryData={victoryData} displayXp={displayXp} displayMonedas={displayMonedas} showContinueHint={showContinueHint} onClose={() => pendingEvolution ? navigate('evolution', pendingEvolution) : navigate('city')} />
        <style>{`
          .battle-btn { background: #e8e8d8; border: 2px solid #666; border-radius: 3px; font-family: "Press Start 2P", monospace; font-size: 8px; color: #222; cursor: pointer; display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px 2px; }
          .battle-btn:hover:not(:disabled) { background: #d0d0c0; }
          .battle-btn-gym { background: #fff; border: 2px solid #555; border-radius: 6px; font-family: "Press Start 2P", monospace; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px; }
          .battle-btn-gym:disabled { opacity: 0.4; cursor: default; background: #ddd; }
          .battle-btn-gym-compact { background: #fff; border: 2px solid #555; border-radius: 4px; font-family: "Press Start 2P", monospace; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 2px; }
          .battle-btn-gym-compact:disabled { opacity: 0.4; cursor: default; background: #ddd; }
          @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
          .battle-cursor { animation: blink 0.6s step-end infinite; font-size: 8px; color: #333; flex-shrink: 0; margin-left: 6px; }
        `}</style>
      </div>
    </div>
  );
};

export default BattleScreen;
