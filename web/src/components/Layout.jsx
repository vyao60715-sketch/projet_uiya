import Sidebar from './Sidebar'

export default function Layout({ children, pendingCount }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '100vh', background: '#F4F5F2' }}>
      <Sidebar pendingCount={pendingCount} />
      <main style={{ flex: '999 1 560px', minWidth: 0, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}
