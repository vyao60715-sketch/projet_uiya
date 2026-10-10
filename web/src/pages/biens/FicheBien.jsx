import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import {
  getBien, getBienByUuid, getBienPhoto, getBienQr, getEtiquette, getBienHistorique,
  affecter, transferer, preter, retourPret,
} from '../../api/biens'
import { getServices, getSalles, getUsers } from '../../api/referentiels'

const STATUT_VARIANT = {
  'Disponible': 'ok', 'Affecté': 'info', 'En prêt': 'loan',
  'En maintenance': 'warn', 'Perdu': 'bad', 'Réformé': 'mute',
}

const TYPE_LABEL = { affectation: 'Affectation', transfert: 'Transfert', pret: 'Prêt', retour: 'Retour' }

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'
const formatDateTime = (iso) => iso ? new Date(iso).toLocaleString('fr-FR') : '—'

const inp = { minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B', boxSizing: 'border-box', width: '100%' }
const field = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }
const dt = { fontSize: 12, color: '#5A676B', marginBottom: 3 }
const dd = { margin: 0, fontSize: 14 }
const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid #EEF0EC', fontSize: 14 }
const btnGhost = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#fff', color: '#0E5A6B', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnPrimary = { ...btnGhost, background: '#0E5A6B', color: '#fff' }

const ACTIONS_CONFIG = {
  affecter: { titre: 'Affecter le bien', soumettre: affecter, succes: 'Bien affecté.' },
  transferer: { titre: 'Transférer le bien', soumettre: transferer, succes: 'Bien transféré.' },
  preter: { titre: 'Prêter le bien', soumettre: preter, succes: 'Bien prêté.' },
}

function ActionForm({ action, bien, services, salles, users, onDone, onCancel }) {
  const [form, setForm] = useState({ service_id: '', salle_id: '', responsable_id: '', date_retour_prevue: '', motif: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const config = ACTIONS_CONFIG[action]

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.salle_id) delete payload.salle_id
      if (!payload.responsable_id) delete payload.responsable_id
      if (action !== 'preter') delete payload.date_retour_prevue
      await config.soumettre(bien.id, payload)
      onDone(config.succes)
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Action impossible.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card style={{ borderColor: '#0E5A6B' }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>{config.titre}</h2>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div>
          <label style={field}>Service <span style={{ color: '#A23B2A' }}>*</span></label>
          <select style={inp} value={form.service_id} onChange={(e) => set('service_id', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={field}>Salle</label>
          <select style={inp} value={form.salle_id} onChange={(e) => set('salle_id', e.target.value)}>
            <option value="">— Aucune —</option>
            {salles.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </div>
        <div>
          <label style={field}>Responsable</label>
          <select style={inp} value={form.responsable_id} onChange={(e) => set('responsable_id', e.target.value)}>
            <option value="">— Aucun —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {action === 'preter' && (
          <div>
            <label style={field}>Date de retour prévue <span style={{ color: '#A23B2A' }}>*</span></label>
            <input type="date" style={inp} value={form.date_retour_prevue} onChange={(e) => set('date_retour_prevue', e.target.value)} required />
          </div>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={field}>Motif</label>
          <input style={inp} value={form.motif} onChange={(e) => set('motif', e.target.value)} />
        </div>
        {error && <p style={{ gridColumn: '1 / -1', color: '#A23B2A', fontSize: 13, margin: 0 }}>{error}</p>}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={btnGhost}>Annuler</button>
          <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Enregistrement…' : 'Confirmer'}</button>
        </div>
      </form>
    </Card>
  )
}

export default function FicheBien() {
  const { id, uuid } = useParams()
  const [bien, setBien] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null)
  const [notice, setNotice] = useState('')
  const [services, setServices] = useState([])
  const [salles, setSalles] = useState([])
  const [users, setUsers] = useState([])

  const charger = () => {
    setLoading(true)
    const requete = uuid ? getBienByUuid(uuid) : getBien(id)
    return requete
      .then((r) => setBien(r.data.data))
      .catch(() => setError("Ce bien n'existe pas ou n'est plus accessible."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [id, uuid])

  useEffect(() => {
    if (!bien?.id) return
    getBienHistorique(bien.id).then((r) => setHistorique(r.data.data ?? [])).catch(() => {})
  }, [bien?.id, bien?.statut])

  useEffect(() => {
    getServices().then((r) => setServices(r.data.data ?? [])).catch(() => {})
    getSalles().then((r) => setSalles(r.data.data ?? [])).catch(() => {})
    getUsers().then((r) => setUsers(r.data.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!bien?.photo) return
    let url
    getBienPhoto(bien.id).then((r) => {
      url = URL.createObjectURL(r.data)
      setPhotoUrl(url)
    }).catch(() => {})
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [bien?.id, bien?.photo])

  useEffect(() => {
    if (!bien?.id) return
    let url
    getBienQr(bien.id).then((r) => {
      url = URL.createObjectURL(r.data)
      setQrUrl(url)
    }).catch(() => {})
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [bien?.id])

  const telechargerEtiquette = async () => {
    const res = await getEtiquette(bien.id)
    const url = URL.createObjectURL(res.data)
    window.open(url, '_blank')
  }

  const enregistrerRetour = async () => {
    if (!window.confirm('Confirmer le retour de ce bien ?')) return
    try {
      await retourPret(bien.id, {})
      setNotice('Retour enregistré.')
      charger()
    } catch (err) {
      alert(err.response?.data?.message || 'Impossible d\'enregistrer le retour.')
    }
  }

  const onActionDone = (message) => {
    setAction(null)
    setNotice(message)
    charger()
  }

  if (loading) {
    return <Layout><p style={{ color: '#5A676B' }}>Chargement…</p></Layout>
  }

  if (error || !bien) {
    return (
      <Layout>
        <p style={{ color: '#A23B2A' }}>{error || 'Bien introuvable.'}</p>
        <Link to="/biens" style={{ color: '#0E5A6B' }}>&larr; Retour à la liste</Link>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ fontSize: 13, color: '#5A676B' }}>
        <Link to="/biens" style={{ color: '#0E5A6B', textDecoration: 'none' }}>Biens</Link> / {bien.numero_inventaire}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>{bien.designation}</h1>
            <Badge variant={STATUT_VARIANT[bien.statut] || 'mute'}>{bien.statut}</Badge>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, color: '#5A676B', marginTop: 6 }}>
            {bien.numero_inventaire} · {bien.categorie?.nom}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {bien.statut === 'Disponible' && <button onClick={() => setAction('affecter')} style={btnGhost}>Affecter</button>}
          {bien.statut === 'Disponible' && <button onClick={() => setAction('preter')} style={btnGhost}>Prêter</button>}
          {bien.statut === 'Affecté' && <button onClick={() => setAction('transferer')} style={btnGhost}>Transférer</button>}
          {bien.statut === 'En prêt' && <button onClick={enregistrerRetour} style={btnGhost}>Enregistrer le retour</button>}
          <button onClick={telechargerEtiquette} style={btnGhost}>Télécharger l'étiquette</button>
        </div>
      </div>

      {notice && <p style={{ margin: 0, color: '#2F6B3A', fontSize: 14 }}>{notice}</p>}

      {action && (
        <ActionForm
          action={action} bien={bien} services={services} salles={salles} users={users}
          onDone={onActionDone} onCancel={() => setAction(null)}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <Card style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <div style={{ width: 180, height: 140, borderRadius: 8, background: '#ECEEEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A676B', fontSize: 13, flex: 'none', overflow: 'hidden' }}>
            {photoUrl ? <img src={photoUrl} alt={bien.designation} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '[Pas de photo]'}
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px 24px', margin: 0, flex: '1 1 300px' }}>
            <div><dt style={dt}>Marque · Modèle</dt><dd style={dd}>{[bien.marque, bien.modele].filter(Boolean).join(' · ') || '—'}</dd></div>
            <div><dt style={dt}>Numéro de série</dt><dd style={{ ...dd, fontFamily: "'IBM Plex Mono', monospace" }}>{bien.numero_serie || '—'}</dd></div>
            <div><dt style={dt}>État</dt><dd style={dd}>{bien.etat}</dd></div>
            <div><dt style={dt}>Fournisseur</dt><dd style={dd}>{bien.fournisseur?.nom || '—'}</dd></div>
            <div><dt style={dt}>Date d'acquisition</dt><dd style={dd}>{formatDate(bien.date_acquisition)}</dd></div>
            <div><dt style={dt}>Prix d'acquisition</dt><dd style={dd}>{bien.prix ? `${Number(bien.prix).toLocaleString('fr')} FCFA` : '—'}</dd></div>
            <div><dt style={dt}>Fin de garantie</dt><dd style={dd}>{formatDate(bien.fin_garantie)}</dd></div>
            <div><dt style={dt}>Prochaine maintenance</dt><dd style={dd}>{formatDate(bien.prochaine_maintenance)}</dd></div>
          </dl>
          {bien.observations && (
            <div style={{ flex: '1 1 100%' }}>
              <dt style={dt}>Observations</dt>
              <dd style={{ ...dd, marginTop: 4 }}>{bien.observations}</dd>
            </div>
          )}
        </Card>

        <Card style={{ flex: '1 1 260px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>Code QR</h2>
          <div style={{ width: 180, height: 180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #DDE1DC', borderRadius: 8 }}>
            {qrUrl ? <img src={qrUrl} alt="Code QR du bien" style={{ width: 160, height: 160 }} /> : <span style={{ color: '#5A676B', fontSize: 13 }}>Chargement…</span>}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#5A676B', fontFamily: "'IBM Plex Mono', monospace", wordBreak: 'break-all' }}>{bien.uuid_qr}</p>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: '#3D4A4E' }}>Attribué automatiquement à l'enregistrement, unique et immuable.</p>
        </Card>
      </div>

      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Historique</h2>
        {historique.length === 0 && <p style={{ color: '#5A676B', fontSize: 14, margin: 0 }}>Aucun mouvement enregistré.</p>}
        {historique.map((m) => (
          <div key={m.id} style={row}>
            <div>
              <div><Badge variant="info">{TYPE_LABEL[m.type] || m.type}</Badge></div>
              <div style={{ marginTop: 6 }}>{m.origine || '—'} &rarr; {m.destination || '—'}</div>
              {m.motif && <div style={{ fontSize: 13, color: '#5A676B', marginTop: 2 }}>{m.motif}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, color: '#5A676B', flexShrink: 0 }}>
              <div>{formatDateTime(m.date)}</div>
              <div>{m.auteur?.name || '—'}</div>
            </div>
          </div>
        ))}
      </Card>
    </Layout>
  )
}
