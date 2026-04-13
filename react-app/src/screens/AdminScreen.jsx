import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const AdminScreen = ({ onNavigate }) => {
  const { template, fetchTemplate, 
          saveCustomTemplate } = useGame();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Template por defecto si no hay config:
  const DEFAULT_CONFIG = [
    {
      gym_id: 'vestirse',
      gym_nombre: 'Gym Vestirse',
      activo: true,
      habitos: [
        {id:'quitar_pijama', nombre:'Quitar pijama',
         icono:'🌙', daño:25, activo:true},
        {id:'ponerse_pantalones',nombre:'Ponerse pantalones',
         icono:'👖', daño:25, activo:true},
        {id:'ponerse_camiseta',nombre:'Ponerse camiseta',
         icono:'👕', daño:25, activo:true},
        {id:'ponerse_calcetines',nombre:'Ponerse calcetines',
         icono:'🧦', daño:15, activo:true},
      ]
    },
    {
      gym_id: 'desayuno',
      gym_nombre: 'Gym Desayuno',
      activo: true,
      habitos: [
        {id:'tomar_leche',nombre:'Tomar leche',
         icono:'🥛',daño:35,activo:true},
        {id:'comer_tostadas',nombre:'Comer tostadas',
         icono:'🍞',daño:35,activo:true},
        {id:'comer_fruta',nombre:'Comer fruta',
         icono:'🍊',daño:30,activo:false},
      ]
    },
    {
      gym_id: 'higiene',
      gym_nombre: 'Gym Higiene',
      activo: true,
      habitos: [
        {id:'lavarse_dientes',nombre:'Lavarse dientes',
         icono:'🪥',daño:35,activo:true},
        {id:'lavarse_cara',nombre:'Lavarse cara',
         icono:'🧼',daño:35,activo:true},
        {id:'peinarse',nombre:'Peinarse',
         icono:'💇',daño:20,activo:true},
      ]
    },
    {
      gym_id: 'orden',
      gym_nombre: 'Gym Orden',
      activo: true,
      habitos: [
        {id:'hacer_cama',nombre:'Hacer la cama',
         icono:'🛏️',daño:35,activo:true},
        {id:'recoger_habitacion',
         nombre:'Recoger habitación',
         icono:'🧸',daño:35,activo:true},
        {id:'preparar_mochila',nombre:'Preparar mochila',
         icono:'🎒',daño:30,activo:true},
      ]
    }
  ];

  useEffect(() => {
    fetchTemplate().then(() => {
      // Logic inside fetchTemplate in GameContext will set template state
    });
  }, [fetchTemplate]);

  useEffect(() => {
    if(template) setConfig(template);
    else setConfig(DEFAULT_CONFIG);
  }, [template]);

  const toggleHabito = (gymIdx, habIdx) => {
    setConfig(prev => prev.map((gym, gi) =>
      gi !== gymIdx ? gym : {
        ...gym,
        habitos: gym.habitos.map((h, hi) =>
          hi !== habIdx ? h : 
          {...h, activo: !h.activo}
        )
      }
    ));
  };

  const toggleGym = (gymIdx) => {
    setConfig(prev => prev.map((gym, gi) =>
      gi !== gymIdx ? gym :
      {...gym, activo: !gym.activo}
    ));
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

  if(!config) return (
    <div style={{...screenStyle,
      justifyContent:'center',alignItems:'center'}}>
      <p style={{fontSize:8,color:'#FFD700'}}>
        CARGANDO...
      </p>
    </div>
  );

  return (
    <div style={screenStyle}>
      <div style={{
        display:'flex',alignItems:'center',
        gap:12,marginBottom:16,
        borderBottom:'2px solid #FFD700',
        paddingBottom:12
      }}>
        <button
          onClick={()=>onNavigate('PROFILE')}
          style={backBtnStyle}
        >← VOLVER</button>
        <h2 style={{fontSize:9,color:'#FFD700'}}>
          CONFIGURAR HÁBITOS
        </h2>
      </div>

      <p style={{fontSize:6,color:'#aaa',
                 marginBottom:16,lineHeight:'1.8em'}}>
        Activa o desactiva los hábitos de tu hijo.
        Los gimnasios desactivados no aparecerán
        en el mapa del juego.
      </p>

      {config.map((gym, gi) => (
        <div key={gym.gym_id} style={{
          border: `2px solid ${gym.activo ? 
            '#FFD700' : '#444'}`,
          marginBottom: 12,
          padding: 12,
          background: gym.activo ? 
            'rgba(255,215,0,0.05)' : 
            'rgba(255,255,255,0.02)'
        }}>
          {/* Cabecera del gimnasio */}
          <div style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems:'center',
            marginBottom: gym.activo ? 12 : 0
          }}>
            <span style={{
              fontSize:8,
              color: gym.activo ? '#FFD700':'#666'
            }}>
              {gym.gym_nombre.toUpperCase()}
            </span>
            
            {/* Toggle gimnasio ON/OFF */}
            <div
              onClick={() => toggleGym(gi)}
              style={{
                width:44,height:22,
                borderRadius:11,
                background: gym.activo ? 
                  '#4CAF50':'#555',
                position:'relative',
                cursor:'pointer',
                transition:'background 0.2s',
                border:'1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div style={{
                position:'absolute',
                top:2,
                left: gym.activo ? 24 : 2,
                width:18,height:18,
                borderRadius:'50%',
                background:'#fff',
                transition:'left 0.2s'
              }}/>
            </div>
          </div>

          {/* Lista de hábitos */}
          {gym.activo && gym.habitos.map((h, hi) => (
            <div
              key={h.id}
              onClick={() => toggleHabito(gi, hi)}
              style={{
                display:'flex',
                alignItems:'center',
                gap:10,
                padding:'8px 0',
                borderTop:'1px solid rgba(255,255,255,0.1)',
                cursor:'pointer',
                opacity: h.activo ? 1 : 0.4
              }}
            >
              <span style={{fontSize:16}}>{h.icono}</span>
              <span style={{
                flex:1,fontSize:7,
                color: h.activo ? '#fff':'#666',
                textDecoration: h.activo ? 
                  'none':'line-through'
              }}>
                {h.nombre}
              </span>
              <span style={{
                fontSize:6,color:'#888'
              }}>
                DMG:{h.daño}
              </span>
              <div style={{
                width:16,height:16,
                borderRadius:3,
                background: h.activo ? 
                  '#4CAF50':'transparent',
                border:`2px solid ${h.activo ? 
                  '#4CAF50':'#666'}`,
                display:'flex',
                alignItems:'center',
                justifyContent:'center'
              }}>
                {h.activo && (
                  <span style={{
                    fontSize:10,color:'#fff',
                    lineHeight:1
                  }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width:'100%',padding:14,
          background: saved ? '#4CAF50' : '#E83030',
          color:'#fff',
          border:'3px solid rgba(255,255,255,0.3)',
          fontFamily:'"Press Start 2P",monospace',
          fontSize:9,cursor:'pointer',
          marginTop:8,
          opacity: saving ? 0.7 : 1
        }}
      >
        {saving ? 'GUARDANDO...' : 
         saved ? '✓ GUARDADO' : 
         'GUARDAR CAMBIOS'}
      </button>
    </div>
  );
};

const screenStyle = {
  width:'100%',
  height:'100dvh',
  background:'#0a0a1a',
  color:'#fff',
  fontFamily:'"Press Start 2P",monospace',
  padding:'16px',
  overflowY:'auto',
  boxSizing:'border-box'
};

const backBtnStyle = {
  padding:'6px 12px',
  background:'transparent',
  color:'#aaa',
  border:'1px solid #444',
  fontFamily:'"Press Start 2P",monospace',
  fontSize:7,
  cursor:'pointer'
};

export default AdminScreen;
