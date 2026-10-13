import api from './axios';

export const getRapportBiens       = (params) => api.get('/rapports/biens',        { params }).then(r => r.data.data);
export const getRapportMouvements  = (params) => api.get('/rapports/mouvements',   { params }).then(r => r.data.data);
export const getRapportMaintenances= (params) => api.get('/rapports/maintenances', { params }).then(r => r.data.data);
export const getRapportGaranties   = (params) => api.get('/rapports/garanties',    { params }).then(r => r.data.data);
export const getRapportInventaire  = (params) => api.get('/rapports/inventaire',   { params }).then(r => r.data.data);
export const getRapportReformes    = (params) => api.get('/rapports/reformes',     { params }).then(r => r.data.data);
export const getRapportStatistiques= ()       => api.get('/rapports/statistiques').then(r => r.data.data);

export const getAudit = (params) => api.get('/audit', { params }).then(r => r.data);

// Exports fichiers (téléchargement direct avec Bearer token)
async function _download(url, filename) {
  const token = localStorage.getItem('token');
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const res = await fetch(`${base}${url}`, { headers: { Authorization: `Bearer ${token}`, Accept: '*/*' } });
  if (!res.ok) throw new Error('Export échoué');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const exportBiensExcel = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return _download(`/rapports/biens/export/excel${qs ? '?' + qs : ''}`, 'rapport-biens.xlsx');
};

export const exportBiensPdf = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return _download(`/rapports/biens/export/pdf${qs ? '?' + qs : ''}`, 'rapport-biens.pdf');
};
