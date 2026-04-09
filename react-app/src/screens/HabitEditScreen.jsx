import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

/**
 * HabitEditScreen — Editor CRUD de la Plantilla de Hábitos
 * Permite a los padres añadir, editar o borrar hábitos para preparar la aventura.
 */
const HabitEditScreen = ({ onNavigate }) => {
  const { template, saveCustomTemplate, fetchTemplate, progress } = useGame();
  const [localTemplate, setLocalTemplate] = useState([]);
  const [expandedGym, setExpandedGym] = useState(null);
  
  // Estado para el modal de edición/creación
  const [editingHabit, setEditingHabit] = useState(null); // null = oculto, { gym_id, habito } = visible
  const [editForm, setEditForm] = useState({ id: '', nombre: '', daño: 20, icono: '⚔️' });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Si no hay template, lo pedimos
    if (!template) {
       fetchTemplate();
    } else {
       // Deep copy the template to edit locally before saving
       setLocalTemplate(JSON.parse(JSON.stringify(template)));
    }
  }, [template]);

  const handleOpenEdit = (gymId, habit) => {
    setEditingHabit({ gymId, isNew: false });
    setEditForm({ 
       id: habit.id, 
       nombre: habit.nombre, 
       daño: habit.daño || habit.damage || 20, 
       icono: habit.icono || '⚔️' 
    });
  };

  const handleOpenNew = (gymId) => {
    setEditingHabit({ gymId, isNew: true });
    setEditForm({ 
       id: 'custom_' + Date.now().toString(36), 
       nombre: '', 
       daño: 20, 
       icono: '⚔️' 
    });
  };

  const handleDelete = (gymId, habitId) => {
    if (!window.confirm('¿Seguro que quieres borrar este hábito?')) return;
    setLocalTemplate(prev => prev.map(gym => {
      if (gym.gym_id === gymId) {
        // Borrar del pokemon lider (que es la fuente de verdad que usa DailySetupScreen)
        let newPokemon = gym.pokemon;
        if (newPokemon && newPokemon[0]) {
           newPokemon[0].habitos = (newPokemon[0].habitos || []).filter(h => h.id !== habitId);
        }
        const newHabitos = (newPokemon?.[0]?.habitos) || (gym.habitos || []).filter(h => h.id !== habitId);
        return { ...gym, habitos: newHabitos, pokemon: newPokemon };
      }
      return gym;
    }));
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editForm.nombre.trim()) return;

    setLocalTemplate(prev => prev.map(gym => {
      if (gym.gym_id === editingHabit.gymId) {
        let currentHabits = gym.pokemon?.[0]?.habitos || gym.habitos || [];
        let newHabitos = [...currentHabits];
        if (editingHabit.isNew) {
           newHabitos.push({ ...editForm });
        } else {
           newHabitos = newHabitos.map(h => h.id === editForm.id ? { ...editForm } : h);
        }

        let newPokemon = gym.pokemon;
        if (newPokemon && newPokemon[0]) {
           newPokemon[0].habitos = [...newHabitos];
        }

        return { ...gym, habitos: newHabitos, pokemon: newPokemon };
      }
      return gym;
    }));

    setEditingHabit(null);
  };

  const handleSaveAll = () => {
    setSaving(true);
    if (saveCustomTemplate) {
        saveCustomTemplate(localTemplate);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!localTemplate || localTemplate.length === 0) {
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
        <button style={s.backBtn} onClick={() => onNavigate(progress?.setup_required ? 'SETUP' : 'MAP')}>← VOLVER</button>
        <h2 style={s.title}>🛠️ GESTOR DE ATAQUES</h2>
        <div style={s.headerRight} />
      </div>

      <div style={s.noticeMsg}>
         Personaliza los ataques de los Pokémon.
      </div>

      {/* Lista de Gimnasios */}
      <div style={s.list}>
        {localTemplate.map(gym => {
          const isOpen = expandedGym === gym.gym_id || expandedGym === null;
          const habits = gym.pokemon?.[0]?.habitos || gym.habitos || [];
          
          return (
            <div key={gym.gym_id} style={s.gymCard}>
              <button
                style={s.gymHeader}
                onClick={() => setExpandedGym(expandedGym === gym.gym_id ? null : gym.gym_id)}
              >
                <span style={s.gymIcon}>🏰</span>
                <span style={s.gymName}>{gym.gym_nombre}</span>
                <span style={s.gymCount}>{habits.length} ataques</span>
                <span style={{ color: '#aaa', fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                 <div style={s.habitContainer}>
                    {habits.map(h => (
                      <div key={h.id} style={s.habitRow}>
                        <div style={s.habitInfo}>
                           <span style={s.habitIcon}>{h.icono || '⚔️'}</span>
                           <div style={s.habitTexts}>
                             <span style={s.habitName}>{h.nombre}</span>
                             <span style={s.habitDmg}>Daño (DMG): {h.daño || h.damage || 20}</span>
                           </div>
                        </div>
                        <div style={s.habitActions}>
                           <button style={s.iconBtn} onClick={() => handleOpenEdit(gym.gym_id, h)}>✏️</button>
                           <button style={{...s.iconBtn, color: '#e74c3c'}} onClick={() => handleDelete(gym.gym_id, h.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                    <button style={s.addBtn} onClick={() => handleOpenNew(gym.gym_id)}>
                       + NUEVO ATAQUE
                    </button>
                 </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Guardar General */}
      <div style={s.footer}>
        <button
          style={{
            ...s.saveTotalBtn,
            background: saved ? '#4caf50' : '#e74c3c',
            borderColor: saved ? '#2a7a2a' : '#c0392b',
          }}
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving ? 'GUARDANDO...' : saved ? '¡RUTINAS GUARDADAS! ✓' : 'GUARDAR CAMBIOS GENERALES'}
        </button>
      </div>

      {/* Modal Edición / Creación */}
      {editingHabit && (
         <div style={s.modalOverlay}>
            <form style={s.modalBox} onSubmit={handleSaveForm}>
               <div style={s.modalHeader}>
                 {editingHabit.isNew ? 'NUEVO ATAQUE' : 'EDITAR ATAQUE'}
               </div>
               
               <div style={s.formGroup}>
                 <label style={s.label}>Nombre del ataque:</label>
                 <input 
                   style={s.input} 
                   value={editForm.nombre} 
                   onChange={e => setEditForm({...editForm, nombre: e.target.value})} 
                   placeholder="Ej: Recoger la mesa"
                   required
                 />
               </div>
               
               <div style={{ display: 'flex', gap: '10px' }}>
                 <div style={s.formGroup}>
                   <label style={s.label}>Daño (DMG):</label>
                   <input 
                     style={s.inputNumber} 
                     type="number" 
                     min="5" max="100" step="5"
                     value={editForm.daño} 
                     onChange={e => setEditForm({...editForm, daño: parseInt(e.target.value) || 20})} 
                   />
                 </div>
                 <div style={s.formGroup}>
                   <label style={s.label}>Icono:</label>
                   <input 
                     style={s.inputEmoji} 
                     value={editForm.icono} 
                     onChange={e => setEditForm({...editForm, icono: e.target.value})} 
                     maxLength="2"
                   />
                 </div>
               </div>

               <div style={s.modalActions}>
                  <button type="button" style={s.cancelBtn} onClick={() => setEditingHabit(null)}>CANCELAR</button>
                  <button type="submit" style={s.confirmBtn}>ACEPTAR</button>
               </div>
            </form>
         </div>
      )}
    </div>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
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
  title: { fontSize: 'clamp(8px, 2.5vw, 10px)', color: '#fff', textAlign: 'center' },
  headerRight: { width: '70px' },

  noticeMsg: {
     padding: '8px 12px', backgroundColor: '#e2f0d9', color: '#385723',
     fontSize: '6px', lineHeight: '1.4', textAlign: 'center', borderBottom: '1px solid #c5e0b4',
     flexShrink: 0,
  },

  list: {
    flex: 1, overflowY: 'auto', padding: '10px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },

  gymCard: {
    backgroundColor: '#fff', border: '3px solid #333',
    borderRadius: '4px', overflow: 'hidden',
    boxShadow: '3px 3px 0 #999',
  },
  gymHeader: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px', backgroundColor: '#f8f8f8',
    border: 'none', borderBottom: '2px solid #eee',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
    textAlign: 'left',
  },
  gymIcon: { fontSize: '16px' },
  gymName: { flex: 1, fontSize: 'clamp(7px, 1.8vw, 9px)', color: '#333' },
  gymCount: { fontSize: '6px', color: '#666', marginRight: '4px' },

  habitContainer: {
     backgroundColor: '#fafafa', padding: '0',
  },
  habitRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', borderBottom: '1px solid #eee',
  },
  habitInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  habitIcon: { fontSize: '20px' },
  habitTexts: { display: 'flex', flexDirection: 'column', gap: '4px' },
  habitName: { fontSize: 'clamp(7px, 1.8vw, 8px)', color: '#222', lineHeight: '1.3' },
  habitDmg: { fontSize: '5px', color: '#e74c3c' },

  habitActions: { display: 'flex', gap: '6px' },
  iconBtn: {
     background: 'none', border: '1px solid #ddd', borderRadius: '4px',
     padding: '6px', cursor: 'pointer', fontSize: '12px',
     backgroundColor: '#fff', boxShadow: '1px 1px 0 #ccc'
  },

  addBtn: {
     width: '100%', padding: '12px', background: '#f0f0f0', border: 'none',
     borderBottom: '1px solid #ddd', color: '#3048a8', fontSize: '7px',
     fontFamily: '"Press Start 2P", cursive', cursor: 'pointer', display: 'block',
  },

  footer: {
    padding: '10px 12px', backgroundColor: '#f0f0f8',
    borderTop: '3px solid #ccc', flexShrink: 0,
  },
  saveTotalBtn: {
    width: '100%', padding: '14px',
    color: '#fff', border: '3px solid',
    cursor: 'pointer', fontFamily: '"Press Start 2P", cursive',
    fontSize: 'clamp(8px, 2vw, 10px)',
    transition: 'background-color 0.3s, border-color 0.3s',
  },

  /* Modal */
  modalOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalBox: {
    width: '90%', maxWidth: '320px', backgroundColor: '#fbfbfb',
    border: '4px solid #222', boxShadow: '4px 4px 0 #555',
    padding: '16px', position: 'relative',
  },
  modalHeader: {
    position: 'absolute', top: '-13px', left: '10px',
    backgroundColor: '#222', color: '#fff', fontSize: '8px',
    padding: '2px 10px', border: '2px solid #fff',
  },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '7px', color: '#444' },
  input: {
     fontFamily: '"Press Start 2P", cursive', fontSize: '8px',
     padding: '8px', border: '2px solid #ccc',
  },
  inputNumber: {
     fontFamily: '"Press Start 2P", cursive', fontSize: '8px',
     padding: '8px', border: '2px solid #ccc', width: '80px',
  },
  inputEmoji: {
     fontFamily: '"Press Start 2P", cursive', fontSize: '12px',
     padding: '6px', border: '2px solid #ccc', width: '50px', textAlign: 'center'
  },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '4px' },
  cancelBtn: {
     padding: '10px', border: '2px solid #222', background: '#888', color: '#fff',
     fontFamily: '"Press Start 2P", cursive', fontSize: '7px', cursor: 'pointer',
     boxShadow: '2px 2px 0 #555'
  },
  confirmBtn: {
     padding: '10px', border: '2px solid #222', background: '#4caf50', color: '#fff',
     fontFamily: '"Press Start 2P", cursive', fontSize: '7px', cursor: 'pointer',
     boxShadow: '2px 2px 0 #2a7a2a'
  }
};

export default HabitEditScreen;
