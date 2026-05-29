import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

/**
 * ProfesorRegister — alta de una cuenta tipo 'professor'.
 * Tras registrarse, GameContext.registerProfesor ya hace saveAuth → el
 * useEffect global de App.jsx redirige a profesor_dashboard.
 */
const ProfesorRegister = ({ navigate }) => {
  const { registerProfesor } = useGame();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await registerProfesor(username, email, password);
      if (!r?.success) {
        setError(r?.error || 'No se pudo crear la cuenta.');
      }
      // si éxito, la redirección la hace App.jsx (useEffect auth-sync)
    } catch (e) {
      setError(e?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Crear cuenta de Profesor</h1>
        <p style={styles.lead}>
          Esta cuenta es para padres, madres o tutores. Te permite enviar
          mensajes que aparecen en el juego de tu hijo/a y acompañarle en
          sus rutinas diarias.
        </p>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            <span>Nombre de usuario</span>
            <input
              required
              minLength={3}
              maxLength={50}
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={styles.input}
              placeholder="ej. mamá_julia"
            />
          </label>

          <label style={styles.label}>
            <span>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span>Contraseña</span>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <div style={styles.linkRow}>
          <button onClick={() => navigate('login')} style={styles.linkBtn}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100dvh',
    background: '#f5f7fa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
  },
  card: {
    background: '#fff', borderRadius: 16, padding: 32,
    maxWidth: 420, width: '100%',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
  },
  title: { fontSize: 22, fontWeight: 700, marginTop: 0, marginBottom: 8, color: '#111827' },
  lead: { fontSize: 14, color: '#6b7280', lineHeight: 1.5, marginBottom: 22 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#374151' },
  input: {
    padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, background: '#fff', color: '#1f2937'
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
    padding: '8px 12px', borderRadius: 8, fontSize: 13
  },
  submitBtn: {
    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
    marginTop: 4
  },
  linkRow: { marginTop: 16, textAlign: 'center' },
  linkBtn: {
    background: 'transparent', border: 'none', color: '#3b82f6',
    fontSize: 13, cursor: 'pointer'
  }
};

export default ProfesorRegister;
