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
  const nextAnims = anims
    .map(a => ({ ...a, timer: a.timer + dt }))
    .filter(a => a.timer < a.duration + (a.delay || 0));

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
      case ANIM_TYPES.FAINT: {
        // Slide down + fade out + red tint
        const drop = t * 80;
        const alpha = 1 - t;
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
          const targetX = (i === steps) ? a.x : a.x + (Math.random() - 0.5) * 24;
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

export const getMoveAnimation = (moveKey, isPlayer, W, H, moveType) => {
  const pPos = { x: W * 0.22, y: H * 0.68 };
  const ePos = { x: W * 0.75, y: H * 0.38 };

  const start    = isPlayer ? pPos : ePos;
  const end      = isPlayer ? ePos : pPos;
  const target   = isPlayer ? 'enemy' : 'player';
  const attacker = isPlayer ? 'player' : 'enemy';

  const anims = [];

  switch (moveKey) {
    case 'TACKLE':
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 250, amount: 26 }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 250, color: '#f3f4f6' }));
      for (let i = 0; i < 4; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x, y: end.y,
          vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50,
          duration: 300, color: '#cbd5e1', size: 4, gravity: 0
        }));
      }
      break;

    case 'SCRATCH':
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 200, amount: 20 }));
      anims.push(createAnimation(ANIM_TYPES.SLASH, { x: end.x, y: end.y, duration: 350, color: '#f3f4f6' }));
      break;

    case 'PECK':
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 200, amount: 22 }));
      // Triple peck hits with delay
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x - 8, y: end.y + 4, duration: 150, color: '#fff' }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x + 8, y: end.y - 4, duration: 150, delay: 90, color: '#fff' }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 150, delay: 180, color: '#f3f4f6' }));
      break;

    case 'QUICK_ATTACK':
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 150, amount: 35 }));
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 150 }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 200, color: '#ffffff' }));
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + (end.x - start.x) * (i / 6),
          y: start.y + (end.y - start.y) * (i / 6),
          vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
          duration: 250, color: '#ffffff', size: 3, gravity: 0
        }));
      }
      break;

    case 'EMBER':
      for (let i = 0; i < 9; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x + (Math.random() - 0.5) * 15,
          y: start.y + (Math.random() - 0.5) * 15,
          vx: (end.x - start.x) * (0.82 + Math.random() * 0.25) + (Math.random() - 0.5) * 30,
          vy: (end.y - start.y) * (0.82 + Math.random() * 0.25) - 15 - Math.random() * 15,
          duration: 450 + i * 40,
          color: i % 2 === 0 ? '#ef4444' : '#fbbf24', // red/yellow sparks
          shape: 'circle',
          size: 5 + Math.random() * 5,
          gravity: -6 // rising sparks!
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 250, color: '#f97316' }));
      break;

    case 'WATER_GUN':
      for (let i = 0; i < 12; i++) {
        const offsetVal = (Math.random() - 0.5) * 14;
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x,
          y: start.y,
          vx: (end.x - start.x) * (0.88 + i * 0.015),
          vy: (end.y - start.y) + offsetVal,
          duration: 350 + i * 25,
          color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#0284c7' : '#ffffff',
          shape: 'circle',
          size: 6 + Math.random() * 4,
          gravity: 4
        }));
      }
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#3b82f6' }));
      break;

    case 'VINE_WHIP':
      anims.push(createAnimation(ANIM_TYPES.CROSS_SLASH, { x: end.x, y: end.y, duration: 400, color: '#10b981' }));
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 30,
          y: end.y - 10 + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 20 - 10,
          vy: 10 + Math.random() * 20,
          duration: 500,
          color: i % 2 === 0 ? '#059669' : '#34d399', // leaves
          shape: 'star',
          size: 5,
          gravity: 12
        }));
      }
      break;

    case 'THUNDER_SHOCK':
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 250 }));
      for (let i = 0; i < 3; i++) {
        anims.push(createAnimation(ANIM_TYPES.LIGHTNING, { x: end.x + (i - 1) * 12, y: end.y, duration: 300 + i * 50, color: '#facc15' }));
      }
      for (let i = 0; i < 8; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 35,
          y: end.y + (Math.random() - 0.5) * 35,
          vx: (Math.random() - 0.5) * 45,
          vy: (Math.random() - 0.5) * 45,
          duration: 300 + Math.random() * 200,
          color: '#fbbf24',
          shape: 'star',
          size: 4 + Math.random() * 3,
          gravity: 0
        }));
      }
      break;

    case 'THUNDER_WAVE':
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, color: '#eab308' }));
      for (let i = 0; i < 6; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 25,
          y: end.y + (Math.random() - 0.5) * 25,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          duration: 400,
          color: '#fef08a',
          shape: 'circle',
          size: 4,
          gravity: 0
        }));
      }
      break;

    case 'CONFUSION':
      anims.push(createAnimation(ANIM_TYPES.FLASH, { duration: 400 }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 600, color: '#a855f7' }));
      for (let i = 0; i < 10; i++) {
        const radius = 25 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + Math.cos(angle) * radius,
          y: end.y + Math.sin(angle) * radius,
          vx: -Math.cos(angle) * 35,
          vy: -Math.sin(angle) * 35,
          duration: 500,
          color: i % 2 === 0 ? '#c084fc' : '#e9d5ff',
          shape: 'star',
          size: 4,
          gravity: 0
        }));
      }
      break;

    case 'GROWL':
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 300, amount: 15 }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: start.x, y: start.y, duration: 500, color: '#60a5fa' }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: start.x + (end.x - start.x) * 0.4, y: start.y + (end.y - start.y) * 0.4, duration: 500, delay: 150, color: '#93c5fd' }));
      anims.push(createAnimation(ANIM_TYPES.SOUNDWAVE, { x: end.x, y: end.y, duration: 500, delay: 300, color: '#bfdbfe' }));
      break;

    case 'LEER':
      anims.push(createAnimation(ANIM_TYPES.LEER_EYES, { x: end.x, y: end.y - 12, duration: 600 }));
      break;

    case 'TAIL_WHIP':
      anims.push(createAnimation(ANIM_TYPES.SHAKE, { target: attacker, duration: 400, amount: 15 }));
      for (let i = 0; i < 5; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 20,
          y: end.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 10,
          vy: 20 + Math.random() * 20,
          duration: 400,
          color: '#60a5fa',
          size: 3,
          gravity: 10
        }));
      }
      break;

    case 'GUST':
      anims.push(createAnimation(ANIM_TYPES.WIND_SWIRL, { x: end.x, y: end.y, duration: 700 }));
      for (let i = 0; i < 8; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 40,
          y: end.y + 20,
          vx: (Math.random() - 0.5) * 10,
          vy: -35 - Math.random() * 25,
          duration: 500 + Math.random() * 200,
          color: '#f1f5f9',
          shape: 'circle',
          size: 3 + Math.random() * 3,
          gravity: -8
        }));
      }
      break;

    case 'SAND_ATTACK':
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 200, amount: -8 }));
      for (let i = 0; i < 10; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: start.x,
          y: start.y + 10,
          vx: (end.x - start.x) * (0.8 + Math.random() * 0.3) + (Math.random() - 0.5) * 25,
          vy: (end.y - start.y) * (0.8 + Math.random() * 0.3) - 10 - Math.random() * 10,
          duration: 400 + i * 20,
          color: i % 2 === 0 ? '#b45309' : '#d97706', // sand dust
          size: 3 + Math.random() * 3,
          gravity: 25
        }));
      }
      break;

    case 'POISON_POWDER':
      anims.push(createAnimation(ANIM_TYPES.BOUNCE, { target: attacker, duration: 350, amount: 10 }));
      for (let i = 0; i < 15; i++) {
        anims.push(createAnimation(ANIM_TYPES.PARTICLE, {
          x: end.x + (Math.random() - 0.5) * 50,
          y: end.y - 45 + Math.random() * 15,
          vx: (Math.random() - 0.5) * 15,
          vy: 15 + Math.random() * 15,
          duration: 600 + Math.random() * 300,
          color: i % 2 === 0 ? '#a855f7' : '#ec4899', // poison violet
          shape: 'star',
          size: 4 + Math.random() * 3,
          gravity: 5
        }));
      }
      break;

    default:
      anims.push(createAnimation(ANIM_TYPES.LUNGE, { attacker, target, duration: 250, amount: 20 }));
      anims.push(createAnimation(ANIM_TYPES.STRIKE, { x: end.x, y: end.y, duration: 300, color: '#fff' }));
  }

  // Universal: damage shake + type-colored sprite flash + screen shake
  const typeColor = (moveType && TYPE_COLORS[moveType]) ? TYPE_COLORS[moveType].flash : '#ff3b30';
  anims.push(createAnimation(ANIM_TYPES.SHAKE,        { target, duration: 450, amount: 12 }));
  anims.push(createAnimation(ANIM_TYPES.FLASH_SPRITE, { target, duration: 500, color: typeColor }));
  anims.push(createAnimation(ANIM_TYPES.SCREEN_SHAKE, { duration: 400, amount: 6 }));
  // Type-colored screen tint (Essentials style)
  if (moveType && TYPE_COLORS[moveType]) {
    anims.push(createAnimation(ANIM_TYPES.TYPE_FLASH,  { color: typeColor, duration: 350 }));
  }

  return anims;
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
