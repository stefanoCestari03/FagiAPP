import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { pushSupportato, attivaNotifiche, sincronizzaSottoscrizioneEsistente, notificheAttive } from '../lib/push'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function istruzioniImpostazioni() {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream
  const isAndroid = /Android/i.test(navigator.userAgent)
  if (isIOS) {
    return 'Vai su Impostazioni del telefono → Fagitana → Notifiche e attiva "Consenti notifiche".'
  }
  if (isAndroid) {
    return 'Tocca i tre puntini del browser → Informazioni sul sito (o l\'icona del lucchetto) → Autorizzazioni → Notifiche → Consenti.'
  }
  return 'Clicca l\'icona del lucchetto accanto all\'indirizzo del sito → Notifiche → Consenti, poi ricarica la pagina.'
}

export default function NotificationPrompt() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stato, setStato] = useState('default') // 'default' | 'denied' | 'ios-non-installata'

  // Nessun "non chiedermelo più" persistito: il banner ricompare a ogni
  // apertura dell'app finché non rileva che le notifiche sono davvero
  // attive sia lato browser (permesso concesso) sia lato app (iscrizione
  // salvata su Supabase) — su richiesta esplicita, per essere sicuri che
  // tutti gli utenti le attivino.
  useEffect(() => {
    if (!user || !pushSupportato()) return

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream
    if (isIOS && !isStandalone()) {
      setStato('ios-non-installata')
      setVisible(true)
      return
    }

    let annullato = false
    ;(async () => {
      if (Notification.permission === 'denied') {
        setStato('denied')
        setVisible(true)
        return
      }
      if (Notification.permission === 'granted') {
        // Prova a (ri)salvare l'iscrizione in silenzio, poi verifica se è
        // davvero confermata su Supabase prima di decidere se nascondere il banner.
        await sincronizzaSottoscrizioneEsistente(user.id)
        const attivo = await notificheAttive()
        if (annullato) return
        if (attivo) { setVisible(false); return }
      }
      setStato(Notification.permission === 'default' ? 'default' : 'non-confermato')
      setVisible(true)
    })()

    return () => { annullato = true }
  }, [user])

  const nascondiPerOra = () => setVisible(false)

  const attiva = async () => {
    setLoading(true)
    setError('')
    try {
      const { granted } = await attivaNotifiche(user.id)
      if (!granted) {
        setError('Permesso negato.')
        setStato('denied')
      } else {
        setVisible(false)
      }
    } catch (e) {
      console.error(e)
      setError('Non sono riuscito ad attivare le notifiche. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  const testo = {
    'default': 'Ogni giorno alle 18:00, se non hai ancora inserito la giornata, te lo ricordiamo con una notifica.',
    'non-confermato': 'Il permesso è concesso ma l\'attivazione non risulta ancora completata su questo dispositivo. Riprova.',
    'denied': `Le notifiche sono bloccate per questo sito. ${istruzioniImpostazioni()}`,
    'ios-non-installata': 'Su iPhone/iPad le notifiche funzionano solo dopo aver installato l\'app sulla schermata Home (Condividi → "Aggiungi alla schermata Home"). Poi torna qui per attivarle.',
  }[stato]

  const puoRiprovare = stato === 'default' || stato === 'non-confermato'

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
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Attiva le notifiche</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 3, lineHeight: 1.5 }}>{testo}</div>
        {error && <div style={{ fontSize: 12, color: '#ff8080', marginTop: 6 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={nascondiPerOra}
            style={{ background: 'none', border: '1px solid #555', color: '#ccc', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            {puoRiprovare ? 'Non ora' : 'Ho capito'}
          </button>
          {puoRiprovare && (
            <button
              onClick={attiva}
              disabled={loading}
              style={{ background: 'var(--green)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Attivazione...' : 'Attiva notifiche'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
