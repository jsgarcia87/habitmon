// Detect root folder dynamically (handles /habitmon/ etc)
const getBase = () => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  return cleanBase + 'hb_api/index.php';
};

const BASE = getBase();

// Use query parameter '?route=' for maximum compatibility with all PHP servers
const buildUrl = (route) => `${BASE}?route=${route}`;

// Detect subfolder via Vite's BASE_URL (more reliable for build-time base paths)
export const getAssetPath = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

const h = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('hm_token')}`
});

const handleResponse = async (r) => {
  if (r.status === 401) {
    const text = await r.text().catch(() => '');
    try { const json = JSON.parse(text); return { success: false, _unauthorized: true, error: json.error }; }
    catch { return { success: false, _unauthorized: true }; }
  }
  const text = await r.text();
  try {
    const json = JSON.parse(text);
    if (!r.ok) throw new Error(json.error || json.message || `Error ${r.status}`);
    return json;
  } catch (e) {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.error("Server returned HTML instead of JSON (likely 404/Redirect).", text);
        throw new Error("Server returned HTML. Check console for details.");
    }
    throw new Error("Failed to parse server response: " + text.substring(0, 50));
  }
};

export const api = {
  // Auth
  register: (data) => fetch(buildUrl('/auth/register'),
    {method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Register Error:", e); throw e; }),
  
  login: (data) => fetch(buildUrl('/auth/login'),
    {method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Login Error:", e); throw e; }),

  // Starter
  elegirStarter: (data) => fetch(buildUrl('/starter/elegir'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Starter Selection Error:", e); throw e; }),
  
  getStarter: () => fetch(buildUrl('/starter/info'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Starter Error:", e); throw e; }),

  // Hábitos
  getHabitosHoy: () => fetch(buildUrl('/habitos/hoy'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Habitos Error:", e); throw e; }),
  
  completarHabito: (data) => fetch(buildUrl('/habitos/completar'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Complete Habito Error:", e); throw e; }),

  resetHabitosHoy: () => fetch(buildUrl('/habitos/reset'),
    {method:'POST',headers:h()}).then(handleResponse).catch(e => { console.error("Reset Habitos Error:", e); throw e; }),

  // Gimnasios
  getGimnasiosHoy: () => fetch(buildUrl('/gimnasios/hoy'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Gimnasio Error:", e); throw e; }),
  
  completarGimnasio: (data) => fetch(buildUrl('/gimnasios/completar'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Complete Gym Error:", e); throw e; }),

  // Colección
  getColeccion: () => fetch(buildUrl('/coleccion'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Collection Error:", e); throw e; }),

  // Admin
  getAdminConfig: () => fetch(buildUrl('/admin/config'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Config Error:", e); throw e; }),
  
  saveAdminConfig: (data) => fetch(buildUrl('/admin/config'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Save Config Error:", e); throw e; }),

  getPresets: () => fetch(buildUrl('/admin/presets'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Presets Error:", e); throw e; }),

  savePreset: (data) => fetch(buildUrl('/admin/presets'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Save Preset Error:", e); throw e; }),

  deletePreset: (id) => fetch(buildUrl(`/admin/presets/${id}`),
    {method:'DELETE',headers:h()}).then(handleResponse).catch(e => { console.error("Delete Preset Error:", e); throw e; }),

  capturarPokemon: (data) => fetch(buildUrl('/coleccion/capturar'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Capture Error:", e); throw e; }),

  ganarBatalla: () => fetch(buildUrl('/battle/victory'),
    {method:'POST',headers:h()}).then(handleResponse).catch(e => { console.error("Battle Victory Error:", e); throw e; }),
  
  comprarObjeto: (data) => fetch(buildUrl('/tienda/comprar'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Buy Item Error:", e); throw e; }),

  usarObjeto: (data) => fetch(buildUrl('/usuario/usar_item'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Use Item Error:", e); throw e; }),

  configurarEncuentros: (data) => fetch(buildUrl('/usuario/configurar_encuentros'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Config Encounters Error:", e); throw e; }),

  getStats: () => fetch(buildUrl('/stats'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Stats Error:", e); throw e; }),

  // Amigos
  getAmigos: () => fetch(buildUrl('/amigos'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Get Amigos Error:", e); throw e; }),

  enviarSolicitudAmistad: (data) => fetch(buildUrl('/amigos/enviar'),
    {method:'POST',headers:h(),body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Send Friend Request Error:", e); throw e; }),

  aceptarSolicitudAmistad: (data) => fetch(buildUrl('/amigos/aceptar'),
    {method:'POST',headers:h(),body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Accept Friend Request Error:", e); throw e; }),

  rechazarSolicitudAmistad: (data) => fetch(buildUrl('/amigos/rechazar'),
    {method:'POST',headers:h(),body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Decline Friend Request Error:", e); throw e; }),

  // MMO — posición y presencia
  actualizarPosicion: (data) => fetch(buildUrl('/mapa/posicion'),
    {method:'POST',headers:h(),body:JSON.stringify(data)})
    .then(handleResponse).catch(() => ({ success: false, amigos_en_mapa: [] })),

  evolucionar: (data) => fetch(buildUrl('/coleccion/evolucionar'),
    {method:'POST',headers:h(),body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Evolucionar Error:", e); throw e; }),

  getAmigosGimnasios: (friendId) => fetch(buildUrl(`/amigos/${friendId}/gimnasios`),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Friend Gyms Error:", e); throw e; }),

  // ── Modo Profesor ────────────────────────────────────────────────────────
  registerProfesor: (data) => fetch(buildUrl('/auth/register-profesor'),
    {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
    .then(handleResponse).catch(e => { console.error("Register Profesor Error:", e); throw e; }),

  profesorMe: () => fetch(buildUrl('/profesor/me'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Profesor Me Error:", e); throw e; }),

  profesorInvitar: (data) => fetch(buildUrl('/profesor/invitar'),
    {method:'POST',headers:h(),body:JSON.stringify(data || {})})
    .then(handleResponse).catch(e => { console.error("Profesor Invitar Error:", e); throw e; }),

  profesorHijos: () => fetch(buildUrl('/profesor/hijos'),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Profesor Hijos Error:", e); throw e; }),

  vincularProfesor: (data) => fetch(buildUrl('/usuarios/vincular-profesor'),
    {method:'POST',headers:h(),body:JSON.stringify(data)})
    .then(handleResponse).catch(e => { console.error("Vincular Profesor Error:", e); throw e; }),

  misProfesores: () => fetch(buildUrl('/usuarios/profesores'),
    {headers:h()}).then(handleResponse).catch(e => ({ success: false, profesores: [] })),

  // Mensajes-NPC del Profesor
  profesorEnviarMensaje: (data) => fetch(buildUrl('/profesor/mensajes'),
    {method:'POST',headers:h(),body:JSON.stringify(data)})
    .then(handleResponse).catch(e => { console.error("Enviar Mensaje Error:", e); throw e; }),

  profesorListarMensajes: (relacion_id) => fetch(
    buildUrl('/profesor/mensajes' + (relacion_id ? `?relacion_id=${relacion_id}` : '')),
    {headers:h()}).then(handleResponse).catch(e => { console.error("Listar Mensajes Error:", e); throw e; }),

  profesorBorrarMensaje: (id) => fetch(buildUrl(`/profesor/mensajes/${id}`),
    {method:'DELETE',headers:h()}).then(handleResponse).catch(e => { console.error("Borrar Mensaje Error:", e); throw e; }),

  // El niño consulta y marca visto
  getMensajesPendientes: () => fetch(buildUrl('/usuarios/mensajes-pendientes'),
    {headers:h()}).then(handleResponse).catch(() => ({ success: false, mensajes: [] })),

  marcarMensajeVisto: (id) => fetch(buildUrl(`/usuarios/mensajes/${id}/visto`),
    {method:'POST',headers:h()}).then(handleResponse).catch(e => { console.error("Marcar Visto Error:", e); throw e; }),
};
