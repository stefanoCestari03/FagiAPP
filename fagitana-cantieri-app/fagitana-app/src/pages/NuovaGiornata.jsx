import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const METEO_OPT = ['☀️ Sole','⛅ Nuvoloso','🌧️ Pioggia','❄️ Neve','💨 Vento forte']

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div className="toast">{msg}</div>
}

export default function NuovaGiornata() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const today = new Date().toISOString().split('T')[0]

  // FORM STATE
  const [cantieri, setCantieri]     = useState([])
  const [operaiDB, setOperaiDB]     = useState([])
  const [cantiereId, setCantiereId] = useState('')
  const [data, setData]             = useState(today)
  const [fase, setFase]             = useState('')
  const [meteo, setMeteo]           = useState('☀️ Sole')
  const [oraInizio, setOraInizio]   = useState('07:00')
  const [oraFine, setOraFine]       = useState('17:00')
  const [oraPausaI, setOraPausaI]   = useState('12:00')
  const [oraPausaF, setOraPausaF]   = useState('13:00')
  const [avanzamento, setAvanzamento] = useState(0)
  const [noteAttivita, setNoteAttivita]   = useState('')
  const [noteProblemi, setNoteProblemi]   = useState('')
  const [noteProssimi, setNoteProssimi]   = useState('')

  // PRESENZE STATE — lista vuota, si riempie selezionando
  const [presenze, setPresenze]         = useState([])
  const [selectedOperaioId, setSelectedOperaioId] = useState('')
  const [jollyNome, setJollyNome]       = useState('')

  const [materiali, setMateriali] = useState([])
  const [mezzi, setMezzi]         = useState([])
  const [newMat, setNewMat]       = useState('')
  const [newMezzo, setNewMezzo]   = useState('')

  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Carica cantieri e operai ──────────────────────────────────────────────
  useEffect(() => {
    supabase.from('cantieri').select('id,nome,comune').eq('stato','attivo').order('nome')
      .then(({ data }) => setCantieri(data || []))
    supabase.from('operai').select('id,nome,cognome').eq('attivo', true).order('cognome')
      .then(({ data }) => setOperaiDB(data || []))
  }, [])

  // ── Carica giornata esistente (modalità modifica) ─────────────────────────
  const loadGiornata = useCallback(async () => {
    if (!id) { setLoading(false); return }
    const { data: g } = await supabase
      .from('giornate')
      .select('*, presenze(*, operai(nome,cognome)), materiali(*), mezzi(*)')
      .eq('id', id).single()
    if (g) {
      setCantiereId(g.cantiere_id)
      setData(g.data)
      setFase(g.fase || '')
      setMeteo(g.meteo || '☀️ Sole')
      setOraInizio(g.ora_inizio?.slice(0,5) || '07:00')
      setOraFine(g.ora_fine?.slice(0,5) || '17:00')
      setOraPausaI(g.ora_pausa_inizio?.slice(0,5) || '12:00')
      setOraPausaF(g.ora_pausa_fine?.slice(0,5) || '13:00')
      setAvanzamento(g.avanzamento || 0)
      setNoteAttivita(g.note_attivita || '')
      setNoteProblemi(g.note_problemi || '')
      setNoteProssimi(g.note_prossimi || '')
      setMateriali(g.materiali?.map(m => ({ id: m.id, nome: m.nome, quantita: m.quantita || '' })) || [])
      setMezzi(g.mezzi?.map(m => ({ id: m.id, nome: m.nome, utilizzo: m.utilizzo || '' })) || [])
      setPresenze(g.presenze?.map(p => ({
        operaio_id: p.operaio_id || null,
        nome: p.nome_jolly || `${p.operai?.nome} ${p.operai?.cognome}`,
        stato: p.stato,
        entrata: p.ora_entrata?.slice(0,5) || '07:00',
        uscita:  p.ora_uscita?.slice(0,5)  || '17:00',
        isJolly: !p.operaio_id,
      })) || [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadGiornata() }, [loadGiornata])

  // ── Aggiungi operaio dal dropdown ─────────────────────────────────────────
  const addOperaioDaLista = () => {
    if (!selectedOperaioId) return
    if (presenze.find(p => p.operaio_id === selectedOperaioId)) {
      setToast('⚠️ Operaio già aggiunto')
      return
    }
    const op = operaiDB.find(o => o.id === selectedOperaioId)
    if (!op) return
    setPresenze(prev => [...prev, {
      operaio_id: op.id,
      nome: `${op.nome} ${op.cognome}`,
      stato: 'presente',
      entrata: oraInizio,
      uscita: oraFine,
      isJolly: false,
    }])
    setSelectedOperaioId('')
  }

  // ── Aggiungi operaio jolly ────────────────────────────────────────────────
  const addJolly = () => {
    if (!jollyNome.trim()) return
    setPresenze(prev => [...prev, {
      operaio_id: null,
      nome: jollyNome.trim(),
      stato: 'presente',
      entrata: oraInizio,
      uscita: oraFine,
      isJolly: true,
    }])
    setJollyNome('')
  }

  const removePresenza = (i) => setPresenze(prev => prev.filter((_, idx) => idx !== i))

  const updatePresenza = (i, field, value) =>
    setPresenze(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  // ── Materiali / Mezzi ─────────────────────────────────────────────────────
  const addMateriale = () => {
    if (!newMat.trim()) return
    setMateriali(prev => [...prev, { nome: newMat.trim(), quantita: '' }])
    setNewMat('')
  }
  const addMezzo = () => {
    if (!newMezzo.trim()) return
    setMezzi(prev => [...prev, { nome: newMezzo.trim(), utilizzo: '' }])
    setNewMezzo('')
  }

  // ── Ore effettive ─────────────────────────────────────────────────────────
  const calcOreEffettive = () => {
    try {
      const [hi, mi]   = oraInizio.split(':').map(Number)
      const [hf, mf]   = oraFine.split(':').map(Number)
      const [hpi, mpi] = oraPausaI.split(':').map(Number)
      const [hpf, mpf] = oraPausaF.split(':').map(Number)
      const eff = ((hf*60+mf) - (hi*60+mi)) - ((hpf*60+mpf) - (hpi*60+mpi))
      return `${Math.floor(eff/60)}h ${eff%60>0?eff%60+'m':''}`
    } catch { return '–' }
  }

  // ── Salva ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!cantiereId) { setToast('⚠️ Seleziona un cantiere'); return }
    setSaving(true)
    try {
      let giornataId = id
      const giornataPayload = {
        cantiere_id: cantiereId, data, fase, meteo,
        ora_inizio: oraInizio, ora_fine: oraFine,
        ora_pausa_inizio: oraPausaI, ora_pausa_fine: oraPausaF,
        avanzamento, note_attivita: noteAttivita,
        note_problemi: noteProblemi, note_prossimi: noteProssimi,
      }

      if (isEdit) {
        await supabase.from('giornate').update(giornataPayload).eq('id', id)
        await Promise.all([
          supabase.from('presenze').delete().eq('giornata_id', id),
          supabase.from('materiali').delete().eq('giornata_id', id),
          supabase.from('mezzi').delete().eq('giornata_id', id),
        ])
      } else {
        const { data: newG, error } = await supabase.from('giornate').insert(giornataPayload).select('id').single()
        if (error) throw error
        giornataId = newG.id
      }

      const presenzePayload = presenze.map(p => ({
        giornata_id:  giornataId,
        operaio_id:   p.isJolly ? null : p.operaio_id,
        nome_jolly:   p.isJolly ? p.nome : null,
        stato:        p.stato,
        ora_entrata:  p.stato !== 'assente' ? p.entrata : null,
        ora_uscita:   p.stato !== 'assente' ? p.uscita  : null,
      }))

      await Promise.all([
        presenze.length > 0 && supabase.from('presenze').insert(presenzePayload),
        materiali.length > 0 && supabase.from('materiali').insert(
          materiali.map(m => ({ giornata_id: giornataId, nome: m.nome, quantita: m.quantita || null }))
        ),
        mezzi.length > 0 && supabase.from('mezzi').insert(
          mezzi.map(m => ({ giornata_id: giornataId, nome: m.nome, utilizzo: m.utilizzo || null }))
        ),
      ].filter(Boolean))

      setToast(isEdit ? '✅ Registrazione aggiornata!' : '✅ Registrazione salvata!')
      setTimeout(() => navigate('/calendario'), 1500)
    } catch (e) {
      console.error(e)
      setToast('❌ Errore nel salvataggio. Riprova.')
    } finally {
      setSaving(false)
    }
  }

  // Operai disponibili nel dropdown (escludi già aggiunti)
  const operaiDisponibili = operaiDB.filter(o => !presenze.find(p => p.operaio_id === o.id))
  const presentiCount = presenze.filter(p => p.stato !== 'assente').length

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div style={{ paddingBottom: 80 }}>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div className="page-header">
        <div className="page-title">
          {isEdit ? 'Modifica Registrazione' : 'Nuova Registrazione'}
          <small>Inserisci i dati della giornata lavorativa</small>
        </div>
        <div className="badge badge-dark" style={{ fontSize: 14, padding: '8px 16px' }}>
          {new Date().toLocaleDateString('it-IT',{weekday:'short',day:'numeric',month:'short'})}
        </div>
      </div>

      {/* CANTIERE + ORARIO */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🏗️</div>
            <div><div className="card-title">Cantiere</div><div className="card-subtitle">Seleziona cantiere e data</div></div>
          </div>
          <div className="card-body">
            <div className="form-row">
              <label className="form-label">Cantiere</label>
              <select className="form-select" value={cantiereId} onChange={e => setCantiereId(e.target.value)}>
                <option value="">— Seleziona cantiere —</option>
                {cantieri.map(c => <option key={c.id} value={c.id}>{c.nome}{c.comune ? ` – ${c.comune}` : ''}</option>)}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Fase Lavori</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Es: Muratura, Rifinitura…"
                  value={fase}
                  onChange={e => setFase(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Meteo</label>
              <div className="weather-pills">
                {METEO_OPT.map(m => (
                  <div key={m} className={`weather-pill${meteo===m?' active':''}`} onClick={() => setMeteo(m)}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-icon">⏰</div>
            <div><div className="card-title">Orario Cantiere</div><div className="card-subtitle">Orari generali della giornata</div></div>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Inizio Lavori</label>
                <input className="form-input" type="time" value={oraInizio} onChange={e => setOraInizio(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Fine Lavori</label>
                <input className="form-input" type="time" value={oraFine} onChange={e => setOraFine(e.target.value)} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Inizio Pausa</label>
                <input className="form-input" type="time" value={oraPausaI} onChange={e => setOraPausaI(e.target.value)} />
              </div>
              <div className="form-row">
                <label className="form-label">Fine Pausa</label>
                <input className="form-input" type="time" value={oraPausaF} onChange={e => setOraPausaF(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Ore Effettive</label>
              <div style={{ background:'var(--green-light)', border:'1.5px solid #b8e0b6', borderRadius:7, padding:'10px 14px', fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, color:'var(--green-dark)', textAlign:'center' }}>
                {calcOreEffettive()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OPERAI */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">👷</div>
          <div><div className="card-title">Presenze & Orari Operai</div><div className="card-subtitle">Seleziona dalla lista o aggiungi un jolly</div></div>
          <div className="badge badge-green" style={{ marginLeft:'auto' }}>{presentiCount}/{presenze.length} Presenti</div>
        </div>
        <div className="card-body">

          {/* Selettori */}
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            {/* Dropdown operai DB */}
            <div style={{ flex:1, minWidth:200 }}>
              <label className="form-label">Operaio dalla lista</label>
              <div style={{ display:'flex', gap:8 }}>
                <select
                  className="form-select"
                  value={selectedOperaioId}
                  onChange={e => setSelectedOperaioId(e.target.value)}
                >
                  <option value="">— Seleziona operaio —</option>
                  {operaiDisponibili.map(o => (
                    <option key={o.id} value={o.id}>{o.nome} {o.cognome}</option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm" onClick={addOperaioDaLista}>＋</button>
              </div>
            </div>

            {/* Jolly */}
            <div style={{ flex:1, minWidth:200 }}>
              <label className="form-label">Operaio jolly (esterno)</label>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  className="form-input"
                  placeholder="Nome e cognome…"
                  value={jollyNome}
                  onChange={e => setJollyNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addJolly()}
                />
                <button className="btn btn-secondary btn-sm" onClick={addJolly}>＋</button>
              </div>
            </div>
          </div>

          {/* Lista presenze */}
          {presenze.length === 0 ? (
            <div style={{ textAlign:'center', color:'#999', fontSize:13, padding:'24px 0' }}>
              Nessun operaio aggiunto. Seleziona dalla lista o inserisci un jolly.
            </div>
          ) : (
            <div className="worker-table">
              <div className="worker-header">
                <span></span>
                <span>Operaio</span>
                <span>Entrata</span>
                <span>Uscita</span>
                <span>Stato</span>
                <span></span>
              </div>
              {presenze.map((p, i) => (
                <div key={i} className="worker-row-item">
                  <div className={`worker-num${p.stato==='assente'?' absent':''}`}>{i+1}</div>
                  <div style={{ fontWeight:600, fontSize:13 }}>
                    {p.nome}
                    {p.isJolly && <span style={{ marginLeft:6, fontSize:10, background:'#f0f0f0', color:'#888', padding:'1px 5px', borderRadius:3 }}>jolly</span>}
                  </div>
                  <input
                    className="form-input"
                    type="time"
                    value={p.entrata}
                    disabled={p.stato==='assente'}
                    onChange={e => updatePresenza(i,'entrata',e.target.value)}
                    style={p.stato==='assente'?{opacity:.4}:{}}
                  />
                  <input
                    className="form-input"
                    type="time"
                    value={p.uscita}
                    disabled={p.stato==='assente'}
                    onChange={e => updatePresenza(i,'uscita',e.target.value)}
                    style={p.stato==='assente'?{opacity:.4}:{}}
                  />
                  <select
                    className="form-select"
                    value={p.stato}
                    onChange={e => updatePresenza(i,'stato',e.target.value)}
                    style={{ background: p.stato==='assente'?'#fff0f0': p.stato==='parziale'?'#fff8e1':'#f0fef0' }}
                  >
                    <option value="presente">✅ Presente</option>
                    <option value="parziale">⚡ Parziale</option>
                    <option value="assente">❌ Assente</option>
                  </select>
                  <button
                    onClick={() => removePresenza(i)}
                    style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#ccc', padding:'0 4px' }}
                    title="Rimuovi"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MATERIALI + MEZZI */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon">🧱</div>
            <div><div className="card-title">Materiali Utilizzati</div></div>
          </div>
          <div className="card-body">
            <div className="tag-list">
              {materiali.map((m, i) => (
                <div key={i} className="tag">
                  {m.nome}
                  <button className="tag-remove" onClick={() => setMateriali(prev => prev.filter((_,idx)=>idx!==i))}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <input
                className="form-input"
                placeholder="Es: Cemento, Mattoni…"
                value={newMat}
                onChange={e => setNewMat(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addMateriale()}
              />
              <button className="btn btn-primary btn-sm" onClick={addMateriale}>＋</button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-icon">🚛</div>
            <div><div className="card-title">Mezzi & Attrezzature</div></div>
          </div>
          <div className="card-body">
            <div className="tag-list">
              {mezzi.map((m, i) => (
                <div key={i} className="tag" style={{ background:'#f0f8f0' }}>
                  {m.nome}
                  <button className="tag-remove" onClick={() => setMezzi(prev => prev.filter((_,idx)=>idx!==i))}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <input
                className="form-input"
                placeholder="Es: Betoniera, Gru, Ponteggio…"
                value={newMezzo}
                onChange={e => setNewMezzo(e.target.value)}
                onKeyDown={e => e.key==='Enter' && addMezzo()}
              />
              <button className="btn btn-primary btn-sm" onClick={addMezzo}>＋</button>
            </div>
          </div>
        </div>
      </div>

      {/* NOTE + AVANZAMENTO */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📝</div>
          <div><div className="card-title">Note & Avanzamento Lavori</div></div>
        </div>
        <div className="card-body">
          <div className="form-grid-2">
            <div>
              <div className="form-row">
                <label className="form-label">Attività Svolte</label>
                <textarea className="form-textarea" value={noteAttivita} onChange={e => setNoteAttivita(e.target.value)} placeholder="Descrivi le attività svolte oggi…" />
              </div>
              <div className="form-row">
                <label className="form-label">Problemi / Segnalazioni</label>
                <textarea className="form-textarea" style={{ minHeight:70 }} value={noteProblemi} onChange={e => setNoteProblemi(e.target.value)} placeholder="Imprevisti, ritardi, mancanze…" />
              </div>
            </div>
            <div>
              <div className="form-row">
                <label className="form-label">Avanzamento Lavori: {avanzamento}%</label>
                <input
                  type="range" min={0} max={100} value={avanzamento}
                  onChange={e => setAvanzamento(Number(e.target.value))}
                  style={{ width:'100%', accentColor:'var(--green)' }}
                />
                <div style={{ textAlign:'center', fontFamily:'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--green)' }}>
                  {avanzamento}%
                </div>
              </div>
              <div className="form-row">
                <label className="form-label">Prossimi Lavori Previsti</label>
                <textarea className="form-textarea" value={noteProssimi} onChange={e => setNoteProssimi(e.target.value)} placeholder="Programma per i prossimi giorni…" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUBMIT BAR */}
      <div className="submit-bar">
        <div className="submit-info">
          {cantiereId
            ? `🏗️ ${cantieri.find(c=>c.id===cantiereId)?.nome || '–'} · ${data}`
            : 'Seleziona un cantiere per continuare'}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Annulla</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Salvataggio...' : `💾 ${isEdit?'AGGIORNA':'SALVA REGISTRAZIONE'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
