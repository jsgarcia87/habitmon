/**
 * battleAnimations.js
 * Visual effects for the BattleScreen canvas.
 * Highly polished GSC/GBA Pokémon style animations.
 */

// GSC/Essentials-style type colors for damage flashes and particles
export const TYPE_COLORS = {
  NORMAL:   { flash: '#A8A878', particle: '#C8C8A0' },
  FIRE:     { flash: '#F97316', particle: '#EF4444' },
  WATER:    { flash: '#3B82F6', particle: '#38BDF8' },
  GRASS:    { flash: '#22C55E', particle: '#4ADE80' },
  ELECTRIC: { flash: '#FACC15', particle: '#FCD34D' },
  ICE:      { flash: '#A5F3FC', particle: '#7DD3FC' },
  FIGHTING: { flash: '#DC2626', particle: '#B91C1C' },
  POISON:   { flash: '#A855F7', particle: '#C084FC' },
  GROUND:   { flash: '#D97706', particle: '#B45309' },
  FLYING:   { flash: '#A5B4FC', particle: '#818CF8' },
  PSYCHIC:  { flash: '#EC4899', particle: '#F472B6' },
  BUG:      { flash: '#84CC16', particle: '#A3E635' },
  ROCK:     { flash: '#A0906C', particle: '#78716C' },
  GHOST:    { flash: '#7C3AED', particle: '#8B5CF6' },
  DRAGON:   { flash: '#7C3AED', particle: '#6D28D9' },
  DARK:     { flash: '#374151', particle: '#6B7280' },
  STEEL:    { flash: '#94A3B8', particle: '#CBD5E1' },
};

export const ANIM_TYPES = {
  STRIKE:      'strike',
  PROJECTILE:  'projectile',
  FLASH:       'flash',
  SHAKE:       'shake',
  BOUNCE:      'bounce',
  PARTICLE:    'particle',
  TEXT:        'text',
  FLASH_SPRITE:'flash_sprite',
  FAINT:       'faint',
  CAPTURE:     'capture',
  SCREEN_SHAKE:'screen_shake',
  LUNGE:       'lunge',
  SLASH:       'slash',
  CROSS_SLASH: 'cross_slash',
  LIGHTNING:   'lightning',
  SOUNDWAVE:   'soundwave',
  LEER_EYES:   'leer_eyes',
  WIND_SWIRL:  'wind_swirl',
  THROW_POKEBALL: 'throw_pokeball',
  CAPTURE_SUCK: 'capture_suck',
  CAPTURE_SHAKE: 'capture_shake',
  CAPTURE_SUCCESS: 'capture_success',
  CAPTURE_BREAKOUT: 'capture_breakout',
  HIDE_SPRITE: 'hide_sprite',
  SLIDE_IN:    'slide_in',
  TYPE_FLASH: 'type_flash',       // colored full-screen tint matching move type
  CRITICAL_FLASH: 'critical_flash' // bright white flash for critical hits
};

export const createAnimation = (type, params) => ({
  type,
  timer: 0,
  duration: params.duration || 500,
  delay: params.delay || 0,
  ...params
});

/**
 * Updates all active animations and computes per-frame sprite offsets.
 * Returns { nextAnims, offsets } where offsets = { player, enemy, screen }
 */
export const updateBattleAnimations = (anims, dt) => {
  // Las animaciones con `persist: true` se mantienen vivas aunque hayan
  // superado su duración, congeladas en t=1. Se usan para estados finales
  // (sprite debilitado, sprite oculto…) y evitan que el sprite vuelva a
  // aparecer al filtrarse la animación y restablecerse los offsets.
  const nextAnims = anims
    .map(a => ({ ...a, timer: a.timer + dt }))
    .filter(a => a.persist || a.timer < a.duration + (a.delay || 0));

  const offsets = {
    player: { x: 0, y: 0, visible: true, opacity: 1, scale: 1, tintColor: null, tintAlpha: 0 },
    enemy:  { x: 0, y: 0, visible: true, opacity: 1, scale: 1, tintColor: null, tintAlpha: 0 },
    screen: { x: 0, y: 0 }
  };

  nextAnims.forEach(a => {
    if (a.timer < (a.delay || 0)) return; // Wait until delay finishes
    const activeTime = a.timer - (a.delay || 0);
    const t = Math.min(1, activeTime / a.duration);

    switch (a.type) {
      case ANIM_TYPES.SHAKE: {
        const amt = (1 - t) * (a.amount || 10);
        const val = Math.sin(t * Math.PI * 10) * amt;
        if (a.target === 'player') offsets.player.x += val;
        else offsets.enemy.x += val;
        break;
      }
      case ANIM_TYPES.SCREEN_SHAKE: {
        const amt = (1 - t) * (a.amount || 8);
        const valX = Math.sin(t * Math.PI * 15) * amt;
        const valY = Math.cos(t * Math.PI * 15) * amt;
        offsets.screen.x += valX;
        offsets.screen.y += valY;
        break;
      }
      case ANIM_TYPES.BOUNCE: {
        const amt = (1 - t) * (a.amount || 20);
        const val = -Math.abs(Math.sin(t * Math.PI)) * amt;
        if (a.target === 'player') offsets.player.y += val;
        else offsets.enemy.y += val;
        break;
      }
      case ANIM_TYPES.LUNGE: {
        const amt = a.amount || 26;
        const factor = Math.sin(t * Math.PI); // moves forward, then returns smoothly
        // Determine vector along diagonal: player attacks top-right (pos X, neg Y), enemy bottom-left (neg X, pos Y)
        const valX = factor * amt;
        const valY = factor * amt * 0.45;
        if (a.attacker === 'player') {
          offsets.player.x += valX;
          offsets.player.y -= valY;
        } else {
          offsets.enemy.x -= valX;
          offsets.enemy.y += valY;
        }
        break;
      }
      case ANIM_TYPES.FLASH_SPRITE: {
        const visible = Math.floor(activeTime / 40) % 2 === 0;
        const tintAlpha = Math.max(0, 1 - t) * 0.8;
        const flashColor = a.color || '#ff3b30';
        if (a.target === 'player') {
          offsets.player.visible = visible;
          offsets.player.tintColor = flashColor;
          offsets.player.tintAlpha = tintAlpha;
        } else {
          offsets.enemy.visible = visible;
          offsets.enemy.tintColor = flashColor;
          offsets.enemy.tintAlpha = tintAlpha;
        }
        break;
      }
      case ANIM_TYPES.SLIDE_IN: {
        // Slide in from right and fade in
        const easeCubic = 1 - Math.pow(1 - t, 3);
        const startX = a.startX || 150;
        const endX = a.endX || 0;
        if (a.target === 'enemy') {
          offsets.enemy.x = startX + (endX - startX) * easeCubic;
          offsets.enemy.opacity = t;
        } else {
          offsets.player.x = startX + (endX - startX) * easeCubic;
          offsets.player.opacity = t;
        }
        break;
      }
      case ANIM_TYPES.FAINT: {
<<<<<<< Updated upstream
        // Organic drop with a small bounce
        let drop = 0;
        if (t < 0.8) {
          const ft = t / 0.8;
          drop = (ft * ft) * 80; // accelerating fall
        } else {
          const bt = (t - 0.8) / 0.2;
          drop = 80 - Math.sin(bt * Math.PI) * 10; // bounce up slightly
        }
        const alpha = Math.max(0, 1 - t * 1.2); // fade slightly faster than drop
        if (a.target === 'player') {
          offsets.player.y    += drop;
          offsets.player.opacity = alpha;
          offsets.player.tintColor = '#ff3b30';
          offsets.player.tintAlpha = t * 0.8;
        } else {
          offsets.enemy.y    += drop;
          offsets.enemy.opacity = alpha;
          offsets.enemy.tintColor = '#ff3b30';
          offsets.enemy.tintAlpha = t * 0.8;
        }
=======
        // Estilo Crystal: el sprite cae hacia abajo, fuera de su plataforma.
        // No hay tinte rojo (Crystal no lo usa); el fade ocurre en el último
        // tramo, cuando el sprite ya está claramente fuera de su silueta.
        const drop = t * 140;         // 140 px hacia abajo (saca el sprite del campo)
        const fade = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        const tgt  = a.target === 'player' ? offsets.player : offsets.enemy;
        tgt.y       += drop;
        tgt.opacity *= Math.max(0, fade);
        if (t >= 1) tgt.visible = false; // estado final: invisible
>>>>>>> Stashed changes
        break;
      }
      case ANIM_TYPES.THROW_POKEBALL: {
        // Arc from startX, startY to endX, endY
        const factor = t;
        const currentX = a.startX + (a.endX - a.startX) * factor;
        // Parabola for the arc
        const currentY = a.startY + (a.endY - a.startY) * factor - Math.sin(factor * Math.PI) * 40;
        a._ballX = currentX;
        a._ballY = currentY;
        a._ballVisible = true;
        a._ballAngle = factor * Math.PI * 6; // Spin multiple times
        a._ballType = a.ballType;
        break;
      }
      case ANIM_TYPES.CAPTURE_SUCK: {
        // Enemy turns white/red and shrinks into the ball
        // Then ball drops to the floor
        if (t < 0.4) {
          const st = t / 0.4;
          offsets.enemy.scale = 1 - st;
          offsets.enemy.opacity = 1 - st;
          offsets.enemy.tintColor = '#ff3b30'; // Red energy
          offsets.enemy.tintAlpha = st;
          a._ballX = a.endX;
          a._ballY = a.endY;
          a._ballVisible = true;
          a._ballAngle = 0;
          a._ballOpen = true;
        } else {
          const ft = (t - 0.4) / 0.6;
          offsets.enemy.scale = 0;
          offsets.enemy.opacity = 0;
          a._ballX = a.endX;
          // Drop to floor and bounce
          const floorY = a.endY + 25;
          // Bounce math
          const bounce = Math.abs(Math.cos(ft * Math.PI * 2.5)) * (1 - ft) * 20;
          a._ballY = floorY - bounce;
          a._ballVisible = true;
          a._ballAngle = 0;
          a._ballOpen = false;
        }
        a._ballType = a.ballType;
        break;
      }
      case ANIM_TYPES.HIDE_SPRITE: {
        const tgt = a.target || 'enemy';
        offsets[tgt].scale = 0;
        offsets[tgt].opacity = 0;
        offsets[tgt].visible = false;
        if (a.showBall) {
          a._ballX = a.endX;
          a._ballY = a.endY + 25;
          a._ballVisible = true;
          a._ballAngle = 0;
          a._ballType = a.ballType;
        }
        break;
      }
      case ANIM_TYPES.CAPTURE_SHAKE: {
        offsets.enemy.scale = 0;
        offsets.enemy.opacity = 0;
        a._ballX = a.endX;
        a._ballY = a.endY + 25;
        a._ballVisible = true;
        // Shake left then right
        a._ballAngle = Math.sin(t * Math.PI * 2) * 0.3;
        a._ballType = a.ballType;
        break;
      }
      case ANIM_TYPES.CAPTURE_SUCCESS: {
        offsets.enemy.scale = 0;
        offsets.enemy.opacity = 0;
        a._ballX = a.endX;
        a._ballY = a.endY + 25;
        a._ballVisible = true;
        a._ballAngle = 0;
        a._ballType = a.ballType;
        // Click flash at the start
        if (t < 0.2) {
           a._ballTint = '#ffffff';
           a._ballTintAlpha = 1 - (t / 0.2);
        }
        break;
      }
      case ANIM_TYPES.CAPTURE_BREAKOUT: {
        a._ballX = a.endX;
        a._ballY = a.endY + 25;
        if (t < 0.2) {
          a._ballVisible = true;
          a._ballOpen = true;
          a._ballType = a.ballType;
          offsets.enemy.scale = 0;
          offsets.enemy.opacity = 0;
        } else {
          a._ballVisible = false;
          // Enemy expands back
          const et = (t - 0.2) / 0.8;
          offsets.enemy.scale = et;
          offsets.enemy.opacity = et;
          offsets.enemy.tintColor = '#ffffff';
          offsets.enemy.tintAlpha = 1 - et;
        }
        break;
      }
      default: break;
    }
  });

  return { nextAnims, offsets };
};

// ─── Draw helpers ──────────────────────────────────────────────────────────

export const drawBattleAnimations = (ctx, anims, W, H) => {
  anims.forEach(a => {
    if (a.timer < (a.delay || 0)) return;
    const activeTime = a.timer - (a.delay || 0);
    const t = Math.min(1, activeTime / a.duration);

    switch (a.type) {
      case ANIM_TYPES.STRIKE: {
        ctx.save();
        ctx.strokeStyle = a.color || '#fff';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 1 - t;
        
        // expanding outer circle
        ctx.beginPath();
        ctx.arc(a.x, a.y, 6 + t * 28, 0, Math.PI * 2);
        ctx.stroke();
        
        // inner filled core
        ctx.fillStyle   = a.color || '#fff';
        ctx.globalAlpha = (1 - t) * 0.5;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 4 + t * 14, 0, Math.PI * 2);
        ctx.fill();

        // cross sparks
        ctx.strokeStyle = a.color || '#fff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x - 12 * t, a.y - 12 * t);
        ctx.lineTo(a.x + 12 * t, a.y + 12 * t);
        ctx.moveTo(a.x + 12 * t, a.y - 12 * t);
        ctx.lineTo(a.x - 12 * t, a.y + 12 * t);
        ctx.stroke();
        
        ctx.restore();
        break;
      }

      case ANIM_TYPES.SLASH: {
        ctx.save();
        ctx.strokeStyle = a.color || '#fff';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 1 - t;
        
        // Draw 3 parallel claw marks sliding down-left
        const dist = 8;
        for (let i = -1; i <= 1; i++) {
          const cx = a.x + i * dist;
          const cy = a.y - i * dist;
          const startX = cx + 16 * (1 - t * 1.4);
          const startY = cy - 16 * (1 - t * 1.4);
          const endX = cx - 16 * (t * 1.4);
          const endY = cy + 16 * (t * 1.4);
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case ANIM_TYPES.CROSS_SLASH: {
        ctx.save();
        ctx.strokeStyle = a.color || '#10b981';
        ctx.lineWidth   = 3;
        ctx.globalAlpha = 1 - t;
        
        // Slash 1: top-left to bottom-right
        const l1StartX = a.x - 22 * (1 - t * 1.5);
        const l1StartY = a.y - 22 * (1 - t * 1.5);
        const l1EndX = a.x + 22 * (t * 1.5);
        const l1EndY = a.y + 22 * (t * 1.5);
        ctx.beginPath();
        ctx.moveTo(l1StartX, l1StartY);
        ctx.lineTo(l1EndX, l1EndY);
        ctx.stroke();
        
        // Slash 2: top-right to bottom-left
        const l2StartX = a.x + 22 * (1 - t * 1.5);
        const l2StartY = a.y - 22 * (1 - t * 1.5);
        const l2EndX = a.x - 22 * (t * 1.5);
        const l2EndY = a.y + 22 * (t * 1.5);
        ctx.beginPath();
        ctx.moveTo(l2StartX, l2StartY);
        ctx.lineTo(l2EndX, l2EndY);
        ctx.stroke();
        
        ctx.restore();
        break;
      }

      case ANIM_TYPES.LIGHTNING: {
        ctx.save();
        ctx.strokeStyle = a.color || '#fbbf24';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 1 - t;
        
        ctx.beginPath();
        let cx = a.x;
        let cy = a.y - 50;
        ctx.moveTo(cx, cy);
        
        const steps = 4;
        const hStep = 50 / steps;
        for (let i = 1; i <= steps; i++) {
          // Use a fixed pseudo-random based on delay and index so it doesn't flicker
          const targetX = (i === steps) ? a.x : a.x + Math.sin((a.delay || 0) * 1.3 + i * 4.7) * 12;
          const targetY = (a.y - 50) + i * hStep;
          ctx.lineTo(targetX, targetY);
        }
        ctx.stroke();
        ctx.restore();
        break;
      }

      case ANIM_TYPES.SOUNDWAVE: {
        ctx.save();
        ctx.strokeStyle = a.color || '#3b82f6';
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 1 - t;
        
        for (let i = 0; i < 2; i++) {
          const ringT = (t + i * 0.45) % 1;
          const r = ringT * 40;
          ctx.beginPath();
          ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case ANIM_TYPES.LEER_EYES: {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 1 - t;
        
        const eyeSpacing = 14;
        for (let dir = -1; dir <= 1; dir += 2) {
          const ex = a.x + dir * eyeSpacing;
          const ey = a.y;
          // Horizontal glowing eye slit
          ctx.beginPath();
          ctx.moveTo(ex - 10 * t, ey);
          ctx.lineTo(ex + 10 * t, ey);
          ctx.stroke();
          
          // Glowing pupil core
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case ANIM_TYPES.WIND_SWIRL: {
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 0.8 * (1 - t);
        
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
          const angle = i * 0.55 + t * Math.PI * 5;
          const r = (i / 24) * 30;
          const px = a.x + Math.cos(angle) * r;
          const py = a.y + Math.sin(angle) * r - (t * 30); // rises as it swirls
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
        break;
      }

      case ANIM_TYPES.PROJECTILE: {
        const px = a.startX + (a.endX - a.startX) * t;
        const py = a.startY + (a.endY - a.startY) * t;
        ctx.fillStyle = a.color || 'yellow';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ANIM_TYPES.PARTICLE: {
        const px = a.x + (a.vx || 0) * t;
        const gravityVal = (a.gravity !== undefined ? a.gravity : 30);
        const py = a.y + (a.vy || 0) * t + gravityVal * t * t;
        
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle   = a.color || '#fff';
        
        const size = a.size || 4;
        if (a.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(px, py, size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (a.shape === 'star') {
          // Draw a small 4-point sparkle star
          ctx.beginPath();
          ctx.moveTo(px, py - size);
          ctx.lineTo(px + size * 0.3, py - size * 0.3);
          ctx.lineTo(px + size, py);
          ctx.lineTo(px + size * 0.3, py + size * 0.3);
          ctx.lineTo(px, py + size);
          ctx.lineTo(px - size * 0.3, py + size * 0.3);
          ctx.lineTo(px - size, py);
          ctx.lineTo(px - size * 0.3, py - size * 0.3);
          ctx.closePath();
          ctx.fill();
        } else {
          // Default: square particle
          ctx.fillRect(px - size/2, py - size/2, size, size);
        }
        ctx.restore();
        break;
      }

      case ANIM_TYPES.FLASH: {
        ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - t)})`;
        ctx.fillRect(0, 0, W, H);
        break;
      }

      case ANIM_TYPES.TYPE_FLASH: {
        // Colored screen tint matching move type (GSC style)
        const alpha = (1 - t) * 0.32;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = a.color || '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        break;
      }

      case ANIM_TYPES.CRITICAL_FLASH: {
        // Bright white flash for critical hits — peaks at t=0.2, fades out
        const alpha = t < 0.2 ? (t / 0.2) : (1 - (t - 0.2) / 0.8);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.92})`;
        ctx.fillRect(0, 0, W, H);
        break;
      }

      case ANIM_TYPES.TEXT: {
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.font        = 'bold 10px "Press Start 2P", monospace';
        ctx.textAlign   = 'center';
        
        // shadow text
        ctx.fillStyle   = '#111';
        ctx.fillText(a.text, a.x + 1, a.y - t * 22 + 1);
        
        // foreground text
        ctx.fillStyle   = a.color || '#fff';
        ctx.fillText(a.text, a.x, a.y - t * 22);
        
        ctx.restore();
        break;
      }

      case ANIM_TYPES.THROW_POKEBALL:
      case ANIM_TYPES.CAPTURE_SUCK:
      case ANIM_TYPES.HIDE_SPRITE:
      case ANIM_TYPES.CAPTURE_SHAKE:
      case ANIM_TYPES.CAPTURE_SUCCESS:
      case ANIM_TYPES.CAPTURE_BREAKOUT: {
        if (a._ballVisible) {
          drawPokeball(ctx, a._ballX, a._ballY, 7, a._ballAngle ?? 0, a._ballType, a._ballOpen, a._ballTint, a._ballTintAlpha);
        }
        if (a.type === ANIM_TYPES.CAPTURE_SUCK && t < 0.4) {
          // Draw energy beam
          ctx.strokeStyle = '#ff3b30';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(a._ballX, a._ballY);
          ctx.lineTo(a.endX, a.endY - 20); // Point towards enemy center
          ctx.stroke();
        }
        if (a.type === ANIM_TYPES.CAPTURE_SUCCESS) {
           if (t > 0.2 && t < 0.8) {
              const st = (t - 0.2) / 0.6;
              for (let i = 0; i < 3; i++) {
                const angle = -Math.PI/2 + (i - 1) * Math.PI/3;
                const dist = 10 + st * 20;
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(a._ballX + Math.cos(angle)*dist, a._ballY + Math.sin(angle)*dist, 2 * (1 - st), 0, Math.PI*2);
                ctx.fill();
              }
           }
        }
        break;
      }

      default: break;
    }
  });
};

function drawPokeball(ctx, x, y, radius, angle, type = 'pokeball', isOpen = false, tintColor = null, tintAlpha = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  if (isOpen) {
    // Top half open
    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = type === 'superball' ? '#3b82f6' : type === 'ultraball' ? '#eab308' : '#E8190C';
    ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
    ctx.restore();

    // Bottom half open
    ctx.save();
    ctx.translate(0, 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
    ctx.restore();
    
    // Light coming out
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2); ctx.fill();
  } else {
    // Red top
    ctx.fillStyle = type === 'superball' ? '#3b82f6' : type === 'ultraball' ? '#eab308' : '#E8190C';
    ctx.beginPath(); ctx.arc(0, 0, radius, Math.PI, 0); ctx.fill();
    
    // Pattern for superball/ultraball
    if (type === 'superball') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(-radius*0.7, -radius*0.4); ctx.lineTo(-radius*0.2, -radius*0.8); ctx.lineTo(radius*0.2, -radius*0.8); ctx.lineTo(radius*0.7, -radius*0.4); ctx.fill();
    }
    
    // White bottom
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI); ctx.fill();
    // Outline + divider
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
    // Center button
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.8;
    ctx.stroke();

    // Add tint flash
    if (tintColor && tintAlpha > 0) {
      ctx.fillStyle = tintColor;
      ctx.globalAlpha = tintAlpha;
      ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  
  ctx.restore();
}

// ─── Move animations ───────────────────────────────────────────────────────

// Conjuntos de movimientos que comparten patrón visual.
// Permite a getMoveAnimation generar anticipación + impacto consistentes
// con un solo switch breve.
const CONTACT_MOVES = new Set([
  'TACKLE','SCRATCH','PECK','QUICK_ATTACK','VINE_WHIP','WING_ATTACK','BITE','SLASH',
  'DOUBLE_KICK','FURY_SWIPES','TAKE_DOWN','DOUBLE_EDGE','BODY_SLAM','ROCK_SLIDE'
]);

const STATUS_MOVES = new Set([
  'GROWL','LEER','TAIL_WHIP','SAND_ATTACK','SMOKESCREEN','STRING_SHOT','SCARY_FACE',
  'THUNDER_WAVE','POISON_POWDER','TOXIC','SLEEP_POWDER','CONFUSE_RAY','SWEET_KISS',
  'LEECH_SEED'
]);

const SELF_BUFF_MOVES = new Set([
  'MEDITATE','SWORDS_DANCE','NASTY_PLOT','AGILITY','CALM_MIND','RECOVER','SOFT_BOILED',
  'REFLECT','LIGHT_SCREEN','RAIN_DANCE','SUNNY_DAY','SANDSTORM'
]);

// Devuelve { anims, impactDelay, hasImpact, totalDuration }.
//
//   - `anims`        — lista de animaciones para encolar en activeAnimsRef.
//   - `impactDelay`  — ms desde el inicio hasta el "momento de impacto".
//                      BattleScreen espera este tiempo antes de aplicar daño,
//                      mostrar número volador y reproducir el sonido de golpe.
//   - `hasImpact`    — false para movimientos sin daño (status, buffs), para
//                      que el caller omita el shake/flash universal.
//   - `totalDuration` — duración total estimada de la animación principal,
//                      útil para esperar después del impacto.
export const getMoveAnimation = (moveKey, isPlayer, W, H, moveType) => {
  const pPos = { x: W * 0.22, y: H * 0.68 };
  const ePos = { x: W * 0.75, y: H * 0.38 };

  const start    = isPlayer ? pPos : ePos;
  const end      = isPlayer ? ePos : pPos;
  const target   = isPlayer ? 'enemy' : 'player';
  const attacker = isPlayer ? 'player' : 'enemy';

  const anims = [];
  const typeColor = (moveType && TYPE_COLORS[moveType]) ? TYPE_COLORS[moveType].flash : '#ff3b30';
  const typeParticle = (moveType && TYPE_COLORS[moveType]) ? TYPE_COLORS[moveType].particle : '#ff3b30';

  const isContact = CONTACT_MOVES.has(moveKey);
  const isStatus  = STATUS_MOVES.has(moveKey);
  const isSelfBuff = SELF_BUFF_MOVES.has(moveKey);
  const hasImpact = !isStatus && !isSelfBuff;

  // ── Anticipación: lunge para movimientos de contacto ───────────────────
  // El atacante se lanza hacia el defensor (Crystal style). El pico
  // del seno ocurre a la mitad de la duración → ahí cae el impacto.
  let impactDelay;
  if (isContact) {
    const lungeDur = 320;
    anims.push(createAnimation(ANIM_TYPES.LUNGE, {
      attacker, target, duration: lungeDur, amount: 26
    }));
    impactDelay = 160; // pico del lunge
  } else if (isSelfBuff || isStatus) {
    impactDelay = 0; // los efectos se aplican al final de la animación
  } else {
    impactDelay = 280; // proyectil viaja ~280ms por defecto
  }

  switch (moveKey) {
    // ── CONTACT MOVES ─────────────────────────────────────────────────
    case 'TACKLE':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 280, delay: impactDelay, color: '#f3f4f6' }));
      break;

    case 'SCRATCH':
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x, y: end.y, duration: 320, delay: impactDelay, color: '#f3f4f6' }));
      break;

    case 'PECK':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 240, delay: impactDelay, color: '#ffffff' }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x + 6, y: end.y + 4, duration: 240, delay: impactDelay + 80, color: '#ffffff' }));
      break;

    case 'QUICK_ATTACK':
      // Lunge más rápido + estela
      anims[0].duration = 220; // acortar el lunge
      impactDelay = 110;
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 200, delay: impactDelay, color: '#ffffff' }));
      anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
        x: start.x + (end.x - start.x) * 0.3, y: start.y + (end.y - start.y) * 0.3,
        vx: (end.x - start.x) * 0.6, vy: (end.y - start.y) * 0.6,
        duration: 200, color: '#fde68a', size: 4, shape: 'circle', gravity: 0
      }));
      break;

    case 'VINE_WHIP':
      anims.push(createAnimation(ANIM_TYPES.CROSS_SLASH, { x: end.x, y: end.y, duration: 300, delay: impactDelay, color: '#059669' }));
      break;

    case 'WING_ATTACK':
      for (let i = 0; i < 3; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (i - 1) * 6, y: end.y - 14,
          vx: (i - 1) * 25, vy: 35, duration: 250, delay: impactDelay,
          color: '#cbd5e1', shape: 'circle', size: 5, gravity: 0
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x, y: end.y, duration: 320, delay: impactDelay, color: '#e2e8f0' }));
      break;

    case 'BITE':
      // 2 mandíbulas que cierran sobre el target
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x - 8, y: end.y - 4, duration: 220, delay: impactDelay, color: '#1f2937' }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x + 8, y: end.y + 4, duration: 220, delay: impactDelay + 40, color: '#1f2937' }));
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x, y: end.y, duration: 280, delay: impactDelay + 100, color: '#374151' }));
      break;

    case 'SLASH':
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x, y: end.y, duration: 320, delay: impactDelay, color: '#f3f4f6' }));
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x + 4, y: end.y + 4, duration: 320, delay: impactDelay + 100, color: '#f3f4f6' }));
      break;

    case 'DOUBLE_KICK':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x - 6, y: end.y + 4, duration: 240, delay: impactDelay, color: '#dc2626' }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x + 6, y: end.y - 2, duration: 240, delay: impactDelay + 220, color: '#dc2626' }));
      // Segundo lunge para el segundo golpe
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 220, delay: 320, amount: 18 }));
      break;

    case 'FURY_SWIPES':
      for (let i = 0; i < 5; i++) {
        anims.push(createAnimation(ANIM_TYPES.SLASH, {
          x: end.x + (Math.random() - 0.5) * 16,
          y: end.y + (Math.random() - 0.5) * 16,
          duration: 220, delay: impactDelay + i * 80, color: '#f3f4f6'
        }));
      }
      break;

    case 'TAKE_DOWN':
    case 'DOUBLE_EDGE':
      // Lunge más fuerte + impacto contundente
      anims[0].amount = 36;
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 350, delay: impactDelay, color: '#fde68a' }));
      anims.push(createAnimation(ANIM_TYPES.CRITICAL_FLASH, { duration: 250, delay: impactDelay }));
      break;

    case 'BODY_SLAM':
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 380, delay: impactDelay, color: '#f3f4f6' }));
      anims.push(createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 380, delay: impactDelay, amount: 10 }));
      break;

    case 'ROCK_SLIDE':
      // Lluvia de "rocas" cayendo sobre el target
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 50,
          y: end.y - 50,
          vx: (Math.random() - 0.5) * 6, vy: 60,
          duration: 380, delay: i * 50,
          color: i % 2 === 0 ? '#78716c' : '#a8a29e',
          size: 6, gravity: 80
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, delay: impactDelay + 200, color: '#a8a29e' }));
      impactDelay = 360;
      break;

    // ── PROJECTILE / SPECIAL MOVES ────────────────────────────────────
    case 'EMBER':
      for (let i = 0; i < 4; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * 1.1 + (i % 2 === 0 ? 15 : -15),
          vy: (end.y - start.y) * 1.1 + (i < 2 ? 15 : -15),
          duration: 320 + i * 15,
          color: '#ef4444', shape: 'circle', size: 6, gravity: 0
        }));
      }
      impactDelay = 280;
      break;

    case 'FLAMETHROWER':
      // Flujo continuo de partículas de fuego
      for (let i = 0; i < 12; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * 1.0 + (Math.random() - 0.5) * 18,
          vy: (end.y - start.y) * 1.0 + (Math.random() - 0.5) * 14,
          duration: 380, delay: i * 30,
          color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f97316' : '#ef4444',
          shape: 'circle', size: 7, gravity: 0
        }));
      }
      impactDelay = 320;
      break;

    case 'FIRE_BLAST':
      // Estrella de fuego enorme
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x, y: end.y,
          vx: Math.cos(angle) * 60, vy: Math.sin(angle) * 60,
          duration: 500, delay: impactDelay,
          color: i % 2 === 0 ? '#f97316' : '#fbbf24',
          shape: 'star', size: 9, gravity: 0
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 400, delay: impactDelay, color: '#fbbf24' }));
      break;

    case 'WATER_GUN':
      for (let i = 0; i < 8; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * 1.1, vy: (end.y - start.y) * 1.1 + (Math.random() - 0.5) * 12,
          duration: 280 + i * 15,
          color: '#38bdf8', shape: 'circle', size: 6, gravity: 0
        }));
      }
      impactDelay = 260;
      break;

    case 'SURF':
      // Ola: ráfaga ancha
      for (let i = 0; i < 14; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + (i - 7) * 4, y: start.y,
          vx: (end.x - start.x) * 1.0, vy: (end.y - start.y) * 1.0 + (Math.random() - 0.5) * 18,
          duration: 380, delay: i * 18,
          color: i % 2 === 0 ? '#3b82f6' : '#7dd3fc',
          shape: 'circle', size: 7, gravity: 0
        }));
      }
      impactDelay = 350;
      break;

    case 'THUNDER_SHOCK':
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 150 }));
      anims.push(createAnimation(ANIM_TYPES.LIGHTNING, { x: end.x, y: end.y, duration: 280, delay: 150, color: '#facc15' }));
      impactDelay = 250;
      break;

    case 'THUNDERBOLT':
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 180 }));
      anims.push(createAnimation(ANIM_TYPES.LIGHTNING, { x: end.x - 10, y: end.y, duration: 320, delay: 150, color: '#facc15' }));
      anims.push(createAnimation(ANIM_TYPES.LIGHTNING, { x: end.x + 10, y: end.y, duration: 320, delay: 200, color: '#fef08a' }));
      impactDelay = 280;
      break;

    case 'THUNDER':
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 250 }));
      anims.push(createAnimation(ANIM_TYPES.LIGHTNING, { x: end.x, y: end.y, duration: 420, delay: 200, color: '#fef08a' }));
      anims.push(createAnimation(ANIM_TYPES.CRITICAL_FLASH, { duration: 220, delay: 200 }));
      impactDelay = 320;
      break;

    case 'ICE_BEAM':
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * 1.1, vy: (end.y - start.y) * 1.1,
          duration: 320, delay: i * 35,
          color: i % 2 === 0 ? '#7dd3fc' : '#bae6fd',
          shape: 'star', size: 7, gravity: 0
        }));
      }
      impactDelay = 320;
      break;

    case 'BLIZZARD':
      for (let i = 0; i < 18; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + (Math.random() - 0.5) * 40,
          y: start.y + (Math.random() - 0.5) * 20,
          vx: (end.x - start.x) * 1.0 + (Math.random() - 0.5) * 20,
          vy: (end.y - start.y) * 1.0 + (Math.random() - 0.5) * 25,
          duration: 420, delay: i * 18,
          color: i % 2 === 0 ? '#a5f3fc' : '#bae6fd',
          shape: 'star', size: 5 + Math.random() * 3, gravity: 0
        }));
      }
      impactDelay = 360;
      break;

    case 'CONFUSION':
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, color: '#a855f7' }));
      impactDelay = 280;
      break;

    case 'PSYCHIC_ATK':
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 480, color: '#ec4899' }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 480, delay: 150, color: '#f472b6' }));
      anims.push(createAnimation(ANIM_TYPES.TYPE_FLASH, { color: '#ec4899', duration: 300, delay: impactDelay }));
      break;

    case 'SHADOW_BALL':
      anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
        x: start.x, y: start.y,
        vx: (end.x - start.x) * 1.0, vy: (end.y - start.y) * 1.0,
        duration: 340, color: '#7c3aed',
        shape: 'circle', size: 14, gravity: 0
      }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 320, delay: impactDelay, color: '#8b5cf6' }));
      break;

    case 'SLUDGE_BOMB':
      for (let i = 0; i < 5; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y,
          vx: (end.x - start.x) * 1.0 + (Math.random() - 0.5) * 22,
          vy: (end.y - start.y) * 1.0 - 10,
          duration: 380, delay: i * 35,
          color: i % 2 === 0 ? '#a855f7' : '#c084fc',
          shape: 'circle', size: 9, gravity: 30
        }));
      }
      impactDelay = 340;
      break;

    case 'EARTHQUAKE':
      anims.push(createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 700, amount: 14 }));
      // Polvo subiendo del suelo bajo el target
      for (let i = 0; i < 8; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (i - 4) * 10, y: end.y + 16,
          vx: (Math.random() - 0.5) * 8, vy: -25,
          duration: 500, delay: 100 + i * 30,
          color: '#b45309', size: 5, gravity: 60
        }));
      }
      impactDelay = 200;
      break;

    case 'GUST':
      anims.push(createAnimation(ANIM_TYPES.WIND_SWIRL, { x: end.x, y: end.y, duration: 600 }));
      impactDelay = 300;
      break;

    // ── STATUS MOVES (no impacto/daño) ────────────────────────────────
    case 'GROWL':
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 300, amount: 15 }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: start.x, y: start.y, duration: 500, color: '#60a5fa' }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, delay: 300, color: '#bfdbfe' }));
      break;

    case 'LEER':
    case 'SCARY_FACE':
      anims.push(createAnimation(ANIM_TYPES.LEER_EYES, { x: end.x, y: end.y - 12, duration: 600 }));
      break;

    case 'TAIL_WHIP':
      anims.push(createAnimation(ANIM_TYPES.SHAKE, { target: attacker, duration: 400, amount: 15 }));
      for (let i = 0; i < 5; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 20, y: end.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 10, vy: 20 + Math.random() * 20,
          duration: 400, color: '#60a5fa', size: 3, gravity: 10
        }));
      }
      break;

    case 'SAND_ATTACK':
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 200, amount: -8 }));
      for (let i = 0; i < 10; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x, y: start.y + 10,
          vx: (end.x - start.x) * 0.9 + (Math.random() - 0.5) * 25,
          vy: (end.y - start.y) * 0.9 - 10,
          duration: 400 + i * 20,
          color: i % 2 === 0 ? '#b45309' : '#d97706',
          size: 4, gravity: 25
        }));
      }
      break;

    case 'SMOKESCREEN':
      for (let i = 0; i < 12; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 30,
          y: end.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 18, vy: -10 - Math.random() * 10,
          duration: 500 + Math.random() * 200,
          color: '#374151', shape: 'circle', size: 8, gravity: -15
        }));
      }
      break;

    case 'POISON_POWDER':
    case 'SLEEP_POWDER':
    case 'STRING_SHOT':
    case 'TOXIC': {
      const c1 = moveKey === 'SLEEP_POWDER' ? '#86efac' : moveKey === 'STRING_SHOT' ? '#e5e7eb' : '#a855f7';
      const c2 = moveKey === 'SLEEP_POWDER' ? '#4ade80' : moveKey === 'STRING_SHOT' ? '#9ca3af' : '#ec4899';
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 350, amount: 10 }));
      for (let i = 0; i < 15; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 50,
          y: end.y - 45 + Math.random() * 15,
          vx: (Math.random() - 0.5) * 15, vy: 15 + Math.random() * 15,
          duration: 600 + Math.random() * 300,
          color: i % 2 === 0 ? c1 : c2,
          shape: 'star', size: 4 + Math.random() * 3, gravity: 5
        }));
      }
      break;
    }

    case 'THUNDER_WAVE':
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, color: '#eab308' }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, delay: 150, color: '#fbbf24' }));
      break;

    case 'CONFUSE_RAY':
    case 'SWEET_KISS':
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 600, color: moveKey === 'SWEET_KISS' ? '#f472b6' : '#a855f7' }));
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x, y: end.y,
          vx: Math.cos(i / 6 * Math.PI * 2) * 30,
          vy: Math.sin(i / 6 * Math.PI * 2) * 30,
          duration: 500, delay: 100,
          color: moveKey === 'SWEET_KISS' ? '#f9a8d4' : '#c084fc',
          shape: 'star', size: 5, gravity: 0
        }));
      }
      break;

    case 'LEECH_SEED':
      // Semilla viaja al target
      anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
        x: start.x, y: start.y,
        vx: (end.x - start.x) * 1.0, vy: (end.y - start.y) * 1.0 - 30,
        duration: 450, color: '#65a30d', shape: 'circle', size: 6, gravity: 40
      }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, delay: 380, color: '#65a30d' }));
      break;

    // ── SELF BUFF / HEAL / WEATHER ─────────────────────────────────────
    case 'RECOVER':
    case 'SOFT_BOILED': {
      const heal_color = moveKey === 'SOFT_BOILED' ? '#f9a8d4' : '#86efac';
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + Math.cos(angle) * 30,
          y: start.y + Math.sin(angle) * 30 + 30,
          vx: -Math.cos(angle) * 20, vy: -Math.sin(angle) * 20 - 30,
          duration: 600, delay: i * 30,
          color: heal_color, shape: 'star', size: 5, gravity: 0
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: start.x, y: start.y, duration: 500, color: heal_color }));
      break;
    }

    case 'SWORDS_DANCE':
    case 'MEDITATE':
    case 'CALM_MIND':
    case 'NASTY_PLOT':
    case 'AGILITY': {
      const buffColor =
        moveKey === 'SWORDS_DANCE' ? '#dc2626' :
        moveKey === 'NASTY_PLOT'   ? '#7c3aed' :
        moveKey === 'AGILITY'      ? '#3b82f6' :
        '#a78bfa';
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 500, amount: 12 }));
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + Math.cos(angle) * 24,
          y: start.y + Math.sin(angle) * 24,
          vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8 - 12,
          duration: 500, delay: i * 35,
          color: buffColor, shape: 'star', size: 4, gravity: 0
        }));
      }
      break;
    }

    case 'REFLECT':
    case 'LIGHT_SCREEN': {
      const c = moveKey === 'REFLECT' ? '#60a5fa' : '#fde047';
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: start.x, y: start.y, duration: 600, color: c }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: start.x, y: start.y, duration: 600, delay: 200, color: c }));
      break;
    }

    case 'RAIN_DANCE':
    case 'SUNNY_DAY':
    case 'SANDSTORM': {
      const c = moveKey === 'RAIN_DANCE' ? '#3b82f6'
              : moveKey === 'SUNNY_DAY' ? '#fbbf24'
              : '#b45309';
      anims.push(createAnimation(ANIM_TYPES.TYPE_FLASH, { color: c, duration: 600 }));
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 400, amount: 14 }));
      break;
    }

    default:
      // Movimiento sin animación específica → impacto genérico
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, delay: impactDelay, color: '#fff' }));
  }

  // ── Universal: shake + sprite flash + screen shake EN EL IMPACTO ──
  if (hasImpact) {
    anims.push(createAnimation(ANIM_TYPES.SHAKE,        { target, duration: 450, delay: impactDelay, amount: 12 }));
    anims.push(createAnimation(ANIM_TYPES.FLASH_SPRITE, { target, duration: 500, delay: impactDelay, color: typeColor }));
    anims.push(createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 380, delay: impactDelay, amount: 6 }));
    if (moveType && TYPE_COLORS[moveType]) {
      anims.push(createAnimation(ANIM_TYPES.TYPE_FLASH, { color: typeColor, duration: 320, delay: impactDelay }));
    }
  }

  // Duración total estimada: máx(delay + duration) entre todos los anims.
  const totalDuration = anims.reduce((m, a) => Math.max(m, (a.delay || 0) + (a.duration || 0)), 0);

  return { anims, impactDelay, hasImpact, totalDuration };
};

// ─── Status effect tint overlay ────────────────────────────────────────────
// Returns { color, alpha } to tint a sprite based on its status condition.
// `pulse` is an accumulating timer (ms) used to animate the effect.

export const getStatusTint = (status, pulse) => {
  if (!status) return null;
  const t = pulse / 1000; // seconds
  switch (status) {
    case 'poison': {
      // Slow purple pulse (every 2s)
      const a = (Math.sin(t * Math.PI) * 0.5 + 0.5) * 0.55;
      return { color: '#a855f7', alpha: a };
    }
    case 'paralysis': {
      // Random yellow static flicker
      const flicker = Math.random() < 0.06 ? 0.75 : 0.0;
      return { color: '#facc15', alpha: flicker };
    }
    case 'burn': {
      // Steady warm orange shimmer
      const a = 0.22 + Math.sin(t * Math.PI * 1.5) * 0.12;
      return { color: '#f97316', alpha: a };
    }
    case 'freeze': {
      // Icy blue constant overlay
      return { color: '#a5f3fc', alpha: 0.38 };
    }
    case 'sleep':
      return null; // Sleep uses floating ZZZ text instead
    default:
      return null;
  }
};

// Returns floating "ZZZ" positions for sleep animation
export const getSleepZzzText = (pulse, spriteX, spriteY) => {
  const t = pulse / 1000;
  const idx = Math.floor(t * 1.5) % 3; // which Z is visible
  return Array.from({ length: idx + 1 }, (_, i) => ({
    text: 'Z',
    x: spriteX + 28 + i * 7,
    y: spriteY - 30 - i * 10 + Math.sin(t * 2 + i) * 3,
    alpha: Math.max(0, 1 - (t * 1.5 % 1)) * (0.5 + i * 0.25)
  }));
};
