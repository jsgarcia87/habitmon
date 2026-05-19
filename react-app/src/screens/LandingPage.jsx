import React, { useState, useEffect, useRef } from 'react';
import { getAssetPath } from '../api';
import '../landing.css';

const LandingPage = ({ renderGameBoy, screen, setScreen, showRegister, setShowRegister, onExitLanding }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Interactive Simulator State
  const [simLevel, setSimLevel] = useState(5);
  const [simXp, setSimXp] = useState(20);
  const [simCoins, setSimCoins] = useState(15);
  const [simConsoleMsg, setSimConsoleMsg] = useState('CONSOLA DE COMBATE > ¡Entrenador listo! Elige una tarea diaria para empezar...');
  const [completedHabits, setCompletedHabits] = useState({
    teeth: false,
    clothes: false,
    veggies: false
  });

  const consoleTextRef = useRef(null);

  const updateSimConsole = (msg) => {
    setSimConsoleMsg(msg);
  };

  const handleSimComplete = (habitId, name, rewardXp, rewardCoins, pokemon, attack, emoji, target) => {
    if (completedHabits[habitId]) return;

    setCompletedHabits(prev => ({ ...prev, [habitId]: true }));
    
    const battleMessages = [
      `¡${pokemon} usó ${attack}! ${emoji}`,
      `¡El monstruo de la '${target}' ha sido derrotado por completo!`,
      `¡Increíble! Ganaste +${rewardXp} XP y +${rewardCoins} Monedas de Oro 💰`
    ];

    let step = 0;
    updateSimConsole(`COMBATE > ` + battleMessages[step]);
    
    const interval = setInterval(() => {
      step++;
      if (step < battleMessages.length) {
        updateSimConsole(`COMBATE > ` + battleMessages[step]);
      } else {
        clearInterval(interval);
        setSimXp(prev => {
          const nextXp = prev + rewardXp;
          if (nextXp >= 100) {
            setSimLevel(l => l + 1);
            updateSimConsole(`¡SUBIDA DE NIVEL! > ¡Tu ${pokemon} ha subido al Nivel ${simLevel + 1}! 🎉 ¡Súper campeón!`);
            return nextXp - 100;
          }
          return nextXp;
        });
        setSimCoins(prev => prev + rewardCoins);
      }
    }, 1500);
  };

  const resetSim = () => {
    setCompletedHabits({ teeth: false, clothes: false, veggies: false });
    setSimLevel(5);
    setSimXp(20);
    setSimCoins(15);
    updateSimConsole('CONSOLA DE COMBATE > ¡Pequeño entrenador listo! Haz tus tareas para ganar batallas.');
  };

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false); // Close mobile menu if open
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const triggerKey = (key, type = 'keydown') => {
    console.log(`Dispatching physical console event: ${type} for ${key}`);
    const event = new KeyboardEvent(type, {
      key: key,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  const triggerDirection = (dir) => {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight'
    };
    triggerKey(keyMap[dir], 'keydown');
  };

  const releaseDirection = (dir) => {
    const keyMap = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight'
    };
    triggerKey(keyMap[dir], 'keyup');
  };

  const faqs = [
    {
      q: '¿Cómo ayuda Habitmon a que mis hijos hagan sus tareas?',
      a: 'Los niños a menudo se resisten a las rutinas porque les resultan aburridas. Habitmon transforma las tareas diarias (cepillarse los dientes, vestirse, ordenar) en combates de un videojuego clásico. El deseo de subir de nivel a su compañero Pokémon y ganar monedas de oro genera una motivación intrínseca positiva, eliminando las batallas y enfados diarios en casa.'
    },
    {
      q: '¿Qué tipo de tareas se pueden configurar?',
      a: '¡Todas las que quieras! El sistema tiene control total para padres. Puedes configurar tareas sencillas de mañana, tarde o noche como: "Ponerme el pijama", "Cepillarme los dientes", "Acabar la verdura", "Recoger los juguetes" o "Hacer los deberes". Cada tarea completada actúa como un ataque para su Habitmon.'
    },
    {
      q: '¿Cómo funcionan las recompensas del mundo real?',
      a: 'Al completar tareas, los niños ganan monedas de oro virtuales. Los padres pueden crear un "menú de premios" en casa intercambiando esas monedas virtuales por recompensas reales, por ejemplo: 15 minutos extras de parque, elegir la película del sábado, o que mamá/papá le lea su cuento favorito por la noche.'
    },
    {
      q: '¿Es una aplicación segura para niños?',
      a: 'Sí, absolutamente. Habitmon es un entorno educativo gamificado 100% libre de anuncios, compras integradas o interacciones con extraños. Toda la configuración la gestionan los padres y los datos de progreso se guardan de forma segura.'
    }
  ];

  return (
    <div className="landing-page-container">
      {/* HEADER */}
      <header className="l-header">
        <div className="l-nav-container">
          <a href="#" className="l-logo" onClick={(e) => { e.preventDefault(); scrollToSection('l-top'); }}>
            <img src={getAssetPath('Graphics/icons/icon_item.png')} alt="Habitmon Logo" className="l-logo-img" />
            <span>HABITMON KIDS</span>
          </a>

          {/* Hamburger menu toggler */}
          <button 
            className={`l-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Abrir Menú"
          >
            <span className="l-hamburger-line" />
            <span className="l-hamburger-line" />
            <span className="l-hamburger-line" />
          </button>

          {/* Navigation Links (responsive slide-down drawer) */}
          <nav className={`l-nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <a href="#features" className="l-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Súper Poderes</a>
            <a href="#simulator" className="l-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('simulator'); }}>Probar Simulador</a>
            <a href="#login" className="l-nav-link l-nav-login" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); onExitLanding('login'); }}>Iniciar Sesión</a>
            <button className="l-btn-access" onClick={() => { setIsMobileMenuOpen(false); onExitLanding('register'); }}>
              ¡Registrarse Gratis! 🎮
            </button>
          </nav>
        </div>
      </header>

      <div id="l-top" />

      {/* HERO */}
      <section className="l-hero">
        <div className="l-hero-text">
          <div className="l-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>🎮 EL JUEGO QUE ENCANTA A PADRES E HIJOS</div>
          <h1 className="l-title">
            ¡Convierte sus tareas en una <span>aventura RPG</span>!
          </h1>
          <p className="l-subtitle">
            ¿Cansado de repetir que se vistan o se laven los dientes? Habitmon transforma las rutinas de tus hijos en misiones Pokémon. Al cumplir sus hábitos reales, entrenan criaturas, ganan oro y suben de nivel.
          </p>
          <div className="l-hero-ctas">
            <button className="l-btn-primary" onClick={() => onExitLanding('register')}>
              Crear Cuenta de Entrenador 👾
            </button>
            <button className="l-btn-secondary" onClick={() => onExitLanding('login')}>
              Iniciar Sesión 🔑
            </button>
          </div>
        </div>

        {/* HERO GAMEBOY EMBEDDED PREVIEW */}
        <div className="l-console-outer-wrapper">
          <div className="l-gameboy-device">
            <div className="l-gb-screen-bezel">
              <div className="l-gb-power-led"></div>
              <div className="l-gb-screen-header">
                <span className="l-gb-screen-title" style={{ letterSpacing: '1px' }}>Consola Infantil Habitmon</span>
              </div>
              <div className="l-gb-screen-viewport">
                {renderGameBoy()}
              </div>
            </div>

            {/* Hardware buttons to play on desktop */}
            <div className="l-gb-hardware-controls">
              {/* D-PAD */}
              <div className="l-gb-dpad-wrapper">
                <div className="l-gb-dpad">
                  <div className="l-gb-dpad-cross">
                    <button 
                      className="l-gb-dpad-btn l-gb-dpad-up" 
                      onMouseDown={() => triggerDirection('up')}
                      onMouseUp={() => releaseDirection('up')}
                      onMouseLeave={() => releaseDirection('up')}
                      onTouchStart={() => triggerDirection('up')}
                      onTouchEnd={() => releaseDirection('up')}
                      title="Arriba"
                    />
                    <button 
                      className="l-gb-dpad-btn l-gb-dpad-down" 
                      onMouseDown={() => triggerDirection('down')}
                      onMouseUp={() => releaseDirection('down')}
                      onMouseLeave={() => releaseDirection('down')}
                      onTouchStart={() => triggerDirection('down')}
                      onTouchEnd={() => releaseDirection('down')}
                      title="Abajo"
                    />
                    <button 
                      className="l-gb-dpad-btn l-gb-dpad-left" 
                      onMouseDown={() => triggerDirection('left')}
                      onMouseUp={() => releaseDirection('left')}
                      onMouseLeave={() => releaseDirection('left')}
                      onTouchStart={() => triggerDirection('left')}
                      onTouchEnd={() => releaseDirection('left')}
                      title="Izquierda"
                    />
                    <button 
                      className="l-gb-dpad-btn l-gb-dpad-right" 
                      onMouseDown={() => triggerDirection('right')}
                      onMouseUp={() => releaseDirection('right')}
                      onMouseLeave={() => releaseDirection('right')}
                      onTouchStart={() => triggerDirection('right')}
                      onTouchEnd={() => releaseDirection('right')}
                      title="Derecha"
                    />
                  </div>
                </div>
              </div>

              {/* A/B Buttons */}
              <div className="l-gb-action-buttons">
                <button 
                  className="l-gb-hw-btn l-gb-hw-btn-b" 
                  onMouseDown={() => triggerKey('x', 'keydown')}
                  onMouseUp={() => triggerKey('x', 'keyup')}
                  onTouchStart={() => triggerKey('x', 'keydown')}
                  onTouchEnd={() => triggerKey('x', 'keyup')}
                  title="Botón B (Cancelar)"
                >
                  B
                </button>
                <button 
                  className="l-gb-hw-btn l-gb-hw-btn-a" 
                  onMouseDown={() => triggerKey('z', 'keydown')}
                  onMouseUp={() => triggerKey('z', 'keyup')}
                  onTouchStart={() => triggerKey('z', 'keydown')}
                  onTouchEnd={() => triggerKey('z', 'keyup')}
                  title="Botón A (Confirmar / Hablar)"
                >
                  A
                </button>
              </div>
            </div>

            {/* Menu options buttons */}
            <div className="l-gb-system-buttons">
              <div className="l-gb-sys-btn-wrapper">
                <button 
                  className="l-gb-sys-btn" 
                  onClick={() => triggerKey('enter', 'keydown')} 
                  title="Botón Start"
                />
                <span className="l-gb-sys-label">START</span>
              </div>
            </div>

            <div className="l-gb-speaker-grille">
              <div className="l-gb-speaker-line"></div>
              <div className="l-gb-speaker-line"></div>
              <div className="l-gb-speaker-line"></div>
              <div className="l-gb-speaker-line"></div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="l-metrics">
        <div className="l-metrics-container">
          <div className="l-metric-item">
            <div className="l-metric-num">98%</div>
            <div className="l-metric-label">Menos enfados diarios</div>
          </div>
          <div className="l-metric-item">
            <div className="l-metric-num">+3,500</div>
            <div className="l-metric-label">Dientes limpios</div>
          </div>
          <div className="l-metric-item">
            <div className="l-metric-num">100%</div>
            <div className="l-metric-label">Autonomía divertida</div>
          </div>
        </div>
      </section>

      {/* THREE STARTERS PRESENTATION */}
      <section className="l-starters-section">
        <h2 className="l-section-title">Elige tu compañero de rutinas</h2>
        <p className="l-section-subtitle">
          Cada monstruo inicial ayuda a tu hijo a enfocarse en diferentes retos diarios mediante refuerzo positivo y mucha diversión.
        </p>
        <div className="l-starters-grid">
          {/* CHIKORITA */}
          <div className="l-starter-card chikorita">
            <div className="l-sprite-container">
              <img src={getAssetPath('Graphics/battlers/152.png')} alt="Chikorita" className="l-starter-sprite" />
            </div>
            <span className="l-starter-type l-type-grass">SALUD E HIGIENE</span>
            <h3 className="l-starter-name">Chikorita</h3>
            <p className="l-starter-desc">
              ¡La reina del baño! Su dulce aroma motiva a los niños a lavarse los dientes, bañarse contentos y mantener sus manos limpias como auténticos profesionales.
            </p>
          </div>

          {/* CYNDAQUIL */}
          <div className="l-starter-card cyndaquil">
            <div className="l-sprite-container">
              <img src={getAssetPath('Graphics/battlers/155.png')} alt="Cyndaquil" className="l-starter-sprite" />
            </div>
            <span className="l-starter-type l-type-fire">ORDEN Y ALIMENTACIÓN</span>
            <h3 className="l-starter-name">Cyndaquil</h3>
            <p className="l-starter-desc">
              ¡Lleno de energía! Su pasión ayuda a los niños a terminarse toda la verdura del plato, recoger sus juguetes súper rápido y dejar su habitación impecable.
            </p>
          </div>

          {/* TOTODILE */}
          <div className="l-starter-card totodile">
            <div className="l-sprite-container">
              <img src={getAssetPath('Graphics/battlers/158.png')} alt="Totodile" className="l-starter-sprite" />
            </div>
            <span className="l-starter-type l-type-water">AUTONOMÍA Y MAÑANAS</span>
            <h3 className="l-starter-name">Totodile</h3>
            <p className="l-starter-desc">
              ¡Súper alegre! Su vitalidad impulsa a los niños a levantarse contentos por la mañana, vestirse solos sin ayuda y prepararse su mochila del colegio.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR */}
      <section id="simulator" className="l-simulator-section">
        <div className="l-sim-container">
          <div className="l-sim-info">
            <div className="l-badge" style={{ background: 'rgba(20, 184, 166, 0.15)', border: '1px solid rgba(20, 184, 166, 0.3)', color: '#2dd4bf' }}>JUEGO EN VIVO</div>
            <h2 className="l-section-title" style={{ textAlign: 'left', margin: 0 }}>Prueba el simulador de tareas</h2>
            <p className="l-subtitle" style={{ fontSize: '16px' }}>
              Haz click en los botones del panel de tareas para simular que tu hijo las ha completado. Mira la pantalla de combate para ver cómo su Habitmon derrota a los monstruos de la pereza y el desorden.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button className="l-btn-secondary" onClick={resetSim} style={{ fontSize: '14px', padding: '12px 24px' }}>
                Reiniciar Tareas 🔄
              </button>
            </div>
          </div>

          <div className="l-sim-box">
            <div className="l-sim-header">
              <span className="l-sim-title">MIS SÚPER TAREAS DE HOY</span>
              <div className="l-sim-stats">
                <span className="l-sim-stat">LV <strong>{simLevel}</strong></span>
                <span className="l-sim-stat">XP <strong>{simXp}%</strong></span>
                <span className="l-sim-stat">💰 <strong>{simCoins}</strong></span>
              </div>
            </div>

            <div className="l-sim-habits-list">
              {/* HABIT 1 */}
              <div className={`l-sim-habit-item ${completedHabits.teeth ? 'completed' : ''}`}>
                <div className="l-sim-habit-left">
                  <span className="l-sim-habit-emoji">🪥</span>
                  <div className="l-sim-habit-details">
                    <span className={`l-sim-habit-name ${completedHabits.teeth ? 'completed' : ''}`}>Cepillarme los dientes (2 minutos)</span>
                    <span className="l-sim-habit-reward">+40 XP / +5 Monedas de Oro</span>
                  </div>
                </div>
                {!completedHabits.teeth ? (
                  <button 
                    className="l-sim-btn-complete"
                    onClick={() => handleSimComplete('teeth', 'Cepillarme los dientes', 40, 5, 'Chikorita', 'HOJAS NAVAJA', '🍃', 'caries dental')}
                  >
                    ¡Completado!
                  </button>
                ) : (
                  <span style={{ color: 'var(--l-emerald)', fontWeight: 'bold', fontSize: '14px' }}>✓ ¡Limpio e impecable!</span>
                )}
              </div>

              {/* HABIT 2 */}
              <div className={`l-sim-habit-item ${completedHabits.clothes ? 'completed' : ''}`}>
                <div className="l-sim-habit-left">
                  <span className="l-sim-habit-emoji">👕</span>
                  <div className="l-sim-habit-details">
                    <span className={`l-sim-habit-name ${completedHabits.clothes ? 'completed' : ''}`}>Vestirme solo por la mañana</span>
                    <span className="l-sim-habit-reward">+40 XP / +6 Monedas de Oro</span>
                  </div>
                </div>
                {!completedHabits.clothes ? (
                  <button 
                    className="l-sim-btn-complete"
                    onClick={() => handleSimComplete('clothes', 'Vestirme solo', 40, 6, 'Totodile', 'PISTOLA AGUA', '💧', 'pereza de las sábanas')}
                  >
                    ¡Completado!
                  </button>
                ) : (
                  <span style={{ color: 'var(--l-emerald)', fontWeight: 'bold', fontSize: '14px' }}>✓ ¡Listo para salir!</span>
                )}
              </div>

              {/* HABIT 3 */}
              <div className={`l-sim-habit-item ${completedHabits.veggies ? 'completed' : ''}`}>
                <div className="l-sim-habit-left">
                  <span className="l-sim-habit-emoji">🥦</span>
                  <div className="l-sim-habit-details">
                    <span className={`l-sim-habit-name ${completedHabits.veggies ? 'completed' : ''}`}>Acabarme toda la verdura del plato</span>
                    <span className="l-sim-habit-reward">+50 XP / +8 Monedas de Oro</span>
                  </div>
                </div>
                {!completedHabits.veggies ? (
                  <button 
                    className="l-sim-btn-complete"
                    onClick={() => handleSimComplete('veggies', 'Comer toda la verdura', 50, 8, 'Cyndaquil', 'ASCUAS', '🔥', 'verdura gigante')}
                  >
                    ¡Completado!
                  </button>
                ) : (
                  <span style={{ color: 'var(--l-emerald)', fontWeight: 'bold', fontSize: '14px' }}>✓ ¡Nutritivo y delicioso!</span>
                )}
              </div>
            </div>

            {/* Simulated Console Screen */}
            <div className="l-sim-console-output">
              <span>{simConsoleMsg} <span className="l-sim-console-blink">_</span></span>
            </div>

            {/* Interactive demo callout linking directly to live standalone register/login screens */}
            <div className="l-sim-demo-callout">
              <p>💡 <strong>¿Te ha gustado la demostración?</strong> Puedes guardar el progreso de tu pequeño entrenador e iniciar la aventura real en pantalla completa creando una cuenta gratis o iniciando sesión si ya eres miembro.</p>
              <div className="l-sim-demo-actions">
                <button className="l-sim-demo-link-btn" onClick={() => onExitLanding('register')}>
                  👉 Registrar Cuenta Gratis
                </button>
                <button className="l-sim-demo-link-btn l-btn-plain" onClick={() => onExitLanding('login')}>
                  🔑 Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="l-features-section">
        <div style={{ textAlign: 'center' }}>
          <div className="l-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>SÚPER PODERES EDUCATIVOS</div>
          <h2 className="l-section-title" style={{ marginTop: '16px' }}>Adiós a los enfados en casa</h2>
          <p className="l-section-subtitle">
            Habitmon utiliza el refuerzo positivo psicológico de los videojuegos para fomentar hábitos saludables de forma autónoma.
          </p>
        </div>

        <div className="l-features-grid">
          {/* FEATURE 1 */}
          <div className="l-feature-card">
            <div className="l-feature-icon-wrapper l-card-teal">🛡️</div>
            <h3 className="l-feature-title">Batallas contra "Monstruos"</h3>
            <p className="l-feature-desc">
              Cada rutina diaria se convierte en un ataque fulminante. Al cepillarse los dientes, ¡derrotan al monstruo Caries! Si completan toda su rutina matutina, su criatura ganará la batalla del día.
            </p>
          </div>

          {/* FEATURE 2 */}
          <div className="l-feature-card">
            <div className="l-feature-icon-wrapper l-card-rose">🦖</div>
            <h3 className="l-feature-title">Captura & Evolución</h3>
            <p className="l-feature-desc">
              A los niños les encanta coleccionar. Al cumplir sus tareas de mañana, tarde y noche, ganan estrellas y Pokéballs para capturar monstruos salvajes, agregándolos a su propio álbum de entrenadores.
            </p>
          </div>

          {/* FEATURE 3 */}
          <div className="l-feature-card">
            <div className="l-feature-icon-wrapper l-card-indigo">🏆</div>
            <h3 className="l-feature-title">Gimnasios de Grandes Retos</h3>
            <p className="l-feature-desc">
              ¿Tu hijo se resiste a una meta más difícil (como irse a dormir temprano una semana entera)? Configúrala como un "Líder de Gimnasio". Al superarla, ganará una medalla virtual y un gran reconocimiento.
            </p>
          </div>

          {/* FEATURE 4 */}
          <div className="l-feature-card">
            <div className="l-feature-icon-wrapper l-card-amber">🎁</div>
            <h3 className="l-feature-title">Menú de Premios Reales</h3>
            <p className="l-feature-desc">
              Las monedas de oro que ganan en la app se pueden canjear por premios reales en casa que tú configures. Por ejemplo: elegir la cena del viernes, 15m más de juego en el parque, o su postre favorito.
            </p>
          </div>
        </div>
      </section>

      {/* THE LOOP STEPS */}
      <section className="l-loop-section">
        <div className="l-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#f472b6' }}>RUTINA SENCILLA</div>
        <h2 className="l-section-title" style={{ marginTop: '16px' }}>¿Cómo funciona Habitmon en casa?</h2>
        <p className="l-section-subtitle">Tres sencillos pasos para activar la magia de la autonomía infantil.</p>

        <div className="l-loop-steps">
          <div className="l-loop-step">
            <div className="l-step-num">01</div>
            <h3 className="l-step-title">Padres configuran</h3>
            <p className="l-step-desc">Eliges las tareas rutinarias de tu hijo (baño, vestirse, ordenar) de forma rápida y sencilla en tu panel.</p>
          </div>

          <div className="l-loop-step">
            <div className="l-step-num">02</div>
            <h3 className="l-step-title">Niños juegan y hacen</h3>
            <p className="l-step-desc">Tu hijo realiza sus tareas cotidianas en el mundo real y las marca para activar ataques y combates.</p>
          </div>

          <div className="l-loop-step">
            <div className="l-step-num">03</div>
            <h3 className="l-step-title">Premios saludables</h3>
            <p className="l-step-desc">Ganan monedas para canjear por recompensas pactadas en familia, ganando autonomía y alegría.</p>
          </div>
        </div>
      </section>

      {/* THE COMPARISON TABLE */}
      <section className="l-starters-section" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.05) 50%, transparent 100%)' }}>
        <h2 className="l-section-title">Habitmon vs Tablas de Pegatinas</h2>
        <p className="l-section-subtitle">¿Por qué Habitmon funciona donde los gráficos tradicionales de cartulina fallan?</p>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', overflowX: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '16px', color: '#9ca3af', fontWeight: '600' }}>Característica</th>
                <th style={{ padding: '16px', color: '#9ca3af', fontWeight: '600' }}>Tabla de papel / Estrellitas</th>
                <th style={{ padding: '16px', color: 'var(--l-indigo)', fontWeight: '700' }}>Habitmon Kids RPG</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px', fontWeight: '500', color: '#fff' }}>Motivación y Deseo</td>
                <td style={{ padding: '16px', color: '#6b7280' }}>Bajo (Se aburren en 3 días)</td>
                <td style={{ padding: '16px', color: 'var(--l-emerald)', fontWeight: '600' }}>Altísimo (Coleccionar y subir de nivel)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px', fontWeight: '500', color: '#fff' }}>Durabilidad en el tiempo</td>
                <td style={{ padding: '16px', color: '#6b7280' }}>Se pierde, ensucia o desengancha</td>
                <td style={{ padding: '16px', color: 'var(--l-rose)', fontWeight: '600' }}>Progreso digital persistente e interactivo</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '16px', fontWeight: '500', color: '#fff' }}>Sorpresa y Recompensa</td>
                <td style={{ padding: '16px', color: '#6b7280' }}>Pegatinas monótonas</td>
                <td style={{ padding: '16px', color: 'var(--l-teal)', fontWeight: '600' }}>Ataques animados, Pokéballs y evolución</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', fontWeight: '500', color: '#fff' }}>Control de los padres</td>
                <td style={{ padding: '16px', color: '#6b7280' }}>Manual e impreciso</td>
                <td style={{ padding: '16px', color: 'var(--l-amber)', fontWeight: '600' }}>Estadísticas y control total de tareas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* STANDALONE CALLOUT PRE-FOOTER SECTION */}
      <section id="register" className="l-play-section" style={{ background: 'linear-gradient(180deg, transparent 0%, #060814 100%)' }}>
        <div className="l-play-text" style={{ gridColumn: '1 / -1', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div className="l-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', margin: '0 auto' }}>REGISTRO DE LA BETA</div>
          <h2 className="l-section-title" style={{ marginTop: '16px' }}>Únete a la liga de súper papás y mamás</h2>
          <p className="l-subtitle" style={{ fontSize: '18px', margin: '0 auto 32px' }}>
            Regístrate gratis hoy mismo en nuestra Beta Abierta para empezar a disfrutar de rutinas familiares tranquilas, organizadas y muy divertidas en pantalla completa.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="l-btn-primary" onClick={() => onExitLanding('register')} style={{ padding: '18px 40px' }}>
              ¡Crear Cuenta Gratis Ahora! 👾
            </button>
            <button className="l-btn-secondary" onClick={() => onExitLanding('login')} style={{ padding: '18px 40px' }}>
              Iniciar Sesión en el Juego 🔑
            </button>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="l-faq-section">
        <h2 className="l-section-title" style={{ textAlign: 'center' }}>Preguntas para Papás y Mamás</h2>
        <p className="l-section-subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
          Respondemos tus principales dudas sobre cómo Habitmon Kids os ayudará a organizar el día a día.
        </p>
        
        <div className="l-faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`l-faq-item ${activeFaq === idx ? 'active' : ''}`}>
              <button className="l-faq-trigger" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <span>{faq.q}</span>
                <span className="l-faq-icon">+</span>
              </button>
              <div className="l-faq-content" style={{ maxHeight: activeFaq === idx ? '240px' : '0' }}>
                <p className="l-faq-text">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="l-footer">
        <div className="l-footer-container">
          <a href="#" className="l-logo" onClick={(e) => { e.preventDefault(); scrollToSection('l-top'); }}>
            <img src={getAssetPath('Graphics/icons/icon_item.png')} alt="Habitmon Logo" className="l-logo-img" />
            <span>HABITMON KIDS</span>
          </a>
          <div className="l-footer-links">
            <a href="#features" className="l-footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Súper Poderes</a>
            <a href="#simulator" className="l-footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('simulator'); }}>Simulador</a>
            <a href="#register" className="l-footer-link" onClick={(e) => { e.preventDefault(); onExitLanding('register'); }}>Crear Cuenta Gratis</a>
            <a href="#login" className="l-footer-link" onClick={(e) => { e.preventDefault(); onExitLanding('login'); }}>Iniciar Sesión</a>
          </div>
          <p className="l-footer-copy">
            &copy; {new Date().getFullYear()} Habitmon Kids RPG. Desarrollado con ❤️ para potenciar el crecimiento y autonomía de los pequeños entrenadores.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
