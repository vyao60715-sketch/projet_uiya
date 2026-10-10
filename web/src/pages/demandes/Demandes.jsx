import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getDemandes, validerDemande, rejeterDemande } from '../../api/demandes'

const TYPE_STYLE = {
  PA: { background: '#FBEFD9', color: '#8A510A' },
  TR: { background: '#E3EFF1', color: '#0E5A6B' },
  PE: { background: '#F8E4DF', color: '#A23B2A' },
}

const TABS = ['En attente', 'Validées', 'Rejetées', 'Toutes']

export default function Demandes() {
  const [demandes, setDemandes] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getDemandes()
      .then((r) => {
        const list = r.data.data ?? []
        setDemandes(list)
        setSelected(list[0] ?? null)
      })
      .catch(() => setDemandes([]))
  }, [])

  const handleValider = async () => {
    setLoading(true)
    try {
      await validerDemande(selected.id, { commentaire })
      setCommentaire('')
    } catch {}
    setLoading(false)
  }

  const handleRejeter = async () => {
    if (!commentaire.trim()) { alert('Le motif est obligatoire en cas de rejet.'); return }
    setLoading(true)
    try {
      await rejeterDemande(selected.id, { commentaire })
      setCommentaire('')
    } catch {}
    setLoading(false)
  }

  const counts = [demandes.filter((d) => d.statut === 'Soumise').length, 0, 0, demandes.length]

  return (
    <Layout pendingCount={counts[0]}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Demandes</h1>
        <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Transferts, pannes et pertes signalés par les responsables de service</p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ minHeight: 38, padding: '0 14px', border: '1px solid #DDE1DC', borderRadius: 999, background: tab === i ? '#17262B' : '#fff', borderColor: tab === i ? '#17262B' : '#DDE1DC', fontFamily: 'inherit', fontSize: 14, color: tab === i ? '#fff' : '#3D4A4E', cursor: 'pointer' }}>
            {t}{i < 3 && counts[i] > 0 ? ` · ${counts[i]}` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Liste */}
        <Card style={{ flex: '1 1 340px', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {demandes.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#5A676B', fontSize: 14 }}>Aucune demande.</div>
          )}
          {demandes.map((d) => (
            <div key={d.id} onClick={() => setSelected(d)} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 8, border: `1px solid ${selected?.id === d.id ? '#0E5A6B' : 'transparent'}`, background: selected?.id === d.id ? '#F3F8F9' : 'transparent', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, ...TYPE_STYLE[d.type] }}>{d.type}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{d.label}</div>
                <div style={{ fontSize: 13, color: '#5A676B', marginTop: 3 }}>{d.service}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Détail */}
        {selected && (
          <Card style={{ flex: '999 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: '#5A676B' }}>Demande n° {selected.ref}</div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 600 }}>{selected.label}</h2>
              </div>
              <Badge variant="warn">{selected.statut}</Badge>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 20px', margin: 0 }}>
              {selected.bien && <div><dt style={dt}>Bien concerné</dt><dd style={{ margin: 0, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>{selected.bien}</dd></div>}
              <div><dt style={dt}>Service · Salle</dt><dd style={{ margin: 0, fontSize: 14 }}>{selected.salleService}</dd></div>
              <div><dt style={dt}>Demandeur</dt><dd style={{ margin: 0, fontSize: 14 }}>{selected.demandeur}</dd></div>
              <div><dt style={dt}>Date</dt><dd style={{ margin: 0, fontSize: 14 }}>{selected.date}</dd></div>
              {selected.garantie && <div><dt style={dt}>Garantie</dt><dd style={{ margin: 0 }}><Badge variant="info">{selected.garantie}</Badge></dd></div>}
            </dl>

            <div>
              <div style={{ fontSize: 12, color: '#5A676B', marginBottom: 6 }}>Motif</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, background: '#F6F7F4', borderRadius: 8, padding: '12px 14px' }}>{selected.motif}</p>
            </div>

            <div style={{ borderTop: '1px solid #EEF0EC', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>
                Décision du gestionnaire <span style={{ color: '#5A676B', fontWeight: 400 }}>(motif obligatoire en cas de rejet)</span>
              </label>
              <textarea rows={3} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Commentaire ou motif du rejet…" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #C9CFC9', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, color: '#17262B' }} />
              <p style={{ margin: 0, fontSize: 13, color: '#3D4A4E' }}>En validant, le bien passe au statut <strong>En maintenance</strong> et le responsable est notifié.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={handleRejeter} disabled={loading} style={{ ...btnBase, background: '#fff', color: '#A23B2A', border: '1px solid #E0B4AA' }}>Rejeter</button>
                <button onClick={handleValider} disabled={loading} style={{ ...btnBase }}>Valider la demande</button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

const dt = { fontSize: 12, color: '#5A676B', marginBottom: 3 }
const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
