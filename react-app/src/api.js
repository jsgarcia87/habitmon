const BASE = '/api';
const getToken = () => localStorage.getItem('hm_token');
const h = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
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
};
