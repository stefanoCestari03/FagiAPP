import { useAuth } from '../context/AuthContext'

// Card informativa mostrata una sola volta per account (per la prima volta
// che usa una certa funzione), anche se l'account è registrato da tempo:
// la visibilità dipende solo dal flag salvato in user_metadata, non dall'età dell'account.
export default function TutorialCard({ flagKey, title, children }) {
  const { hasSeenTutorial, markTutorialSeen } = useAuth()

  if (hasSeenTutorial(flagKey)) return null

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--green)', background: 'var(--green-light)', marginBottom: 20 }}>
      <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green-dark)', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{children}</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flexShrink: 0 }}
          onClick={() => markTutorialSeen(flagKey)}
        >
          ✓ Ho capito
        </button>
      </div>
    </div>
  )
}
