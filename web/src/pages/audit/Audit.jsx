import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout'
import { getAudit } from '../../api/rapports'

const chip = (active) => ({
  padding:'6px 14px', borderRadius:999, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
  background: active ? '#0E5A6B' : '#f0f4f5',
  color:      active ? '#fff'     : '#334',
})
const btnSecondary = { background:'#f0f4f5', color:'#0E5A6B', border:'1px solid #c5d5d9', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontSize:14 }

const ENTITES = ['','Bien','Affectation','Demande','Maintenance','Campagne','User','Service']

export default function Audit() {
  const [entries, setEntries]     = useState([])
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const [page, setPage]           = useState(1)
  const [filtres, setFiltres]     = useState({ entite: '', action: '', date_debut: '', date_fin: '' })

  const charger = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await getAudit({ ...filtres, page: p, per_page: 50 })
      setEntries(res.data)
      setMeta(res.meta)
      setPage(p)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [filtres])

  useEffect(() => { charger(1) }, [charger])

  const badge = (action) => {
    const map = {
      create: { bg:'#d1fae5', color:'#065f46', label:'Création' },
      update: { bg:'#dbeafe', color:'#1e40af', label:'Modification' },
      delete: { bg:'#fee2e2', color:'#991b1b', label:'Suppression' },
      login:  { bg:'#f3f4f6', color:'#374151', label:'Connexion' },
    }
    const key = Object.keys(map).find(k => action?.toLowerCase().includes(k))
    const style = map[key] ?? { bg:'#f3f4f6', color:'#374151', label: action }
    return (
      <span style={{ background:style.bg, color:style.color, padding:'2px 10px', borderRadius:999, fontSize:12, fontWeight:500 }}>
        {style.label ?? action}
      </span>
    )
  }

  return (
    <Layout>
      <div style={{ padding:'28px 32px', maxWidth:1200 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#1a2e35', margin:'0 0 24px' }}>Journal d'audit</h1>

        {/* Filtres */}
        <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <select value={filtres.entite} onChange={e => setFiltres(f => ({...f, entite: e.target.value}))}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde', minWidth:160 }}>
              <option value="">Toutes les entités</option>
              {ENTITES.filter(Boolean).map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input placeholder="Action (ex: update)" value={filtres.action}
              onChange={e => setFiltres(f => ({...f, action: e.target.value}))}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde', width:180 }} />
            <input type="date" value={filtres.date_debut}
              onChange={e => setFiltres(f => ({...f, date_debut: e.target.value}))}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }} />
            <input type="date" value={filtres.date_fin}
              onChange={e => setFiltres(f => ({...f, date_fin: e.target.value}))}
              style={{ padding:'7px 12px', borderRadius:8, border:'1px solid #dde' }} />
          </div>
        </div>

        {/* Tableau */}
        <div style={{ background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, overflow:'hidden' }}>
          {loading ? (
            <p style={{ padding:32, textAlign:'center', color:'#888' }}>Chargement…</p>
          ) : (
            <>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f0f4f5' }}>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>Date</th>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>Utilisateur</th>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>Action</th>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>Entité</th>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>ID</th>
                    <th style={{ padding:'10px 16px', textAlign:'left', fontWeight:600 }}>IP</th>
                    <th style={{ padding:'10px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:32, textAlign:'center', color:'#888' }}>Aucune entrée.</td></tr>
                  ) : entries.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom:'1px solid #f0f4f5', background: i%2===0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding:'9px 16px', whiteSpace:'nowrap', fontFamily:'monospace', fontSize:12 }}>{e.date}</td>
                      <td style={{ padding:'9px 16px' }}>{e.utilisateur}</td>
                      <td style={{ padding:'9px 16px' }}>{badge(e.action)}</td>
                      <td style={{ padding:'9px 16px' }}>{e.entite}</td>
                      <td style={{ padding:'9px 16px', color:'#888' }}>{e.entite_id ?? '—'}</td>
                      <td style={{ padding:'9px 16px', color:'#aaa', fontFamily:'monospace', fontSize:12 }}>{e.ip}</td>
                      <td style={{ padding:'9px 16px' }}>
                        {(e.avant || e.apres) && (
                          <button style={{ ...btnSecondary, padding:'3px 10px', fontSize:12 }}
                            onClick={() => setSelected(selected?.id === e.id ? null : e)}>
                            Détail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, padding:16 }}>
                  <button style={chip(false)} onClick={() => charger(page - 1)} disabled={page === 1}>‹ Préc.</button>
                  <span style={{ padding:'6px 14px', fontSize:13, color:'#667' }}>Page {meta.current_page} / {meta.last_page}</span>
                  <button style={chip(false)} onClick={() => charger(page + 1)} disabled={page === meta.last_page}>Suiv. ›</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panneau détail */}
        {selected && (
          <div style={{ marginTop:20, background:'#fff', border:'1px solid #e0e8ea', borderRadius:12, padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:15 }}>Détail — {selected.action} #{selected.entite_id}</h3>
              <button style={{ ...btnSecondary, padding:'4px 12px' }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {selected.avant && (
                <div>
                  <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#667' }}>AVANT</p>
                  <pre style={{ background:'#fef9f9', border:'1px solid #fcc', borderRadius:8, padding:12, fontSize:12, overflow:'auto', margin:0 }}>
                    {JSON.stringify(selected.avant, null, 2)}
                  </pre>
                </div>
              )}
              {selected.apres && (
                <div>
                  <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:600, color:'#667' }}>APRÈS</p>
                  <pre style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:12, fontSize:12, overflow:'auto', margin:0 }}>
                    {JSON.stringify(selected.apres, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
