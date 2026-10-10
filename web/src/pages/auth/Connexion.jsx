import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Connexion() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  const field = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }
  const input = {
    width: '100%', boxSizing: 'border-box', minHeight: 44,
    border: '1px solid #C9CFC9', borderRadius: 8, padding: '8px 12px',
    fontFamily: 'inherit', fontSize: 15, background: '#fff', color: '#17262B',
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', fontFamily: "'IBM Plex Sans', sans-serif", color: '#17262B', background: '#F4F5F2' }}>
      {/* Panneau gauche */}
      <section style={{
        flex: '1 1 420px', background: '#17262B', color: '#E8ECEA',
        padding: '56px 48px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', gap: 40, boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#0E5A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#fff' }}>U</div>
          <div style={{ fontWeight: 600, fontSize: 17 }}>UIYA · Patrimoine</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.15, fontWeight: 600, color: '#fff' }}>
            Chaque bien de l'université, suivi de son entrée à sa réforme.
          </h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#B8C3C0' }}>
            Enregistrement, affectation, mouvements, maintenance et inventaire par code QR.
          </p>
        </div>
        <div style={{ fontSize: 13, color: '#8E9C99' }}>Université Internationale de Yamoussoukro</div>
      </section>

      {/* Panneau droit – formulaire */}
      <section style={{ flex: '1 1 420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>Connexion</h2>
            <p style={{ margin: '6px 0 0', color: '#5A676B', fontSize: 14 }}>Accédez à votre espace selon votre rôle.</p>
          </div>

          <div>
            <label style={field} htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" style={input} placeholder="prenom.nom@uiya.ci" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label style={field} htmlFor="mdp">Mot de passe</label>
            <input id="mdp" type="password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Rester connecté
            </label>
            <Link to="/mot-de-passe-oublie" style={{ color: '#0E5A6B', textDecoration: 'none' }}>Mot de passe oublié ?</Link>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#A23B2A', background: '#F8E4DF', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 46, borderRadius: 8, background: loading ? '#6fa3b0' : '#0E5A6B',
              color: '#fff', border: 'none', fontFamily: 'inherit', fontWeight: 500,
              fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion en cours…' : 'Se connecter'}
          </button>

          <p style={{ margin: 0, fontSize: 13, color: '#5A676B', background: '#ECEEEA', borderRadius: 8, padding: '12px 14px' }}>
            Après 5 tentatives échouées, le compte est bloqué temporairement.
          </p>
        </form>
      </section>
    </div>
  )
}
