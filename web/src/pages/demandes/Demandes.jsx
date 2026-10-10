import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getDemandes, validerDemande, rejeterDemande } from '../../api/demandes'
import { useAuth } from '../../context/AuthContext'

const TYPE_LABEL  = { transfert: 'Transfert', panne: 'Panne', perte: 'Perte' }
const TYPE_ABBREV = { transfert: 'TR', panne: 'PA', perte: 'PE' }
const TYPE_STYLE  = {
  transfert: { background: '#E3EFF1', color: '#0E5A6B' },
  panne:     { background: '#FBEFD9', color: '#8A510A' },
  perte:     { background: '#F8E4DF', color: '#A23B2A' },
}
const STATUT_VARIANT = { soumise: 'warn', validee: 'good', rejetee: 'bad' }
const STATUT_LABEL   = { soumise: 'Soumise', validee: 'Validée', rejetee: 'Rejetée' }

const TABS = [
  { label: 'En attente', statut: 'soumise' },
  { label: 'Validées',   statut: 'validee' },
  { label: 'Rejetées',   statut: 'rejetee' },
  { label: 'Toutes',     statut: null },
]

export default function Demandes() {
  const { user } = useAuth()
  const isGestionnaire = user?.roles?.some((r) => ['admin', 'gestionnaire'].includes(r))

  const [all, setAll]           = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab]           = useState(0)
  const [motif, setMotif]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  const load = useCallback(() => {
    getDemandes()
      .then((r) => {
        const list = r.data.data ?? []
        setAll(list)
        setSelected((prev) => list.find((d) => d.id === prev?.id) ?? list[0] ?? null)
      })
      .catch(() => setAll([]))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = TABS[tab].statut
    ? all.filter((d) => d.statut === TABS[tab].statut)
    : all

  const counts = TABS.map((t) => t.statut ? all.filter((d) => d.statut === t.statut).length : all.length)

  const handleValider = async () => {
    setLoading(true); setErr('')
    try {
      await validerDemande(selected.id)
      setMotif('')
      load()
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Erreur lors de la validation.')
    }
    setLoading(false)
  }

  const handleRejeter = async () => {
    if (!motif.trim()) { setErr('Le motif est obligatoire en cas de rejet.'); return }
    setLoading(true); setErr('')
    try {
      await rejeterDemande(selected.id, { motif })
      setMotif('')
      load()
    } catch (e) {
      setErr(e.response?.data?.message ?? 'Erreur lors du rejet.')
    }
    setLoading(false)
  }

  return (
    <Layout pendingCount={counts[0]}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Demandes</h1>
        <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Transferts, pannes et pertes signalés par les responsables de service</p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            minHeight: 38, padding: '0 14px', border: '1px solid',
            borderColor: tab === i ? '#17262B' : '#DDE1DC',
            borderRadius: 999, background: tab === i ? '#17262B' : '#fff',
            fontFamily: 'inherit', fontSize: 14, color: tab === i ? '#fff' : '#3D4A4E', cursor: 'pointer'
          }}>
            {t.label}{counts[i] > 0 ? ` · ${counts[i]}` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Liste */}
        <Card style={{ flex: '1 1 340px', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#5A676B', fontSize: 14 }}>Aucune demande.</div>
          )}
          {filtered.map((d) => (
            <div key={d.id} onClick={() => { setSelected(d); setMotif(''); setErr('') }} style={{
              display: 'flex', gap: 14, padding: 14, borderRadius: 8,
              border: `1px solid ${selected?.id === d.id ? '#0E5A6B' : 'transparent'}`,
              background: selected?.id === d.id ? '#F3F8F9' : 'transparent', cursor: 'pointer'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 600, ...TYPE_STYLE[d.type] }}>
                {TYPE_ABBREV[d.type]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {TYPE_LABEL[d.type]} – {d.bien?.designation ?? '—'}
                </div>
                <div style={{ fontSize: 13, color: '#5A676B', marginTop: 3 }}>
                  {d.bien?.numero_inventaire} · {d.demandeur?.name ?? '—'}
                </div>
              </div>
            </div>
          ))}
        </Card>

        {/* Détail */}
        {selected && (
          <Card style={{ flex: '999 1 460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: '#5A676B' }}>Demande n° {selected.id}</div>
                <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 600 }}>
                  {TYPE_LABEL[selected.type]} – {selected.bien?.designation ?? '—'}
                </h2>
              </div>
              <Badge variant={STATUT_VARIANT[selected.statut]}>{STATUT_LABEL[selected.statut]}</Badge>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 20px', margin: 0 }}>
              <div>
                <dt style={dt}>Bien concerné</dt>
                <dd style={{ margin: 0, fontSize: 14, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {selected.bien?.numero_inventaire ?? '—'}
                </dd>
              </div>
              <div>
                <dt style={dt}>Demandeur</dt>
                <dd style={{ margin: 0, fontSize: 14 }}>{selected.demandeur?.name ?? '—'}</dd>
              </div>
              <div>
                <dt style={dt}>Date</dt>
                <dd style={{ margin: 0, fontSize: 14 }}>{new Date(selected.created_at).toLocaleDateString('fr-FR')}</dd>
              </div>
              {selected.service_destination && (
                <div>
                  <dt style={dt}>Service demandé</dt>
                  <dd style={{ margin: 0, fontSize: 14 }}>{selected.service_destination.nom}</dd>
                </div>
              )}
            </dl>

            <div>
              <div style={{ fontSize: 12, color: '#5A676B', marginBottom: 6 }}>Motif</div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, background: '#F6F7F4', borderRadius: 8, padding: '12px 14px' }}>
                {selected.motif || <em style={{ color: '#5A676B' }}>Non précisé</em>}
              </p>
            </div>

            {selected.decision_motif && (
              <div>
                <div style={{ fontSize: 12, color: '#5A676B', marginBottom: 6 }}>Décision</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, background: '#F6F7F4', borderRadius: 8, padding: '12px 14px' }}>
                  {selected.decision_motif}
                </p>
              </div>
            )}

            {/* Actions gestionnaire — seulement si soumise */}
            {isGestionnaire && selected.statut === 'soumise' && (
              <div style={{ borderTop: '1px solid #EEF0EC', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>
                  Décision <span style={{ color: '#5A676B', fontWeight: 400 }}>(motif obligatoire en cas de rejet)</span>
                </label>
                <textarea rows={3} value={motif} onChange={(e) => { setMotif(e.target.value); setErr('') }}
                  placeholder="Commentaire ou motif du rejet…"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #C9CFC9', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, color: '#17262B', resize: 'vertical' }} />
                {err && <p style={{ margin: 0, fontSize: 13, color: '#A23B2A' }}>{err}</p>}
                <p style={{ margin: 0, fontSize: 13, color: '#3D4A4E' }}>
                  {selected.type === 'panne' && 'En validant, le bien passe au statut En maintenance.'}
                  {selected.type === 'perte' && 'En validant, le bien passe au statut Perdu.'}
                  {selected.type === 'transfert' && 'En validant, le transfert vers le service demandé est appliqué.'}
                  {' '}Le responsable sera notifié.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={handleRejeter} disabled={loading}
                    style={{ ...btnBase, background: '#fff', color: '#A23B2A', border: '1px solid #E0B4AA' }}>
                    Rejeter
                  </button>
                  <button onClick={handleValider} disabled={loading} style={btnBase}>
                    Valider la demande
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  )
}

const dt      = { fontSize: 12, color: '#5A676B', marginBottom: 3 }
const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
