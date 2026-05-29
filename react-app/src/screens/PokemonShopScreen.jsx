import React, { useState, useEffect } from 'react';
import InteriorMap from '../components/InteriorMap';
import DialogBox from '../components/DialogBox';
import { useGame } from '../context/GameContext';
import { INTERIOR_CONFIGS, INTERIOR_MAPS } from '../data/interiorData';
import { sfx, initAudio } from '../utils/audioEngine';

const config = INTERIOR_CONFIGS['pokemon_shop'];
const mapMatrix = INTERIOR_MAPS['pokemon_shop'];

const SHOP_ITEMS = [
  { id: 'pokeball',    name: 'POKÉ BALL',   price: 50,  description: 'Dispositivo para atrapar Pokémon salvajes.',    icon: '🔴' },
  { id: 'superball',   name: 'SUPER BALL',  price: 100, description: 'Alto rendimiento. Mayor índice de captura.',    icon: '🔵' },
  { id: 'potion',      name: 'POCIÓN',      price: 30,  description: 'Restaura 20 PS de tu Pokémon.',                 icon: '🧪' },
  { id: 'superpotion', name: 'SUPERPOCIÓN', price: 60,  description: 'Alta eficacia. Restaura 50 PS de tu Pokémon.', icon: '🥤' }
];

const CLERK_NPC = {
  id: 'dependiente',
  nombre: 'Dependiente',
  sprite: 'char_ 07_b',
  x: 9,
  y: 3,
  direccion: 0
};

const PokemonShopScreen = ({ navigate, direction, aPressed }) => {
  const { user, comprarObjeto, notify } = useGame();
  const [showShop, setShowShop] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);
  const [shopMsg, setShopMsg] = useState('¿Qué deseas comprar hoy?');
  const [fadeAlpha, setFadeAlpha] = useState(1);

  useEffect(() => {
    initAudio();
    setFadeAlpha(1);
    const t = setTimeout(() => setFadeAlpha(0), 50);
    return () => clearTimeout(t);
  }, []);

  const selectedItem = SHOP_ITEMS[selectedIdx];
  const totalCost = selectedItem.price * cantidad;
  const currentCount = user?.inventario?.[selectedItem.id] ?? 0;

  const handleBuy = async () => {
    if (user.monedas < totalCost) {
      setShopMsg('¡Lo siento! No tienes suficiente dinero.');
      setIsConfirming(false);
      return;
    }
    setShopMsg(`Comprando ${cantidad}x ${selectedItem.name}...`);
    const r = await comprarObjeto(selectedItem.id, cantidad);
    if (r.success) {
      sfx.confirm();
      setShopMsg(`¡Muchas gracias! ¿Deseas algo más?`);
      setCantidad(1);
      setIsConfirming(false);
      notify({ message: `¡Compraste ${cantidad}x ${selectedItem.name}!`, type: 'success' });
    } else {
      setShopMsg(`Error: ${r.message || 'No se pudo realizar la compra.'}`);
      setIsConfirming(false);
    }
  };

  const handleEvent = (event) => {
    if (event.type === 'npc_talk' && event.npc.id === 'dependiente') {
      setDialogue({
        name: 'DEPENDIENTE',
        text: ['¡Hola! Bienvenido a la Tienda Pokémon.', '¿Qué deseas comprar hoy?'],
        options: [
          { label: 'VER ARTÍCULOS', value: 'shop', primary: true },
          { label: 'NADA, GRACIAS', value: 'cancel' }
        ]
      });
    }
  };

  const handleExit = () => {
    setFadeAlpha(1);
    setTimeout(() => navigate('city'), 300);
  };

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(1.2)', transformOrigin: 'center', height: '100%', display: 'flex', alignItems: 'center' }}>
        <InteriorMap
          map={mapMatrix}
          tileset={config.tileset}
          tileConfig={{ floor: 36, exit: 54 }}
          initialPos={config.spawn}
          npcs={[CLERK_NPC]}
          onEvent={handleEvent}
          onExit={handleExit}
          direction={direction}
          aPressed={aPressed}
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
        pointerEvents: 'none', zIndex: 20
      }} />

      {/* Dialogue (before shop menu) */}
      {dialogue && !showShop && (
        <DialogBox
          name={dialogue.name}
          text={dialogue.text}
          onComplete={() => setDialogue(null)}
          onOptionSelect={(val) => {
            setDialogue(null);
            if (val === 'shop') setShowShop(true);
          }}
          options={dialogue.options || []}
        />
      )}

      {/* Shop menu overlay — Crystal style panel at bottom */}
      {showShop && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(10,10,20,0.97)', border: '3px solid #FFD700',
          fontFamily: '"Press Start 2P"', color: '#fff',
          padding: '12px', zIndex: 30, maxHeight: '55dvh',
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #555', paddingBottom: 6 }}>
            <span style={{ fontSize: 8, color: '#FFD700' }}>TIENDA</span>
            <span style={{ fontSize: 8 }}>💰 ${user?.monedas || 0}</span>
          </div>

          {/* Item list */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {SHOP_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => { setSelectedIdx(idx); setCantidad(1); setIsConfirming(false); setShopMsg(`¿Cuántos ${item.name} deseas?`); sfx.cursor(); }}
                style={{
                  flex: '0 0 auto', padding: '6px 10px', fontSize: 7,
                  background: selectedIdx === idx ? '#FFD700' : '#222',
                  color: selectedIdx === idx ? '#000' : '#fff',
                  border: `2px solid ${selectedIdx === idx ? '#FFD700' : '#555'}`,
                  borderRadius: 4, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                }}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.name}</span>
                <span style={{ color: selectedIdx === idx ? '#444' : '#FFD700' }}>${item.price}</span>
              </div>
            ))}
          </div>

          {/* Selected item + buy controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 7, gap: 8 }}>
            <div style={{ flex: 1, color: '#ccc', lineHeight: 1.5 }}>
              <div style={{ color: '#fff', marginBottom: 2 }}>{selectedItem.name}</div>
              <div>{selectedItem.description}</div>
              <div style={{ marginTop: 4, color: '#aaa' }}>En mochila: {currentCount}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => setCantidad(c => Math.max(1, c - 1))} style={btnStyle}>-</button>
                <span style={{ fontSize: 10, minWidth: 20, textAlign: 'center' }}>{cantidad}</span>
                <button onClick={() => setCantidad(c => c + 1)} style={btnStyle}>+</button>
              </div>
              <div style={{ fontSize: 8, color: user?.monedas >= totalCost ? '#4CAF50' : '#f44' }}>
                Total: ${totalCost}
              </div>
            </div>
          </div>

          {/* Message bar */}
          <div style={{ fontSize: 7, color: '#FFD700', minHeight: 16 }}>{shopMsg}</div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {!isConfirming ? (
              <>
                <button onClick={() => { setIsConfirming(true); setShopMsg(`¿Comprar ${cantidad}x ${selectedItem.name} por $${totalCost}?`); sfx.confirm(); }}
                  style={{ ...actionBtn, background: '#FFD700', color: '#000' }}>COMPRAR</button>
                <button onClick={() => { setShowShop(false); setIsConfirming(false); }}
                  style={{ ...actionBtn, background: '#555', color: '#fff' }}>CERRAR</button>
              </>
            ) : (
              <>
                <button onClick={handleBuy} style={{ ...actionBtn, background: '#4CAF50', color: '#fff' }}>SÍ</button>
                <button onClick={() => { setIsConfirming(false); setShopMsg('¿Qué más deseas?'); }}
                  style={{ ...actionBtn, background: '#f44336', color: '#fff' }}>NO</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const btnStyle = {
  width: 24, height: 24, background: '#333', color: '#fff',
  border: '1px solid #666', borderRadius: 4, fontSize: 12,
  cursor: 'pointer', fontFamily: '"Press Start 2P"'
};

const actionBtn = {
  flex: 1, padding: '8px 4px', border: '2px solid #000',
  borderRadius: 4, fontSize: 7, cursor: 'pointer',
  fontFamily: '"Press Start 2P"', fontWeight: 'bold'
};

export default PokemonShopScreen;
