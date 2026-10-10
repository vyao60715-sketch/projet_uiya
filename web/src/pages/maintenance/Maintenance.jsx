import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getMaintenances, createMaintenance, updateMaintenance } from '../../api/maintenance'
import { getBiens } from '../../api/biens'

const STATUT_VARIANT = { planifiee: 'mute', en_cours: 'warn', terminee: 'good' }
const STATUT_LABEL   = { planifiee: 'Planifiée', en_cours: 'En cours', terminee: 'Terminée' }
const TYPE_LABEL     = { preventive: 'Préventive', corrective: 'Corrective' }
const TABS           = ['En cours', 'Planifiées', 'Terminées', 'Toutes']
const TAB_STATUT     = ['en_cours', 'planifiee', 'terminee', null]

const ct = { fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const tdS = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }

export default function Maintenance() {
  const [all, setAll]               = useState([])
  const [biens, setBiens]           = useState([])
  const [tab, setTab]               = useState(0)
  const [showPlan, setShowPlan]     = useState(false)
  const [cloture, setCloture]       = useState(null) // maintenance en cours à clôturer
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState('')

  // Formulaire planification
  const [form, setForm] = useState({ bien_id: '', type: 'preventive', date_prevue: '' })
  // Formulaire clôture
  const [fCloture, setFCloture] = useState({ resultat: '', cout: '', pieces: '' })

  const load = useCallback(() => {
    getMaintenances().then((r) => setAll(r.data.data ?? [])).catch(() => setAll([]))
  }, [])

  useEffect(() => {
    load()
    getBiens().then((r) => setBiens(r.data.data ?? [])).catch(() => {})
  }, [load])

  const filtered = TAB_STATUT[tab]
    ? all.filter((m) => m.statut === TAB_STATUT[tab])
    : all

  // Résumé : maintenances en cours correctives
  const enCours   = all.filter((m) => m.statut === 'en_cours').length
  const planifiees = all.filter((m) => m.statut === 'planifiee').length

  // Garanties expirantes dans 60j
  const garanties = biens
    .filter((b) => b.fin_garantie && daysUntil(b.fin_garantie) <= 60 && daysUntil(b.fin_garantie) >= 0)
    .sort((a, b) => daysUntil(a.fin_garantie) - daysUntil(b.fin_garantie))
    .slice(0, 10)

  const handlePlanifier = async (e) => {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      await createMaintenance(form)
      setShowPlan(false); setForm({ bien_id: '', type: 'preventive', date_prevue: '' })
      load()
    } catch (ex) {
      setErr(ex.response?.data?.message ?? 'Erreur.')
    }
    setLoading(false)
  }

  const handleCloture = async (e) => {
    e.preventDefault(); setLoading(true); setErr('')
    try {
      await updateMaintenance(cloture.id, {
        resultat: fCloture.resultat || undefined,
        cout:     fCloture.cout ? parseInt(fCloture.cout) : undefined,
        pieces:   fCloture.pieces || undefined,
      })
      setCloture(null); setFCloture({ resultat: '', cout: '', pieces: '' })
      load()
    } catch (ex) {
      setErr(ex.response?.data?.message ?? 'Erreur.')
    }
    setLoading(false)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Maintenance et garanties</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Interventions préventives et correctives, échéances de garantie</p>
        </div>
        <button onClick={() => { setShowPlan(true); setErr('') }} style={btnPrimary}>+ Planifier une maintenance</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Card><div style={{ fontSize: 13, color: '#5A676B' }}>En cours</div><div style={{ fontSize: 32, fontWeight: 600, marginTop: 6 }}>{enCours}</div></Card>
        <Card><div style={{ fontSize: 13, color: '#5A676B' }}>Planifiées</div><div style={{ fontSize: 32, fontWeight: 600, marginTop: 6 }}>{planifiees}</div></Card>
        <Card style={{ borderColor: '#E7C48C' }}>
          <div style={{ fontSize: 13, color: '#5A676B' }}>Garanties expirantes (60j)</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 6, color: '#8A510A' }}>{garanties.length}</div>
        </Card>
      </div>

      {/* Garanties expirantes */}
      {garanties.length > 0 && (
        <Card>
          <h2 style={ct}>Garanties qui expirent dans 60 jours</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Bien', 'N° inventaire', 'Expiration', 'Jours restants'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {garanties.map((b) => {
                  const jours = daysUntil(b.fin_garantie)
                  return (
                    <tr key={b.id}>
                      <td style={tdS}>{b.designation}</td>
                      <td style={{ ...tdS, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{b.numero_inventaire}</td>
                      <td style={tdS}>{fmtDate(b.fin_garantie)}</td>
                      <td style={tdS}><Badge variant={jours <= 7 ? 'bad' : jours <= 30 ? 'warn' : 'mute'}>{jours}j</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tableau interventions */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={ct}>Interventions</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setTab(i)} style={{
                minHeight: 38, padding: '0 14px', border: '1px solid',
                borderColor: tab === i ? '#17262B' : '#DDE1DC',
                borderRadius: 999, background: tab === i ? '#17262B' : '#fff',
                fontFamily: 'inherit', fontSize: 14, color: tab === i ? '#fff' : '#3D4A4E', cursor: 'pointer'
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Bien', 'Type', 'Date prévue', 'Prestataire', 'Coût (FCFA)', 'Garantie', 'Statut', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ ...tdS, textAlign: 'center', color: '#5A676B' }}>Aucune intervention.</td></tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={tdS}>
                    <div>{m.bien?.designation ?? '—'}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#5A676B' }}>{m.bien?.numero_inventaire}</div>
                  </td>
                  <td style={tdS}>{TYPE_LABEL[m.type]}</td>
                  <td style={tdS}>{fmtDate(m.date_prevue)}</td>
                  <td style={tdS}>{m.prestataire?.nom ?? <span style={{ color: '#C9CFC9' }}>—</span>}</td>
                  <td style={tdS}>{m.cout != null ? m.cout.toLocaleString('fr') : <span style={{ color: '#C9CFC9' }}>—</span>}</td>
                  <td style={tdS}><Badge variant={m.sous_garantie ? 'good' : 'mute'}>{m.sous_garantie ? 'Oui' : 'Non'}</Badge></td>
                  <td style={tdS}><Badge variant={STATUT_VARIANT[m.statut]}>{STATUT_LABEL[m.statut]}</Badge></td>
                  <td style={tdS}>
                    {m.statut !== 'terminee' && (
                      <button onClick={() => { setCloture(m); setFCloture({ resultat: m.resultat ?? '', cout: m.cout ?? '', pieces: m.pieces ?? '' }); setErr('') }}
                        style={{ ...btnGhost, minHeight: 34, padding: '0 12px', fontSize: 13 }}>
                        Clôturer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal planification */}
      {showPlan && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Planifier une maintenance</h3>
            <form onSubmit={handlePlanifier} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={lbl}>
                Bien *
                <select required value={form.bien_id} onChange={(e) => setForm((p) => ({ ...p, bien_id: e.target.value }))} style={input}>
                  <option value="">— Choisir un bien —</option>
                  {biens.map((b) => <option key={b.id} value={b.id}>{b.designation} ({b.numero_inventaire})</option>)}
                </select>
              </label>
              <label style={lbl}>
                Type *
                <select required value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} style={input}>
                  <option value="preventive">Préventive</option>
                  <option value="corrective">Corrective</option>
                </select>
              </label>
              <label style={lbl}>
                Date prévue *
                <input type="date" required value={form.date_prevue} onChange={(e) => setForm((p) => ({ ...p, date_prevue: e.target.value }))} style={input} />
              </label>
              {err && <p style={{ margin: 0, fontSize: 13, color: '#A23B2A' }}>{err}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowPlan(false)} style={{ ...btnGhost, minHeight: 42 }}>Annuler</button>
                <button type="submit" disabled={loading} style={{ ...btnPrimary, minHeight: 42 }}>Planifier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal clôture */}
      {cloture && (
        <div style={overlay}>
          <div style={modal}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Clôturer la maintenance</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#5A676B' }}>
              {cloture.bien?.designation} ({cloture.bien?.numero_inventaire})
            </p>
            <form onSubmit={handleCloture} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={lbl}>
                Résultat / Rapport *
                <textarea required rows={4} value={fCloture.resultat} onChange={(e) => setFCloture((p) => ({ ...p, resultat: e.target.value }))}
                  placeholder="Décrire les travaux effectués et le résultat…" style={{ ...input, resize: 'vertical' }} />
              </label>
              <label style={lbl}>
                Coût (FCFA)
                <input type="number" min={0} value={fCloture.cout} onChange={(e) => setFCloture((p) => ({ ...p, cout: e.target.value }))} style={input} />
              </label>
              <label style={lbl}>
                Pièces remplacées
                <input type="text" value={fCloture.pieces} onChange={(e) => setFCloture((p) => ({ ...p, pieces: e.target.value }))} style={input} />
              </label>
              {err && <p style={{ margin: 0, fontSize: 13, color: '#A23B2A' }}>{err}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setCloture(null)} style={{ ...btnGhost, minHeight: 42 }}>Annuler</button>
                <button type="submit" disabled={loading} style={{ ...btnPrimary, minHeight: 42 }}>Enregistrer la clôture</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnGhost   = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
const overlay    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const modal      = { background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }
const lbl        = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500, color: '#3D4A4E' }
const input      = { border: '1px solid #C9CFC9', borderRadius: 8, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14, color: '#17262B', width: '100%', boxSizing: 'border-box' }
