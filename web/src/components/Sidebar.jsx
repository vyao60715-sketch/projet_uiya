import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ClipboardList, Wrench,
  ClipboardCheck, BarChart2, Users, LogOut, Bell, Tags, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/biens', label: 'Biens', icon: Package },
  { to: '/demandes', label: 'Demandes', icon: ClipboardList, badge: true },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/inventaire', label: 'Inventaires', icon: ClipboardCheck },
  { to: '/rapports', label: 'Rapports', icon: BarChart2 },
]

const adminLinks = [
  { to: '/administration', label: 'Administration', icon: Users },
  { to: '/audit',          label: 'Journal d\'audit', icon: ShieldCheck },
]

const gestionLinks = [
  { to: '/referentiels', label: 'Référentiels', icon: Tags },
]

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/connexion')
  }

  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin'
  const isGestionnaire = user?.roles?.includes('gestionnaire') || user?.role === 'gestionnaire'
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <nav style={{
      flex: '1 1 220px', background: '#17262B', color: '#E8ECEA',
      padding: '24px 16px', display: 'flex', flexDirection: 'column',
      gap: '24px', boxSizing: 'border-box', minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15, padding: '0 8px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0E5A6B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>U</div>
        <div>UIYA · Patrimoine</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {links.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              minHeight: 42, padding: '0 12px', borderRadius: 8,
              color: isActive ? '#fff' : '#C9D2CF',
              background: isActive ? '#2A4148' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              textDecoration: 'none', fontSize: 14,
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={16} />
              {label}
            </span>
            {badge && pendingCount > 0 && (
              <span style={{ background: '#C47A1C', color: '#17262B', borderRadius: 999, fontSize: 12, fontWeight: 600, padding: '1px 8px' }}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}

        {(isAdmin || isGestionnaire) && gestionLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              minHeight: 42, padding: '0 12px', borderRadius: 8,
              color: isActive ? '#fff' : '#C9D2CF',
              background: isActive ? '#2A4148' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              textDecoration: 'none', fontSize: 14,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {isAdmin && adminLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              minHeight: 42, padding: '0 12px', borderRadius: 8,
              color: isActive ? '#fff' : '#C9D2CF',
              background: isActive ? '#2A4148' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              textDecoration: 'none', fontSize: 14,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 8px', borderTop: '1px solid #2A3B40', fontSize: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2A4148', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || '—'}</div>
          <div style={{ fontSize: 12, color: '#8E9C99' }}>{user?.role || user?.roles?.[0] || ''}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{ background: 'none', border: 'none', color: '#8E9C99', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
