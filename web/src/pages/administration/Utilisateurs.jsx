import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getUsers } from '../../api/referentiels'

const TABS = ['Utilisateurs', 'Rôles et permissions']
const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const td = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }

const ROLE_LABEL = {
  admin: 'Administrateur',
  gestionnaire: 'Gestionnaire',
  responsable: 'Responsable',
  agent: "Agent d'inventaire",
}

export default function Utilisateurs() {
  const [tab, setTab] = useState(0)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsers()
      .then((r) => setUsers(r.data.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && !u.email.includes(q)) return false
    if (role && !(u.roles || []).includes(role)) return false
    return true
  })

  const kpis = [
    { label: 'Utilisateurs actifs', value: users.filter((u) => u.actif).length },
    { label: 'Gestionnaires', value: users.filter((u) => (u.roles || []).includes('gestionnaire')).length },
    { label: 'Responsables de service', value: users.filter((u) => (u.roles || []).includes('responsable')).length },
    { label: "Agents d'inventaire", value: users.filter((u) => (u.roles || []).includes('agent')).length },
  ]

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Comptes et rôles</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Gestion des utilisateurs, de leurs rôles et de leur service</p>
        </div>
        <button style={btnPrimary}>+ Nouveau compte</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
        {kpis.map((k) => (
          <Card key={k.label}>
            <div style={{ fontSize: 13, color: '#5A676B' }}>{k.label}</div>
            <div style={{ fontSize: 30, fontWeight: 600, marginTop: 6 }}>{k.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ paddingTop: 8 }}>
        {/* Onglets */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #DDE1DC', flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ minHeight: 42, padding: '0 14px', border: 0, background: 'none', fontFamily: 'inherit', fontSize: 14, color: tab === i ? '#0E5A6B' : '#5A676B', cursor: 'pointer', borderBottom: `2px solid ${tab === i ? '#0E5A6B' : 'transparent'}`, marginBottom: -1, fontWeight: tab === i ? 500 : 400 }}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <input type="search" placeholder="Nom ou e-mail" style={{ flex: '1 1 240px', minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }} value={q} onChange={(e) => setQ(e.target.value)} />
              <select style={{ minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Tous les rôles</option>
                {Object.entries(ROLE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Utilisateur', 'Rôle', 'Service', 'Statut', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: '#5A676B' }}>Aucun utilisateur.</td></tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td style={td}>
                        <div>{u.name}</div>
                        <div style={{ fontSize: 13, color: '#5A676B' }}>{u.email}</div>
                      </td>
                      <td style={td}>{(u.roles || []).map((r) => <Badge key={r} variant="info">{ROLE_LABEL[r] || r}</Badge>)}</td>
                      <td style={td}>{u.service_id ?? '—'}</td>
                      <td style={td}><Badge variant={u.actif ? 'ok' : 'mute'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge></td>
                      <td style={td}><button style={{ border: 0, background: 'none', fontFamily: 'inherit', fontSize: 14, color: '#0E5A6B', cursor: 'pointer', padding: '6px 8px', minHeight: 36 }}>Modifier</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 1 && (
          <div style={{ padding: '16px 0', color: '#5A676B', fontSize: 14 }}>
            Gestion des rôles et permissions — à venir.
          </div>
        )}
      </Card>
    </Layout>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
