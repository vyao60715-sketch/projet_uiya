export default function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #DDE1DC',
      borderRadius: 10, padding: 20, boxSizing: 'border-box',
      ...style,
    }}>
      {children}
    </div>
  )
}
