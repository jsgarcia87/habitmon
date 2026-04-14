const BASE = 'hb_api/index.php';

// Detect subfolder via Vite's BASE_URL (more reliable for build-time base paths)
export const getAssetPath = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  const base = import.meta.env.BASE_URL || '/';
  // Clean path: remove leading slash if base already has trailing slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

const h = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('hm_token')}`
});

export const api = {
  // Auth
  register: (data) => fetch(`${BASE}/auth/register`,
    {method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(data)}).then(r=>r.json()),
  
  login: (data) => fetch(`${BASE}/auth/login`,
    {method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify(data)}).then(r=>r.json()),

  // Starter
  elegirStarter: (data) => fetch(`${BASE}/starter/elegir`,
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(r=>r.json()),
  
  getStarter: () => fetch(`${BASE}/starter/info`,
    {headers:h()}).then(r=>r.json()),

  // Hábitos
  getHabitosHoy: () => fetch(`${BASE}/habitos/hoy`,
    {headers:h()}).then(r=>r.json()),
  
  completarHabito: (data) => fetch(`${BASE}/habitos/completar`,
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(r=>r.json()),

  // Gimnasios
  getGimnasiosHoy: () => fetch(`${BASE}/gimnasios/hoy`,
    {headers:h()}).then(r=>r.json()),
  
  completarGimnasio: (data) => fetch(`${BASE}/gimnasios/completar`,
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(r=>r.json()),

  // Colección
  getColeccion: () => fetch(`${BASE}/coleccion`,
    {headers:h()}).then(r=>r.json()),

  // Admin
  getAdminConfig: () => fetch(`${BASE}/admin/config`,
    {headers:h()}).then(r=>r.json()),
  
  saveAdminConfig: (data) => fetch(`${BASE}/admin/config`,
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(r=>r.json()),

  capturarPokemon: (data) => fetch(`${BASE}/coleccion/capturar`,
    {method:'POST',headers:h(),
     body:JSON.stringify(data)}).then(r=>r.json()),
};
