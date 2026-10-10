import { useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import { getRapport } from '../../api/referentiels'

const RAPPORTS = [
  { type: 'liste-generale', label: 'Liste générale des biens', desc: 'Tous les biens et leurs caractéristiques, par catégorie, service, salle et statut.' },
  { type: 'par-service', label: 'Biens par service', desc: 'Biens affectés à chaque service, avec salle et responsable.' },
  { type: 'mouvements', label: 'Mouvements', desc: 'Affectations, transferts, prêts et retours sur la période.' },
  { type: 'maintenances', label: 'Maintenances', desc: 'Interventions, prestataires et coûts, préventives et correctives.' },
  { type: 'garanties', label: 'Garanties', desc: 'Biens sous garantie et dates d\'expiration.' },
  { type: 'inventaire', label: 'Rapport d\'inventaire', desc: 'Résultat d\'une campagne : présents, absents, déplacés, détériorés, non répertoriés.' },
  { type: 'reformes-perdus', label: 'Biens réformés ou perdus', desc: 'Biens sortis du patrimoine, avec date et motif.' },
  { type: 'statistiques', label: 'Statistiques', desc: 'Répartitions et évolutions par catégorie, service et statut.' },
]

const inp = { minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B', boxSizing: 'border-box' }

export default function Rapports() {
  const [du, setDu] = useState('2026-01-01')
  const [au, setAu] = useState('2026-10-10')
  const [service, setService] = useState('')
  const [categorie, setCategorie] = useState('')

  const telecharger = async (type, format) => {
    try {
      const res = await getRapport(type, { du, au, service, categorie, format })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <Layout>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Rapports</h1>
        <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Générés automatiquement, exportables en PDF et Excel</p>
      </div>

      {/* Filtres */}
      <Card style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label style={lbl} htmlFor="du">Du</label>
          <input id="du" type="date" style={inp} value={du} onChange={(e) => setDu(e.target.value)} />
        </div>
        <div>
          <label style={lbl} htmlFor="au">Au</label>
          <input id="au" type="date" style={inp} value={au} onChange={(e) => setAu(e.target.value)} />
        </div>
        <div>
          <label style={lbl} htmlFor="srv">Service</label>
          <select id="srv" style={inp} value={service} onChange={(e) => setService(e.target.value)}>
            <option value="">Tous</option>
            {['Scolarité', 'Comptabilité', 'Département Informatique'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl} htmlFor="cat">Catégorie</label>
          <select id="cat" style={inp} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            <option value="">Toutes</option>
            {['Informatique', 'Mobilier', 'Climatisation', 'Audiovisuel'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {RAPPORTS.map((r) => (
          <Card key={r.type} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{r.label}</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#5A676B', lineHeight: 1.5, flex: 1 }}>{r.desc}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => telecharger(r.type, 'pdf')} style={btnPrimary}>PDF</button>
              <button onClick={() => telecharger(r.type, 'xlsx')} style={btnGhost}>Excel</button>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: '#5A676B', marginBottom: 4 }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const btnGhost = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
