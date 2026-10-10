import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getBiens } from '../../api/biens'
import { getCategories } from '../../api/referentiels'

const STATUT_VARIANT = {
  'Disponible': 'ok', 'Affecté': 'info', 'En prêt': 'loan',
  'En maintenance': 'warn', 'Perdu': 'bad', 'Réformé': 'mute',
}

const inp = { minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B', boxSizing: 'border-box' }

export default function Biens() {
  const [biens, setBiens] = useState([])
  const [q, setQ] = useState('')
  const [categorie, setCategorie] = useState('')
  const [statut, setStatut] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    getBiens({ q, categorie, statut }).then((r) => setBiens(r.data.data ?? [])).catch(() => setBiens([]))
  }, [q, categorie, statut])

  const filtered = biens

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Biens</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>{biens.length} bien{biens.length !== 1 ? 's' : ''} enregistré{biens.length !== 1 ? 's' : ''}</p>
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
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
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
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#5A676B' }}>Aucun bien enregistré.</td></tr>
              )}
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
          <span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
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
