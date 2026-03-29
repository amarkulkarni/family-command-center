'use client'

export default function AuthError() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Authentication Error</h1>
      <p>Something went wrong during login.</p>
      <p>Check the browser console (F12) or network tab for details.</p>
      <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Go back home
      </a>
    </div>
  )
}
