// Mock Supabase client — nessun DB richiesto, dati in localStorage

const AUTH_KEY = 'fagitana_auth'
const DB_KEY   = 'fagitana_db'
const MOCK_USER = { id: 'mock-user-id', email: 'admin@fagitana.it' }

// ─── Dati di seed ──────────────────────────────────────────────────────────

const SEED = {
  operai: [
    { id: 'op1', nome: 'Alessandro', cognome: 'Tomasi',      attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op2', nome: 'Damiano',    cognome: 'Giovannini',  attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op3', nome: 'Damiano',    cognome: 'Gottardi',    attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op4', nome: 'Marco',      cognome: 'Gottardi',    attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op5', nome: 'Emanuele',   cognome: 'Paoli',       attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op6', nome: 'Cristian',   cognome: 'Casagranda',  attivo: true, created_at: '2024-01-01T00:00:00Z' },
    { id: 'op7', nome: 'Fabrizio',   cognome: 'Leonardelli', attivo: true, created_at: '2024-01-01T00:00:00Z' },
  ],
  cantieri: [
    { id: 'cant1', nome: 'Villa Rossi',      indirizzo: 'Via Roma 14',   comune: 'Baselga di Pinè',   fase: 'Muratura',   stato: 'attivo',     note: '',                   created_at: '2024-01-15T00:00:00Z' },
    { id: 'cant2', nome: 'Condominio Verde', indirizzo: 'Via Trento 8',  comune: 'Pergine Valsugana', fase: 'Rifinitura', stato: 'attivo',     note: '',                   created_at: '2024-02-01T00:00:00Z' },
    { id: 'cant3', nome: 'Casa Bianchi',     indirizzo: 'Via Mazzini 3', comune: 'Levico Terme',      fase: 'Fondamenta', stato: 'completato', note: 'Lavori terminati',   created_at: '2023-10-01T00:00:00Z' },
  ],
  giornate: [
    { id: 'g1', cantiere_id: 'cant1', data: '2025-05-08', meteo: '☀️ Sole',     ora_inizio: '07:00', ora_fine: '17:00', ora_pausa_inizio: '12:00', ora_pausa_fine: '13:00', fase: 'Muratura',   avanzamento: 35, note_attivita: 'Posa mattoni al secondo piano', note_problemi: '',                      note_prossimi: 'Continuare terzo piano', created_by: 'mock-user-id', created_at: '2025-05-08T17:30:00Z' },
    { id: 'g2', cantiere_id: 'cant2', data: '2025-05-09', meteo: '⛅ Nuvoloso', ora_inizio: '07:30', ora_fine: '16:30', ora_pausa_inizio: '12:00', ora_pausa_fine: '13:00', fase: 'Rifinitura', avanzamento: 70, note_attivita: 'Intonaco interno completato',    note_problemi: 'Problema con la pompa', note_prossimi: 'Verniciatura',           created_by: 'mock-user-id', created_at: '2025-05-09T17:00:00Z' },
    { id: 'g3', cantiere_id: 'cant1', data: '2025-05-12', meteo: '☀️ Sole',     ora_inizio: '07:00', ora_fine: '17:00', ora_pausa_inizio: '12:00', ora_pausa_fine: '13:00', fase: 'Muratura',   avanzamento: 40, note_attivita: 'Terzo piano avviato',             note_problemi: '',                      note_prossimi: '',                       created_by: 'mock-user-id', created_at: '2025-05-12T17:00:00Z' },
  ],
  presenze: [
    { id: 'pr1',  giornata_id: 'g1', operaio_id: 'op1', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr2',  giornata_id: 'g1', operaio_id: 'op2', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr3',  giornata_id: 'g1', operaio_id: 'op3', stato: 'assente',  ora_entrata: null,    ora_uscita: null,    note: '' },
    { id: 'pr4',  giornata_id: 'g1', operaio_id: 'op4', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr5',  giornata_id: 'g1', operaio_id: 'op5', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr6',  giornata_id: 'g1', operaio_id: 'op6', stato: 'parziale', ora_entrata: '07:00', ora_uscita: '12:00', note: '' },
    { id: 'pr7',  giornata_id: 'g1', operaio_id: 'op7', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr8',  giornata_id: 'g2', operaio_id: 'op1', stato: 'presente', ora_entrata: '07:30', ora_uscita: '16:30', note: '' },
    { id: 'pr9',  giornata_id: 'g2', operaio_id: 'op2', stato: 'presente', ora_entrata: '07:30', ora_uscita: '16:30', note: '' },
    { id: 'pr10', giornata_id: 'g2', operaio_id: 'op4', stato: 'presente', ora_entrata: '07:30', ora_uscita: '16:30', note: '' },
    { id: 'pr11', giornata_id: 'g3', operaio_id: 'op1', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr12', giornata_id: 'g3', operaio_id: 'op2', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr13', giornata_id: 'g3', operaio_id: 'op3', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr14', giornata_id: 'g3', operaio_id: 'op4', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr15', giornata_id: 'g3', operaio_id: 'op5', stato: 'assente',  ora_entrata: null,    ora_uscita: null,    note: '' },
    { id: 'pr16', giornata_id: 'g3', operaio_id: 'op6', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
    { id: 'pr17', giornata_id: 'g3', operaio_id: 'op7', stato: 'presente', ora_entrata: '07:00', ora_uscita: '17:00', note: '' },
  ],
  materiali: [
    { id: 'mat1', giornata_id: 'g1', nome: 'Mattoni',  quantita: '500 pz'    },
    { id: 'mat2', giornata_id: 'g1', nome: 'Cemento',  quantita: '20 sacchi' },
    { id: 'mat3', giornata_id: 'g2', nome: 'Intonaco', quantita: '15 sacchi' },
    { id: 'mat4', giornata_id: 'g3', nome: 'Mattoni',  quantita: '300 pz'    },
  ],
  mezzi: [
    { id: 'mez1', giornata_id: 'g1', nome: 'Betoniera',      utilizzo: 'Tutto il giorno' },
    { id: 'mez2', giornata_id: 'g2', nome: 'Pompa intonaco', utilizzo: 'Mattino'         },
    { id: 'mez3', giornata_id: 'g3', nome: 'Gru',            utilizzo: 'Pomeriggio'      },
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function readDb() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) } catch { return null }
}

function getDb() {
  const existing = readDb()
  if (existing) return existing
  const fresh = JSON.parse(JSON.stringify(SEED))
  localStorage.setItem(DB_KEY, JSON.stringify(fresh))
  return fresh
}

function saveDb(store) {
  localStorage.setItem(DB_KEY, JSON.stringify(store))
}

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ─── Join resolver ─────────────────────────────────────────────────────────

function resolveJoins(table, record, selectStr, store) {
  if (table !== 'giornate') return record
  const r = { ...record }
  if (selectStr.includes('cantieri'))  r.cantieri  = store.cantieri.find(c => c.id === record.cantiere_id) ?? null
  if (selectStr.includes('presenze'))  r.presenze  = store.presenze.filter(p => p.giornata_id === record.id).map(p => ({
    ...p,
    ...(selectStr.includes('operai') ? { operai: store.operai.find(o => o.id === p.operaio_id) ?? null } : {}),
  }))
  if (selectStr.includes('materiali')) r.materiali = store.materiali.filter(m => m.giornata_id === record.id)
  if (selectStr.includes('mezzi'))     r.mezzi     = store.mezzi.filter(m => m.giornata_id === record.id)
  return r
}

// ─── Query builder ─────────────────────────────────────────────────────────

class Q {
  constructor(table) {
    this._table      = table
    this._filters    = []
    this._order      = null
    this._orderAsc   = true
    this._limitN     = null
    this._selectStr  = '*'
    this._countMode  = false
    this._headMode   = false
    this._singleMode = false
    this._insert     = null
    this._update     = null
    this._delete     = false
  }

  select(fields = '*', opts = {}) {
    this._selectStr = fields
    if (opts.count === 'exact') this._countMode = true
    if (opts.head)              this._headMode  = true
    return this
  }

  eq(f, v)  { this._filters.push({ op: 'eq',  f, v }); return this }
  gte(f, v) { this._filters.push({ op: 'gte', f, v }); return this }
  lte(f, v) { this._filters.push({ op: 'lte', f, v }); return this }

  order(field, opts = {}) { this._order = field; this._orderAsc = opts.ascending !== false; return this }
  limit(n) { this._limitN = n; return this }
  single()  { this._singleMode = true; return this._run() }

  insert(data) { this._insert = data; return this }
  update(data) { this._update = data; return this }
  delete()     { this._delete = true; return this }

  then(resolve, reject) { return Promise.resolve().then(() => this._run()).then(resolve, reject) }

  _match(row) {
    return this._filters.every(({ op, f, v }) =>
      op === 'eq'  ? row[f] === v :
      op === 'gte' ? row[f] >= v  :
      op === 'lte' ? row[f] <= v  : true
    )
  }

  _run() {
    const store = getDb()
    const t = this._table

    if (this._insert !== null) {
      const rows = (Array.isArray(this._insert) ? this._insert : [this._insert]).map(item => ({
        id: uid(), created_at: new Date().toISOString(), ...item,
      }))
      store[t] = [...(store[t] ?? []), ...rows]
      saveDb(store)
      return this._singleMode ? { data: rows[0], error: null } : { data: rows, error: null }
    }

    if (this._update !== null) {
      store[t] = (store[t] ?? []).map(row => this._match(row) ? { ...row, ...this._update } : row)
      saveDb(store)
      return { data: null, error: null }
    }

    if (this._delete) {
      store[t] = (store[t] ?? []).filter(row => !this._match(row))
      saveDb(store)
      return { data: null, error: null }
    }

    let rows = (store[t] ?? []).filter(row => this._match(row))
    rows = rows.map(r => resolveJoins(t, r, this._selectStr, store))

    if (this._order) {
      const [f, asc] = [this._order, this._orderAsc]
      rows.sort((a, b) => (a[f] < b[f] ? -1 : a[f] > b[f] ? 1 : 0) * (asc ? 1 : -1))
    }

    const count = rows.length
    if (this._limitN !== null) rows = rows.slice(0, this._limitN)
    if (this._countMode) return { count, data: this._headMode ? null : rows, error: null }
    if (this._singleMode) return { data: rows[0] ?? null, error: null }
    return { data: rows, count, error: null }
  }
}

// ─── Auth mock ─────────────────────────────────────────────────────────────

const _listeners = []

const auth = {
  getSession() {
    const ok = localStorage.getItem(AUTH_KEY) === '1'
    return Promise.resolve({ data: { session: ok ? { user: MOCK_USER } : null } })
  },
  onAuthStateChange(cb) {
    _listeners.push(cb)
    return { data: { subscription: { unsubscribe: () => {
      const i = _listeners.indexOf(cb); if (i > -1) _listeners.splice(i, 1)
    }}}}
  },
  signInWithPassword() {
    localStorage.setItem(AUTH_KEY, '1')
    _listeners.forEach(cb => cb('SIGNED_IN', { user: MOCK_USER }))
    return Promise.resolve({ error: null })
  },
  signOut() {
    localStorage.removeItem(AUTH_KEY)
    _listeners.forEach(cb => cb('SIGNED_OUT', null))
    return Promise.resolve()
  },
}

// ─── Export ────────────────────────────────────────────────────────────────

export const supabase = {
  from: (table) => new Q(table),
  auth,
}

/*
══════════════════════════════════════════════
  SCHEMA SQL – Da eseguire in Supabase quando si
  collega il DB reale. Rimpiazza questo file con:

  import { createClient } from '@supabase/supabase-js'
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  export const supabase = createClient(supabaseUrl, supabaseKey)
══════════════════════════════════════════════

CREATE TABLE operai (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, cognome TEXT NOT NULL,
  attivo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO operai (nome, cognome) VALUES
  ('Alessandro','Tomasi'),('Damiano','Giovannini'),('Damiano','Gottardi'),
  ('Marco','Gottardi'),('Emanuele','Paoli'),('Cristian','Casagranda'),('Fabrizio','Leonardelli');

CREATE TABLE cantieri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, indirizzo TEXT, comune TEXT, fase TEXT,
  stato TEXT DEFAULT 'attivo' CHECK (stato IN ('attivo','completato','sospeso')),
  note TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE giornate (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cantiere_id UUID REFERENCES cantieri(id) ON DELETE CASCADE,
  data DATE NOT NULL, meteo TEXT,
  ora_inizio TIME DEFAULT '07:00', ora_fine TIME DEFAULT '17:00',
  ora_pausa_inizio TIME DEFAULT '12:00', ora_pausa_fine TIME DEFAULT '13:00',
  fase TEXT, avanzamento INTEGER DEFAULT 0 CHECK (avanzamento BETWEEN 0 AND 100),
  note_attivita TEXT, note_problemi TEXT, note_prossimi TEXT,
  created_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cantiere_id, data)
);

CREATE TABLE presenze (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giornata_id UUID REFERENCES giornate(id) ON DELETE CASCADE,
  operaio_id UUID REFERENCES operai(id),
  stato TEXT DEFAULT 'presente' CHECK (stato IN ('presente','assente','parziale')),
  ora_entrata TIME, ora_uscita TIME, note TEXT
);

CREATE TABLE materiali (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giornata_id UUID REFERENCES giornate(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, quantita TEXT
);

CREATE TABLE mezzi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giornata_id UUID REFERENCES giornate(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, utilizzo TEXT
);

CREATE INDEX idx_giornate_data      ON giornate(data);
CREATE INDEX idx_giornate_cantiere  ON giornate(cantiere_id);
CREATE INDEX idx_presenze_giornata  ON presenze(giornata_id);

ALTER TABLE operai ENABLE ROW LEVEL SECURITY;
ALTER TABLE cantieri ENABLE ROW LEVEL SECURITY;
ALTER TABLE giornate ENABLE ROW LEVEL SECURITY;
ALTER TABLE presenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiali ENABLE ROW LEVEL SECURITY;
ALTER TABLE mezzi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read" ON operai    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all"  ON cantieri  FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all"  ON giornate  FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all"  ON presenze  FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all"  ON materiali FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "auth_all"  ON mezzi     FOR ALL    USING (auth.role() = 'authenticated');
*/
