import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getBien, getBienByUuid, getBienPhoto, getBienQr, getEtiquette } from '../../api/biens'

const STATUT_VARIANT = {
  'Disponible': 'ok', 'Affecté': 'info', 'En prêt': 'loan',
  'En maintenance': 'warn', 'Perdu': 'bad', 'Réformé': 'mute',
}

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'

export default function FicheBien() {
  const { id, uuid } = useParams()
  const [bien, setBien] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    const requete = uuid ? getBienByUuid(uuid) : getBien(id)
    requete
      .then((r) => setBien(r.data.data))
      .catch(() => setError("Ce bien n'existe pas ou n'est plus accessible."))
      .finally(() => setLoading(false))
  }, [id, uuid])

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
          <button onClick={telechargerEtiquette} style={btnGhost}>Télécharger l'étiquette</button>
        </div>
      </div>

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
    </Layout>
  )
}

const dt = { fontSize: 12, color: '#5A676B', marginBottom: 3 }
const dd = { margin: 0, fontSize: 14 }
const btnGhost = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#fff', color: '#0E5A6B', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
