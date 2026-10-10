import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#5A676B', fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Chargement…
      </div>
    )
  }

  if (!user) return <Navigate to="/connexion" replace />

  if (roles && !roles.some((r) => user.roles?.includes(r) || user.role === r)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
