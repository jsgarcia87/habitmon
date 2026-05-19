import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const SHOP_ITEMS = [
  {
    id: 'pokeball',
    name: 'POKÉ BALL',
    price: 50,
    description: 'Dispositivo para atrapar Pokémon salvajes. ¡Básico pero confiable!',
    icon: '🔴'
  },
  {
    id: 'superball',
    name: 'SUPER BALL',
    price: 100,
    description: 'Dispositivo de alto rendimiento. Mayor índice de captura.',
    icon: '🔵'
  },
  {
    id: 'potion',
    name: 'POCIÓN',
    price: 30,
    description: 'Medicina líquida que restaura 20 PS de tu Pokémon.',
    icon: '🧪'
  },
  {
    id: 'superpotion',
    name: 'SUPERPOCIÓN',
    price: 60,
    description: 'Medicina de alta eficacia que restaura 50 PS de tu Pokémon.',
    icon: '🥤'
  }
];

const ShopScreen = ({ navigate }) => {
  const { user, comprarObjeto, notify } = useGame();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);
  const [dialogue, setDialogue] = useState('¡Hola! Bienvenido a la TIENDA HABITMON. ¿En qué te puedo ayudar hoy?');

  const selectedItem = SHOP_ITEMS[selectedIdx];
  const totalCost = selectedItem.price * cantidad;

  const handleBuy = async () => {
    if (user.monedas < totalCost) {
      setDialogue('¡Lo siento! No tienes suficiente dinero para pagar eso.');
      setIsConfirming(false);
      return;
    }

    setDialogue(`Comprando ${cantidad}x ${selectedItem.name}...`);
    const r = await comprarObjeto(selectedItem.id, cantidad);
    
    if (r.success) {
      setDialogue(`¡Muchas gracias! Aquí tienes tu compra. ¿Deseas algo más?`);
      setCantidad(1);
      setIsConfirming(false);
      notify({ message: `¡Compraste ${cantidad}x ${selectedItem.name}!`, type: 'success' });
    } else {
      setDialogue(`Error: ${r.message || 'No se pudo realizar la compra.'}`);
      setIsConfirming(false);
    }
  };

  const currentCount = user?.inventario?.[selectedItem.id] ?? 0;

  return (
    <div className="retro-shop-container" style={{
      width: '100vw',
      height: '100dvh',
      background: '#2B2B4E',
      fontFamily: '"Press Start 2P", monospace',
      color: '#333',
      padding: '16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#4E538C',
        color: '#fff',
        padding: '8px 12px',
        border: '3px solid #000',
        borderRadius: '4px',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '10px' }}>🏪 TIENDA POKÉMON</div>
        <div style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#FFD700' }}>$</span> {user?.monedas || 0}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        gap: '12px',
        minHeight: '0',
        marginBottom: '10px'
      }}>
        {/* Item List */}
        <div style={{
          flex: 1.2,
          background: '#fff',
          border: '3px solid #000',
          borderRadius: '4px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto'
        }}>
          {SHOP_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedIdx(idx);
                setCantidad(1);
                setIsConfirming(false);
                setDialogue(`¿Cuántas unidades de ${item.name} deseas llevar?`);
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                background: selectedIdx === idx ? '#FFD700' : 'transparent',
                border: selectedIdx === idx ? '2px solid #000' : '2px solid transparent',
                fontSize: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </div>
              <div style={{ fontWeight: 'bold' }}>${item.price}</div>
            </div>
          ))}
        </div>

        {/* Selected Item Detail */}
        <div style={{
          flex: 0.8,
          background: '#fff',
          border: '3px solid #000',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', margin: '10px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{selectedItem.icon}</div>
            {selectedItem.name}
          </div>

          <div style={{ fontSize: '6px', color: '#666', lineHeight: '1.4' }}>
            {selectedItem.description}
          </div>

          <div style={{ width: '100%', marginTop: '10px', borderTop: '2px dashed #ccc', paddingTop: '8px' }}>
            <div style={{ fontSize: '7px', display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
              <span>Llevas:</span>
              <span style={{ color: '#4E538C' }}>{currentCount} uds.</span>
            </div>
            
            {/* Quantity Selector */}
            {!isConfirming ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
                <button
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                  style={{ width: '22px', height: '22px', background: '#333', color: '#fff', border: '1px solid #000', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '10px', width: '24px', textAlign: 'center' }}>{cantidad}</span>
                <button
                  onClick={() => setCantidad(prev => prev + 1)}
                  style={{ width: '22px', height: '22px', background: '#333', color: '#fff', border: '1px solid #000', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '8px', margin: '12px 0', fontWeight: 'bold', color: '#FF4444' }}>
                ¿Confirmas compra?
              </div>
            )}

            <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span style={{ color: user.monedas >= totalCost ? '#007700' : '#FF0000' }}>${totalCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogue / Actions Area */}
      <div style={{
        background: '#fff',
        border: '4px solid #333',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '75px',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: 'inset -2px -2px 0px #ccc'
      }}>
        {/* Dialogue text with pixel font styling */}
        <div style={{
          fontSize: '7px',
          lineHeight: '1.6',
          color: '#111',
          paddingRight: '120px'
        }}>
          {dialogue}
        </div>

        {/* Buttons Pane */}
        <div style={{
          position: 'absolute',
          right: '8px',
          bottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '100px'
        }}>
          {!isConfirming ? (
            <>
              <button
                onClick={() => {
                  if (user.monedas < totalCost) {
                    setDialogue('¡Lo siento! No tienes suficiente dinero para comprar esto.');
                    return;
                  }
                  setIsConfirming(true);
                  setDialogue(`¿Deseas comprar ${cantidad}x ${selectedItem.name} por $${totalCost}?`);
                }}
                style={{
                  padding: '8px',
                  background: '#FFD700',
                  color: '#333',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                COMPRAR
              </button>
              <button
                onClick={() => navigate('city')}
                style={{
                  padding: '6px',
                  background: '#ddd',
                  color: '#333',
                  border: '2px solid #333',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer'
                }}
              >
                SALIR
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBuy}
                style={{
                  padding: '8px',
                  background: '#4CAF50',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                SÍ
              </button>
              <button
                onClick={() => {
                  setIsConfirming(false);
                  setDialogue('Entendido. ¿Qué otra cosa te gustaría comprar?');
                }}
                style={{
                  padding: '6px',
                  background: '#f44336',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontSize: '7px',
                  fontFamily: '"Press Start 2P"',
                  cursor: 'pointer'
                }}
              >
                NO
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
