import { useEffect, useState, useCallback } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import { getUsers, createUser, updateUser, deleteUser, getServices } from '../../api/referentiels'

const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const tdS = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }

const ROLES = [
  { value: 'admin',         label: 'Administrateur' },
  { value: 'gestionnaire',  label: 'Gestionnaire' },
  { value: 'responsable',   label: 'Responsable de service' },
  { value: 'agent',         label: "Agent d'inventaire" },
]
const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

const EMPTY_FORM = { name: '', email: '', password: '', role: 'responsable', service_id: '', actif: true }

export default function Utilisateurs() {
  const [users, setUsers]       = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [roleF, setRoleF]       = useState('')

  // Modal
  const [modal, setModal]   = useState(null)  // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null) // user object
  const [form, setForm]     = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  // Confirmation suppression
  const [delTarget, setDelTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getUsers()
      .then((r) => setUsers(r.data.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    getServices().then((r) => setServices(r.data.data ?? [])).catch(() => {})
  }, [load])

  const filtered = users.filter((u) => {
    if (q && !u.name.toLowerCase().includes(q.toLowerCase()) && !u.email.includes(q)) return false
    if (roleF && !(u.roles || []).includes(roleF)) return false
    return true
  })

  const kpis = [
    { label: 'Utilisateurs actifs',      value: users.filter((u) => u.actif).length },
    { label: 'Gestionnaires',            value: users.filter((u) => (u.roles || []).includes('gestionnaire')).length },
    { label: 'Responsables de service',  value: users.filter((u) => (u.roles || []).includes('responsable')).length },
    { label: "Agents d'inventaire",      value: users.filter((u) => (u.roles || []).includes('agent')).length },
  ]

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErr('')
    setModal('create')
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({
      name:       u.name,
      email:      u.email,
      password:   '',
      role:       (u.roles || [])[0] ?? 'responsable',
      service_id: u.service_id ?? '',
      actif:      u.actif,
    })
    setErr('')
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditing(null); setErr('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      const payload = {
        name:       form.name,
        email:      form.email,
        role:       form.role,
        service_id: form.service_id || null,
        actif:      form.actif,
      }
      if (form.password) payload.password = form.password
      if (modal === 'create') {
        if (!form.password) { setErr('Le mot de passe est obligatoire.'); setSaving(false); return }
        payload.password = form.password
        await createUser(payload)
      } else {
        await updateUser(editing.id, payload)
      }
      closeModal()
      load()
    } catch (ex) {
      const errors = ex.response?.data?.errors
      if (errors) {
        setErr(Object.values(errors).flat().join(' '))
      } else {
        setErr(ex.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
      }
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!delTarget) return
    try {
      await deleteUser(delTarget.id)
      setDelTarget(null)
      load()
    } catch (ex) {
      alert(ex.response?.data?.message ?? 'Impossible de supprimer cet utilisateur.')
    }
  }

  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Layout>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Comptes et rôles</h1>
          <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Gestion des utilisateurs, de leurs rôles et de leur service</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nouveau compte</button>
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
        {/* Filtres */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <input type="search" placeholder="Nom ou e-mail" value={q} onChange={(e) => setQ(e.target.value)}
            style={{ flex: '1 1 240px', minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }} />
          <select value={roleF} onChange={(e) => setRoleF(e.target.value)}
            style={{ minHeight: 40, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 12px', fontFamily: 'inherit', fontSize: 14 }}>
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Utilisateur', 'Rôle', 'Service', 'Statut', ''].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} style={{ ...tdS, textAlign: 'center', color: '#5A676B' }}>Aucun utilisateur.</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={tdS}>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: '#5A676B' }}>{u.email}</div>
                  </td>
                  <td style={tdS}>
                    {(u.roles || []).map((r) => (
                      <Badge key={r} variant="info">{ROLE_MAP[r] || r}</Badge>
                    ))}
                  </td>
                  <td style={tdS}>{services.find((s) => s.id === u.service_id)?.nom ?? <span style={{ color: '#C9CFC9' }}>—</span>}</td>
                  <td style={tdS}><Badge variant={u.actif ? 'good' : 'mute'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge></td>
                  <td style={{ ...tdS, whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(u)} style={btnLink}>Modifier</button>
                    <button onClick={() => setDelTarget(u)} style={{ ...btnLink, color: '#A23B2A', marginLeft: 4 }}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal création / modification */}
      {modal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>
              {modal === 'create' ? 'Nouveau compte' : 'Modifier le compte'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={lbl}>
                Nom complet *
                <input required type="text" value={form.name} onChange={f('name')} style={inp} placeholder="Ex. : Konan Yao" />
              </label>
              <label style={lbl}>
                Adresse e-mail *
                <input required type="email" value={form.email} onChange={f('email')} style={inp} placeholder="Ex. : konan.yao@uiya.ci" />
              </label>
              <label style={lbl}>
                Mot de passe {modal === 'edit' && <span style={{ fontWeight: 400, color: '#5A676B' }}>(laisser vide pour ne pas changer)</span>}
                <input type="password" value={form.password} onChange={f('password')} style={inp}
                  placeholder={modal === 'create' ? 'Minimum 8 caractères' : 'Nouveau mot de passe (optionnel)'}
                  required={modal === 'create'} minLength={8} />
              </label>
              <label style={lbl}>
                Rôle *
                <select required value={form.role} onChange={f('role')} style={inp}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
              <label style={lbl}>
                Service
                <select value={form.service_id} onChange={f('service_id')} style={inp}>
                  <option value="">— Aucun service —</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <input type="checkbox" checked={form.actif} onChange={f('actif')} />
                Compte actif
              </label>
              {err && <p style={{ margin: 0, fontSize: 13, color: '#A23B2A', background: '#FDF3F1', padding: '10px 12px', borderRadius: 8 }}>{err}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={{ ...btnGhost, minHeight: 42 }}>Annuler</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, minHeight: 42 }}>
                  {saving ? 'Enregistrement…' : modal === 'create' ? 'Créer le compte' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {delTarget && (
        <div style={overlay}>
          <div style={{ ...modalBox, maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>Supprimer le compte</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.6, color: '#3D4A4E' }}>
              Supprimer définitivement <strong>{delTarget.name}</strong> ({delTarget.email}) ?
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelTarget(null)} style={{ ...btnGhost, minHeight: 42 }}>Annuler</button>
              <button onClick={handleDelete} style={{ ...btnPrimary, minHeight: 42, background: '#A23B2A', borderColor: '#A23B2A' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnGhost   = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
const btnLink    = { border: 0, background: 'none', fontFamily: 'inherit', fontSize: 14, color: '#0E5A6B', cursor: 'pointer', padding: '6px 8px', minHeight: 36 }
const overlay    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const modalBox   = { background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }
const lbl        = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500, color: '#3D4A4E' }
const inp        = { border: '1px solid #C9CFC9', borderRadius: 8, padding: '9px 12px', fontFamily: 'inherit', fontSize: 14, color: '#17262B', width: '100%', boxSizing: 'border-box' }
