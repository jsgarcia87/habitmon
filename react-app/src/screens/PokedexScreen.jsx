import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { POKEMON_SPECIES } from '../data/pokemonData';
import { getPokedexData, TYPE_COLORS, POKEDEX_ENTRIES } from '../data/pokedexData';
import { getAssetPath } from '../api';
import { sfx } from '../utils/audioEngine';
import '../components/PokedexDuo.css';

const PokedexScreen = ({ navigate }) => {
  const { coleccion, starter } = useGame();

  // Estados de la Pokédex Duo
  const [isOpen, setIsOpen] = useState(true);
  const [selectedId, setSelectedId] = useState('025'); // Pikachu por defecto o primer capturado
  const [keypadInput, setKeypadInput] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' o 'captured'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const keypadTimeoutRef = useRef(null);

  // Set de IDs capturados por el usuario (starter + colección)
  const capturedIds = useMemo(() => {
    const ids = new Set();
    if (starter?.starter_id) {
      ids.add(String(starter.starter_id).padStart(3, '0'));
    }
    (coleccion || []).forEach(pk => {
      if (pk.pokemon_id) {
        ids.add(String(pk.pokemon_id).padStart(3, '0'));
      }
    });
    return ids;
  }, [starter, coleccion]);

  // Lista consolidada de Pokémon conocidos en el juego
  const allPokemonList = useMemo(() => {
    const ids = Object.keys(POKEMON_SPECIES);
    // Incluir también los que tengan lore en POKEDEX_ENTRIES
    Object.keys(POKEDEX_ENTRIES).forEach(id => {
      if (!ids.includes(id)) ids.push(id);
    });
    ids.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    return ids.map(id => {
      const species = POKEMON_SPECIES[id] || {};
      const dexInfo = getPokedexData(id);
      const isCaptured = capturedIds.has(id);

      return {
        id,
        name: species.name || dexInfo.name,
        types: species.types || ['NORMAL'],
        baseStats: species.baseStats || { hp: 50, atk: 50, def: 50, spe: 50 },
        isCaptured,
        dexInfo
      };
    });
  }, [capturedIds]);

  // Lista filtrada según el modo seleccionado
  const displayList = useMemo(() => {
    if (filterMode === 'captured') {
      const filtered = allPokemonList.filter(p => p.isCaptured);
      return filtered.length > 0 ? filtered : allPokemonList;
    }
    return allPokemonList;
  }, [allPokemonList, filterMode]);

  // Seleccionar el primer capturado si está disponible al iniciar
  useEffect(() => {
    if (capturedIds.size > 0 && selectedId === '025' && !capturedIds.has('025')) {
      const firstCaptured = Array.from(capturedIds)[0];
      if (firstCaptured) setSelectedId(firstCaptured);
    }
  }, [capturedIds]);

  // Pokémon activo
  const currentPokemon = useMemo(() => {
    return allPokemonList.find(p => p.id === selectedId) || allPokemonList[0];
  }, [allPokemonList, selectedId]);

  // Manejo de Síntesis de Voz (Spoken facts)
  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const text = `${currentPokemon.name}. ${currentPokemon.dexInfo.category}. ${currentPokemon.dexInfo.description}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.92;
      utterance.pitch = 0.95;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
      setIsSpeaking(false);
    }
  };

  // Detener la voz al cambiar de Pokémon o desmontar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [selectedId, isOpen]);

  // Navegación secuencial
  const handleNavigateNext = () => {
    sfx.cursor?.();
    const currentIndex = displayList.findIndex(p => p.id === selectedId);
    const nextIndex = (currentIndex + 1) % displayList.length;
    setSelectedId(displayList[nextIndex].id);
  };

  const handleNavigatePrev = () => {
    sfx.cursor?.();
    const currentIndex = displayList.findIndex(p => p.id === selectedId);
    const prevIndex = (currentIndex - 1 + displayList.length) % displayList.length;
    setSelectedId(displayList[prevIndex].id);
  };

  // Lógica del Keypad Numérico
  const handleKeypadPress = (key) => {
    sfx.cursor?.();

    if (key === 'CLR') {
      setKeypadInput('');
      return;
    }

    if (key === 'ENT') {
      applyKeypadInput(keypadInput);
      return;
    }

    // Agregar dígito (máximo 3)
    const nextInput = (keypadInput + key).slice(0, 3);
    setKeypadInput(nextInput);

    // Si ya completó 3 dígitos, aplicar con pequeño retardo
    if (nextInput.length === 3) {
      if (keypadTimeoutRef.current) clearTimeout(keypadTimeoutRef.current);
      keypadTimeoutRef.current = setTimeout(() => {
        applyKeypadInput(nextInput);
      }, 350);
    }
  };

  const applyKeypadInput = (input) => {
    if (!input) return;
    const targetId = input.padStart(3, '0');
    const found = allPokemonList.find(p => p.id === targetId);

    if (found) {
      sfx.confirm?.();
      setSelectedId(found.id);
      setKeypadInput('');
    } else {
      sfx.cancel?.();
      setKeypadInput('ERR');
      setTimeout(() => setKeypadInput(''), 600);
    }
  };

  // Atajos de teclado físicos (D-Pad, números, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Enter') {
        handleKeypadPress('ENT');
      } else if (e.key === 'Backspace') {
        handleKeypadPress('CLR');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNavigateNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handleNavigatePrev();
      } else if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        navigate('city');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, keypadInput, selectedId, displayList]);

  // ==========================================================================
  // RENDER: VISTA CERRADA (Tapa / Cover)
  // ==========================================================================
  if (!isOpen) {
    return (
      <div className="pokedex-duo-wrapper">
        <div 
          className="pokedex-folded-cover" 
          onClick={() => {
            sfx.menuOpen?.();
            setIsOpen(true);
          }}
          title="Toca para abrir la Pokédex"
        >
          {/* Header con la gran lente */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="pokedex-main-lens-housing">
              <div className="pokedex-main-lens" />
            </div>
            <div className="pokedex-mini-leds">
              <div className="mini-led led-red" />
              <div className="mini-led led-yellow" />
              <div className="mini-led led-green" />
            </div>
          </div>

          {/* Grabado central de la Pokéball */}
          <div className="pokedex-pokeball-emboss">
            <div className="pokeball-inner-button" />
          </div>

          {/* Prompt de apertura */}
          <div>
            <div className="pokedex-tap-prompt">
              ▼ TOCAR PARA ABRIR POKÉDEX
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('city');
              }}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '10px',
                background: '#1e293b',
                color: '#94a3b8',
                border: '2px solid #0f172a',
                borderRadius: '6px',
                fontSize: '7px',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              SALIR A LA CIUDAD (B)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: VISTA ABIERTA (Doble Pantalla / Pokédex Duo)
  // ==========================================================================
  const spriteSrc = getAssetPath(`/Graphics/battlers/${currentPokemon.id}.png`);

  return (
    <div className="pokedex-duo-wrapper">
      <div className="pokedex-duo-chassis">
        
        {/* ==================================================================
            PANEL IZQUIERDO — Pantalla Principal y Visualizador
            ================================================================== */}
        <div className="pokedex-panel-left">
          {/* Barra superior de luces */}
          <div className="pokedex-header-lights">
            <div 
              className="pokedex-main-lens-housing" 
              onClick={toggleSpeech}
              title="Toca la lente para escuchar la descripción"
            >
              <div className="pokedex-main-lens" />
            </div>

            <div className="pokedex-mini-leds">
              <div className="mini-led led-red" />
              <div className="mini-led led-yellow" />
              <div className="mini-led led-green" />
            </div>

            <div className="pokedex-speaker-grill">
              <div className="speaker-slit" />
              <div className="speaker-slit" />
              <div className="speaker-slit" />
            </div>
          </div>

          {/* Marco de Pantalla Principal */}
          <div className="pokedex-screen-housing">
            <div className="pokedex-housing-dots">
              <div className="dot-indicator" />
              <div className="dot-indicator" />
            </div>

            <div className="pokedex-lcd-screen">
              <div className="pokedex-sprite-container">
                <img 
                  src={spriteSrc} 
                  alt={currentPokemon.name}
                  className="pokedex-sprite"
                  onError={(e) => {
                    // Fallback a imagen por defecto si faltara
                    e.target.src = getAssetPath('/Graphics/battlers/016.png');
                  }}
                />
              </div>

              <div className="pokedex-pokemon-title">
                No.{currentPokemon.id} {currentPokemon.name.toUpperCase()}
              </div>

              {/* Badges de Tipo */}
              <div className="pokedex-types-bar">
                {currentPokemon.types.map(t => {
                  const style = TYPE_COLORS[t] || { bg: '#888', border: '#444' };
                  return (
                    <span 
                      key={t} 
                      className="pokedex-type-badge" 
                      style={{ background: style.bg, borderColor: style.border }}
                    >
                      {t}
                    </span>
                  );
                })}
              </div>

              {/* Medidas Altura / Peso */}
              <div className="pokedex-measurements">
                <span>ALT: {currentPokemon.dexInfo.height}</span>
                <span>PESO: {currentPokemon.dexInfo.weight}</span>
              </div>
            </div>

            {/* Cuadro de Lore / Entrada de la Pokédex */}
            <div className="pokedex-entry-box">
              <div style={{ color: '#0369a1', marginBottom: '4px', fontWeight: 'bold' }}>
                {currentPokemon.dexInfo.category}
              </div>
              {currentPokemon.dexInfo.description}
            </div>
          </div>

          {/* Barra inferior izquierda: Voz y estado de captura */}
          <div className="pokedex-left-bottom-bar">
            <button 
              className={`pokedex-audio-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={toggleSpeech}
              title="Escuchar descripción hablada"
            >
              <span>{isSpeaking ? '⏹ DETENER' : '🔊 VOZ'}</span>
            </button>

            <div style={{ fontSize: '7px', color: '#fff', textShadow: '1px 1px 0 #000' }}>
              {currentPokemon.isCaptured ? '⭐ REGISTRADO' : '🔍 AVISTADO'}
            </div>
          </div>
        </div>

        {/* ==================================================================
            BISAGRA CENTRAL METÁLICA
            ================================================================== */}
        <div className="pokedex-hinge">
          <div className="hinge-groove" />
          <div className="hinge-groove" />
          <div className="hinge-groove" />
        </div>

        {/* ==================================================================
            PANEL DERECHO — Control Deck, Keypad y Estadísticas
            ================================================================== */}
        <div className="pokedex-panel-right">
          
          {/* Pantalla Secundaria: Stats del Pokémon */}
          <div className="pokedex-sub-screen">
            <div className="pokedex-sub-screen-header">
              <span>ESTADÍSTICAS BASE</span>
              <span style={{ color: currentPokemon.isCaptured ? '#4ade80' : '#fbbf24' }}>
                {currentPokemon.isCaptured ? 'EN EQUIPO' : 'DATOS GEN'}
              </span>
            </div>

            <div className="pokedex-stats-list">
              <div className="stat-row">
                <span className="stat-name">PS</span>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill" style={{ width: `${Math.min(100, (currentPokemon.baseStats.hp / 160) * 100)}%` }} />
                </div>
                <span className="stat-value">{currentPokemon.baseStats.hp}</span>
              </div>
              <div className="stat-row">
                <span className="stat-name">ATQ</span>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill" style={{ width: `${Math.min(100, (currentPokemon.baseStats.atk / 130) * 100)}%` }} />
                </div>
                <span className="stat-value">{currentPokemon.baseStats.atk}</span>
              </div>
              <div className="stat-row">
                <span className="stat-name">DEF</span>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill" style={{ width: `${Math.min(100, (currentPokemon.baseStats.def / 130) * 100)}%` }} />
                </div>
                <span className="stat-value">{currentPokemon.baseStats.def}</span>
              </div>
              <div className="stat-row">
                <span className="stat-name">VEL</span>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill" style={{ width: `${Math.min(100, (currentPokemon.baseStats.spe / 120) * 100)}%` }} />
                </div>
                <span className="stat-value">{currentPokemon.baseStats.spe}</span>
              </div>
            </div>
          </div>

          {/* Visor del Teclado Numérico */}
          <div className="pokedex-keypad-screen">
            <span>BUSCAR No.:</span>
            <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>
              {keypadInput ? `[ ${keypadInput.padStart(3, '_')} ]` : `[ ${currentPokemon.id} ]`}
            </span>
          </div>

          {/* Keypad Numérico Interactivo 3x4 */}
          <div className="pokedex-keypad-grid">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'ENT'].map(k => (
              <button
                key={k}
                className={`pokedex-key-btn ${k === 'CLR' ? 'action-clear' : k === 'ENT' ? 'action-enter' : ''}`}
                onClick={() => handleKeypadPress(k)}
              >
                {k === 'CLR' ? '⌫' : k === 'ENT' ? '↵' : k}
              </button>
            ))}
          </div>

          {/* Controles de Navegación D-Pad y Filtros */}
          <div className="pokedex-nav-row">
            <button className="pokedex-dpad-btn" onClick={handleNavigatePrev} title="Anterior Pokémon">
              ◀ PREV
            </button>
            <button className="pokedex-dpad-btn" onClick={handleNavigateNext} title="Siguiente Pokémon">
              NEXT ▶
            </button>
            <button 
              className="pokedex-dpad-btn" 
              onClick={() => {
                sfx.menuOpen?.();
                setFilterMode(filterMode === 'all' ? 'captured' : 'all');
              }}
              style={{ background: filterMode === 'captured' ? '#047857' : '#334155' }}
              title="Filtrar por Pokémon capturados"
            >
              {filterMode === 'captured' ? '★ MIS PKMN' : '📖 TODOS'}
            </button>
          </div>

          {/* Botones de Función: Plegar Tapa y Salir */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button 
              className="pokedex-exit-btn"
              style={{ flex: 1, background: '#475569', color: '#fff', borderColor: '#1e293b' }}
              onClick={() => {
                sfx.cancel?.();
                setIsOpen(false);
              }}
              title="Plegar Pokédex"
            >
              📁 CERRAR
            </button>
            <button 
              className="pokedex-exit-btn"
              style={{ flex: 1, background: '#dc2626', color: '#fff', borderColor: '#991b1b' }}
              onClick={() => {
                sfx.cancel?.();
                navigate('city');
              }}
              title="Regresar a la ciudad"
            >
              SALIR (B)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PokedexScreen;
