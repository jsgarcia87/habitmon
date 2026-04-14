import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

// Emojis precargados para el selector
const EMOJI_OPTIONS = [
  '⚔️', '🛡️', '💊', '📚', '🌙', '👖', '👕', '🧦', '🥛', '🍞', '🍊', 
  '🪥', '🧼', '💇', '🛏️', '🧸', '🎒', '🍎', '🥦', '🏃', '🧘'
];

const AdminScreen = ({ onNavigate }) => {
  const { template, fetchTemplate, saveCustomTemplate } = useGame();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const DEFAULT_CONFIG = [
    {
      gym_id: 'vestirse', gym_nombre: 'Gym Vestirse', activo: true,
      habitos: [
        {id:'quitar_pijama', nombre:'Quitar pijama', icono:'🌙', daño:25, activo:true},
        {id:'ponerse_pantalones',nombre:'Ponerse pantalones', icono:'👖', daño:25, activo:true},
        {id:'ponerse_camiseta',nombre:'Ponerse camiseta', icono:'👕', daño:25, activo:true},
        {id:'ponerse_calcetines',nombre:'Ponerse calcetines', icono:'🧦', daño:15, activo:true},
      ]
    },
    {
      gym_id: 'desayuno', gym_nombre: 'Gym Desayuno', activo: true,
      habitos: [
        {id:'tomar_leche',nombre:'Tomar leche', icono:'🥛',daño:35,activo:true},
        {id:'comer_tostadas',nombre:'Comer tostadas', icono:'🍞',daño:35,activo:true},
        {id:'comer_fruta',nombre:'Comer fruta', icono:'🍊',daño:30,activo:false},
      ]
    },
    {
      gym_id: 'higiene', gym_nombre: 'Gym Higiene', activo: true,
      habitos: [
        {id:'lavarse_dientes',nombre:'Lavarse dientes', icono:'🪥',daño:35,activo:true},
        {id:'lavarse_cara',nombre:'Lavarse cara', icono:'🧼',daño:35,activo:true},
        {id:'peinarse',nombre:'Peinarse', icono:'💇',daño:20,activo:true},
      ]
    },
    {
      gym_id: 'orden', gym_nombre: 'Gym Orden', activo: true,
      habitos: [
        {id:'hacer_cama',nombre:'Hacer la cama', icono:'🛏️',daño:35,activo:true},
        {id:'recoger_habitacion', nombre:'Recoger habitación', icono:'🧸',daño:35,activo:true},
        {id:'preparar_mochila',nombre:'Preparar mochila', icono:'🎒',daño:30,activo:true},
      ]
    }
  ];

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  useEffect(() => {
    if (template && template.length > 0) {
      // Hacer deep copy para poder editar libremente sin mutar el contexto hasta guardar
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

  const handleSave = async () => {
    setSaving(true);
    const r = await saveCustomTemplate(config);
    setSaving(false);
    if(r.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

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
        {saving ? 'GUARDANDO...' : saved ? '✓ GUARDADO' : 'GUARDAR CAMBIOS'}
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
