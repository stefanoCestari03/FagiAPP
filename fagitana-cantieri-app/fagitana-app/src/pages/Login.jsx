import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError('Email o password non corretti')
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">FAGITANA <span>//</span> CANTIERI</div>
        <div className="login-subtitle">Gestione quotidiana dei cantieri edili</div>

        <form onSubmit={handleSubmit}>
          <label className="login-label">Email</label>
          <input
            className="login-input"
            type="email"
            placeholder="nome@fagitana.it"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label className="login-label">Password</label>
          <input
            className="login-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Accesso...' : 'ACCEDI →'}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
          Per ricevere le credenziali di accesso<br />contatta il responsabile Fagitana
        </div>
      </div>
    </div>
  )
}
