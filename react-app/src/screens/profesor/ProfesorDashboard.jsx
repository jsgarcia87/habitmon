import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api';
import { useGame } from '../../context/GameContext';

/**
 * ProfesorDashboard — pantalla principal de la cuenta tipo 'professor'.
 *
 * Tres bloques:
 *  1. Identidad + cerrar sesión.
 *  2. Hijos vinculados (estado activo) — botón "Enviar mensaje" por cada uno.
 *  3. Invitaciones (pendientes) + botón para generar un código nuevo.
 *
 * Estilo deliberadamente "limpio dashboard" — sin canvas ni Press Start 2P:
 *  los padres no quieren leer pixel art durante 30 segundos para entender
 *  qué tienen que hacer.
 */
const ProfesorDashboard = ({ navigate }) => {
  const { logout, user } = useGame();
  const [hijos, setHijos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [nuevoCodigo, setNuevoCodigo] = useState(null);
  const [error, setError] = useState(null);
  const [rolDisplay, setRolDisplay] = useState('PAPÁ');
  const [avatarNpc, setAvatarNpc] = useState(0);

  const cargarHijos = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.profesorHijos();
      setHijos(r?.hijos || []);
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los hijos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarHijos(); }, [cargarHijos]);

  const generarCodigo = async () => {
    setGenerando(true);
    setNuevoCodigo(null);
    setError(null);
    try {
      const r = await api.profesorInvitar({
        rol_display: rolDisplay,
        avatar_npc: avatarNpc
      });
      setNuevoCodigo(r?.codigo);
      cargarHijos();
    } catch (e) {
      setError(e?.message || 'No se pudo generar el código.');
    } finally {
      setGenerando(false);
    }
  };

  const pendientes = hijos.filter(h => h.estado === 'pendiente');
  const activos = hijos.filter(h => h.estado === 'activo');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>Sala del Profesor</div>
          <div style={styles.subtitle}>
            {user?.username ? `Conectado como ${user.username}` : 'Habitmon'}
          </div>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Cerrar sesión</button>
      </header>

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* ── Hijos activos ─────────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Tus hijos</h2>
        {loading ? (
          <div style={styles.muted}>Cargando…</div>
        ) : activos.length === 0 ? (
          <div style={styles.empty}>
            Aún no tienes ningún hijo vinculado. Genera un código de invitación
            abajo y dáselo a tu hijo/a para que lo introduzca en el juego.
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {activos.map(h => (
              <div key={h.id} style={styles.childCard}>
                <div style={styles.childName}>{h.child_username}</div>
                <div style={styles.childMeta}>
                  Te llama: <strong>{h.rol_display}</strong>
                </div>
                {h.partner_nombre && (
                  <div style={styles.childMeta}>
                    Pokémon compañero: {h.partner_nombre}
                  </div>
                )}
                <div style={styles.cardActions}>
                  <button
                    onClick={() => navigate('profesor_mensaje', { relacion: h })}
                    style={styles.primaryBtn}
                  >
                    Enviar un mensaje
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Invitar a un hijo ─────────────────────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Invitar a un hijo</h2>
        <p style={styles.paragraph}>
          Genera un código de 6 caracteres y dícelo a tu hijo/a. En el juego
          podrá introducirlo en <em>Menú → Vincular Familia</em>.
        </p>

        <div style={styles.formRow}>
          <label style={styles.label}>
            <span>¿Cómo te llama?</span>
            <select
              value={rolDisplay}
              onChange={e => setRolDisplay(e.target.value)}
              style={styles.input}
            >
              <option value="PAPÁ">PAPÁ</option>
              <option value="MAMÁ">MAMÁ</option>
              <option value="ABUELO">ABUELO</option>
              <option value="ABUELA">ABUELA</option>
              <option value="TÍO">TÍO</option>
              <option value="TÍA">TÍA</option>
              <option value="PROFESOR">PROFESOR</option>
            </select>
          </label>

          <label style={styles.label}>
            <span>Avatar en el juego</span>
            <select
              value={avatarNpc}
              onChange={e => setAvatarNpc(Number(e.target.value))}
              style={styles.input}
            >
              <option value={0}>Figura clásica</option>
              <option value={1}>Figura femenina</option>
              <option value={2}>Abuelo</option>
              <option value={3}>Abuela</option>
            </select>
          </label>

          <button
            onClick={generarCodigo}
            disabled={generando}
            style={styles.primaryBtn}
          >
            {generando ? 'Generando…' : 'Generar código'}
          </button>
        </div>

        {nuevoCodigo && (
          <div style={styles.codigoBox}>
            <div style={styles.muted}>Tu código (válido 7 días):</div>
            <div style={styles.codigoGrande}>{nuevoCodigo}</div>
          </div>
        )}

        {pendientes.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={styles.h3}>Códigos pendientes</h3>
            <ul style={styles.list}>
              {pendientes.map(h => (
                <li key={h.id} style={styles.pendingItem}>
                  <code style={styles.codigoChico}>{h.codigo_invitacion}</code>
                  <span style={styles.muted}>como {h.rol_display}</span>
                  <span style={styles.muted}>
                    {h.expira_en && `caduca: ${new Date(h.expira_en).toLocaleDateString()}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100dvh',
    background: '#f5f7fa',
    color: '#1f2937',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    padding: '24px',
    maxWidth: 880,
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb'
  },
  title: { fontSize: 24, fontWeight: 700, color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutBtn: {
    background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '8px 14px', color: '#374151', fontSize: 13, cursor: 'pointer'
  },
  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
    padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13
  },
  section: {
    background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)'
  },
  h2: { fontSize: 18, fontWeight: 600, marginBottom: 14, marginTop: 0 },
  h3: { fontSize: 14, fontWeight: 600, marginBottom: 8 },
  paragraph: { color: '#4b5563', fontSize: 14, marginBottom: 16, lineHeight: 1.5 },
  muted: { color: '#6b7280', fontSize: 13 },
  empty: {
    background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8,
    padding: 16, color: '#6b7280', fontSize: 13, lineHeight: 1.5
  },
  cardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12
  },
  childCard: {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 4
  },
  childName: { fontSize: 16, fontWeight: 600 },
  childMeta: { fontSize: 13, color: '#6b7280' },
  cardActions: { marginTop: 12 },
  primaryBtn: {
    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
    padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
  },
  formRow: {
    display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap'
  },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#374151' },
  input: {
    padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, minWidth: 160, background: '#fff', color: '#1f2937'
  },
  codigoBox: {
    background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
    padding: 16, marginTop: 18, textAlign: 'center'
  },
  codigoGrande: {
    fontSize: 32, fontWeight: 700, letterSpacing: 6, color: '#1e3a8a',
    fontFamily: 'monospace', marginTop: 6
  },
  codigoChico: {
    background: '#f3f4f6', padding: '2px 8px', borderRadius: 4,
    fontFamily: 'monospace', fontSize: 13
  },
  list: { listStyle: 'none', padding: 0, margin: 0 },
  pendingItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
    borderBottom: '1px solid #f3f4f6'
  }
};

export default ProfesorDashboard;
