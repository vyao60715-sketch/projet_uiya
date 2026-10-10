import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import {
  getCategories, createCategorie, deleteCategorie,
  getServices, createService, deleteService,
  getBatiments, createBatiment, deleteBatiment,
  getSalles, createSalle, deleteSalle,
  getFournisseurs, createFournisseur, deleteFournisseur,
} from '../../api/referentiels'

const inp = { minHeight: 38, border: '1px solid #C9CFC9', borderRadius: 8, padding: '0 10px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B', boxSizing: 'border-box', width: '100%' }
const th = { textAlign: 'left', fontWeight: 500, color: '#5A676B', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 12px', borderBottom: '1px solid #DDE1DC', whiteSpace: 'nowrap' }
const td = { padding: 12, borderBottom: '1px solid #EEF0EC', verticalAlign: 'middle', fontSize: 14 }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnDanger = { border: 0, background: 'none', fontFamily: 'inherit', fontSize: 13, color: '#A23B2A', cursor: 'pointer', padding: '4px 8px' }

function ReferentielSection({ title, fields, list, onLoad, onCreate, onDelete, renderExtraColumn }) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.default ?? ''])))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onCreate(form)
      setForm(Object.fromEntries(fields.map((f) => [f.key, f.default ?? ''])))
      onLoad()
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Erreur lors de la création.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet élément ?')) return
    try {
      await onDelete(id)
      onLoad()
    } catch (err) {
      alert(err.response?.data?.message || 'Suppression impossible.')
    }
  }

  return (
    <Card>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>{title}</h2>

      <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #EEF0EC' }}>
        {fields.map((f) => (
          <div key={f.key} style={{ flex: f.flex ?? '1 1 140px', minWidth: 110 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#5A676B', marginBottom: 4 }}>{f.label}</label>
            {f.type === 'select' ? (
              <select style={inp} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} required={f.required}>
                <option value="">— Choisir —</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                style={inp} type={f.type || 'text'} value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                required={f.required} min={f.type === 'number' ? 0 : undefined}
              />
            )}
          </div>
        ))}
        <button type="submit" disabled={saving} style={btnPrimary}>+ Ajouter</button>
      </form>

      {error && <p style={{ color: '#A23B2A', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {fields.map((f) => <th key={f.key} style={th}>{f.label}</th>)}
              {renderExtraColumn && <th style={th}>{renderExtraColumn.label}</th>}
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={fields.length + (renderExtraColumn ? 2 : 1)} style={{ ...td, textAlign: 'center', color: '#5A676B' }}>Aucun élément.</td></tr>
            )}
            {list.map((item) => (
              <tr key={item.id}>
                {fields.map((f) => <td key={f.key} style={td}>{f.display ? f.display(item) : item[f.key]}</td>)}
                {renderExtraColumn && <td style={td}>{renderExtraColumn.render(item)}</td>}
                <td style={td}><button onClick={() => remove(item.id)} style={btnDanger}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const TABS = ['Catégories', 'Services', 'Bâtiments', 'Salles', 'Fournisseurs']

export default function Referentiels() {
  const [tab, setTab] = useState(0)
  const [categories, setCategories] = useState([])
  const [services, setServices] = useState([])
  const [batiments, setBatiments] = useState([])
  const [salles, setSalles] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])

  const loadCategories = () => getCategories().then((r) => setCategories(r.data.data ?? [])).catch(() => {})
  const loadServices = () => getServices().then((r) => setServices(r.data.data ?? [])).catch(() => {})
  const loadBatiments = () => getBatiments().then((r) => setBatiments(r.data.data ?? [])).catch(() => {})
  const loadSalles = () => getSalles().then((r) => setSalles(r.data.data ?? [])).catch(() => {})
  const loadFournisseurs = () => getFournisseurs().then((r) => setFournisseurs(r.data.data ?? [])).catch(() => {})

  useEffect(() => {
    loadCategories(); loadServices(); loadBatiments(); loadSalles(); loadFournisseurs()
  }, [])

  return (
    <Layout>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Référentiels</h1>
        <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Catégories, services, bâtiments, salles et fournisseurs</p>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #DDE1DC', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ minHeight: 42, padding: '0 14px', border: 0, background: 'none', fontFamily: 'inherit', fontSize: 14, color: tab === i ? '#0E5A6B' : '#5A676B', cursor: 'pointer', borderBottom: `2px solid ${tab === i ? '#0E5A6B' : 'transparent'}`, marginBottom: -1, fontWeight: tab === i ? 500 : 400 }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <ReferentielSection
          title="Catégories"
          list={categories}
          onLoad={loadCategories}
          onCreate={(f) => createCategorie({ ...f, code: f.code.toUpperCase() })}
          onDelete={deleteCategorie}
          fields={[
            { key: 'nom', label: 'Nom', required: true, flex: '2 1 200px' },
            { key: 'code', label: 'Code (3 lettres)', required: true, flex: '1 1 100px' },
            { key: 'duree_garantie_mois', label: 'Garantie (mois)', type: 'number', required: true, default: 0 },
            { key: 'periodicite_maintenance_mois', label: 'Maintenance (mois)', type: 'number', required: true, default: 0 },
          ]}
        />
      )}

      {tab === 1 && (
        <ReferentielSection
          title="Services"
          list={services}
          onLoad={loadServices}
          onCreate={createService}
          onDelete={deleteService}
          fields={[
            { key: 'nom', label: 'Nom', required: true, flex: '2 1 200px' },
            { key: 'code', label: 'Code', required: true },
          ]}
        />
      )}

      {tab === 2 && (
        <ReferentielSection
          title="Bâtiments"
          list={batiments}
          onLoad={loadBatiments}
          onCreate={createBatiment}
          onDelete={deleteBatiment}
          fields={[
            { key: 'nom', label: 'Nom', required: true, flex: '2 1 200px' },
            { key: 'code', label: 'Code', required: true },
          ]}
        />
      )}

      {tab === 3 && (
        <ReferentielSection
          title="Salles"
          list={salles}
          onLoad={loadSalles}
          onCreate={createSalle}
          onDelete={deleteSalle}
          fields={[
            { key: 'nom', label: 'Nom', required: true, flex: '2 1 160px' },
            { key: 'code', label: 'Code', required: true },
            {
              key: 'batiment_id', label: 'Bâtiment', type: 'select', required: true,
              options: batiments.map((b) => ({ value: b.id, label: b.nom })),
              display: (item) => item.batiment?.nom ?? '—',
            },
          ]}
        />
      )}

      {tab === 4 && (
        <ReferentielSection
          title="Fournisseurs"
          list={fournisseurs}
          onLoad={loadFournisseurs}
          onCreate={createFournisseur}
          onDelete={deleteFournisseur}
          fields={[
            { key: 'nom', label: 'Nom', required: true, flex: '2 1 200px' },
            { key: 'contact', label: 'Contact', flex: '2 1 200px' },
            {
              key: 'type', label: 'Type', type: 'select', required: true, default: 'fournisseur',
              options: [{ value: 'fournisseur', label: 'Fournisseur' }, { value: 'prestataire', label: 'Prestataire' }],
            },
          ]}
        />
      )}
    </Layout>
  )
}
