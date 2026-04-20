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

  capturarPokemon: (data) => fetch(buildUrl('/coleccion/capturar'),
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(handleResponse).catch(e => { console.error("Capture Error:", e); throw e; }),

  ganarBatalla: () => fetch(buildUrl('/battle/victory'),
    {method:'POST',headers:h()}).then(handleResponse).catch(e => { console.error("Battle Victory Error:", e); throw e; }),
};
