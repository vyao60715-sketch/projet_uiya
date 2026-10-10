import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getDashboard } from '../../api/dashboard'

const MOCK = {
  total: 1248, affectes: 1012, enPret: 23, maintenance: 37,
  correctivesEnCours: 12, demandesAttente: 4, reformes: 51, perdus: 6, disponibles: 142,
  alertes: [
    { label: 'Fin de garantie – Imprimante HP LaserJet', num: 'UIYA-INF-2025-0088', variant: 'warn', info: 'dans 30 j' },
    { label: 'Maintenance préventive – Climatiseur Salle B12', num: 'UIYA-CLI-2024-0017', variant: 'info', info: 'dans 15 j' },
    { label: 'Retour de prêt – Vidéoprojecteur Epson', num: 'UIYA-AUD-2023-0005', variant: 'warn', info: 'demain' },
    { label: 'Prêt non rendu – Ordinateur portable Dell', num: 'UIYA-INF-2024-0142', variant: 'bad', info: '3 j de retard' },
  ],
  demandes: [
    { label: 'Panne – Ordinateur de bureau', service: 'Service Scolarité · il y a 2 h', variant: 'warn', statut: 'Soumise' },
    { label: 'Transfert – 6 chaises vers Salle A04', service: 'Service Comptabilité · hier', variant: 'warn', statut: 'Soumise' },
    { label: 'Perte – Vidéoprojecteur', service: 'Département Informatique · hier', variant: 'warn', statut: 'Soumise' },
  ],
  campagne: { nom: 'Inventaire annuel – Bâtiment A', controles: 256, total: 400, absents: 5, deplaces: 8, deteriores: 3 },
}

function BarStat({ label, value, max }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
        <span>{label}</span><span>{value}</span>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: '#ECEEEA', overflow: 'hidden' }}>
        <div style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', background: '#0E5A6B' }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(MOCK)

  useEffect(() => {
    getDashboard().then((r) => setData(r.data)).catch(() => {})
  }, [])

  const pct = Math.round((data.campagne.controles / data.campagne.total) * 100)

  return (
    <Layout pendingCount={data.demandesAttente}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Tableau de bord</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Vue d'ensemble du patrimoine mobilier</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/inventaire" style={ghostBtn}>Lancer un inventaire</Link>
          <Link to="/biens/nouveau" style={primaryBtn}>+ Nouveau bien</Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        <Card><div style={kl}>Total des biens</div><div style={kv}>{data.total.toLocaleString('fr')}</div><div style={kn}>dans 14 services</div></Card>
        <Card><div style={kl}>Affectés</div><div style={kv}>{data.affectes.toLocaleString('fr')}</div><div style={kn}>dont {data.enPret} en prêt</div></Card>
        <Card><div style={kl}>En maintenance</div><div style={kv}>{data.maintenance}</div><div style={kn}>{data.correctivesEnCours} correctives en cours</div></Card>
        <Card style={{ borderColor: '#E7C48C' }}>
          <div style={kl}>Demandes en attente</div>
          <div style={{ ...kv, color: '#8A510A' }}>{data.demandesAttente}</div>
          <div style={kn}>à traiter</div>
        </Card>
      </div>

      <div style={grid2}>
        {/* Alertes */}
        <Card>
          <h2 style={ct}>Alertes à venir</h2>
          {data.alertes.map((a, i) => (
            <div key={i} style={row}>
              <div>
                <div>{a.label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#5A676B' }}>{a.num}</div>
              </div>
              <Badge variant={a.variant}>{a.info}</Badge>
            </div>
          ))}
        </Card>

        {/* Répartition */}
        <Card>
          <h2 style={ct}>Répartition par statut</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BarStat label="Affectés" value={data.affectes} max={data.total} />
            <BarStat label="Disponibles" value={data.disponibles} max={data.total} />
            <BarStat label="En maintenance" value={data.maintenance} max={data.total} />
            <BarStat label="Réformés" value={data.reformes} max={data.total} />
            <BarStat label="Perdus" value={data.perdus} max={data.total} />
          </div>
        </Card>
      </div>

      <div style={grid2}>
        {/* Demandes */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={ct}>Demandes en attente</h2>
            <Link to="/demandes" style={{ fontSize: 14, color: '#0E5A6B' }}>Tout voir</Link>
          </div>
          {data.demandes.map((d, i) => (
            <div key={i} style={row}>
              <div>
                <div>{d.label}</div>
                <div style={{ fontSize: 13, color: '#5A676B' }}>{d.service}</div>
              </div>
              <Badge variant={d.variant}>{d.statut}</Badge>
            </div>
          ))}
        </Card>

        {/* Campagne */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 style={ct}>Campagne en cours</h2>
            <Link to="/inventaire" style={{ fontSize: 14, color: '#0E5A6B' }}>Ouvrir</Link>
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>{data.campagne.nom}</div>
          <div style={{ height: 14, borderRadius: 7, background: '#ECEEEA', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#0E5A6B' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5A676B', marginTop: 8 }}>
            <span>{data.campagne.controles} / {data.campagne.total} biens contrôlés</span>
            <span>{pct} %</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <Badge variant="bad">{data.campagne.absents} absents</Badge>
            <Badge variant="warn">{data.campagne.deplaces} déplacés</Badge>
            <Badge variant="mute">{data.campagne.deteriores} détériorés</Badge>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

const kl = { fontSize: 13, color: '#5A676B' }
const kv = { fontSize: 32, fontWeight: 600, marginTop: 6 }
const kn = { fontSize: 12, color: '#5A676B', marginTop: 4 }
const ct = { fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EEF0EC', fontSize: 14 }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }
const primaryBtn = { display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', borderRadius: 8, background: '#0E5A6B', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 }
const ghostBtn = { ...primaryBtn, background: '#fff', color: '#0E5A6B', border: '1px solid #0E5A6B' }
