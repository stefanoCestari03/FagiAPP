import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const OPERAI = [
  'Alessandro Tomasi',
  'Damiano Giovannini',
  'Damiano Gottardi',
  'Marco Gottardi',
  'Emanuele Paoli',
  'Cristian Casagranda',
  'Fabrizio Leonardelli',
]

const FASI = ['Muratura','Carpenteria','Rifinitura','Impianti','Copertura','Fondamenta','Intonaco','Pavimentazione']
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
  const [cantieri, setCantieri] = useState([])
  const [cantiereId, setCantiereId] = useState('')
  const [data, setData] = useState(today)
  const [fase, setFase] = useState('')
  const [meteo, setMeteo] = useState('☀️ Sole')
  const [oraInizio, setOraInizio] = useState('07:00')
  const [oraFine, setOraFine] = useState('17:00')
  const [oraPausaI, setOraPausaI] = useState('12:00')
  const [oraPausaF, setOraPausaF] = useState('13:00')
  const [avanzamento, setAvanzamento] = useState(0)
  const [noteAttivita, setNoteAttivita] = useState('')
  const [noteProblemi, setNoteProblemi] = useState('')
  const [noteProssimi, setNoteProssimi] = useState('')

  const [presenze, setPresenze] = useState(
    OPERAI.map(n => ({ nome: n, stato: 'presente', entrata: '07:00', uscita: '17:00' }))
  )
  const [materiali, setMateriali] = useState([])
  const [mezzi, setMezzi] = useState([])
  const [newMat, setNewMat] = useState('')
  const [newMezzo, setNewMezzo] = useState('')

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load cantieri
  useEffect(() => {
    supabase.from('cantieri').select('id,nome,comune').eq('stato','attivo').order('nome')
      .then(({ data }) => { setCantieri(data || []) })
  }, [])

  // Load existing giornata if editing
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
      // Map presenze
      const presenzeMap = {}
      g.presenze?.forEach(p => {
        const nome = `${p.operai?.nome} ${p.operai?.cognome}`
        presenzeMap[nome] = {
          nome, stato: p.stato,
          entrata: p.ora_entrata?.slice(0,5) || '07:00',
          uscita: p.ora_uscita?.slice(0,5) || '17:00',
        }
      })
      setPresenze(OPERAI.map(n => presenzeMap[n] || { nome: n, stato: 'presente', entrata: '07:00', uscita: '17:00' }))
    }
    setLoading(false)
  }, [id])

  useEffect(() => { loadGiornata() }, [loadGiornata])

  const updatePresenza = (i, field, value) => {
    setPresenze(prev => prev.map((p,idx) => idx===i ? {...p,[field]:value} : p))
  }

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

  const calcOreEffettive = () => {
    try {
      const [hi, mi] = oraInizio.split(':').map(Number)
      const [hf, mf] = oraFine.split(':').map(Number)
      const [hpi, mpi] = oraPausaI.split(':').map(Number)
      const [hpf, mpf] = oraPausaF.split(':').map(Number)
      const totMin = (hf*60+mf) - (hi*60+mi)
      const pausaMin = (hpf*60+mpf) - (hpi*60+mpi)
      const eff = totMin - pausaMin
      return `${Math.floor(eff/60)}h ${eff%60>0?eff%60+'m':''}`
    } catch { return '–' }
  }

  const handleSave = async () => {
    if (!cantiereId) { setToast('⚠️ Seleziona un cantiere'); return }
    setSaving(true)
    try {
      // Get operai IDs from DB
      const { data: operaiDB } = await supabase.from('operai').select('id,nome,cognome').eq('attivo',true)
      const operaiMap = {}
      operaiDB?.forEach(o => { operaiMap[`${o.nome} ${o.cognome}`] = o.id })

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
        // Delete existing related records
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

      // Insert presenze
      const presenzePayload = presenze
        .filter(p => operaiMap[p.nome])
        .map(p => ({
          giornata_id: giornataId,
          operaio_id: operaiMap[p.nome],
          stato: p.stato,
          ora_entrata: p.stato !== 'assente' ? p.entrata : null,
          ora_uscita: p.stato !== 'assente' ? p.uscita : null,
        }))

      await Promise.all([
        supabase.from('presenze').insert(presenzePayload),
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
                <select className="form-select" value={fase} onChange={e => setFase(e.target.value)}>
                  <option value="">– Fase –</option>
                  {FASI.map(f => <option key={f}>{f}</option>)}
                </select>
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
          <div><div className="card-title">Presenze & Orari Operai</div><div className="card-subtitle">Registra ogni operaio</div></div>
          <div className="badge badge-green" style={{ marginLeft:'auto' }}>{presentiCount}/7 Presenti</div>
        </div>
        <div className="card-body">
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
              <div key={p.nome} className="worker-row-item">
                <div className={`worker-num${p.stato==='assente'?' absent':''}`}>{i+1}</div>
                <div style={{ fontWeight:600, fontSize:13 }}>{p.nome}</div>
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
                <div />
              </div>
            ))}
          </div>
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
