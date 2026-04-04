'use client'

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>Something went wrong</div>
          <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>{error?.message}</div>
          <button
            onClick={reset}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
              background: '#127A66', color: 'white', border: 'none', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
