import { useAuth } from '../context/AuthContext'

export default function SubscriptionExpired() {
  const { signOut } = useAuth()

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-logo">FAGITANA <span>//</span> CANTIERI</div>
        <div style={{ fontSize: 40, margin: '20px 0 10px' }}>🔒</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Abbonamento scaduto
        </div>
        <div style={{ fontSize: 14, color: '#999', lineHeight: 1.6, marginBottom: 28 }}>
          Contattare l'amministratore per continuare
        </div>
        <button className="login-btn" onClick={signOut}>ESCI</button>
      </div>
    </div>
  )
}
