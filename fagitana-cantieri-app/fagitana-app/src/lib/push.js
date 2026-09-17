import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function pushSupportato() {
  return 'serviceWorker' in navigator && 'PushManager' in window && Boolean(VAPID_PUBLIC_KEY)
}

// Converte la chiave pubblica VAPID (base64url) nel formato Uint8Array
// richiesto da PushManager.subscribe().
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

// Si iscrive (se non già iscritto) e salva/aggiorna la riga su Supabase.
// Richiede che il permesso sia già stato concesso.
async function salvaSottoscrizione(userId) {
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  }, { onConflict: 'endpoint' })
  if (error) throw error
}

// Chiede il permesso e, se concesso, iscrive questo dispositivo alle notifiche
// push salvando l'iscrizione su Supabase legata all'utente loggato.
export async function attivaNotifiche(userId) {
  if (!pushSupportato()) throw new Error('Notifiche push non supportate su questo dispositivo/browser')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { granted: false }

  await salvaSottoscrizione(userId)
  return { granted: true }
}

// Da chiamare silenziosamente all'avvio per chi ha già concesso il permesso:
// ripete il salvataggio su Supabase nel caso fosse fallito la prima volta
// (es. tabella non ancora creata) senza dover ripassare dal popup di sistema.
export async function sincronizzaSottoscrizioneEsistente(userId) {
  if (!pushSupportato() || Notification.permission !== 'granted') return
  try {
    await salvaSottoscrizione(userId)
  } catch (e) {
    console.warn('Sincronizzazione notifiche push fallita:', e)
  }
}
