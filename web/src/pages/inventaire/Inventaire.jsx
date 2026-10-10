import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getCampagnes } from '../../api/inventaire'

export default function Inventaire() {
  const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
  const td = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }

  const [campagne, setCampagne] = useState(null)

  useEffect(() => {
    getCampagnes({ statut: 'en_cours' }).then((r) => {
      const list = r.data.data ?? []
      setCampagne(list[0] ?? null)
    }).catch(() => setCampagne(null))
  }, [])

  if (!campagne) {
    return (
      <Layout>
        <div>
          <div style={{ fontSize: 13, color: '#5A676B' }}>Inventaires</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>Aucune campagne en cours</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Lancez une campagne d'inventaire pour commencer un contrôle physique des biens.</p>
        </div>
        <Card>
          <button style={btnPrimary}>+ Nouvelle campagne</button>
        </Card>
      </Layout>
    )
  }

  const ecarts = campagne.ecarts ?? []
  const agents = campagne.agents ?? []
  const stats = campagne.stats ?? []
  const pct = campagne.total ? Math.round((campagne.controles / campagne.total) * 100) : 0

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 13, color: '#5A676B' }}>Inventaires / Campagne en cours</div>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>{campagne.nom}</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>{campagne.periode}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={btnGhost}>Exporter le rapport</button>
          <button style={btnPrimary}>Clôturer la campagne</button>
        </div>
      </div>

      {/* Progression */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
          <span><strong>{campagne.controles}</strong> biens contrôlés sur {campagne.total}</span><span>{pct} %</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: '#ECEEEA', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#0E5A6B' }} />
        </div>
      </Card>

      {/* Stats */}
      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: s.bg, border: s.border, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Écarts */}
        <Card style={{ flex: '999 1 520px', minWidth: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Écarts et anomalies</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['N° inventaire', 'Désignation', 'Salle prévue', 'Constat', 'Agent', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ecarts.length === 0 && (
                  <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#5A676B' }}>Aucun écart constaté.</td></tr>
                )}
                {ecarts.map((e, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{e.num}</td>
                    <td style={td}>{e.label}</td>
                    <td style={td}>{e.salle}</td>
                    <td style={td}><Badge variant={e.variant}>{e.constat}</Badge></td>
                    <td style={td}>{e.agent}</td>
                    <td style={td}><button style={{ ...btnGhost, minHeight: 34, fontSize: 13 }}>{e.num === '—' ? 'Enregistrer' : 'Traiter'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: '#5A676B' }}>Un bien absent n'est pas déclaré perdu automatiquement : le gestionnaire décide après vérification.</p>
        </Card>

        {/* Agents */}
        <Card style={{ flex: '1 1 280px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Agents</h2>
          {agents.length === 0 && <div style={{ padding: '16px 0', textAlign: 'center', color: '#5A676B', fontSize: 14 }}>Aucun agent assigné.</div>}
          {agents.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < agents.length - 1 ? '1px solid #EEF0EC' : 'none', fontSize: 14 }}>
              <div>
                <div>{a.nom}</div>
                <div style={{ fontSize: 12, color: a.infoColor }}>{a.salles} · {a.info}</div>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#ECEEEA', overflow: 'hidden', width: 120 }}>
                <div style={{ width: `${a.pct}%`, height: '100%', background: '#0E5A6B' }} />
              </div>
            </div>
          ))}
          <button style={{ ...btnGhost, width: '100%', marginTop: 14, justifyContent: 'center' }}>+ Nouvelle campagne</button>
        </Card>
      </div>
    </Layout>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }
const btnGhost = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
