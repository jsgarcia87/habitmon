import React, { useState, useEffect, useRef, useCallback } from 'react';
import InteriorMap from '../components/InteriorMap';
import DialogBox from '../components/DialogBox';
import { useGame } from '../context/GameContext';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { sfx, initAudio } from '../utils/audioEngine';

const config = INTERIOR_CONFIGS['pokemon_shop'];
const mapMatrix = INTERIOR_MAPS['pokemon_shop'];

// NPC direccion: 0=down, 1=left, 2=right, 3=up

const INITIAL_NPCS = [
  // Interior 10×8 con offset (5, 3). Mostrador único en (9, 4). Suelo desde y=5.
  // El dependiente se dibuja sobre el tile CT y el jugador le habla desde (9, 5).
  { id: 'clerk',       nombre: 'Dependiente', sprite: 'char_ 07_b', x: 9,  y: 4, direccion: 0 },
  // Veterana — paseando por la sala, mirando a la izquierda.
  { id: 'cooltrainer', nombre: 'Veterana',    sprite: 'char_ 04_b', x: 12, y: 7, direccion: 1 },
  // Joven — más a la izquierda, mirando hacia arriba.
  { id: 'youngster',   nombre: 'Joven',       sprite: 'char_ 03_b', x: 7,  y: 8, direccion: 3 },
];

const SHOP_ITEMS = [
  { id: 'pokeball',    name: 'POKÉ BALL',   price: 50,  description: 'Dispositivo para atrapar HABITMON salvajes.' },
  { id: 'superball',   name: 'SUPER BALL',  price: 100, description: 'Mayor índice de captura que la POKÉ BALL.' },
  { id: 'potion',      name: 'POCIÓN',      price: 30,  description: 'Restaura 20 PS de un HABITMON.' },
  { id: 'superpotion', name: 'SUPERPOCIÓN', price: 60,  description: 'Restaura 50 PS de un HABITMON.' }
];

// Etapas del menú de tienda.
const STAGE = {
  CLOSED:    'closed',
  ITEM_LIST: 'item_list',
  QTY:       'qty',
  CONFIRM:   'confirm',
  RESULT:    'result',     // mostrando "¡Aquí los tienes!" o errores
  ASK_MORE:  'ask_more'    // "¿Algo más?"
};

const PokemonShopScreen = ({ navigate, direction, aPressed, bPressed }) => {
  const { user, comprarObjeto, notify } = useGame();
  const [npcs] = useState(INITIAL_NPCS);
  const [dialogue, setDialogue] = useState(null);
  const [stage, setStage] = useState(STAGE.CLOSED);
  const [selectedIdx, setSelectedIdx] = useState(0); // último item de la lista = "CANCELAR"
  const [qty, setQty] = useState(1);
  const [resultText, setResultText] = useState('');
  const [fadeAlpha, setFadeAlpha] = useState(1);
  // Selecciones SÍ/NO para los pasos CONFIRM y ASK_MORE (estilo Crystal).
  const [confirmYes, setConfirmYes] = useState(true);
  const [askMoreYes, setAskMoreYes] = useState(true);

  // Para evitar repetir eventos cuando aPressed/bPressed se mantienen.
  const lastAtRef = useRef(0);
  const lastBtRef = useRef(0);
  const lastDirRef = useRef(null);

  useEffect(() => {
    initAudio();
    setFadeAlpha(1);
    const t = setTimeout(() => setFadeAlpha(0), 80);
    return () => clearTimeout(t);
  }, []);

  // ----------------------------------------------------------------------
  // Apertura / cierre del menú.
  // ----------------------------------------------------------------------
  const openShop = useCallback(() => {
    setSelectedIdx(0);
    setQty(1);
    setStage(STAGE.ITEM_LIST);
    sfx.menuOpen();
  }, []);

  const closeShop = useCallback(() => {
    setStage(STAGE.CLOSED);
    sfx.cancel();
    setDialogue({
      name: 'DEPENDIENTE',
      text: ['¡Vuelve pronto!']
    });
  }, []);

  // Tras una compra exitosa o un "no" en ask_more, volvemos al menú con frase.
  const goToAskMore = useCallback(() => {
    setStage(STAGE.ASK_MORE);
  }, []);

  // ----------------------------------------------------------------------
  // Lógica de compra.
  // ----------------------------------------------------------------------
  const item = SHOP_ITEMS[selectedIdx] || null;
  const totalCost = item ? item.price * qty : 0;
  const playerMoney = user?.monedas ?? 0;

  const handleBuy = useCallback(async () => {
    if (!item) return;
    if (playerMoney < totalCost) {
      sfx.cancel();
      setResultText('No tienes dinero suficiente.');
      setStage(STAGE.RESULT);
      return;
    }
    setResultText('Procesando...');
    setStage(STAGE.RESULT);
    const r = await comprarObjeto(item.id, qty);
    if (r?.success) {
      sfx.confirm();
      notify?.({ message: `¡Compraste ${qty}x ${item.name}!`, type: 'success' });
      setResultText(`¡Aquí los tienes! Gracias por tu compra.`);
    } else {
      sfx.cancel();
      setResultText(r?.message || 'No se pudo realizar la compra.');
    }
  }, [comprarObjeto, item, notify, playerMoney, qty, totalCost]);

  // ----------------------------------------------------------------------
  // Manejo de input para el menú (teclado + props aPressed/bPressed/dir).
  // ----------------------------------------------------------------------

  // Reaccionar a direction (D-pad / flechas)
  useEffect(() => {
    if (stage === STAGE.CLOSED) return;
    if (!direction) { lastDirRef.current = null; return; }
    if (direction === lastDirRef.current) return; // evitar repeat hold
    lastDirRef.current = direction;

    if (stage === STAGE.ITEM_LIST) {
      const total = SHOP_ITEMS.length + 1; // +1 por CANCELAR
      if (direction === 'up') {
        setSelectedIdx(i => (i - 1 + total) % total);
        sfx.cursor();
      } else if (direction === 'down') {
        setSelectedIdx(i => (i + 1) % total);
        sfx.cursor();
      }
    } else if (stage === STAGE.QTY) {
      if (direction === 'up') {
        setQty(q => Math.min(99, q + 1));
        sfx.cursor();
      } else if (direction === 'down') {
        setQty(q => Math.max(1, q - 1));
        sfx.cursor();
      } else if (direction === 'right') {
        setQty(q => Math.min(99, q + 10));
        sfx.cursor();
      } else if (direction === 'left') {
        setQty(q => Math.max(1, q - 10));
        sfx.cursor();
      }
    } else if (stage === STAGE.CONFIRM) {
      // Yes/No selector — toggle con left/right
      if (direction === 'left' || direction === 'right') {
        setConfirmYes(v => !v);
        sfx.cursor();
      }
    } else if (stage === STAGE.ASK_MORE) {
      if (direction === 'left' || direction === 'right') {
        setAskMoreYes(v => !v);
        sfx.cursor();
      }
    }
  }, [direction, stage]);

  // Reaccionar a A (confirmar)
  useEffect(() => {
    if (!aPressed) return;
    const now = Date.now();
    if (now - lastAtRef.current < 200) return;
    lastAtRef.current = now;

    if (stage === STAGE.ITEM_LIST) {
      if (selectedIdx >= SHOP_ITEMS.length) {
        // CANCELAR
        closeShop();
        return;
      }
      setQty(1);
      setStage(STAGE.QTY);
      sfx.confirm();
    } else if (stage === STAGE.QTY) {
      setConfirmYes(true);
      setStage(STAGE.CONFIRM);
      sfx.confirm();
    } else if (stage === STAGE.CONFIRM) {
      if (confirmYes) {
        handleBuy();
      } else {
        // NO: volver a ajustar cantidad
        sfx.cancel();
        setStage(STAGE.QTY);
      }
    } else if (stage === STAGE.RESULT) {
      goToAskMore();
      setAskMoreYes(true);
    } else if (stage === STAGE.ASK_MORE) {
      if (askMoreYes) {
        sfx.confirm();
        setStage(STAGE.ITEM_LIST);
      } else {
        closeShop();
      }
    }
  }, [aPressed, stage, selectedIdx, confirmYes, askMoreYes, handleBuy, closeShop, goToAskMore]);

  // Reaccionar a B (cancelar / retroceder)
  useEffect(() => {
    if (!bPressed) return;
    const now = Date.now();
    if (now - lastBtRef.current < 200) return;
    lastBtRef.current = now;

    if (stage === STAGE.ITEM_LIST) {
      closeShop();
    } else if (stage === STAGE.QTY) {
      sfx.cancel();
      setStage(STAGE.ITEM_LIST);
    } else if (stage === STAGE.CONFIRM) {
      sfx.cancel();
      setStage(STAGE.QTY);
    } else if (stage === STAGE.RESULT) {
      goToAskMore();
      setAskMoreYes(true);
    } else if (stage === STAGE.ASK_MORE) {
      closeShop();
    }
  }, [bPressed, stage, closeShop, goToAskMore]);

  // ----------------------------------------------------------------------
  // Eventos del mundo (hablar con NPCs).
  // ----------------------------------------------------------------------
  const handleEvent = useCallback((event) => {
    if (event.type !== 'npc_talk') return;
    const id = event.npc.id;

    if (id === 'clerk') {
      setDialogue({
        name: 'DEPENDIENTE',
        text: ['¡Bienvenido!', '¿En qué puedo ayudarte?'],
        options: [
          { label: 'COMPRAR', value: 'buy', primary: true },
          { label: 'SALIR',   value: 'leave' }
        ]
      });
      return;
    }

    if (id === 'cooltrainer') {
      setDialogue({
        name: 'VETERANA',
        text: [
          'Las POKÉ BALLS siempre están en oferta aquí.',
          '¡Compra unas cuantas antes de salir!'
        ]
      });
      return;
    }

    if (id === 'youngster') {
      setDialogue({
        name: 'JOVEN',
        text: [
          'Cuando salí a las rutas, mi HABITMON resultó herido.',
          '¡Lleva siempre POCIONES contigo!'
        ]
      });
      return;
    }
  }, []);

  const handleOptionSelect = useCallback((val) => {
    setDialogue(null);
    if (val === 'buy') openShop();
    else if (val === 'leave') sfx.cancel();
  }, [openShop]);

  const handleExit = useCallback(() => {
    setFadeAlpha(1);
    setTimeout(() => navigate('city'), 300);
  }, [navigate]);

  // ----------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={{ floor: -1 }}
          initialPos={config.spawn}
          facing="up"
          npcs={npcs}
          exitPositions={config.exitPositions}
          backgroundColor={config.backgroundColor}
          onEvent={handleEvent}
          onExit={handleExit}
          direction={stage === STAGE.CLOSED ? direction : null}
          aPressed={stage === STAGE.CLOSED ? aPressed : false}
          currentMapId="pokemon_shop"
        />
      </div>

      {/* Nombre */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)', color: '#FFD700',
        border: '2px solid #FFD700', padding: '6px 16px',
        fontFamily: '"Press Start 2P"', fontSize: 8, zIndex: 10, borderRadius: 4,
        whiteSpace: 'nowrap'
      }}>
        TIENDA POKÉMON
      </div>

      <button onClick={handleExit} style={{
        position: 'absolute', top: 10, left: 10, padding: '8px 12px',
        background: '#222', color: '#fff', border: '2px solid #666',
        borderRadius: 4, fontFamily: '"Press Start 2P"', fontSize: 8,
        cursor: 'pointer', zIndex: 10
      }}>
        SALIR
      </button>

      {/* Fade overlay */}
      <div style={{
        position: 'absolute', inset: 0, background: '#000',
        opacity: fadeAlpha, transition: 'opacity 0.3s ease',
        pointerEvents: 'none', zIndex: 25
      }} />

      {/* Diálogo previo / posterior al menú */}
      {dialogue && stage === STAGE.CLOSED && (
        <DialogBox
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => setDialogue(null)}
          onOptionSelect={handleOptionSelect}
          options={dialogue.options || []}
        />
      )}

      {/* Menú de tienda estilo Crystal */}
      {stage !== STAGE.CLOSED && (
        <MartMenu
          stage={stage}
          items={SHOP_ITEMS}
          selectedIdx={selectedIdx}
          qty={qty}
          confirmYes={confirmYes}
          askMoreYes={askMoreYes}
          resultText={resultText}
          item={item}
          totalCost={totalCost}
          playerMoney={playerMoney}
          bagCount={user?.inventario?.[item?.id] ?? 0}
        />
      )}
    </div>
  );
};

// ============================================================================
// MartMenu — UI del menú estilo Pokémon Crystal.
// ============================================================================
const MartMenu = ({
  stage, items, selectedIdx, qty, confirmYes, askMoreYes,
  resultText, item, totalCost, playerMoney, bagCount
}) => {
  const showItemList = stage === STAGE.ITEM_LIST;
  const showQty      = stage === STAGE.QTY;
  const showConfirm  = stage === STAGE.CONFIRM;
  const showResult   = stage === STAGE.RESULT;
  const showAskMore  = stage === STAGE.ASK_MORE;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      padding: '0 12px 80px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
      zIndex: 30,
      fontFamily: '"Press Start 2P"',
      color: '#fff',
      pointerEvents: 'none'
    }}>
      {/* Caja de dinero arriba del menú */}
      <div style={{
        alignSelf: 'flex-end',
        background: '#fff', color: '#000',
        border: '3px solid #000', borderRadius: 6,
        padding: '6px 10px', fontSize: 8,
        boxShadow: '3px 3px 0 #555',
        minWidth: 130, textAlign: 'right'
      }}>
        <div style={{ color: '#555', fontSize: 6, marginBottom: 2 }}>DINERO</div>
        <div>${playerMoney}</div>
      </div>

      {/* Caja principal */}
      <div style={{
        background: '#fff', color: '#000',
        border: '3px solid #000', borderRadius: 6,
        padding: '8px 10px',
        boxShadow: '4px 4px 0 #555',
        minHeight: 80,
        fontSize: 8, lineHeight: 1.6
      }}>
        {showItemList && (
          <ItemList items={items} selectedIdx={selectedIdx} bagCount={bagCount} item={item} />
        )}
        {showQty && (
          <QtyPicker item={item} qty={qty} totalCost={totalCost} />
        )}
        {showConfirm && (
          <ConfirmBuy item={item} qty={qty} totalCost={totalCost} confirmYes={confirmYes} />
        )}
        {showResult && (
          <ResultMsg text={resultText} />
        )}
        {showAskMore && (
          <AskMore yes={askMoreYes} />
        )}
      </div>

      {/* Hint inferior */}
      <div style={{
        alignSelf: 'flex-end',
        fontSize: 6, color: '#aaa',
        background: 'rgba(0,0,0,0.6)', padding: '3px 6px', borderRadius: 3
      }}>
        {showItemList && '↑↓ MOVER  Z OK  X SALIR'}
        {showQty && '↑↓ ±1   ←→ ±10   Z OK   X ATRÁS'}
        {(showConfirm || showAskMore) && '←→ ELEGIR   Z CONFIRMAR'}
        {showResult && 'Z CONTINUAR'}
      </div>
    </div>
  );
};

const ItemList = ({ items, selectedIdx, bagCount, item }) => (
  <>
    {items.map((it, idx) => (
      <Row key={it.id} selected={idx === selectedIdx} label={it.name} value={`$${it.price}`} />
    ))}
    <Row selected={selectedIdx === items.length} label="CANCELAR" value="" />
    <div style={{ borderTop: '1px dashed #999', marginTop: 6, paddingTop: 6, fontSize: 6, color: '#444' }}>
      {item ? (
        <>
          <div>{item.description}</div>
          <div style={{ marginTop: 2 }}>EN BOLSA: {bagCount}</div>
        </>
      ) : (
        <div>Vuelve a la tienda cuando quieras.</div>
      )}
    </div>
  </>
);

const Row = ({ selected, label, value }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    color: '#000'
  }}>
    <span>{selected ? '▶ ' : '   '}{label}</span>
    <span>{value}</span>
  </div>
);

const QtyPicker = ({ item, qty, totalCost }) => (
  <div>
    <div style={{ fontSize: 8, marginBottom: 8 }}>{item?.name}</div>
    <div style={{ fontSize: 8, marginBottom: 6 }}>¿Cuántos?</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
      <span style={{ color: '#777' }}>▲</span>
      <span style={{
        minWidth: 50, textAlign: 'center',
        border: '2px solid #000', padding: '4px 10px',
        background: '#FFF6C8'
      }}>{String(qty).padStart(2, '0')}</span>
      <span style={{ color: '#777' }}>▼</span>
      <span style={{ marginLeft: 'auto', fontSize: 8 }}>$&nbsp;{totalCost}</span>
    </div>
  </div>
);

const ConfirmBuy = ({ item, qty, totalCost, confirmYes }) => (
  <div>
    <div style={{ fontSize: 8, marginBottom: 6 }}>
      {qty} {item?.name} = ${totalCost}.
    </div>
    <div style={{ fontSize: 8, marginBottom: 6 }}>¿De acuerdo?</div>
    <div style={{ display: 'flex', gap: 14, fontSize: 8 }}>
      <span style={{ color: confirmYes ? '#000' : '#aaa' }}>{confirmYes ? '▶ ' : '   '}SÍ</span>
      <span style={{ color: !confirmYes ? '#000' : '#aaa' }}>{!confirmYes ? '▶ ' : '   '}NO</span>
    </div>
  </div>
);

const ResultMsg = ({ text }) => (
  <div style={{ fontSize: 8, padding: '4px 0' }}>{text}</div>
);

const AskMore = ({ yes }) => (
  <div>
    <div style={{ fontSize: 8, marginBottom: 6 }}>¿Puedo hacer algo más por ti?</div>
    <div style={{ display: 'flex', gap: 14, fontSize: 8 }}>
      <span style={{ color: yes ? '#000' : '#aaa' }}>{yes ? '▶ ' : '   '}SÍ</span>
      <span style={{ color: !yes ? '#000' : '#aaa' }}>{!yes ? '▶ ' : '   '}NO</span>
    </div>
  </div>
);

export default PokemonShopScreen;
