import { useRegisterSW } from 'virtual:pwa-register/react'
import { CHANGELOG } from '../changelog'

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Controlla periodicamente se c'è una nuova versione pubblicata,
      // utile perché l'app resta spesso aperta a lungo come shortcut sul desktop
      if (!registration) return
      setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 9999,
        maxWidth: 420, margin: '0 auto',
        background: 'var(--dark)', color: '#fff',
        borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Nuova versione disponibile</div>
        {CHANGELOG.length > 0 ? (
          <ul style={{ fontSize: 12, color: '#aaa', marginTop: 4, paddingLeft: 16 }}>
            {CHANGELOG.map((riga, i) => <li key={i}>{riga}</li>)}
          </ul>
        ) : (
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Ci sono aggiornamenti all'app</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setNeedRefresh(false)}
          style={{ background: 'none', border: '1px solid #555', color: '#ccc', borderRadius: 8, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
        >
          Più tardi
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          style={{ background: 'var(--green)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Aggiorna ora
        </button>
      </div>
    </div>
  )
}
