import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getCampagnes, createCampagne, cloturerCampagne } from '../../api/inventaire'
import { getServices } from '../../api/referentiels'

const th  = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const tdS = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }

const RESULTAT_VARIANT = { present: 'good', absent: 'bad', deplace: 'warn', deteriore: 'warn', non_controle: 'mute' }
const RESULTAT_LABEL   = { present: 'Présent', absent: 'Absent', deplace: 'Déplacé', deteriore: 'Détérioré', non_controle: 'Non contrôlé' }

const FORM0 = { nom: '', description: '', date_debut: '', date_fin_prevue: '', service_id: '' }

export default function Inventaire() {
  const [campagne, setCampagne]   = useState(null)  // campagne en cours
  const [historique, setHist]     = useState([])
  const [rapport, setRapport]     = useState(null)
  const [services, setServices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHist, setShowHist]   = useState(false)
  const [form, setForm]           = useState(FORM0)
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rCours, rAll] = await Promise.all([
        getCampagnes({ statut: 'en_cours' }),
        getCampagnes(),
      ])
      const enCours = (rCours.data.data ?? [])[0] ?? null
      setCampagne(enCours)
      setHist((rAll.data.data ?? []).filter((c) => c.statut === 'cloturee'))

      if (enCours) {
        // Charger le rapport (écarts) pour la campagne en cours
        const { default: api } = await import('../../api/axios')
        const rr = await api.get(`/inventaires/${enCours.id}/rapport`)
        setRapport(rr.data.data)
      } else {
        setRapport(null)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    getServices().then((r) => setServices(r.data.data ?? [])).catch(() => {})
  }, [load])

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await createCampagne({ ...form, service_id: form.service_id || null })
      setShowModal(false); setForm(FORM0)
      load()
    } catch (ex) {
      const errors = ex.response?.data?.errors
      setErr(errors ? Object.values(errors).flat().join(' ') : (ex.response?.data?.message ?? 'Erreur.'))
    }
    setSaving(false)
  }

  const handleCloturer = async () => {
    if (!window.confirm('Clôturer définitivement cette campagne ?')) return
    try {
      await cloturerCampagne(campagne.id)
      load()
    } catch (ex) {
      alert(ex.response?.data?.message ?? 'Erreur lors de la clôture.')
    }
  }

  const pct = campagne ? campagne.pct : 0

  // ─── État : aucune campagne ───────────────────────────────────────────────
  if (!loading && !campagne) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 13, color: '#5A676B' }}>Inventaires</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>Aucune campagne en cours</h1>
            <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Lancez une campagne pour commencer un contrôle physique des biens.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {historique.length > 0 && (
              <button onClick={() => setShowHist((v) => !v)} style={btnGhost}>
                {showHist ? 'Masquer l\'historique' : `Historique (${historique.length})`}
              </button>
            )}
            <button onClick={() => { setShowModal(true); setErr('') }} style={btnPrimary}>+ Nouvelle campagne</button>
          </div>
        </div>

        {showHist && <HistoriqueTable campagnes={historique} />}

        {showModal && <ModalCampagne form={form} f={f} services={services} saving={saving} err={err} onSubmit={handleCreate} onClose={() => setShowModal(false)} />}
      </Layout>
    )
  }

  // ─── État : campagne en cours ─────────────────────────────────────────────
  const ecarts = rapport?.ecarts?.filter((e) => e.resultat !== 'present') ?? []
  const nbAbsents   = rapport?.nb_absents   ?? 0
  const nbDeplaces  = rapport?.nb_deplaces  ?? 0
  const nbDeteriores = rapport?.nb_deteriores ?? 0

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 13, color: '#5A676B' }}>Inventaires / Campagne en cours</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>{campagne?.nom}</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>
            Depuis le {fmtDate(campagne?.date_debut)}
            {campagne?.date_fin_prevue ? ` · Fin prévue : ${fmtDate(campagne.date_fin_prevue)}` : ''}
            {campagne?.service ? ` · Périmètre : ${campagne.service}` : ' · Périmètre : tous les biens'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleCloturer} style={btnPrimary}>Clôturer la campagne</button>
        </div>
      </div>

      {/* Progression */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
          <span><strong>{campagne?.controles}</strong> biens contrôlés sur {campagne?.total}</span>
          <span style={{ fontWeight: 600 }}>{pct} %</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: '#ECEEEA', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#0E5A6B', transition: 'width .4s' }} />
        </div>
      </Card>

      {/* KPIs écarts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <Card><div style={{ fontSize: 13, color: '#5A676B' }}>Non contrôlés</div><div style={{ fontSize: 28, fontWeight: 600, marginTop: 4 }}>{(campagne?.total ?? 0) - (campagne?.controles ?? 0)}</div></Card>
        <Card style={{ borderColor: '#E0B4AA' }}><div style={{ fontSize: 13, color: '#A23B2A' }}>Absents</div><div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#A23B2A' }}>{nbAbsents}</div></Card>
        <Card style={{ borderColor: '#E7C48C' }}><div style={{ fontSize: 13, color: '#8A510A' }}>Déplacés</div><div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#8A510A' }}>{nbDeplaces}</div></Card>
        <Card style={{ borderColor: '#E7C48C' }}><div style={{ fontSize: 13, color: '#8A510A' }}>Détériorés</div><div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: '#8A510A' }}>{nbDeteriores}</div></Card>
      </div>

      {/* Tableau des écarts */}
      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Écarts et anomalies</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['N° inventaire', 'Désignation', 'Constat', 'Salle constatée', 'Remarque'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ecarts.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', color: '#5A676B' }}>
                  {(campagne?.controles ?? 0) === 0 ? 'Aucun bien contrôlé pour l\'instant. Les agents scannent les biens depuis l\'application mobile.' : 'Aucun écart constaté.'}
                </td></tr>
              )}
              {ecarts.map((e) => (
                <tr key={e.bien_id}>
                  <td style={{ ...tdS, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{e.numero_inventaire}</td>
                  <td style={tdS}>{e.designation}</td>
                  <td style={tdS}><Badge variant={RESULTAT_VARIANT[e.resultat]}>{RESULTAT_LABEL[e.resultat]}</Badge></td>
                  <td style={tdS}>{e.salle_constatee ?? <span style={{ color: '#C9CFC9' }}>—</span>}</td>
                  <td style={tdS}>{e.remarque ?? <span style={{ color: '#C9CFC9' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: '#5A676B' }}>
          Un bien absent n'est pas déclaré perdu automatiquement — le gestionnaire décide après vérification.
        </p>
      </Card>
    </Layout>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function HistoriqueTable({ campagnes }) {
  const tdS = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }
  return (
    <Card>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Campagnes clôturées</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Nom', 'Début', 'Clôture', 'Périmètre', 'Contrôlés / Attendus', 'Taux'].map((h) => (
              <th key={h} style={{ textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {campagnes.map((c) => (
              <tr key={c.id}>
                <td style={{ ...tdS, fontWeight: 500 }}>{c.nom}</td>
                <td style={tdS}>{fmtDate(c.date_debut)}</td>
                <td style={tdS}>{fmtDate(c.date_cloture)}</td>
                <td style={tdS}>{c.service ?? 'Tous les biens'}</td>
                <td style={tdS}>{c.controles} / {c.total}</td>
                <td style={tdS}><Badge variant={c.pct >= 90 ? 'good' : c.pct >= 50 ? 'warn' : 'bad'}>{c.pct} %</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function ModalCampagne({ form, f, services, saving, err, onSubmit, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Nouvelle campagne d'inventaire</h3>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={lbl}>
            Nom de la campagne *
            <input required type="text" value={form.nom} onChange={f('nom')} style={inp} placeholder="Ex. : Inventaire annuel 2026" />
          </label>
          <label style={lbl}>
            Description
            <textarea rows={2} value={form.description} onChange={f('description')} style={{ ...inp, resize: 'vertical' }} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={lbl}>
              Date de début
              <input type="date" value={form.date_debut} onChange={f('date_debut')} style={inp} />
            </label>
            <label style={lbl}>
              Date de fin prévue
              <input type="date" value={form.date_fin_prevue} onChange={f('date_fin_prevue')} style={inp} />
            </label>
          </div>
          <label style={lbl}>
            Périmètre (service)
            <select value={form.service_id} onChange={f('service_id')} style={inp}>
              <option value="">Tous les biens</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </label>
          {err && <p style={{ margin: 0, fontSize: 13, color: '#A23B2A', background: '#FDF3F1', padding: '10px 12px', borderRadius: 8 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ ...btnGhost, minHeight: 42 }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, minHeight: 42 }}>
              {saving ? 'Création…' : 'Lancer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR')
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnGhost   = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
const lbl        = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500, color: '#3D4A4E' }
const inp        = { border: '1px solid #C9CFC9', borderRadius: 8, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14, color: '#17262B', width: '100%', boxSizing: 'border-box' }
