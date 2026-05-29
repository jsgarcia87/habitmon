import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useGame } from '../context/GameContext';

/**
 * VincularProfesorScreen — el niño introduce el código de invitación que le
 * dio su padre/madre/tutor. Al vincular, el adulto puede empezar a enviarle
 * mensajes-NPC en el mapa, regalarle Pokémon, etc.
 */
const VincularProfesorScreen = ({ navigate }) => {
  const { notify } = useGame();
  const [codigo, setCodigo] = useState('');
  const [misProfes, setMisProfes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.misProfesores();
      setMisProfes(r?.profesores || []);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { cargar(); }, []);

  const vincular = async (e) => {
    e?.preventDefault?.();
    setError(null);
    const c = codigo.trim().toUpperCase();
    if (c.length !== 6) {
      setError('El código debe tener 6 caracteres.');
      return;
    }
    setVinculando(true);
    try {
      const r = await api.vincularProfesor({ codigo: c });
      if (r?.success) {
        notify?.({
          message: `¡Te has vinculado con ${r.profesor_username || 'tu Profesor'}!`,
          type: 'success'
        });
        setCodigo('');
        cargar();
      }
    } catch (e) {
      setError(e?.message || 'No se pudo vincular el código.');
    } finally {
      setVinculando(false);
    }
  };

  return (
    <div className="screen-container" style={{ padding: 20, color: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 14, color: 'var(--primary-color)' }}>VINCULAR FAMILIA</h1>
        <p style={{ fontSize: 7, opacity: 0.7, marginTop: 8 }}>
          Pide a tu padre, madre o tutor el código que ha generado en su cuenta
          y escríbelo aquí.
        </p>
      </div>

      <div className="gb-window">
        <form onSubmit={vincular}>
          <label className="gb-label">CÓDIGO (6 CARACTERES)</label>
          <input
            className="gb-input"
            type="text"
            value={codigo}
            maxLength={6}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="EJ. K7XR42"
            autoCapitalize="characters"
            style={{
              fontFamily: 'monospace', fontSize: 18,
              letterSpacing: 6, textAlign: 'center'
            }}
          />
          {error && (
            <p style={{ color: 'var(--secondary-color)', fontSize: 8, marginTop: 10 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={vinculando}
            className="gb-button primary"
            style={{ width: '100%', marginTop: 14 }}
          >
            {vinculando ? 'VINCULANDO…' : 'VINCULAR'}
          </button>
        </form>
      </div>

      {/* Lista de profesores ya vinculados */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 10, marginBottom: 10 }}>FAMILIA VINCULADA</h2>
        {loading ? (
          <p style={{ fontSize: 8, opacity: 0.6 }}>Cargando…</p>
        ) : misProfes.length === 0 ? (
          <p style={{ fontSize: 8, opacity: 0.6 }}>
            Aún no estás vinculado con nadie.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {misProfes.map(p => (
              <li
                key={p.id}
                style={{
                  background: 'rgba(255,255,255,0.05)', padding: '8px 12px',
                  marginBottom: 6, borderRadius: 4, fontSize: 9
                }}
              >
                <strong style={{ color: 'var(--primary-color)' }}>{p.rol_display}</strong>
                {' · '}
                <span style={{ opacity: 0.8 }}>{p.profesor_username}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={() => navigate('city')} className="gb-button" style={{ fontSize: 8 }}>
          VOLVER
        </button>
      </div>
    </div>
  );
};

export default VincularProfesorScreen;
