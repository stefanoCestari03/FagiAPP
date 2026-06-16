-- ============================================================
-- MIGRAZIONE: Gestione Computo Metrico & Avanzamento
-- Da eseguire nel Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Voci del computo preventivo, collegate al cantiere
create table if not exists voci_computo (
  id               uuid        default gen_random_uuid() primary key,
  cantiere_id      uuid        references cantieri(id) on delete cascade not null,
  categoria        text        not null default 'GENERALE',
  descrizione      text        not null,
  unita_misura     text        not null default 'h',
  quantita_totale  numeric     not null default 0,
  ore_preventivo   numeric     not null default 0,  -- ore stimate per questa lavorazione
  prezzo_unitario  numeric,                          -- €/unità (facoltativo)
  created_at       timestamptz default now()
);

-- 2. Avanzamento giornaliero per voce (storia delle quantità eseguite)
create table if not exists avanzamento_giornaliero (
  id                  uuid        default gen_random_uuid() primary key,
  voce_id             uuid        references voci_computo(id) on delete cascade not null,
  giornata_id         uuid        references giornate(id) on delete cascade not null,
  cantiere_id         uuid        references cantieri(id) on delete cascade not null,
  quantita_eseguita   numeric     not null default 0,
  ore_spese           numeric     not null default 0,  -- ore dedicate a questa voce oggi
  note                text,
  created_at          timestamptz default now()
);

-- Indici per le query frequenti
create index if not exists idx_voci_computo_cantiere   on voci_computo(cantiere_id);
create index if not exists idx_avanzamento_voce        on avanzamento_giornaliero(voce_id);
create index if not exists idx_avanzamento_giornata    on avanzamento_giornaliero(giornata_id);
create index if not exists idx_avanzamento_cantiere    on avanzamento_giornaliero(cantiere_id);

-- RLS (Row Level Security) — solo utenti autenticati
alter table voci_computo          enable row level security;
alter table avanzamento_giornaliero enable row level security;

create policy "Accesso autenticati - voci_computo"
  on voci_computo for all
  using (auth.role() = 'authenticated');

create policy "Accesso autenticati - avanzamento_giornaliero"
  on avanzamento_giornaliero for all
  using (auth.role() = 'authenticated');
