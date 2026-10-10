import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/Card'
import { createBien } from '../../api/biens'
import { getCategories, getFournisseurs } from '../../api/referentiels'

const field = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }
const inp = { width: '100%', boxSizing: 'border-box', minHeight: 42, border: '1px solid #C9CFC9', borderRadius: 8, padding: '8px 12px', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: '#17262B' }

export default function NouveauBien() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    designation: '', categorie: '', marque: '', modele: '',
    numero_serie: '', etat: 'Neuf', fournisseur: '', date_acquisition: '',
    prix: '', duree_garantie_mois: '', observations: '', photo: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data ?? [])).catch(() => {})
    getFournisseurs().then((r) => setFournisseurs(r.data.data ?? [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const finGarantie = () => {
    if (!form.date_acquisition || !form.duree_garantie_mois) return ''
    const d = new Date(form.date_acquisition)
    d.setMonth(d.getMonth() + parseInt(form.duree_garantie_mois))
    return d.toLocaleDateString('fr-FR')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== '') fd.append(k, v) })
      const res = await createBien(fd)
      navigate(`/biens/${res.data.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div>
        <div style={{ fontSize: 13, color: '#5A676B' }}><Link to="/biens" style={{ color: '#0E5A6B', textDecoration: 'none' }}>Biens</Link> / Nouveau bien</div>
        <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 600 }}>Enregistrer un bien</h1>
        <p style={{ margin: '4px 0 0', color: '#5A676B', fontSize: 14 }}>Les champs marqués <span style={{ color: '#A23B2A' }}>*</span> sont obligatoires.</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <form onSubmit={handleSubmit} style={{ flex: '999 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identification */}
          <Card>
            <h2 style={ct}>Identification</h2>
            <div style={fg}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={field} htmlFor="des">Désignation <span style={{ color: '#A23B2A' }}>*</span></label>
                <input id="des" style={inp} value={form.designation} onChange={(e) => set('designation', e.target.value)} required />
              </div>
              <div><label style={field} htmlFor="cat">Catégorie <span style={{ color: '#A23B2A' }}>*</span></label>
                <select id="cat" style={inp} value={form.categorie} onChange={(e) => set('categorie', e.target.value)} required>
                  <option value="">— Sélectionner —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div><label style={field} htmlFor="mar">Marque</label><input id="mar" style={inp} value={form.marque} onChange={(e) => set('marque', e.target.value)} /></div>
              <div><label style={field} htmlFor="mod">Modèle</label><input id="mod" style={inp} value={form.modele} onChange={(e) => set('modele', e.target.value)} /></div>
              <div><label style={field} htmlFor="ns">Numéro de série</label><input id="ns" style={{ ...inp, fontFamily: "'IBM Plex Mono', monospace" }} value={form.numero_serie} onChange={(e) => set('numero_serie', e.target.value)} /></div>
              <div><label style={field} htmlFor="etat">État <span style={{ color: '#A23B2A' }}>*</span></label>
                <select id="etat" style={inp} value={form.etat} onChange={(e) => set('etat', e.target.value)}>
                  {['Neuf', 'Bon', 'Moyen', 'Dégradé'].map((e) => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Acquisition */}
          <Card>
            <h2 style={ct}>Acquisition et garantie</h2>
            <div style={fg}>
              <div><label style={field} htmlFor="four">Fournisseur <span style={{ color: '#A23B2A' }}>*</span></label>
                <select id="four" style={inp} value={form.fournisseur} onChange={(e) => set('fournisseur', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {fournisseurs.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div><label style={field} htmlFor="da">Date d'acquisition <span style={{ color: '#A23B2A' }}>*</span></label><input id="da" type="date" style={inp} value={form.date_acquisition} onChange={(e) => set('date_acquisition', e.target.value)} required /></div>
              <div><label style={field} htmlFor="prix">Prix d'acquisition (FCFA)</label><input id="prix" style={inp} value={form.prix} onChange={(e) => set('prix', e.target.value)} /></div>
              <div>
                <label style={field} htmlFor="dg">Durée de garantie (mois)</label>
                <input id="dg" style={inp} value={form.duree_garantie_mois} onChange={(e) => set('duree_garantie_mois', e.target.value)} />
                <div style={{ fontSize: 12, color: '#5A676B', marginTop: 4 }}>Reprise de la catégorie, modifiable</div>
              </div>
              <div>
                <label style={field}>Fin de garantie</label>
                <input style={{ ...inp, background: '#F1F3F0', color: '#3D4A4E' }} readOnly value={finGarantie()} />
                <div style={{ fontSize: 12, color: '#5A676B', marginTop: 4 }}>Calculée automatiquement</div>
              </div>
            </div>
          </Card>

          {/* Photo */}
          <Card>
            <h2 style={ct}>Photo et observations</h2>
            <div style={fg}>
              <label htmlFor="photo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 150, border: '1.5px dashed #B9C2BC', borderRadius: 10, background: '#F8FAF8', color: '#3D4A4E', fontSize: 14, cursor: 'pointer', textAlign: 'center', padding: 16 }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#0E5A6B" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3.5" /><path d="M8 5l1.5-2h5L16 5" /></svg>
                <span><strong>Ajouter une photo</strong><br />JPEG ou PNG, 2 Mo max</span>
                <input id="photo" type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={(e) => set('photo', e.target.files[0])} />
              </label>
              <div>
                <label style={field} htmlFor="obs">Observations</label>
                <textarea id="obs" rows={5} style={{ ...inp, resize: 'vertical' }} placeholder="Accessoires fournis, remarques…" value={form.observations} onChange={(e) => set('observations', e.target.value)} />
              </div>
            </div>
          </Card>

          {error && <p style={{ color: '#A23B2A', background: '#F8E4DF', borderRadius: 8, padding: '10px 14px', margin: 0, fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Link to="/biens" style={btnGhost}>Annuler</Link>
            <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Enregistrement…' : 'Enregistrer le bien'}</button>
          </div>
        </form>

        {/* Aside */}
        <aside style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: '#E3EFF1', borderColor: '#BBD6DC' }}>
            <h2 style={{ ...ct, marginBottom: 10 }}>Attribué automatiquement</h2>
            <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.55 }}>Dès l'enregistrement, le système attribue :</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 12, color: '#5A676B' }}>Numéro d'inventaire</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, marginTop: 2 }}>UIYA-INF-2026-····</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, border: '1.5px dashed #0E5A6B', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0E5A6B" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v7M14 20h3" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#5A676B' }}>Code QR unique</div>
                  <div style={{ marginTop: 2 }}>Généré à l'enregistrement</div>
                </div>
              </div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 13, color: '#3D4A4E' }}>L'étiquette sera prête à imprimer sur la fiche du bien.</p>
          </Card>
          <Card>
            <h2 style={{ ...ct, marginBottom: 10 }}>Affectation</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#5A676B', lineHeight: 1.55 }}>Le bien est créé au statut <strong style={{ color: '#17262B' }}>Disponible</strong>. Vous pourrez l'affecter à un service depuis sa fiche.</p>
          </Card>
        </aside>
      </div>
    </Layout>
  )
}

const ct = { fontSize: 16, fontWeight: 600, margin: '0 0 18px' }
const fg = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 20px' }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '0 20px', borderRadius: 8, border: '1px solid #0E5A6B', background: '#0E5A6B', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }
const btnGhost = { ...btnPrimary, background: '#fff', color: '#0E5A6B' }
