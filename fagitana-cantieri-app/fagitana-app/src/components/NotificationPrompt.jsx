import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { pushSupportato, attivaNotifiche } from '../lib/push'

const DISMISS_KEY = 'fagitana_notifiche_prompt_dismissed'

export default function NotificationPrompt() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !pushSupportato()) return
    if (localStorage.getItem(DISMISS_KEY)) return
    if (Notification.permission !== 'default') return
    setVisible(true)
  }, [user])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const attiva = async () => {
    setLoading(true)
    setError('')
    try {
      const { granted } = await attivaNotifiche(user.id)
      if (!granted) setError('Permesso negato. Puoi attivarle più tardi dalle impostazioni del browser.')
      dismiss()
    } catch (e) {
      console.error(e)
      setError('Non sono riuscito ad attivare le notifiche. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', left: 16, right: 16, top: 'calc(16px + var(--safe-top, 0px))', zIndex: 9997,
        maxWidth: 420, margin: '0 auto',
        background: 'var(--dark)', color: '#fff',
        borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: 22 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Attiva le notifiche</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 3, lineHeight: 1.5 }}>
          Ogni giorno alle 18:00, se non hai ancora inserito la giornata, te lo ricordiamo con una notifica.
        </div>
        {error && <div style={{ fontSize: 12, color: '#ff8080', marginTop: 6 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: '1px solid #555', color: '#ccc', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            Non ora
          </button>
          <button
            onClick={attiva}
            disabled={loading}
            style={{ background: 'var(--green)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Attivazione...' : 'Attiva notifiche'}
          </button>
        </div>
      </div>
    </div>
  )
}
