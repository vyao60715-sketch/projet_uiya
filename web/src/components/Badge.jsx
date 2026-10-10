const variants = {
  ok:   { background: '#E3F0E4', color: '#2F6B3A' },
  info: { background: '#E3EFF1', color: '#0E5A6B' },
  warn: { background: '#FBEFD9', color: '#8A510A' },
  bad:  { background: '#F8E4DF', color: '#A23B2A' },
  mute: { background: '#ECEEEA', color: '#4A5659' },
}

export default function Badge({ variant = 'mute', children }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      ...variants[variant],
    }}>
      {children}
    </span>
  )
}
