import React, { useState, useMemo } from 'react';
import { api } from '../../api';

/**
 * ProfesorMensaje — editor de mensaje-NPC.
 *
 * El padre escribe hasta 280 caracteres (2 páginas de 140), elige fecha
 * (por defecto mañana) y al enviarlo se programa: el niño verá el NPC
 * con ese texto al entrar a Pueblo Primavera ese día.
 *
 * Plantillas sugeridas para empujar tono positivo. Filtro local mínimo
 * de palabras dañinas (lista corta, ampliable).
 */

const PLANTILLAS = [
  '¡Estoy muy orgulloso/a de ti! Hoy puedes con todos tus retos. 💪',
  'Sé que la HIGIENE es la que más te cuesta, pero confío en ti. ¡Adelante!',
  'Si terminas todos tus hábitos antes de cenar, esta noche elegimos peli juntos.',
  'Hoy es buen día para retar al gimnasio de DESAYUNO. ¡Sorpréndeme!',
  'Acuérdate de beber agua. ¡Tu Pokémon te lo agradecerá!'
];

const PALABRAS_FILTRADAS = [
  // Lista mínima de términos negativos — solo activa una advertencia,
  // no bloquea el envío (el padre decide).
  'idiota', 'estúpido', 'tonto', 'inútil', 'castigo', 'odio'
];

const ProfesorMensaje = ({ navigate, screenData }) => {
  const relacion = screenData?.relacion;
  const [texto, setTexto] = useState('');
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const avisoTono = useMemo(() => {
    const lower = texto.toLowerCase();
    return PALABRAS_FILTRADAS.find(w => lower.includes(w));
  }, [texto]);

  const restante = 280 - texto.length;

  if (!relacion) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBanner}>
          No hay relación seleccionada. Vuelve al Dashboard.
        </div>
        <button onClick={() => navigate('profesor_dashboard')} style={styles.secondaryBtn}>
          ← Volver
        </button>
      </div>
    );
  }

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await api.profesorEnviarMensaje({
        relacion_id: relacion.id,
        texto: texto.trim(),
        programado_para: fecha
      });
      setResultado(r);
      setTexto('');
    } catch (e) {
      setError(e?.message || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={() => navigate('profesor_dashboard')} style={styles.backBtn}>
          ← Dashboard
        </button>
        <div style={styles.title}>
          Mensaje para <strong>{relacion.child_username}</strong>
        </div>
      </header>

      {resultado && (
        <div style={styles.successBanner}>
          ✓ Mensaje programado para el {new Date(resultado.programado_para).toLocaleDateString()}.
          {' '}Aparecerá como NPC en el pueblo ese día.
        </div>
      )}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Plantillas */}
      <section style={styles.section}>
        <h3 style={styles.h3}>Sugerencias</h3>
        <p style={styles.muted}>Toca una para usarla como punto de partida:</p>
        <div style={styles.plantillas}>
          {PLANTILLAS.map((p, i) => (
            <button
              key={i}
              onClick={() => setTexto(p.slice(0, 280))}
              style={styles.plantillaBtn}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Editor */}
      <section style={styles.section}>
        <h3 style={styles.h3}>Tu mensaje</h3>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value.slice(0, 280))}
          placeholder="Escribe algo cariñoso y específico…"
          rows={4}
          style={styles.textarea}
        />
        <div style={styles.counter}>
          {restante} caracteres restantes
        </div>
        {avisoTono && (
          <div style={styles.toneWarning}>
            ⚠️ Detectamos la palabra <strong>“{avisoTono}”</strong>. Recuerda que
            el niño leerá este mensaje en su aventura — el refuerzo positivo
            funciona mejor que el reproche.
          </div>
        )}
      </section>

      {/* Fecha + envío */}
      <section style={styles.section}>
        <h3 style={styles.h3}>¿Cuándo aparece?</h3>
        <p style={styles.muted}>
          El NPC aparecerá en Pueblo Primavera el día elegido y desaparecerá
          cuando tu hijo/a hable con él.
        </p>
        <div style={styles.formRow}>
          <label style={styles.label}>
            <span>Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={styles.input}
            />
          </label>
        </div>

        <button
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          style={{
            ...styles.primaryBtn,
            ...(enviando || !texto.trim() ? styles.btnDisabled : {})
          }}
        >
          {enviando ? 'Enviando…' : 'Programar mensaje'}
        </button>
      </section>

      {/* Preview de cómo se verá en el juego */}
      <section style={styles.section}>
        <h3 style={styles.h3}>Vista previa (lado niño)</h3>
        <div style={styles.preview}>
          <div style={styles.previewHeader}>
            💬 {relacion.rol_display}
          </div>
          <div style={styles.previewBody}>
            {texto || 'Tu mensaje aparecerá aquí…'}
          </div>
          <div style={styles.previewFooter}>▼</div>
        </div>
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
    padding: 24, maxWidth: 720, margin: '0 auto', boxSizing: 'border-box'
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 16,
    paddingBottom: 16, borderBottom: '1px solid #e5e7eb', marginBottom: 20
  },
  backBtn: {
    background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '6px 12px', color: '#374151', fontSize: 13, cursor: 'pointer'
  },
  title: { fontSize: 18, fontWeight: 600 },
  section: {
    background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  h3: { fontSize: 15, fontWeight: 600, marginTop: 0, marginBottom: 10 },
  muted: { color: '#6b7280', fontSize: 13, marginBottom: 12 },
  plantillas: { display: 'flex', flexDirection: 'column', gap: 6 },
  plantillaBtn: {
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
    padding: '8px 12px', fontSize: 13, color: '#374151', cursor: 'pointer',
    textAlign: 'left', lineHeight: 1.4
  },
  textarea: {
    width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 8,
    border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'inherit',
    resize: 'vertical', minHeight: 90, lineHeight: 1.5
  },
  counter: { fontSize: 12, color: '#6b7280', textAlign: 'right', marginTop: 4 },
  toneWarning: {
    background: '#fffbeb', border: '1px solid #fde68a', color: '#78350f',
    padding: '10px 12px', borderRadius: 8, marginTop: 10, fontSize: 13, lineHeight: 1.5
  },
  formRow: { display: 'flex', gap: 12, marginBottom: 14 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 },
  input: {
    padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, background: '#fff', color: '#1f2937'
  },
  primaryBtn: {
    background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer'
  },
  secondaryBtn: {
    background: '#fff', color: '#374151', border: '1px solid #e5e7eb',
    borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer'
  },
  btnDisabled: { background: '#9ca3af', cursor: 'not-allowed' },
  successBanner: {
    background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#065f46',
    padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14
  },
  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
    padding: '12px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14
  },
  preview: {
    background: '#1a1a2e', color: '#fff', border: '4px solid #FFD700',
    borderRadius: 4, padding: '12px 14px', fontFamily: '"Press Start 2P", monospace',
    fontSize: 11, lineHeight: 1.5
  },
  previewHeader: {
    color: '#FFD700', fontSize: 9, marginBottom: 8,
    borderBottom: '1px solid #444', paddingBottom: 4
  },
  previewBody: { minHeight: 48, fontSize: 9, lineHeight: 1.6 },
  previewFooter: { textAlign: 'right', color: '#FFD700', marginTop: 4 }
};

export default ProfesorMensaje;
