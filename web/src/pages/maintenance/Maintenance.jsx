import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getMaintenances } from '../../api/maintenance'

const TABS = ['En cours', 'Terminées', 'Toutes']

const vide = { padding: '16px 0', textAlign: 'center', color: '#5A676B', fontSize: 14 }

export default function Maintenance() {
  const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
  const td = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #EEF0EC', fontSize: 14 }

  const [preventives, setPreventives] = useState([])
  const [garanties, setGaranties] = useState([])
  const [interventions, setInterventions] = useState([])

  useEffect(() => {
    getMaintenances().then((r) => {
      const data = r.data.data ?? {}
      setPreventives(data.preventives ?? [])
      setGaranties(data.garanties ?? [])
      setInterventions(data.interventions ?? [])
    }).catch(() => {})
  }, [])

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Maintenance et garanties</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Interventions préventives et correctives, échéances de garantie</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={btnGhost}>Planifier une maintenance</button>
          <button style={btnPrimary}>+ Enregistrer une intervention</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <Card>
          <h2 style={ct}>Maintenances préventives à venir</h2>
          {preventives.length === 0 && <div style={vide}>Aucune maintenance préventive planifiée.</div>}
          {preventives.map((p, i) => (
            <div key={i} style={{ ...row, ...(i === preventives.length - 1 ? { borderBottom: 0 } : {}) }}>
              <div>
                <div>{p.label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#5A676B' }}>{p.num}</div>
              </div>
              <Badge variant={p.badge}>{p.info}</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <h2 style={ct}>Garanties qui expirent</h2>
          {garanties.length === 0 && <div style={vide}>Aucune garantie proche de l'expiration.</div>}
          {garanties.map((g, i) => (
            <div key={i} style={{ ...row, ...(i === garanties.length - 1 ? { borderBottom: 0 } : {}) }}>
              <div>
                <div>{g.label}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#5A676B' }}>{g.num}</div>
              </div>
              <Badge variant={g.badge}>{g.info}</Badge>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={ct}>Interventions</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TABS.map((t, i) => (
              <button key={i} style={{ minHeight: 38, padding: '0 14px', border: '1px solid #DDE1DC', borderRadius: 999, background: i === 0 ? '#17262B' : '#fff', borderColor: i === 0 ? '#17262B' : '#DDE1DC', fontFamily: 'inherit', fontSize: 14, color: i === 0 ? '#fff' : '#3D4A4E', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Bien', 'Type', 'Prestataire', 'Début', 'Coût (FCFA)', 'Garantie', 'Statut'].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {interventions.length === 0 && (
                <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#5A676B' }}>Aucune intervention enregistrée.</td></tr>
              )}
              {interventions.map((iv, i) => (
                <tr key={i}>
                  <td style={td}>
                    <div>{iv.bien}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: '#5A676B' }}>{iv.num}</div>
                  </td>
                  <td style={td}>{iv.type}</td>
                  <td style={td}>{iv.prestataire}</td>
                  <td style={td}>{iv.debut}</td>
                  <td style={td}>{iv.cout}</td>
                  <td style={td}><Badge variant={iv.garantie}>{iv.gLabel}</Badge></td>
                  <td style={td}><Badge variant={iv.statut}>{iv.sLabel}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}

const ct = { fontSize: 15, fontWeight: 600, margin: '0 0 14px' }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnGhost = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
