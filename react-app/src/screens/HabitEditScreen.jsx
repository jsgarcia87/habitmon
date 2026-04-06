import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

/**
 * HabitEditScreen — Editar hábitos activos del día
 *
 * Permite al usuario:
 * - Ver qué hábitos están activos hoy
 * - Activar/desactivar hábitos no completados
 * - Reiniciar el día completo (cuidado: borra el progreso)
 * - Confirmar cambios (llama a setupDay de nuevo solo con los cambios no-completados)
 */
const HabitEditScreen = ({ onNavigate }) => {
  const { template, progress, setupDay, fetchTemplate } = useGame();
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedGym, setExpandedGym] = useState(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  // Inicializar con el estado actual del progreso
  useEffect(() => {
    if (!template || !Array.isArray(template)) return;

    const current = [];
    template.forEach(gym => {
      if (!gym.pokemon) return;
      gym.pokemon.forEach((pk, pkIdx) => {
        if (!pk.habitos) return;
        pk.habitos.forEach(task => {
          const existingHabit = progress?.habitos?.find(
            h => String(h.gym_id) === String(gym.gym_id) &&
                 String(h.id) === String(task.id)
          );
          current.push({
            gym_id: gym.gym_id,
            gym_nombre: gym.gym_nombre,
            pokemon_index: pkIdx,
            habito_id: task.id,
            habito_nombre: task.nombre,
            icono: task.icono || '🐾',
            completado: existingHabit?.completado || false,
            // Activo si existe en el progreso de hoy
            active: !!existingHabit,
          });
        });
      });
    });
    setSelectedHabits(current);
  }, [template, progress]);

  const toggleHabit = (gymId, habitId) => {
    setSelectedHabits(prev => prev.map(h => {
      if (h.gym_id === gymId && h.habito_id === habitId) {
        // No permitir desactivar hábitos ya completados
        if (h.completado) return h;
        return { ...h, active: !h.active };
      }
      return h;
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Solo enviamos hábitos activos y NO completados (para no sobreescribir progreso)
    const toSubmit = selectedHabits.filter(h => h.active).map(h => ({
      gym_id: h.gym_id,
      pokemon_index: h.pokemon_index,
      habito_id: h.habito_id,
      habito_nombre: h.habito_nombre,
      active: true,
    }));
    await setupDay(toSubmit);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Agrupar por gimnasio
  const gymGroups = {};
  selectedHabits.forEach(h => {
    if (!gymGroups[h.gym_id]) gymGroups[h.gym_id] = { nombre: h.gym_nombre, habits: [] };
    gymGroups[h.gym_id].habits.push(h);
  });

  const completedCount = selectedHabits.filter(h => h.completado).length;
  const activeCount = selectedHabits.filter(h => h.active && !h.completado).length;

  if (!template) {
    return (
      <div style={s.screen}>
        <div style={{ color: '#aaa', fontSize: '10px', margin: 'auto' }}>CARGANDO...</div>
      </div>
    );
  }

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => onNavigate('INDOOR', null)}>← VOLVER</button>
        <h2 style={s.title}>📝 EDITAR HÁBITOS</h2>
        <div style={s.headerRight} />
      </div>

      {/* Stats bar */}
      <div style={s.statsBar}>
        <div style={s.statPill}>
          <span style={s.statV}>{completedCount}</span>
          <span style={s.statL}>HECHOS</span>
        </div>
        <div style={s.statPill}>
          <span style={s.statV}>{activeCount}</span>
          <span style={s.statL}>PENDIENTES</span>
        </div>
        <div style={s.statPill}>
          <span style={s.statV}>{selectedHabits.filter(h => !h.active).length}</span>
          <span style={s.statL}>OMITIDOS</span>
        </div>
      </div>

      {/* Lista de gimnasios */}
      <div style={s.list}>
        {Object.entries(gymGroups).map(([gymId, group]) => {
          const isOpen = expandedGym === gymId || expandedGym === null;
          const gymDone = group.habits.every(h => h.completado);
          return (
            <div key={gymId} style={{ ...s.gymCard, ...(gymDone ? s.gymDone : {}) }}>
              {/* Gym header */}
              <button
                style={s.gymHeader}
                onClick={() => setExpandedGym(expandedGym === gymId ? null : gymId)}
              >
                <span style={s.gymIcon}>{gymDone ? '🏅' : '🏋️'}</span>
                <span style={s.gymName}>{group.nombre}</span>
                <span style={s.gymCount}>
                  {group.habits.filter(h => h.completado).length}/{group.habits.length}
                </span>
                <span style={{ color: '#aaa', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Habit list */}
              {isOpen && group.habits.map(h => (
                <div
                  key={h.habito_id}
                  style={{
                    ...s.habitRow,
                    ...(h.completado ? s.habitDone : {}),
                    ...((!h.active && !h.completado) ? s.habitOff : {}),
                  }}
                  onClick={() => toggleHabit(gymId, h.habito_id)}
                >
                  <span style={s.habitIcon}>{h.icono}</span>
                  <span style={s.habitName}>{h.habito_nombre}</span>
                  <div style={s.habitStatus}>
                    {h.completado ? (
                      <span style={s.badgeDone}>✓ HECHO</span>
                    ) : h.active ? (
                      <span style={s.badgeActive}>● ACTIVO</span>
                    ) : (
                      <span style={s.badgeOff}>○ OMITIR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Guardar */}
      <div style={s.footer}>
        <p style={s.footerHint}>
          Los hábitos ya completados no se pueden desactivar.
        </p>
        <button
          style={{
            ...s.saveBtn,
            backgroundColor: saved ? '#2a7a2a' : '#3048a8',
            borderColor: saved ? '#1a5a1a' : '#1a2870',
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'GUARDANDO...' : saved ? '¡GUARDADO! ✓' : 'GUARDAR CAMBIOS'}
        </button>
      </div>
    </div>
  );
};

const s = {
  screen: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: '"Press Start 2P", cursive',
    backgroundColor: '#f4f4f8',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#3048a8',
    borderBottom: '3px solid #1a2870',
    flexShrink: 0,
  },
  backBtn: {
    background: 'none', border: '2px solid rgba(255,255,255,0.6)', color: '#fff',
    padding: '6px 10px', fontSize: '7px',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
  },
  title: { fontSize: 'clamp(8px, 2.5vw, 11px)', color: '#fff' },
  headerRight: { width: '70px' },

  statsBar: {
    display: 'flex', gap: '8px', padding: '10px 12px',
    backgroundColor: '#1a2870', flexShrink: 0,
  },
  statPill: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', padding: '6px 4px',
  },
  statV: { fontSize: 'clamp(12px, 3.5vw, 16px)', color: '#fff', fontWeight: 'bold' },
  statL: { fontSize: '6px', color: '#a0b0f0', marginTop: '2px' },

  list: {
    flex: 1, overflowY: 'auto', padding: '10px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },

  gymCard: {
    backgroundColor: '#fff', border: '3px solid #333',
    borderRadius: '4px', overflow: 'hidden',
    boxShadow: '3px 3px 0 #999',
  },
  gymDone: {
    border: '3px solid #4caf50', boxShadow: '3px 3px 0 #2a7a2a',
  },
  gymHeader: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px', backgroundColor: '#f8f8f8',
    border: 'none', borderBottom: '2px solid #eee',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
    textAlign: 'left',
  },
  gymIcon: { fontSize: '16px' },
  gymName: { flex: 1, fontSize: 'clamp(7px, 1.8vw, 9px)', color: '#222' },
  gymCount: { fontSize: '7px', color: '#666', marginRight: '4px' },

  habitRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '9px 12px', cursor: 'pointer',
    borderBottom: '1px solid #eee',
    transition: 'background-color 0.1s',
    backgroundColor: 'white',
  },
  habitDone: { backgroundColor: '#f0fff0' },
  habitOff: { backgroundColor: '#f8f8f8', opacity: 0.6 },
  habitIcon: { fontSize: '20px', flexShrink: 0 },
  habitName: {
    flex: 1, fontSize: 'clamp(7px, 1.8vw, 8px)',
    color: '#333', lineHeight: '1.4',
  },
  habitStatus: { flexShrink: 0 },
  badgeDone: { fontSize: '6px', color: '#4caf50', fontWeight: 'bold' },
  badgeActive: { fontSize: '6px', color: '#3048a8', fontWeight: 'bold' },
  badgeOff: { fontSize: '6px', color: '#aaa' },

  footer: {
    padding: '10px 12px', backgroundColor: '#f0f0f8',
    borderTop: '3px solid #ccc', flexShrink: 0,
  },
  footerHint: {
    fontSize: 'clamp(6px, 1.5vw, 7px)', color: '#888',
    textAlign: 'center', marginBottom: '8px', lineHeight: '1.6',
  },
  saveBtn: {
    width: '100%', padding: '14px',
    color: '#fff', border: '3px solid',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
    fontSize: 'clamp(8px, 2vw, 10px)',
    transition: 'background-color 0.3s, border-color 0.3s',
  },
};

export default HabitEditScreen;
