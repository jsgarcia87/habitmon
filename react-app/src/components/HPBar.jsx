import React, { useState, useEffect } from 'react';
import { getAssetPath } from '../api/assets';
import { sfx } from '../utils/audioEngine';

const HPBar = ({ current, max, alignment = 'player', name = 'PKMN', level = 5, status = null }) => {
  // Ensure we have numbers. Fallback to 1/1 if data is missing to avoid NaN.
  const cur = Number(current) || 0;
  const mx = Number(max) || 100;
  
  const [displayCur, setDisplayCur] = useState(cur);

  useEffect(() => {
    if (displayCur === cur) return;
    
    const diff = cur - displayCur;
    const durationMs = 600; // 0.6s
    let startTimestamp = null;
    let startVal = displayCur;
    let lastTickVal = Math.floor(displayCur);
    
    let rafId;
    const updateHP = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const t = Math.min(1, elapsed / durationMs);
      
      const nextVal = startVal + diff * t;
      setDisplayCur(nextVal);
      
      if (Math.floor(nextVal) < lastTickVal) {
        lastTickVal = Math.floor(nextVal);
        sfx.dmgPop();
      }
      
      if (t < 1) {
        rafId = requestAnimationFrame(updateHP);
      } else {
        setDisplayCur(cur);
      }
    };
    rafId = requestAnimationFrame(updateHP);
    return () => cancelAnimationFrame(rafId);
  }, [cur]);

  const pct = Math.max(0, Math.min(100, (displayCur / mx) * 100));

  // Status colors/text
  const STATUS_MAP = {
    paralysis: { text: 'PAR', color: '#F8D030' },
    poison: { text: 'PSN', color: '#A040A0' },
    burn: { text: 'BRN', color: '#F08030' },
    freeze: { text: 'FRZ', color: '#98D8D8' },
    sleep: { text: 'SLP', color: '#A8A878' }
  };
  const activeStatus = STATUS_MAP[status];

  // Pokemon HP Colors: Green > 50%, Yellow > 20%, Red <= 20%
  let hpColor = '#00FF00'; // Green
  if (pct <= 20) hpColor = '#FF0000'; // Red
  else if (pct <= 50) hpColor = '#F8D030'; // Yellow

  // Databox positioning
  const isPlayer = alignment === 'player';
  
  return (
    <div style={{
      width: 160,
      height: 50,
      position: 'relative',
      backgroundImage: `url(${getAssetPath(isPlayer ? 'Graphics/pictures/battle/databox_normal.png' : 'Graphics/pictures/battle/databox_normal_foe.png')})`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      imageRendering: 'pixelated',
      padding: '8px'
    }}>
      {/* Name */}
      <div style={{
        position: 'absolute',
        top: 6,
        left: isPlayer ? 24 : 8,
        fontFamily: '"Press Start 2P"',
        fontSize: 7,
        color: '#333'
      }}>
        {String(name || 'PKMN').toUpperCase()}
      </div>

      {/* Level */}
      <div style={{
        position: 'absolute',
        top: 6,
        right: isPlayer ? 8 : 24,
        fontFamily: '"Press Start 2P"',
        fontSize: 7,
        color: '#333'
      }}>
        Lv{level}
      </div>

      {/* Status Icon */}
      {activeStatus && (
        <div style={{
          position: 'absolute',
          top: 24,
          left: isPlayer ? 45 : 84,
          background: activeStatus.color,
          color: '#fff',
          fontSize: 5,
          padding: '2px 3px',
          borderRadius: 2,
          fontFamily: '"Press Start 2P"',
          border: '1px solid rgba(0,0,0,0.2)'
        }}>
          {activeStatus.text}
        </div>
      )}

      {/* HP Bar */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: isPlayer ? 84 : 24,
        width: 66,
        height: 4,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 1
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: hpColor,
          transition: 'background-color 0.3s'
        }} />
      </div>

      {/* HP Text (Current/Max) - Only for Player */}
      {isPlayer && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 10,
          fontFamily: '"Press Start 2P"',
          fontSize: 6,
          color: '#333'
        }}>
          {Math.ceil(displayCur)}/{mx}
        </div>
      )}
    </div>
  );
};

export default HPBar;
