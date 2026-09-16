-- ============================================================
-- MIGRAZIONE: Notifiche push (promemoria giornaliero ore 18:00)
-- Da eseguire nel Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Iscrizioni push: una riga per ogni dispositivo/browser che ha
--    attivato le notifiche, collegata all'utente che ha effettuato l'accesso.
create table if not exists push_subscriptions (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth        text        not null,
  created_at  timestamptz default now()
);

create index if not exists idx_push_subscriptions_user on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

-- Ogni utente vede e gestisce solo le proprie iscrizioni push.
-- La funzione serverless che invia i promemoria usa la service role key
-- e non è quindi soggetta a queste policy (le bypassa per leggere tutte le righe).
create policy "utenti gestiscono le proprie iscrizioni push"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Log di esecuzione del cron, usato per evitare invii doppi:
--    prima di inviare i promemoria del giorno, la funzione prova a inserire
--    una riga con chiave "promemoria_giornata:<data>" — se la chiave esiste
--    già (vincolo di unicità), vuol dire che è già stato eseguito oggi.
create table if not exists cron_notifiche_log (
  chiave       text        primary key,
  eseguito_at  timestamptz default now()
);

alter table cron_notifiche_log enable row level security;
-- Nessuna policy: la tabella è scritta solo dalla funzione serverless
-- tramite la service role key, che bypassa comunque la RLS.
