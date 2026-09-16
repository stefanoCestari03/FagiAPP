import { useEffect, useState } from 'react'

const DISMISS_KEY = 'fagitana_install_prompt_dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isMobile = isIOS || isAndroid

  useEffect(() => {
    if (!isMobile || isStandalone() || localStorage.getItem(DISMISS_KEY)) return

    setVisible(true)

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', left: 16, right: 16, top: 'calc(16px + var(--safe-top, 0px))', zIndex: 9998,
        maxWidth: 420, margin: '0 auto',
        background: 'var(--dark)', color: '#fff',
        borderRadius: 12, padding: '14px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap',
      }}
    >
      <div style={{ fontSize: 22 }}>📱</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Usa Fagitana come app</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 3, lineHeight: 1.5 }}>
          {isIOS
            ? <>Tocca <strong>Condividi</strong> (icona in basso) e poi <strong>"Aggiungi alla schermata Home"</strong>: si aprirà a schermo intero come un'app.</>
            : 'Installala sulla schermata Home per un accesso più rapido e a schermo intero.'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: '1px solid #555', color: '#ccc', borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            Non ora
          </button>
          {!isIOS && deferredPrompt && (
            <button
              onClick={install}
              style={{ background: 'var(--green)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Installa
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
