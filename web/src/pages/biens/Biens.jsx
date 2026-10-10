import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getBiens } from '../../api/biens'

const STATUT_VARIANT = {
  'Disponible': 'ok', 'Affecté': 'info', 'En prêt': 'loan',
  'En maintenance': 'warn', 'Perdu': 'bad', 'Réformé': 'mute',
}

const MOCK = [
  { id: 1, numero: 'UIYA-INF-2024-0142', designation: 'Ordinateur portable Dell Latitude', categorie: 'Informatique', service: 'Dépt. Informatique', salle: 'B05', statut: 'En prêt', etat: 'Bon', fin_garantie: '12/03/2027' },
  { id: 2, numero: 'UIYA-INF-2025-0088', designation: 'Imprimante HP LaserJet', categorie: 'Informatique', service: 'Scolarité', salle: 'Accueil', statut: 'Affecté', etat: 'Bon', fin_garantie: '09/11/2026' },
  { id: 3, numero: 'UIYA-CLI-2024-0017', designation: 'Climatiseur split 2 CV', categorie: 'Climatisation', service: 'Bibliothèque', salle: 'B12', statut: 'Affecté', etat: 'Moyen', fin_garantie: '20/06/2026' },
  { id: 4, numero: 'UIYA-INF-2024-0132', designation: 'Ordinateur de bureau Lenovo', categorie: 'Informatique', service: 'Scolarité', salle: 'S02', statut: 'En maintenance', etat: 'Dégradé', fin_garantie: '05/02/2027' },
  { id: 5, numero: 'UIYA-MOB-2026-0518', designation: 'Chaise visiteur', categorie: 'Mobilier', service: '—', salle: '', statut: 'Disponible', etat: 'Bon', fin_garantie: '—' },
  { id: 6, numero: 'UIYA-AUD-2023-0005', designation: 'Vidéoprojecteur Epson EB-X49', categorie: 'Audiovisuel', service: 'Amphi A', salle: 'A01', statut: 'En prêt', etat: 'Bon', fin_garantie: 'Expirée' },
  { id: 7, numero: 'UIYA-MOB-2019-0033', designation: 'Table de réunion 8 places', categorie: 'Mobilier', service: '—', salle: '', statut: 'Réformé', etat: 'Hors d\'usage', fin_garantie: '—' },
  { id: 8, numero: 'UIYA-AUD-2022-0011', designation: 'Vidéoprojecteur Epson EB-E01', categorie: 'Audiovisuel', service: 'Dépt. Informatique', salle: '', statut: 'Perdu', etat: '—', fin_garantie: 'Expirée' },
]

const inp = { minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B', boxSizing: 'border-box' }

export default function Biens() {
  const [biens, setBiens] = useState(MOCK)
  const [q, setQ] = useState('')
  const [categorie, setCategorie] = useState('')
  const [statut, setStatut] = useState('')

  useEffect(() => {
    getBiens({ q, categorie, statut }).then((r) => setBiens(r.data.data ?? r.data)).catch(() => {})
  }, [q, categorie, statut])

  const filtered = MOCK.filter((b) => {
    if (q && !b.designation.toLowerCase().includes(q.toLowerCase()) && !b.numero.includes(q)) return false
    if (categorie && b.categorie !== categorie) return false
    if (statut && b.statut !== statut) return false
    return true
  })

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Biens</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>1 248 biens enregistrés</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ ...btnGhost }}>Importer (Excel)</button>
          <button style={{ ...btnGhost }}>Imprimer les étiquettes</button>
          <Link to="/biens/nouveau" style={{ ...btnPrimary }}>+ Nouveau bien</Link>
        </div>
      </div>

      {/* Filtres */}
      <Card style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 240px' }}>
          <label style={lbl}>Recherche</label>
          <input style={{ ...inp, width: '100%' }} type="search" placeholder="Désignation, n° d'inventaire, n° de série" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Catégorie</label>
          <select style={inp} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            <option value="">Toutes</option>
            {['Informatique', 'Mobilier', 'Climatisation', 'Audiovisuel'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Statut</label>
          <select style={inp} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous</option>
            {['Disponible', 'Affecté', 'En prêt', 'En maintenance', 'Perdu', 'Réformé'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* Tableau */}
      <Card style={{ padding: '8px 8px 16px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={th}><input type="checkbox" /></th>
                <th style={th}>N° inventaire</th>
                <th style={th}>Désignation</th>
                <th style={th}>Catégorie</th>
                <th style={th}>Service · Salle</th>
                <th style={th}>Statut</th>
                <th style={th}>État</th>
                <th style={th}>Fin garantie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ cursor: 'pointer' }}>
                  <td style={td}><input type="checkbox" /></td>
                  <td style={td}><Link to={`/biens/${b.id}`} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#0E5A6B', textDecoration: 'none' }}>{b.numero}</Link></td>
                  <td style={td}>{b.designation}</td>
                  <td style={td}>{b.categorie}</td>
                  <td style={td}>{b.service}{b.salle ? ` · ${b.salle}` : ''}</td>
                  <td style={td}><Badge variant={STATUT_VARIANT[b.statut] || 'mute'}>{b.statut}</Badge></td>
                  <td style={td}>{b.etat}</td>
                  <td style={td}>{b.fin_garantie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 14, color: '#5A676B', marginTop: 14, padding: '0 12px' }}>
          <span>1–{filtered.length} sur 1 248</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map((p) => (
              <button key={p} style={{ minWidth: 40, minHeight: 36, border: '1px solid #DDE1DC', borderRadius: 8, background: p === 1 ? '#0E5A6B' : '#fff', color: p === 1 ? '#fff' : '#17262B', cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
            ))}
            <button style={{ minWidth: 40, minHeight: 36, border: '1px solid #DDE1DC', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>›</button>
          </div>
        </div>
      </Card>
    </Layout>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: '#5A676B', marginBottom: 4 }
const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const td = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle' }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer' }
const btnGhost = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
