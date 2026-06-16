import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const UM_OPTIONS = ['h', 'm²', 'm³', 'm', 'cad', 'kg', 't', 'a corpo']

const CATEGORIE_SUGGERITE = [
  'OPERE DI CANTIERIZZAZIONE',
  'SCAVI E DEMOLIZIONI',
  'SOTTOFONDI E MASSETTI',
  'GUAINE - IMPERMEABILIZZANTI',
  'ISOLAZIONE',
  'STRUTTURE IN CEMENTO',
  'SOLAI IN LATEROCEMENTO',
  'MURATURE E CONTROSOFFITTI',
  'TRAMEZZE',
  'COPERTURA',
  'LATTONERIE',
  'CAMINI - SFIATI - TUBATURE',
  'INTONACI E PITTURE',
  'PAVIMENTAZIONI E RIVESTIMENTI',
  'SICUREZZA',
]

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div className="toast">{msg}</div>
}

function timeToMin(t) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmt(n) {
  if (n === null || n === undefined) return '–'
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function fmtEur(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

const EMPTY_FORM = {
  categoria: '', descrizione: '', unita_misura: 'h',
  quantita_totale: '', ore_preventivo: '', prezzo_unitario: '',
}

export default function CantierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cantiere, setCantiere]         = useState(null)
  const [voci, setVoci]                 = useState([])
  const [avanzamenti, setAvanzamenti]   = useState({}) // { voce_id: { quantita_eseguita, ore_spese } }
  const [oreEffettive, setOreEffettive] = useState(0)
  const [tab, setTab]                   = useState('computo')
  const [loading, setLoading]           = useState(true)
  const [toast, setToast]               = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)

  const load = useCallback(async () => {
    setLoading(true)

    const { data: c } = await supabase.from('cantieri').select('*').eq('id', id).single()
    setCantiere(c)

    const { data: v } = await supabase
      .from('voci_computo').select('*').eq('cantiere_id', id)
      .order('categoria').order('created_at')
    setVoci(v || [])

    // Aggrega avanzamenti per voce_id
    const { data: av } = await supabase
      .from('avanzamento_giornaliero')
      .select('voce_id, quantita_eseguita, ore_spese')
      .eq('cantiere_id', id)

    const aggr = {}
    for (const a of av || []) {
      if (!aggr[a.voce_id]) aggr[a.voce_id] = { quantita_eseguita: 0, ore_spese: 0 }
      aggr[a.voce_id].quantita_eseguita += Number(a.quantita_eseguita)
      aggr[a.voce_id].ore_spese         += Number(a.ore_spese)
    }
    setAvanzamenti(aggr)

    // Ore effettive dalle presenze collegate a questo cantiere
    const { data: giornate } = await supabase
      .from('giornate')
      .select('presenze(ora_entrata, ora_uscita, stato)')
      .eq('cantiere_id', id)

    let totalMin = 0
    for (const g of giornate || []) {
      for (const p of (g.presenze || [])) {
        if (p.stato !== 'assente' && p.ora_entrata && p.ora_uscita) {
          totalMin += timeToMin(p.ora_uscita.slice(0, 5)) - timeToMin(p.ora_entrata.slice(0, 5))
        }
      }
    }
    setOreEffettive(totalMin / 60)

    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleSaveVoce() {
    if (!form.descrizione.trim()) { setToast('⚠️ Inserisci la descrizione'); return }
    if (!form.quantita_totale || isNaN(Number(form.quantita_totale))) {
      setToast('⚠️ Inserisci una quantità valida'); return
    }
    setSaving(true)
    const { error } = await supabase.from('voci_computo').insert({
      cantiere_id:     id,
      categoria:       form.categoria.trim() || 'GENERALE',
      descrizione:     form.descrizione.trim(),
      unita_misura:    form.unita_misura,
      quantita_totale: Number(form.quantita_totale),
      ore_preventivo:  Number(form.ore_preventivo) || 0,
      prezzo_unitario: form.prezzo_unitario ? Number(form.prezzo_unitario) : null,
    })
    if (error) setToast('❌ Errore nel salvataggio')
    else {
      setToast('✅ Voce aggiunta!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    }
    setSaving(false)
  }

  async function deleteVoce(voceId) {
    if (!window.confirm('Eliminare questa voce? Verranno eliminati anche tutti gli avanzamenti registrati.')) return
    await supabase.from('voci_computo').delete().eq('id', voceId)
    setToast('Voce eliminata')
    load()
  }

  // Calcoli derivati
  const totalOrePreventivo = voci.reduce((s, v) => s + Number(v.ore_preventivo || 0), 0)
  const totalOreSpeseVoci  = Object.values(avanzamenti).reduce((s, a) => s + a.ore_spese, 0)
  const deltaOre           = oreEffettive - totalOrePreventivo
  const isOvertime         = deltaOre > 0

  const totalePreventivoEur = voci.reduce((s, v) =>
    v.prezzo_unitario ? s + Number(v.quantita_totale) * Number(v.prezzo_unitario) : s, 0)
  const totaleEseguitoEur = voci.reduce((s, v) => {
    const av = avanzamenti[v.id]
    return v.prezzo_unitario && av ? s + av.quantita_eseguita * Number(v.prezzo_unitario) : s
  }, 0)

  // Raggruppa voci per categoria
  const gruppi = {}
  for (const v of voci) {
    const cat = v.categoria || 'GENERALE'
    if (!gruppi[cat]) gruppi[cat] = []
    gruppi[cat].push(v)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!cantiere) return <div className="loading">Cantiere non trovato</div>

  return (
    <div style={{ paddingBottom: 40 }}>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* INTESTAZIONE */}
      <div className="page-header">
        <div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/cantieri')}
            style={{ marginBottom: 10 }}
          >
            ← Cantieri
          </button>
          <div className="page-title">
            {cantiere.nome}
            <small>
              {[cantiere.indirizzo, cantiere.comune].filter(Boolean).join(' – ') || 'Nessun indirizzo'}
            </small>
          </div>
        </div>
        <span className={`badge ${cantiere.stato === 'attivo' ? 'badge-green' : 'badge-gray'}`}>
          {cantiere.stato === 'attivo' ? 'Attivo' : 'Completato'}
        </span>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button className={`tab-btn${tab === 'computo' ? ' active' : ''}`} onClick={() => setTab('computo')}>
          📋 Voci di Computo <span className="badge badge-gray" style={{ marginLeft: 6, fontSize: 10 }}>{voci.length}</span>
        </button>
        <button className={`tab-btn${tab === 'avanzamento' ? ' active' : ''}`} onClick={() => setTab('avanzamento')}>
          📊 Avanzamento & Ore
        </button>
      </div>

      {/* ─────────────────────── TAB COMPUTO ─────────────────────── */}
      {tab === 'computo' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
              {showForm ? '✕ Chiudi form' : '＋ Aggiungi Voce'}
            </button>
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon">📄</div>
                <div>
                  <div className="card-title">Nuova Voce di Computo</div>
                  <div className="card-subtitle">Aggiungi una lavorazione al preventivo</div>
                </div>
              </div>
              <div className="card-body">
                <div className="form-grid-2">
                  <div className="form-row">
                    <label className="form-label">Categoria</label>
                    <input
                      className="form-input"
                      list="categorie-list"
                      placeholder="Es: SCAVI E DEMOLIZIONI"
                      value={form.categoria}
                      onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    />
                    <datalist id="categorie-list">
                      {CATEGORIE_SUGGERITE.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="form-row">
                    <label className="form-label">Descrizione *</label>
                    <input
                      className="form-input"
                      placeholder="Es: Scavo a sezione obbligata"
                      value={form.descrizione}
                      onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-row">
                    <label className="form-label">Unità di Misura</label>
                    <select
                      className="form-select"
                      value={form.unita_misura}
                      onChange={e => setForm(f => ({ ...f, unita_misura: e.target.value }))}
                    >
                      {UM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <label className="form-label">Quantità Totale *</label>
                    <input
                      className="form-input"
                      type="number" min="0" step="0.01"
                      placeholder="Es: 158.40"
                      value={form.quantita_totale}
                      onChange={e => setForm(f => ({ ...f, quantita_totale: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Ore Preventivo</label>
                    <input
                      className="form-input"
                      type="number" min="0" step="0.5"
                      placeholder="Es: 16"
                      value={form.ore_preventivo}
                      onChange={e => setForm(f => ({ ...f, ore_preventivo: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">Prezzo Unitario €/{form.unita_misura} — opzionale</label>
                  <input
                    className="form-input"
                    type="number" min="0" step="0.01"
                    placeholder="Es: 13.29"
                    value={form.prezzo_unitario}
                    onChange={e => setForm(f => ({ ...f, prezzo_unitario: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                    Annulla
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveVoce} disabled={saving}>
                    {saving ? '⏳ Salvataggio...' : '💾 Aggiungi Voce'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {voci.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Nessuna voce di computo</div>
                <div style={{ fontSize: 13 }}>Aggiungi le lavorazioni preventivate per questo cantiere</div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                  ＋ Aggiungi la prima voce
                </button>
              </div>
            </div>
          ) : (
            Object.entries(gruppi).map(([categoria, vociGruppo]) => (
              <div key={categoria} className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                    textTransform: 'uppercase', color: 'var(--gray)',
                  }}>
                    {categoria}
                  </div>
                  <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>
                    {vociGruppo.length} {vociGruppo.length === 1 ? 'voce' : 'voci'}
                  </span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {vociGruppo.map((v, i) => {
                    const av  = avanzamenti[v.id] || { quantita_eseguita: 0, ore_spese: 0 }
                    const pct = v.quantita_totale > 0
                      ? Math.min(100, (av.quantita_eseguita / v.quantita_totale) * 100)
                      : 0
                    return (
                      <div
                        key={v.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto',
                          gap: 12, padding: '13px 20px',
                          borderBottom: i < vociGruppo.length - 1 ? '1px solid var(--border)' : 'none',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{v.descrizione}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>Qtà: {fmt(v.quantita_totale)} {v.unita_misura}</span>
                            {v.ore_preventivo > 0 && <span>⏱ {fmt(v.ore_preventivo)}h previste</span>}
                            {v.prezzo_unitario && <span>€ {fmt(v.prezzo_unitario)}/{v.unita_misura}</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                            <div className="progress-wrap" style={{ height: 5 }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : '#3AAA35' }}
                              />
                            </div>
                            <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>
                              {fmt(av.quantita_eseguita)} / {fmt(v.quantita_totale)} ({Math.round(pct)}%)
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteVoce(v.id)}
                          title="Elimina voce"
                          style={{ flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ─────────────────────── TAB AVANZAMENTO ─────────────────────── */}
      {tab === 'avanzamento' && (
        <>
          {/* SOMMARIO ORE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
              <div className="stat-value">{fmt(totalOrePreventivo)}h</div>
              <div className="stat-label">Ore Preventivate (computo)</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: isOvertime ? 'var(--red)' : 'var(--green)' }}>
              <div className="stat-value" style={{ color: isOvertime ? 'var(--red)' : 'var(--dark)' }}>
                {fmt(oreEffettive)}h
              </div>
              <div className="stat-label">Ore Effettive (presenze totali)</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: isOvertime ? 'var(--red)' : 'var(--green)' }}>
              <div className="stat-value" style={{
                color: isOvertime ? 'var(--red)' : 'var(--green-dark)',
                fontSize: 28,
              }}>
                {isOvertime ? '▲' : deltaOre < 0 ? '▼' : '='} {fmt(Math.abs(deltaOre))}h
              </div>
              <div className="stat-label" style={{ color: isOvertime ? 'var(--red)' : 'var(--gray)' }}>
                {isOvertime ? '⚠️ Ore in eccesso' : deltaOre < 0 ? '✅ Ore risparmiate' : 'In linea col preventivo'}
              </div>
            </div>
          </div>

          {/* SOMMARIO ECONOMICO */}
          {totalePreventivoEur > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-icon">💶</div>
                <div>
                  <div className="card-title">Riepilogo Economico</div>
                  <div className="card-subtitle">Solo voci con prezzo unitario inserito</div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--green-dark)' }}>
                      {fmtEur(totaleEseguitoEur)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>Importo Eseguito</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--orange)' }}>
                      {fmtEur(totalePreventivoEur - totaleEseguitoEur)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>Importo Residuo</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--dark)' }}>
                      {fmtEur(totalePreventivoEur)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>Importo Totale Preventivo</div>
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="progress-wrap">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(100, (totaleEseguitoEur / totalePreventivoEur) * 100)}%` }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 5 }}>
                    {Math.round((totaleEseguitoEur / totalePreventivoEur) * 100)}% del valore eseguito
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AVANZAMENTO PER VOCE */}
          {voci.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                Nessuna voce di computo inserita.
                <br />
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('computo')}>
                  ＋ Aggiungi voci
                </button>
              </div>
            </div>
          ) : (
            Object.entries(gruppi).map(([categoria, vociGruppo]) => (
              <div key={categoria} className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gray)' }}>
                    {categoria}
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {vociGruppo.map((v, i) => {
                    const av        = avanzamenti[v.id] || { quantita_eseguita: 0, ore_spese: 0 }
                    const pctQta    = v.quantita_totale > 0
                      ? Math.min(100, (av.quantita_eseguita / v.quantita_totale) * 100)
                      : 0
                    const pctOre    = v.ore_preventivo > 0 ? (av.ore_spese / v.ore_preventivo) * 100 : null
                    const oreOk     = pctOre === null || pctOre <= 100
                    const oreWarning = pctOre !== null && pctOre > 80 && pctOre <= 100
                    const importoEs = v.prezzo_unitario ? av.quantita_eseguita * Number(v.prezzo_unitario) : null
                    const importoTo = v.prezzo_unitario ? Number(v.quantita_totale) * Number(v.prezzo_unitario) : null

                    return (
                      <div
                        key={v.id}
                        style={{
                          padding: '16px 20px',
                          borderBottom: i < vociGruppo.length - 1 ? '1px solid var(--border)' : 'none',
                          borderLeft: !oreOk ? '3px solid var(--red)' : oreWarning ? '3px solid var(--orange)' : '3px solid transparent',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{v.descrizione}</div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                              {v.categoria} · {v.unita_misura}
                            </div>
                          </div>
                          <span className={`badge ${pctQta >= 100 ? 'badge-green' : pctQta > 0 ? 'badge-orange' : 'badge-gray'}`}>
                            {Math.round(pctQta)}% qtà
                          </span>
                        </div>

                        {/* Barra quantità */}
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <span>Quantità: <strong>{fmt(av.quantita_eseguita)}</strong> / {fmt(v.quantita_totale)} {v.unita_misura}</span>
                            <span style={{ color: '#aaa' }}>
                              Residuo: {fmt(Math.max(0, v.quantita_totale - av.quantita_eseguita))} {v.unita_misura}
                            </span>
                          </div>
                          <div className="progress-wrap">
                            <div className="progress-fill" style={{ width: `${pctQta}%` }} />
                          </div>
                        </div>

                        {/* Barra ore */}
                        {v.ore_preventivo > 0 && (
                          <div style={{ marginBottom: importoTo ? 10 : 0 }}>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between',
                              fontSize: 12, marginBottom: 4,
                              color: !oreOk ? 'var(--red)' : oreWarning ? 'var(--orange)' : '#666',
                              fontWeight: !oreOk ? 700 : 400,
                            }}>
                              <span>
                                Ore: <strong>{fmt(av.ore_spese)}h</strong> spese / {fmt(v.ore_preventivo)}h prev.
                              </span>
                              {!oreOk && (
                                <span>⚠️ SFORO +{fmt(av.ore_spese - v.ore_preventivo)}h</span>
                              )}
                              {oreWarning && <span>⚡ Vicino al limite</span>}
                            </div>
                            <div className="progress-wrap">
                              <div className="progress-fill" style={{
                                width: `${Math.min(100, pctOre)}%`,
                                background: !oreOk ? 'var(--red)' : oreWarning ? 'var(--orange)' : 'var(--green)',
                              }} />
                            </div>
                          </div>
                        )}

                        {/* Importi */}
                        {importoTo && (
                          <div style={{ display: 'flex', gap: 20, fontSize: 12, marginTop: 10, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>
                              Eseguito: {fmtEur(importoEs)}
                            </span>
                            <span style={{ color: 'var(--orange)' }}>
                              Residuo: {fmtEur(importoTo - importoEs)}
                            </span>
                            <span style={{ color: '#aaa' }}>
                              Totale: {fmtEur(importoTo)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
