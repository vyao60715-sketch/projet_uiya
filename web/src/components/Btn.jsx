export default function Btn({ ghost, children, style, ...props }) {
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        minHeight: 40, padding: '0 16px', borderRadius: 8,
        border: '1px solid #0E5A6B',
        background: ghost ? '#fff' : '#0E5A6B',
        color: ghost ? '#0E5A6B' : '#fff',
        font: 'inherit', fontSize: 14, fontWeight: 500,
        cursor: 'pointer', textDecoration: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
