import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SpriteAvatar } from '../components/GBSprite';
import PokemonSprite from '../components/PokemonSprite';
import { getAssetPath, api } from '../api';

const FriendsScreen = ({ onNavigate }) => {
  const { notify } = useGame();
  const [tab, setTab] = useState('amigos'); // 'amigos', 'solicitudes', 'agregar'
  const [data, setData] = useState({ amigos: [], recibidas: [], enviadas: [] });
  const [loadingAmigos, setLoadingAmigos] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFriends = async () => {
    try {
      const res = await api.getAmigos();
      if (res.success) {
        setData({
          amigos: res.amigos || [],
          recibidas: res.recibidas || [],
          enviadas: res.enviadas || []
        });
      }
    } catch (e) {
      console.error(e);
      notify('Error al cargar amigos', 'error');
    } finally {
      setLoadingAmigos(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    const targetName = searchUsername.trim();
    if (!targetName) return;
    setActionLoading(true);
    try {
      const res = await api.enviarSolicitudAmistad({ username: targetName });
      if (res.success) {
        notify(res.message || 'Solicitud enviada con éxito', 'success');
        setSearchUsername('');
        await fetchFriends();
        setTab('solicitudes');
      }
    } catch (e) {
      console.error(e);
      notify(e.message || 'Error al enviar solicitud', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    setActionLoading(true);
    try {
      const res = await api.aceptarSolicitudAmistad({ friend_id: friendId });
      if (res.success) {
        notify(res.message || '¡Solicitud aceptada!', 'success');
        await fetchFriends();
      }
    } catch (e) {
      console.error(e);
      notify('Error al aceptar la solicitud', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrDelete = async (friendId, confirmMsg, successMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActionLoading(true);
    try {
      const res = await api.rechazarSolicitudAmistad({ friend_id: friendId });
      if (res.success) {
        notify(successMsg || 'Acción completada con éxito', 'success');
        await fetchFriends();
      }
    } catch (e) {
      console.error(e);
      notify('Error al realizar la acción', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = data.recibidas.length;

  return (
    <div className="screen-container" style={{
      background: 'var(--bg-color)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '4px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        <h2 style={{ fontSize: 11, color: 'var(--retro-blue)', margin: 0, fontFamily: 'var(--font-main)' }}>👥 CENTRO SOCIAL</h2>
        <button 
          onClick={() => onNavigate('city')}
          className="gb-button secondary"
          style={{ padding: '6px 12px', fontSize: 7, minWidth: '40px' }}
        >
          SALIR
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        width: '100%',
        background: 'rgba(0, 0, 0, 0.05)',
        border: '3px solid var(--border-color)',
        padding: '2px',
        gap: '2px'
      }}>
        <button 
          onClick={() => setTab('amigos')}
          className="gb-control-btn"
          style={{
            flex: 1,
            background: tab === 'amigos' ? 'var(--retro-blue)' : 'var(--bg-panel)',
            color: tab === 'amigos' ? '#fff' : 'var(--text-main)',
            border: '2px solid var(--border-color)',
            fontFamily: 'var(--font-main)',
            fontSize: '7px',
            padding: '8px 2px',
            cursor: 'pointer'
          }}
        >
          AMIGOS
        </button>
        <button 
          onClick={() => setTab('solicitudes')}
          className="gb-control-btn"
          style={{
            flex: 1,
            background: tab === 'solicitudes' ? 'var(--retro-purple)' : 'var(--bg-panel)',
            color: tab === 'solicitudes' ? '#fff' : 'var(--text-main)',
            border: '2px solid var(--border-color)',
            fontFamily: 'var(--font-main)',
            fontSize: '7px',
            padding: '8px 2px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          SOLICITS
          {pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--retro-red)',
              color: '#fff',
              fontSize: '6px',
              padding: '2px 4px',
              border: '1.5px solid #fff',
              fontFamily: 'var(--font-main)'
            }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setTab('agregar')}
          className="gb-control-btn"
          style={{
            flex: 1,
            background: tab === 'agregar' ? 'var(--retro-green)' : 'var(--bg-panel)',
            color: tab === 'agregar' ? '#fff' : 'var(--text-main)',
            border: '2px solid var(--border-color)',
            fontFamily: 'var(--font-main)',
            fontSize: '7px',
            padding: '8px 2px',
            cursor: 'pointer'
          }}
        >
          AGREGAR
        </button>
      </div>

      {/* Main Panel Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loadingAmigos ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <div className="blinker" style={{ fontSize: 9, fontFamily: 'var(--font-main)', color: 'var(--text-main)' }}>CONECTANDO...</div>
          </div>
        ) : (
          <>
            {/* Tab: Amigos */}
            {tab === 'amigos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.amigos.length === 0 ? (
                  <div className="retro-panel" style={{ padding: '20px 16px', background: 'var(--bg-panel)', color: 'var(--text-main)', textAlign: 'center', border: '3px solid var(--border-color)' }}>
                    <div style={{ fontSize: '8px', lineHeight: '1.6', fontFamily: 'var(--font-main)' }}>
                      ¡NO TIENES AMIGOS TODAVÍA!<br/><br/>
                      COMPARTE TU NOMBRE DE USUARIO Y AGREGA OTROS ENTRENADORES.
                    </div>
                  </div>
                ) : (
                  data.amigos.map(friend => (
                    <div 
                      key={friend.friend_id}
                      className="premium-card"
                      style={{
                        padding: '12px',
                        display: 'flex',
                        background: 'var(--bg-panel)',
                        border: '3px solid var(--border-color)',
                        color: 'var(--text-main)',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        boxShadow: '2px 2px 0px rgba(0,0,0,0.15)'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '48px',
                        height: '56px',
                        background: 'rgba(0,0,0,0.05)',
                        border: '2px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        <SpriteAvatar 
                          path={getAssetPath(`/Graphics/characters/trchar${String(friend.avatar || 0).padStart(3, '0')}.png`)} 
                          width={32}
                          height={40}
                          col={0}
                          row={0}
                          style={{
                            transform: 'scale(1.4)'
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'var(--font-main)', wordBreak: 'break-all' }}>
                          {friend.username?.toUpperCase()}
                        </div>
                        {friend.pokemon_id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '6px', color: '#777', fontFamily: 'var(--font-main)' }}>PARTNER:</span>
                            <span style={{ fontSize: '7px', color: 'var(--retro-blue)', fontFamily: 'var(--font-main)', fontWeight: 'bold' }}>
                              {friend.pokemon_nombre?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '7px', color: 'var(--retro-red)', fontFamily: 'var(--font-main)' }}>
                              Lv{friend.partner_level}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '6px', color: '#999', fontFamily: 'var(--font-main)' }}>SIN PARTNER ACTIVO</div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', fontSize: '6px', color: '#777', fontFamily: 'var(--font-main)' }}>
                          <span>🏆 HÁBITOS: <strong style={{ color: 'var(--text-main)' }}>{friend.habitos_completados}</strong></span>
                          <span>🏅 MEDALLAS: <strong style={{ color: 'var(--text-main)' }}>{friend.medallas}</strong></span>
                        </div>
                      </div>

                      {/* PKMN Sprite / Delete Button */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {friend.pokemon_id && (
                          <PokemonSprite 
                            id={friend.pokemon_id}
                            style={{ width: '40px', height: '40px', background: 'transparent' }}
                          />
                        )}
                        <button
                          onClick={() => handleRejectOrDelete(friend.friend_id, `¿Seguro que quieres eliminar a ${friend.username} de tus amigos?`, 'Amigo eliminado')}
                          className="gb-control-btn"
                          disabled={actionLoading}
                          style={{
                            padding: '4px 6px',
                            background: 'var(--retro-red)',
                            color: '#fff',
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '6px',
                            fontFamily: 'var(--font-main)'
                          }}
                        >
                          BORRAR
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Solicitudes */}
            {tab === 'solicitudes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Recibidas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '7px', margin: 0, color: 'var(--retro-purple)', fontFamily: 'var(--font-main)', borderBottom: '2px solid var(--retro-purple)', paddingBottom: '4px' }}>RECIBIDAS ({data.recibidas.length})</h3>
                  {data.recibidas.length === 0 ? (
                    <div style={{ fontSize: '6px', color: '#999', fontFamily: 'var(--font-main)', padding: '10px 0', textAlign: 'center' }}>
                      NO TIENES SOLICITUDES ENTRANTES.
                    </div>
                  ) : (
                    data.recibidas.map(req => (
                      <div 
                        key={req.friend_id}
                        className="premium-card"
                        style={{
                          padding: '10px',
                          display: 'flex',
                          background: 'var(--bg-panel)',
                          border: '2px solid var(--border-color)',
                          color: 'var(--text-main)',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '40px',
                            background: 'rgba(0,0,0,0.05)',
                            border: '1.5px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                          }}>
                            <SpriteAvatar 
                              path={getAssetPath(`/Graphics/characters/trchar${String(req.avatar || 0).padStart(3, '0')}.png`)} 
                              width={32}
                              height={40}
                              col={0}
                              row={0}
                              style={{
                                transform: 'scale(1.1)'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'var(--font-main)' }}>{req.username?.toUpperCase()}</div>
                            {req.pokemon_id && (
                              <div style={{ fontSize: '6px', color: 'var(--retro-blue)', fontFamily: 'var(--font-main)' }}>
                                {req.pokemon_nombre?.toUpperCase()} Lv{req.partner_level}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleAcceptRequest(req.friend_id)}
                            className="gb-control-btn"
                            disabled={actionLoading}
                            style={{
                              padding: '6px 8px',
                              background: 'var(--retro-green)',
                              color: '#fff',
                              border: '1.5px solid var(--border-color)',
                              cursor: 'pointer',
                              fontSize: '6px',
                              fontFamily: 'var(--font-main)',
                              fontWeight: 'bold'
                            }}
                          >
                            ACEPTAR
                          </button>
                          <button
                            onClick={() => handleRejectOrDelete(req.friend_id, null, 'Solicitud rechazada')}
                            className="gb-control-btn"
                            disabled={actionLoading}
                            style={{
                              padding: '6px 8px',
                              background: 'var(--retro-red)',
                              color: '#fff',
                              border: '1.5px solid var(--border-color)',
                              cursor: 'pointer',
                              fontSize: '6px',
                              fontFamily: 'var(--font-main)'
                            }}
                          >
                            RECHAZAR
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Enviadas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <h3 style={{ fontSize: '7px', margin: 0, color: '#777', fontFamily: 'var(--font-main)', borderBottom: '2px solid #ccc', paddingBottom: '4px' }}>ENVIADAS ({data.enviadas.length})</h3>
                  {data.enviadas.length === 0 ? (
                    <div style={{ fontSize: '6px', color: '#999', fontFamily: 'var(--font-main)', padding: '10px 0', textAlign: 'center' }}>
                      NO TIENES SOLICITUDES ENVIADAS.
                    </div>
                  ) : (
                    data.enviadas.map(req => (
                      <div 
                        key={req.friend_id}
                        className="premium-card"
                        style={{
                          padding: '10px',
                          display: 'flex',
                          background: 'var(--bg-panel)',
                          border: '2px solid var(--border-color)',
                          color: 'var(--text-main)',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '6px',
                          opacity: 0.85
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '40px',
                            background: 'rgba(0,0,0,0.05)',
                            border: '1.5px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                          }}>
                            <SpriteAvatar 
                              path={getAssetPath(`/Graphics/characters/trchar${String(req.avatar || 0).padStart(3, '0')}.png`)} 
                              width={32}
                              height={40}
                              col={0}
                              row={0}
                              style={{
                                transform: 'scale(1.1)'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ fontSize: '8px', fontWeight: 'bold', fontFamily: 'var(--font-main)' }}>{req.username?.toUpperCase()}</div>
                            <span style={{ fontSize: '5px', color: '#777', fontFamily: 'var(--font-main)' }}>PENDIENTE...</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRejectOrDelete(req.friend_id, null, 'Solicitud cancelada')}
                          className="gb-control-btn"
                          disabled={actionLoading}
                          style={{
                            padding: '6px 8px',
                            background: '#777',
                            color: '#fff',
                            border: '1.5px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '6px',
                            fontFamily: 'var(--font-main)'
                          }}
                        >
                          CANCELAR
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Agregar */}
            {tab === 'agregar' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <form onSubmit={handleSendRequest} className="retro-panel" style={{
                  padding: '16px',
                  background: 'var(--bg-panel)',
                  border: '3px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div className="gb-input-group" style={{ margin: 0 }}>
                    <label className="gb-label" style={{ fontSize: '7px', marginBottom: '8px', fontFamily: 'var(--font-main)' }}>
                      NOMBRE DE USUARIO DEL AMIGO:
                    </label>
                    <input 
                      type="text"
                      className="gb-input"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      placeholder="Ej: TrainerRed"
                      disabled={actionLoading}
                      required
                      style={{
                        padding: '10px 8px',
                        fontSize: '9px',
                        border: '3px solid var(--border-color)',
                        textTransform: 'none',
                        fontFamily: 'var(--font-main)'
                      }}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="gb-button primary"
                    disabled={actionLoading || !searchUsername.trim()}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '8px',
                      fontFamily: 'var(--font-main)'
                    }}
                  >
                    {actionLoading ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
                  </button>
                </form>

                <div className="retro-panel" style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '2px solid var(--border-color)',
                  fontSize: '6px',
                  lineHeight: '1.8',
                  fontFamily: 'var(--font-main)',
                  color: '#666'
                }}>
                  💡 CONSEJO:<br/>
                  ¡PÍDELE A TU AMIGO SU APODO EXACTO! EL NOMBRE DE USUARIO distingue entre mayúsculas y minúsculas.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsScreen;
