import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

// Emojis precargados para el selector
const EMOJI_OPTIONS = [
  '⚔️', '🛡️', '💊', '📚', '🌙', '👖', '👕', '🧦', '🥛', '🍞', '🍊', 
  '🪥', '🧼', '💇', '🛏️', '🧸', '🎒', '🍎', '🥦', '🏃', '🧘', '💪', '🦵', '⏱️'
];

const AdminScreen = ({ onNavigate }) => {
  const { template, fetchTemplate, saveCustomTemplate, fetchPresets, createPreset, deletePreset, resetHabitos, notify } = useGame();
  const [config, setConfig] = useState(null);
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [pin, setPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);

  const DEFAULT_CONFIG = [
    {
      gym_id: 'vestirse', gym_nombre: 'Gym Vestimenta', activo: true,
      habitos: [
        {id:'quitar_pijama', nombre:'Quitar pijama', icono:'🌙', daño:25, activo:true},
        {id:'quitar_calcetines', nombre:'Quitar calcetines', icono:'🧦', daño:25, activo:true},
        {id:'ponerse_ropa_interior', nombre:'Ponerse ropa interior', icono:'🩲', daño:20, activo:true},
        {id:'ponerse_pantalones', nombre:'Ponerse pantalones', icono:'👖', daño:20, activo:true},
        {id:'ponerse_camiseta', nombre:'Ponerse camiseta', icono:'👕', daño:20, activo:true},
        {id:'ponerse_calcetines', nombre:'Ponerse calcetines', icono:'🧦', daño:20, activo:true},
      ]
    },
    {
      gym_id: 'higiene', gym_nombre: 'Gym Higiene', activo: true,
      habitos: [
        {id:'h_cepi', nombre:'Cepillo', icono:'🪥', daño:30, activo:true},
        {id:'h_past', nombre:'Pasta dientes', icono:'🧴', daño:20, activo:true},
        {id:'h_cara', nombre:'Lavar cara', icono:'🧼', daño:25, activo:true},
        {id:'h_pein', nombre:'Peinarse', icono:'💇', daño:25, activo:true},
        {id:'h_colo', nombre:'Colonia', icono:'✨', daño:20, activo:true},
        {id:'h_toal', nombre:'Toalla', icono:'🧖', daño:20, activo:true},
        {id:'h_hilo', nombre:'Hilo dental', icono:'🧵', daño:30, activo:true},
      ]
    },
    {
      gym_id: 'desayuno', gym_nombre: 'Gym Desayuno', activo: true,
      habitos: [
        {id:'d_lech', nombre:'Leche', icono:'🥛', daño:25, activo:true},
        {id:'d_tost', nombre:'Tostadas', icono:'🍞', daño:25, activo:true},
        {id:'d_cere', nombre:'Cereales', icono:'🥣', daño:25, activo:true},
        {id:'d_frut', nombre:'Fruta', icono:'🍎', daño:30, activo:true},
        {id:'d_zumo', nombre:'Zumo', icono:'🍊', daño:25, activo:true},
        {id:'d_gall', nombre:'Galletas', icono:'🍪', daño:20, activo:true},
        {id:'d_yogu', nombre:'Yogur', icono:'🍶', daño:25, activo:true},
        {id:'d_huev', nombre:'Huevo', icono:'🥚', daño:30, activo:true},
        {id:'d_sand', nombre:'Sandwich', icono:'🥪', daño:30, activo:true},
        {id:'d_cubi', nombre:'Cubiertos', icono:'🍴', daño:15, activo:true},
        {id:'d_serv', nombre:'Servilleta', icono:'🧻', daño:15, activo:true},
      ]
    },
    {
      gym_id: 'orden', gym_nombre: 'Gym Orden', activo: true,
      habitos: [
        {id:'o_cama', nombre:'Hacer cama', icono:'🛏️', daño:40, activo:true},
        {id:'o_jugu', nombre:'Recoger juguetes', icono:'🧸', daño:40, activo:true},
        {id:'o_pija', nombre:'Guardar pijama', icono:'💤', daño:25, activo:true},
        {id:'o_pers', nombre:'Abrir persiana', icono:'☀️', daño:20, activo:true},
        {id:'o_rsuc', nombre:'Ropa sucia', icono:'🧺', daño:30, activo:true},
        {id:'o_plan', nombre:'Regar plantas', icono:'🪴', daño:30, activo:true},
      ]
    },
    {
      gym_id: 'comida', gym_nombre: 'Gym Comida', activo: true,
      habitos: [
        {id:'c_salu', nombre:'Comida Saludable', icono:'🥗', daño:30, activo:true},
        {id:'c_agua', nombre:'Beber Agua', icono:'💧', daño:20, activo:true},
        {id:'c_frut', nombre:'Comer Fruta', icono:'🍎', daño:25, activo:true},
      ]
    },
    {
      gym_id: 'fitness', gym_nombre: 'Gym Fitness', activo: true,
      habitos: [
        {id:'f_flex', nombre:'10 Flexiones', icono:'💪', daño:40, activo:true},
        {id:'f_sent', nombre:'15 Sentadillas', icono:'🦵', daño:40, activo:true},
        {id:'f_plan', nombre:'30s Plancha', icono:'⏱️', daño:50, activo:true},
      ]
    }
  ];

  useEffect(() => {
    fetchTemplate();
    loadPresets();
  }, [fetchTemplate]);

  const loadPresets = async () => {
    const p = await fetchPresets();
    setPresets(p);
  };

  useEffect(() => {
    if (template && template.length > 0) {
      setConfig(JSON.parse(JSON.stringify(template)));
    } else {
      setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    }
  }, [template]);

  // Edición General
  const toggleGym = (gymIdx) => {
    setConfig(prev => prev.map((gym, gi) =>
      gi !== gymIdx ? gym : { ...gym, activo: !gym.activo }
    ));
  };

  const handleEditHabit = (gymIdx, habIdx, field, value) => {
    setConfig(prev => prev.map((gym, gi) => 
      gi !== gymIdx ? gym : {
        ...gym,
        habitos: gym.habitos.map((h, hi) => 
          hi !== habIdx ? h : { ...h, [field]: value }
        )
      }
    ));
  };

  const addHabit = (gymIdx) => {
    setConfig(prev => prev.map((gym, gi) => {
      if (gi !== gymIdx) return gym;
      const newHabit = {
        id: 'cust_' + Date.now().toString(36),
        nombre: 'Nuevo Hábito',
        icono: '⚔️',
        daño: 20,
        activo: true
      };
      return { ...gym, habitos: [...gym.habitos, newHabit] };
    }));
  };

  const deleteHabit = (gymIdx, habIdx) => {
    if (!window.confirm('¿Seguro que quieres eliminar este hábito?')) return;
    setConfig(prev => prev.map((gym, gi) => {
      if (gi !== gymIdx) return gym;
      return { ...gym, habitos: gym.habitos.filter((_, hi) => hi !== habIdx) };
    }));
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("¿Restablecer toda la configuración a los valores por defecto? Se perderán tus cambios personalizados.")) {
      setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
      notify("Valores por defecto cargados. No olvides guardar.", "info");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await saveCustomTemplate(config);
      if(r && r.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Admin Save Error:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName) {
      notify("Introduce un nombre para la configuración");
      return;
    }
    setSavingPreset(true);
    try {
      const r = await createPreset(presetName, config);
      if (r.success) {
        setPresetName('');
        loadPresets();
        notify("¡Configuración guardada!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPreset(false);
    }
  };

  const applyPreset = async (p, andSave = false) => {
    const action = andSave ? 'Cargar y Activar' : 'Cargar';
    if (window.confirm(`¿${action} configuración '${p.nombre}'?`)) {
      const newConfig = JSON.parse(JSON.stringify(p.config));
      setConfig(newConfig);
      
      if (andSave) {
        setSaving(true);
        try {
          const r = await saveCustomTemplate(newConfig);
          if (r.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            notify(`¡Configuración '${p.nombre}' activada!`, "success");
          }
        } catch (e) {
          console.error(e);
          notify("Error al activar", "error");
        } finally {
          setSaving(false);
        }
      } else {
        notify(`Cargado: ${p.nombre}. No olvides pulsar 'ACTUALIZAR' para guardarlo.`);
      }
    }
  };

  const handleDeletePreset = async (id, nombre) => {
    if (window.confirm(`¿Seguro que quieres eliminar la configuración '${nombre}'?`)) {
      try {
        const r = await deletePreset(id);
        if (r.success) {
          loadPresets();
          notify(`Configuración '${nombre}' eliminada`);
        }
      } catch (e) {
        console.error(e);
        notify("Error al eliminar", "error");
      }
    }
  };

  const handleResetDay = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro? Se borrará TODO el progreso de hoy (hábitos y medallas).')) return;
    setResetting(true);
    const r = await resetHabitos();
    setResetting(false);
    if (r.success) {
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2000);
    }
  };

  const handleVerifyPin = () => {
    if (pin === '0000') { // Default PIN for parents
      setPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  if (!pinVerified) {
    return (
      <div style={{...screenStyle, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: 20}}>
        <h2 style={{fontSize:10, color:'#FFD700'}}>CONTROL PARENTAL</h2>
        <p style={{fontSize:7, color:'#aaa', textAlign:'center', lineHeight:'1.5em'}}>Introduce el PIN para editar<br/>los hábitos del gimnasio.</p>
        <input 
          type="password" 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          style={{
            background:'#222', border:'2px solid #555', color:'#fff', 
            fontFamily:'"Press Start 2P"', fontSize: 16, padding: 10, textAlign: 'center', width: 120
          }}
        />
        {pinError && <p style={{fontSize:6, color:'#E83030'}}>PIN INCORRECTO</p>}
        <button 
          onClick={handleVerifyPin}
          style={{
            background:'#4CAF50', border:'3px solid #fff', color:'#fff', 
            fontFamily:'"Press Start 2P"', fontSize: 8, padding: '12px 24px', cursor: 'pointer'
          }}
        >
          ACCEDER
        </button>
        <button onClick={()=>onNavigate('PROFILE')} style={{...backBtnStyle, marginTop: 20}}>CANCELAR</button>
      </div>
    );
  }

  if (!config) return (
    <div style={{...screenStyle, justifyContent:'center',alignItems:'center'}}>
      <p style={{fontSize:8,color:'#FFD700'}}>CARGANDO...</p>
    </div>
  );

  return (
    <div style={screenStyle}>
      <div style={headerStyle}>
        <button onClick={()=>onNavigate('PROFILE')} style={backBtnStyle}>← VOLVER</button>
        <h2 style={{fontSize:9,color:'#FFD700', textAlign: 'center'}}>CONFIGURAR HÁBITOS</h2>
        <div style={{width: 70}}></div>
      </div>

      {/* SECCIÓN PRESETS */}
      <div style={{ background:'rgba(255,255,255,0.05)', padding: 12, marginBottom: 20, border: '2px dashed #555' }}>
        <h3 style={{ fontSize: 7, color:'#A1CAFF', marginBottom: 12 }}>GESTIONAR CONFIGURACIONES</h3>
        
        <div style={{ display:'flex', gap: 8, marginBottom: 12 }}>
          <input 
            type="text" 
            placeholder="Ej: MAÑANA, NOCHE..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={{ ...inputNameStyle, fontSize: 7 }}
          />
          <button 
            onClick={handleSavePreset} 
            disabled={savingPreset}
            style={{ background:'#3D5AFE', color:'#fff', border:'none', fontSize:6, padding:'8px 12px', fontFamily:'"Press Start 2P"', cursor:'pointer' }}
          >
            {savingPreset ? '...' : 'GUARDAR'}
          </button>
        </div>

        {presets.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap: 10 }}>
            {presets.map(p => (
              <div key={p.id} style={{ display:'flex', gap: 6, alignItems:'center', background:'rgba(255,255,255,0.03)', padding: 6 }}>
                <span style={{ flex: 1, fontSize: 7, color: '#fff' }}>📁 {p.nombre}</span>
                <button 
                  onClick={() => applyPreset(p, false)}
                  style={{ background:'#444', color:'#fff', border:'1px solid #666', fontSize:6, padding:'6px 8px', fontFamily:'"Press Start 2P"', cursor:'pointer' }}
                >
                  VER/EDITAR
                </button>
                <button 
                  onClick={() => applyPreset(p, true)}
                  style={{ background:'#4CAF50', color:'#fff', border:'1px solid #fff', fontSize:6, padding:'6px 8px', fontFamily:'"Press Start 2P"', cursor:'pointer' }}
                >
                  ACTIVAR
                </button>
                <button 
                  onClick={() => handleDeletePreset(p.id, p.nombre)}
                  style={{ background:'#E83030', color:'#fff', border:'none', fontSize:10, padding:'4px 8px', cursor:'pointer' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={noticeStyle}>
        Cambia el nombre, poder (DMG) e icono de cada ataque.
        Los gimnasios desactivados desaparecerán del mapa.
      </p>

      {config.map((gym, gi) => (
        <div key={gym.gym_id} style={{
          border: `2px solid ${gym.activo ? '#FFD700' : '#444'}`,
          marginBottom: 12, padding: '10px 8px',
          background: gym.activo ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)'
        }}>
          {/* Cabecera del gimnasio */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: gym.activo ? 16 : 0 }}>
            <span style={{ fontSize:9, color: gym.activo ? '#FFD700':'#666' }}>
              {gym.gym_nombre.toUpperCase()}
            </span>
            {/* Toggle gimnasio ON/OFF */}
            <div
              onClick={() => toggleGym(gi)}
              style={toggleStyle(gym.activo)}
            ><div style={toggleKnobStyle(gym.activo)}/></div>
          </div>

          {/* Lista de hábitos (Editables) */}
          {gym.activo && gym.habitos.map((h, hi) => (
            <div key={h.id} style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '10px', marginBottom: '8px', border: '1px solid #333',
              opacity: h.activo ? 1 : 0.4
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <select 
                  value={h.icono} 
                  onChange={(e) => handleEditHabit(gi, hi, 'icono', e.target.value)}
                  style={inputEmojiStyle}
                >
                  {EMOJI_OPTIONS.map(emj => <option key={emj} value={emj}>{emj}</option>)}
                </select>

                <input 
                  type="text" 
                  value={h.nombre} 
                  onChange={(e) => handleEditHabit(gi, hi, 'nombre', e.target.value)}
                  maxLength={30}
                  style={inputNameStyle}
                  placeholder="Nombre de ataque"
                />

                <button onClick={() => deleteHabit(gi, hi)} style={deleteBtnStyle}>×</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Control Slider de Daño */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '6px', color: '#888' }}>DMG:</span>
                  <input 
                    type="range" min="10" max="60" step="5"
                    value={h.daño || 20}
                    onChange={(e) => handleEditHabit(gi, hi, 'daño', parseInt(e.target.value))}
                    style={{ width: '60px' }}
                  />
                  <span style={{ fontSize: '8px', color: '#FFD700', minWidth: '15px' }}>{h.daño || 20}</span>
                </div>

                {/* Control Toggle Activo Hábito */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '6px', color: '#888' }}>ON/OFF:</span>
                  <div onClick={() => handleEditHabit(gi, hi, 'activo', !h.activo)} style={toggleStyle(h.activo, 0.7)}>
                    <div style={toggleKnobStyle(h.activo, 0.7)}/>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {gym.activo && (
            <button onClick={() => addHabit(gi)} style={addHabitBtnStyle}>
              + AÑADIR HÁBITO
            </button>
          )}
        </div>
      ))}

      {/* Botón guardar */}
      <button onClick={handleSave} disabled={saving} style={saveBtnStyle(saved, saving)}>
        {saving ? 'GUARDANDO...' : saved ? '✓ ACTUALIZADO' : 'ACTUALIZAR CONFIG. ACTUAL'}
      </button>

      {/* Botón Restaurar Defaults */}
      <button 
        onClick={() => { if(window.confirm('¿Restablecer a los NUEVOS valores por defecto?')) setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG))); }}
        style={{...saveBtnStyle(false, false), background: '#666', marginTop: 12, fontSize: 7}}
      >
        ✨ CARGAR NUEVOS VALORES POR DEFECTO
      </button>

      {/* Botón Reset Manual */}
      <button 
        onClick={handleResetDay} 
        disabled={resetting} 
        style={{...saveBtnStyle(resetDone, resetting), background: resetDone ? '#4CAF50' : '#444', marginTop: 12}}
      >
        {resetting ? 'REINICIANDO...' : resetDone ? '✓ DÍA REINICIADO' : '🔄 RESETEAR PROGRESO HOY'}
      </button>
    </div>
  );
};

/* --- ESTILOS --- */
const screenStyle = {
  width:'100%', height:'100dvh', background:'#0a0a1a', color:'#fff',
  fontFamily:'"Press Start 2P",monospace', padding:'16px',
  overflowY:'auto', boxSizing:'border-box'
};

const headerStyle = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  gap:12, marginBottom:12, borderBottom:'2px solid #FFD700', paddingBottom:12
};

const backBtnStyle = {
  padding:'6px 10px', background:'transparent', color:'#aaa',
  border:'1px solid #444', fontFamily:'"Press Start 2P",monospace',
  fontSize:7, cursor:'pointer'
};

const noticeStyle = {
  fontSize:6, color:'#aaa', marginBottom:16, lineHeight:'1.8em', borderBottom:'1px dashed #333', paddingBottom:16
};

const toggleStyle = (activo, scale = 1) => ({
  width: 44 * scale, height: 22 * scale, borderRadius: 11 * scale,
  background: activo ? '#4CAF50':'#555', position:'relative',
  cursor:'pointer', transition:'background 0.2s', border:'1px solid rgba(255,255,255,0.2)'
});

const toggleKnobStyle = (activo, scale = 1) => ({
  position:'absolute', top: 2 * scale, left: activo ? 24 * scale : 2 * scale,
  width: 18 * scale, height: 18 * scale, borderRadius:'50%',
  background:'#fff', transition:'left 0.2s'
});

const inputEmojiStyle = {
  fontFamily:'"Press Start 2P",monospace', fontSize:'14px',
  padding:'4px', background:'#222', border:'1px solid #555', color:'#fff'
};

const inputNameStyle = {
  flex: 1, fontFamily:'"Press Start 2P",monospace', fontSize:'8px',
  padding:'8px', background:'#222', border:'1px solid #555', color:'#fff', minWidth: 0
};

const deleteBtnStyle = {
  background:'#E83030', color:'#fff', border:'none', fontSize:'14px',
  fontWeight:'bold', padding:'4px 8px', cursor:'pointer', height: '100%'
};

const addHabitBtnStyle = {
  width: '100%', padding: '10px', background: 'rgba(255,215,0,0.1)',
  color: '#FFD700', border: '1px dashed #FFD700', fontSize: '7px',
  fontFamily: '"Press Start 2P",monospace', cursor: 'pointer', marginTop: '4px'
};

const saveBtnStyle = (saved, saving) => ({
  width:'100%', padding:14, background: saved ? '#4CAF50' : '#E83030',
  color:'#fff', border:'3px solid rgba(255,255,255,0.3)',
  fontFamily:'"Press Start 2P",monospace', fontSize:9, cursor:'pointer',
  marginTop:8, opacity: saving ? 0.7 : 1, marginBottom: 20
});

export default AdminScreen;
