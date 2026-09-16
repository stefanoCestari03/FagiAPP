import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Chiamata da due cron Vercel (16:00 e 17:00 UTC, vedi vercel.json) per coprire
// sia l'ora solare che quella legale senza bisogno di un cron a livello di minuti
// (non disponibile sul piano Hobby). Questa funzione procede solo se, convertito
// nel fuso di Roma, sono davvero le 18:00 — l'altro trigger si ferma qui sotto.
function eOra18aRoma() {
  const ora = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', hour: '2-digit', hour12: false,
  }).format(new Date())
  return Number(ora) === 18
}

function dataOggiRoma() {
  // YYYY-MM-DD nel fuso di Roma
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
}

export default async function handler(req, res) {
  // Vercel invia questo header sulle chiamate cron quando CRON_SECRET è impostato
  // nelle env var del progetto — protegge l'endpoint da chiamate esterne.
  if (process.env.CRON_SECRET) {
    const auth = req.headers.authorization
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  if (!eOra18aRoma()) {
    return res.status(200).json({ skipped: 'not-18-rome' })
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const oggi = dataOggiRoma()

  // Evita invii doppi se entrambi i cron dovessero risultare "le 18" (non dovrebbe
  // succedere, ma è economico da garantire): la chiave è unica per giorno.
  const { error: lockError } = await supabaseAdmin
    .from('cron_notifiche_log')
    .insert({ chiave: `promemoria_giornata:${oggi}` })
  if (lockError) {
    return res.status(200).json({ skipped: 'already-run-today' })
  }

  const { count } = await supabaseAdmin
    .from('giornate')
    .select('id', { count: 'exact', head: true })
    .eq('data', oggi)
  if (count > 0) {
    return res.status(200).json({ skipped: 'already-logged', count })
  }

  const { data: subs, error: subsError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
  if (subsError) {
    return res.status(500).json({ error: subsError.message })
  }

  webpush.setVapidDetails(
    'mailto:info@fagitana.it',
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const payload = JSON.stringify({
    title: 'Fagitana Cantieri',
    body: 'Non hai ancora inserito la giornata di oggi. Tocca per registrarla.',
    url: '/registrazione',
  })

  const risultati = await Promise.allSettled((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    } catch (err) {
      // 404/410 = iscrizione non più valida (dispositivo disinstallato/permesso revocato)
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id)
      }
      throw err
    }
  }))

  const inviate = risultati.filter(r => r.status === 'fulfilled').length
  return res.status(200).json({ inviate, totale: subs?.length || 0 })
}
