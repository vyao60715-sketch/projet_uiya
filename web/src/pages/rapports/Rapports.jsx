import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import {
  getRapportBiens, getRapportMouvements, getRapportMaintenances,
  getRapportGaranties, getRapportInventaire, getRapportReformes,
  getRapportStatistiques, exportBiensExcel, exportBiensPdf,
} from '../../api/rapports'
import { getServices } from '../../api/referentiels'

// ─── styles ──────────────────────────────────────────────────────────────────
const btnPrimary  = { background:'#0E5A6B', color:'#fff', border:'none', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:14 }
const btnSecondary= { background:'#f0f4f5', color:'#0E5A6B', border:'1px solid #c5d5d9', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:14 }
const chip = (active) => ({
  padding:'6px 14px', borderRadius:999, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
  background: active ? '#0E5A6B' : '#f0f4f5',
  color:      active ? '#fff'     : '#334',
})

const ONGLETS = [
  { id: 'biens',        label: 'Biens' },
  { id: 'mouvements',   label: 'Mouvements' },
  { id: 'maintenances', label: 'Maintenances' },
  { id: 'garanties',    label: 'Garanties' },
  { id: 'inventaire',   label: 'Inventaires' },
  { id: 'reformes',     label: 'Réformés / Perdus' },
  { id: 'statistiques', label: 'Statistiques' },
]

// ─── composants génériques ───────────────────────────────────────────────────
function Tableau({ colonnes, lignes }) {
  if (!lignes || lignes.length === 0)
    return <p style={{ color:'#888', padding:'24px 0', textAlign:'center' }}>Aucun résultat.</p>
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#f0f4f5' }}>
            {colonnes.map(c => (
              <th key={c.key} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, whiteSpace:'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={i} style={{ borderBottom:'1px solid #eee' }}>
              {colonnes.map(c => (
                <td key={c.key} style={{ padding:'8px 12px', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                  {c.render ? c.render(l) : (l[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KpiBar({ kpis }) {
  return (
    <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
      {kpis.map(k => (
        <div key={k.label} style={{ flex:'1 1 120px', background:'#f8fafb', border:'1px solid #e0e8ea', borderRadius:10, padding:'14px 18px', textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:700, color: k.color ?? '#0E5A6B' }}>{k.value}</div>
          <div style={{ fontSize:12, color:'#667', marginTop:4 }}>{k.label}</div>
        </div>
      ))}
    </div>
  )
}

function exportCsv(colonnes, lignes, nom) {
  const header = colonnes.map(c => c.label).join(';')
  const rows = lignes.map(l => colonnes.map(c => {
    const val = c.render ? c.render(l) : (l[c.key] ?? '')
    return `"${String(val).replace(/"/g, '""')}"`
  }).join(';'))
  const csv = '﻿' + [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = nom + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

function exportHtml(colonnes, lignes, titre) {
  const thStyle = 'padding:8px 12px;background:#0E5A6B;color:#fff;text-align:left'
  const tdStyle = 'padding:8px 12px;border-bottom:1px solid #eee'
  const ths = colonnes.map(c => `<th style="${thStyle}">${c.label}</th>`).join('')
  const trs = lignes.map(l =>
    '<tr>' + colonnes.map(c => `<td style="${tdStyle}">${c.render ? c.render(l) : (l[c.key] ?? '—')}</td>`).join('') + '</tr>'
  ).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titre}</title></head>
<body style="font-family:sans-serif;padding:32px">
<h2 style="color:#0E5A6B">${titre}</h2>
<p style="color:#888">Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
<table style="border-collapse:collapse;width:100%"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

// ─── panneaux par onglet ─────────────────────────────────────────────────────
function PanneauBiens({ services }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [filtres, setFiltres] = useState({ service_id: '', statut: '', etat: '' })

  const charger = useCallback(async () => {
    setLoading(true)
    try { setData(await getRapportBiens(filtres)) }
    finally { setLoading(false) }
  }, [filtres])

  useEffect(() => { charger() }, [charger])

  const cols = [
    { key:'numero_inventaire', label:'N° inventaire' },
    { key:'designation',       label:'Désignation' },
    { key:'categorie',         label:'Catégorie' },
    { key:'service',           label:'Service' },
    { key:'statut',            label:'Statut' },
    { key:'etat',              label:'État' },
    { key:'valeur_acquisition',label:'Valeur', render: l => l.valeur_acquisition ? `${Number(l.valeur_acquisition).toLocaleString('fr')} F` : '—' },
    { key:'date_acquisition',  label:'Acquisition' },
    { key:'fin_garantie',      label:'Fin garantie' },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <select value={filtres.service_id} onChange={e => setFiltres(f => ({ ...f, service_id: e.target.value }))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }}>
          <option value="">Tous les services</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select value={filtres.statut} onChange={e => setFiltres(f => ({ ...f, statut: e.target.value }))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }}>
          <option value="">Tous les statuts</option>
          {['Disponible','Affecté','En prêt','En maintenance','Perdu','Réformé'].map(s =>
            <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {data && <KpiBar kpis={[
        { label:'Total', value: data.stats.total },
        { label:'Disponibles', value: data.stats.disponibles, color:'#2a9d6c' },
        { label:'Affectés', value: data.stats.affectes, color:'#0E5A6B' },
        { label:'Maintenance', value: data.stats.maintenance, color:'#d97706' },
        { label:'Perdus / Réformés', value: data.stats.perdus + data.stats.reformes, color:'#dc2626' },
      ]} />}
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.biens, 'rapport-biens')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportBiensExcel(filtres)}>⬇ Excel</button>
          <button style={btnSecondary} onClick={() => exportBiensPdf(filtres)}>⬇ PDF</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.biens, 'Rapport – Liste des biens')}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.biens} />
      </>}
    </div>
  )
}

function PanneauMouvements({ services }) {
  const today = new Date().toISOString().slice(0, 10)
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [filtres, setFiltres] = useState({ date_debut: new Date(Date.now() - 30*86400000).toISOString().slice(0,10), date_fin: today, type: '', service_id: '' })

  const charger = useCallback(async () => {
    setLoading(true)
    try { setData(await getRapportMouvements(filtres)) }
    finally { setLoading(false) }
  }, [filtres])

  useEffect(() => { charger() }, [charger])

  const cols = [
    { key:'date',               label:'Date' },
    { key:'type',               label:'Type' },
    { key:'bien',               label:'Bien' },
    { key:'numero',             label:'N° inventaire' },
    { key:'service',            label:'Service' },
    { key:'utilisateur',        label:'Utilisateur' },
    { key:'date_retour_prevue', label:'Retour prévu' },
    { key:'retourne',           label:'Retourné', render: l => l.retourne ? '✓' : '' },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <input type="date" value={filtres.date_debut} onChange={e => setFiltres(f => ({...f, date_debut: e.target.value}))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }} />
        <input type="date" value={filtres.date_fin} onChange={e => setFiltres(f => ({...f, date_fin: e.target.value}))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }} />
        <select value={filtres.type} onChange={e => setFiltres(f => ({...f, type: e.target.value}))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }}>
          <option value="">Tous types</option>
          {['affectation','transfert','pret'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <p style={{ marginBottom:12, color:'#667', fontSize:13 }}>{data.total} mouvement(s)</p>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.mouvements, 'rapport-mouvements')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.mouvements, 'Rapport – Mouvements')}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.mouvements} />
      </>}
    </div>
  )
}

function PanneauMaintenances() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [filtres, setFiltres] = useState({ statut: '', type: '' })

  const charger = useCallback(async () => {
    setLoading(true)
    try { setData(await getRapportMaintenances(filtres)) }
    finally { setLoading(false) }
  }, [filtres])

  useEffect(() => { charger() }, [charger])

  const cols = [
    { key:'bien',       label:'Bien' },
    { key:'numero',     label:'N° inventaire' },
    { key:'type',       label:'Type' },
    { key:'statut',     label:'Statut' },
    { key:'date_prevue',label:'Prévue le' },
    { key:'date_debut', label:'Début' },
    { key:'date_fin',   label:'Fin' },
    { key:'technicien', label:'Technicien' },
    { key:'cout',       label:'Coût', render: l => l.cout ? `${Number(l.cout).toLocaleString('fr')} F` : '—' },
    { key:'resultat',   label:'Résultat', wrap: true },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <select value={filtres.type} onChange={e => setFiltres(f => ({...f, type: e.target.value}))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }}>
          <option value="">Tous types</option>
          <option value="preventive">Préventive</option>
          <option value="corrective">Corrective</option>
        </select>
        <select value={filtres.statut} onChange={e => setFiltres(f => ({...f, statut: e.target.value}))}
          style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }}>
          <option value="">Tous statuts</option>
          <option value="planifiee">Planifiée</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>
      {data && <KpiBar kpis={[
        { label:'Total', value: data.stats.total },
        { label:'En cours', value: data.stats.en_cours, color:'#d97706' },
        { label:'Planifiées', value: data.stats.planifiees, color:'#0E5A6B' },
        { label:'Terminées', value: data.stats.terminees, color:'#2a9d6c' },
        { label:'Coût total', value: `${Number(data.stats.cout_total || 0).toLocaleString('fr')} F`, color:'#334' },
      ]} />}
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.rows, 'rapport-maintenances')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.rows, 'Rapport – Maintenances')}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.rows} />
      </>}
    </div>
  )
}

function PanneauGaranties() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [jours, setJours]     = useState(90)

  const charger = useCallback(async () => {
    setLoading(true)
    try { setData(await getRapportGaranties({ jours })) }
    finally { setLoading(false) }
  }, [jours])

  useEffect(() => { charger() }, [charger])

  const cols = [
    { key:'numero',      label:'N° inventaire' },
    { key:'designation', label:'Désignation' },
    { key:'categorie',   label:'Catégorie' },
    { key:'service',     label:'Service' },
    { key:'fin_garantie',label:'Fin garantie' },
    { key:'jours_restants', label:'Jours restants', render: l => (
      <span style={{ fontWeight:600, color: l.jours_restants <= 7 ? '#dc2626' : l.jours_restants <= 30 ? '#d97706' : '#2a9d6c' }}>
        J-{l.jours_restants}
      </span>
    )},
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
        <span style={{ fontSize:13, color:'#667' }}>Horizon :</span>
        {[30, 60, 90, 180].map(j => (
          <button key={j} style={chip(jours === j)} onClick={() => setJours(j)}>{j} jours</button>
        ))}
      </div>
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <p style={{ marginBottom:12, color:'#667', fontSize:13 }}>{data.total} bien(s) avec garantie expirant dans {jours} jours</p>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.biens, 'rapport-garanties')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.biens, `Rapport – Garanties (J-${jours})`)}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.biens} />
      </>}
    </div>
  )
}

function PanneauInventaire() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRapportInventaire().then(setData).finally(() => setLoading(false))
  }, [])

  const cols = [
    { key:'nom',          label:'Campagne' },
    { key:'service',      label:'Périmètre' },
    { key:'date_debut',   label:'Début' },
    { key:'date_cloture', label:'Clôturée le' },
    { key:'statut',       label:'Statut' },
    { key:'nb_attendus',  label:'Biens attendus' },
    { key:'nb_controles', label:'Contrôlés' },
    { key:'pct',          label:'Avancement', render: l => `${l.pct} %` },
  ]

  return (
    <div>
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.campagnes, 'rapport-inventaires')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.campagnes, 'Rapport – Inventaires')}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.campagnes} />
      </>}
    </div>
  )
}

function PanneauReformes() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [statut, setStatut]   = useState('')

  const charger = useCallback(async () => {
    setLoading(true)
    try { setData(await getRapportReformes({ statut })) }
    finally { setLoading(false) }
  }, [statut])

  useEffect(() => { charger() }, [charger])

  const cols = [
    { key:'numero',           label:'N° inventaire' },
    { key:'designation',      label:'Désignation' },
    { key:'categorie',        label:'Catégorie' },
    { key:'service',          label:'Service' },
    { key:'statut',           label:'Statut' },
    { key:'valeur',           label:'Valeur', render: l => l.valeur ? `${Number(l.valeur).toLocaleString('fr')} F` : '—' },
    { key:'date_acquisition', label:'Acquisition' },
  ]

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[{v:'',l:'Tous'},{v:'Réformé',l:'Réformés'},{v:'Perdu',l:'Perdus'}].map(o => (
          <button key={o.v} style={chip(statut === o.v)} onClick={() => setStatut(o.v)}>{o.l}</button>
        ))}
      </div>
      {loading ? <p style={{ color:'#888' }}>Chargement…</p> : data && <>
        <p style={{ marginBottom:12, color:'#667', fontSize:13 }}>{data.total} bien(s)</p>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={btnSecondary} onClick={() => exportCsv(cols, data.biens, 'rapport-reformes')}>⬇ CSV</button>
          <button style={btnSecondary} onClick={() => exportHtml(cols, data.biens, 'Rapport – Réformés / Perdus')}>🖨 Imprimer</button>
        </div>
        <Tableau colonnes={cols} lignes={data.biens} />
      </>}
    </div>
  )
}

function PanneauStatistiques() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRapportStatistiques().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color:'#888' }}>Chargement…</p>
  if (!data) return null

  const statuts = Object.entries(data.parStatut)
  const total = statuts.reduce((s, [, v]) => s + v, 0)
  const COLORS = { 'Disponible':'#2a9d6c','Affecté':'#0E5A6B','En prêt':'#7c3aed','En maintenance':'#d97706','Perdu':'#dc2626','Réformé':'#6b7280' }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
      {/* Répartition par statut */}
      <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:20 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:15 }}>Répartition par statut</h3>
        {statuts.map(([s, nb]) => (
          <div key={s} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
              <span>{s}</span><span style={{ fontWeight:600 }}>{nb} ({total ? Math.round(nb/total*100) : 0} %)</span>
            </div>
            <div style={{ background:'#f0f4f5', borderRadius:999, height:8, overflow:'hidden' }}>
              <div style={{ background: COLORS[s] ?? '#0E5A6B', width:`${total ? nb/total*100 : 0}%`, height:'100%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Par service */}
      <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:20 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:15 }}>Biens par service</h3>
        <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
          <tbody>
            {data.parService.map((r, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #f0f4f5' }}>
                <td style={{ padding:'6px 0' }}>{r.service}</td>
                <td style={{ padding:'6px 0', textAlign:'right', fontWeight:600 }}>{r.nb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Par catégorie */}
      <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:20 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:15 }}>Biens par catégorie</h3>
        <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
          <tbody>
            {data.parCategorie.map((r, i) => (
              <tr key={i} style={{ borderBottom:'1px solid #f0f4f5' }}>
                <td style={{ padding:'6px 0' }}>{r.categorie}</td>
                <td style={{ padding:'6px 0', textAlign:'right', fontWeight:600 }}>{r.nb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── page principale ─────────────────────────────────────────────────────────
export default function Rapports() {
  const [onglet, setOnglet]     = useState('biens')
  const [services, setServices] = useState([])

  useEffect(() => {
    getServices().then(r => setServices(r.data?.data ?? r.data ?? [])).catch(() => {})
  }, [])

  const panneaux = {
    biens:        <PanneauBiens services={services} />,
    mouvements:   <PanneauMouvements services={services} />,
    maintenances: <PanneauMaintenances />,
    garanties:    <PanneauGaranties />,
    inventaire:   <PanneauInventaire />,
    reformes:     <PanneauReformes />,
    statistiques: <PanneauStatistiques />,
  }

  return (
    <Layout>
      <div style={{ padding:'28px 32px', maxWidth:1200 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#1a2e35', margin:'0 0 24px' }}>Rapports</h1>

        {/* Onglets */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {ONGLETS.map(o => (
            <button key={o.id} style={chip(onglet === o.id)} onClick={() => setOnglet(o.id)}>{o.label}</button>
          ))}
        </div>

        {/* Panneau actif */}
        <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:24 }}>
          {panneaux[onglet]}
        </div>
      </div>
    </Layout>
  )
}
