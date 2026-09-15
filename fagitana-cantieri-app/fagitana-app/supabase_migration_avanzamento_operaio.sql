-- ============================================================
-- MIGRAZIONE: Ore per operaio sulle voci di computo
-- Da eseguire nel Supabase Dashboard → SQL Editor
-- ============================================================

-- Aggiunge il collegamento opzionale operaio/jolly a ogni riga di avanzamento,
-- cosi' le ore su una voce possono essere assegnate al singolo lavoratore
-- (oltre alle ore giornaliere lavorate registrate in "presenze").
-- Le righe con operaio_id e nome_jolly entrambi NULL restano "aggregate"
-- (comportamento precedente, usato quando non ci sono operai in presenza).

alter table avanzamento_giornaliero
  add column if not exists operaio_id uuid references operai(id) on delete set null,
  add column if not exists nome_jolly text;

create index if not exists idx_avanzamento_operaio on avanzamento_giornaliero(operaio_id);
