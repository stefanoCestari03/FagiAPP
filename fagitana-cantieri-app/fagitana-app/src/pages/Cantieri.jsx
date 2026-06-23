import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'


function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return <div className="toast">{msg}</div>
}

export default function Cantieri() {
  const navigate = useNavigate()
  const [cantieri, setCantieri] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [filtro, setFiltro] = useState('attivo')
  const [form, setForm] = useState({ nome:'', indirizzo:'', comune:'', fase:'', note:'' })

  useEffect(() => { fetchCantieri() }, [filtro])

  async function fetchCantieri() {
    setLoading(true)
    const q = supabase.from('cantieri').select('*').order('created_at', { ascending: false })
    if (filtro !== 'tutti') q.eq('stato', filtro)
    const { data } = await q
    setCantieri(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.nome.trim()) { setToast('⚠️ Inserisci il nome del cantiere'); return }
    setSaving(true)
    const { error } = await supabase.from('cantieri').insert({ ...form, stato: 'attivo' })
    if (error) setToast('❌ Errore nel salvataggio')
    else {
      setToast('✅ Cantiere aggiunto!')
      setForm({ nome:'', indirizzo:'', comune:'', fase:'', note:'' })
      setShowForm(false)
      fetchCantieri()
    }
    setSaving(false)
  }

  async function toggleStato(c) {
    const nuovoStato = c.stato === 'attivo' ? 'completato' : 'attivo'
    await supabase.from('cantieri').update({ stato: nuovoStato }).eq('id', c.id)
    setToast(`✅ Cantiere ${nuovoStato === 'attivo' ? 'riattivato' : 'completato'}`)
    fetchCantieri()
  }

  const statoBadge = s => {
    if (s === 'attivo') return <span className="badge badge-green">Attivo</span>
    if (s === 'completato') return <span className="badge badge-gray">Completato</span>
    return <span className="badge badge-orange">Sospeso</span>
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div className="page-header">
        <div className="page-title">Cantieri<small>Gestisci i cantieri attivi e archiviati</small></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Chiudi' : '＋ Nuovo Cantiere'}
        </button>
      </div>

      {/* FORM NUOVO CANTIERE */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-icon">🏗️</div>
            <div><div className="card-title">Aggiungi Cantiere</div></div>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Nome Cantiere *</label>
                <input className="form-input" placeholder="Es: Villa Bianchi" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
              </div>
              <div className="form-row">
                <label className="form-label">Comune</label>
                <input className="form-input" placeholder="Es: Baselga di Pinè" value={form.comune} onChange={e => setForm(f=>({...f,comune:e.target.value}))} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label className="form-label">Indirizzo</label>
                <input className="form-input" placeholder="Es: Via Roma 14" value={form.indirizzo} onChange={e => setForm(f=>({...f,indirizzo:e.target.value}))} />
              </div>
              <div className="form-row">
                <label className="form-label">Fase Iniziale</label>
                <input
                  className="form-input"
                  placeholder="Es: Fondamenta, Muratura…"
                  value={form.fase}
                  onChange={e => setForm(f=>({...f,fase:e.target.value}))}
                />
              </div>
            </div>
            <div className="form-row">
              <label className="form-label">Note</label>
              <textarea className="form-textarea" style={{ minHeight:60 }} value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Informazioni aggiuntive…" />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : '💾 Salva Cantiere'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTRI */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['attivo','Attivi'],['completato','Completati'],['tutti','Tutti']].map(([v,l]) => (
          <button key={v} className={`btn btn-sm ${filtro===v?'btn-primary':'btn-secondary'}`} onClick={() => setFiltro(v)}>{l}</button>
        ))}
      </div>

      {/* LISTA */}
      <div className="card">
        <div className="card-body" style={{ padding:0 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : cantieri.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', color:'#999', fontSize:14 }}>
              Nessun cantiere trovato.<br />
              <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowForm(true)}>
                ＋ Aggiungi il primo
              </button>
            </div>
          ) : (
            cantieri.map(c => (
              <div key={c.id} className="cantiere-row" onClick={() => navigate(`/cantieri/${c.id}`)} style={{ cursor:'pointer' }}>
                <div style={{ fontSize:28 }}>🏗️</div>
                <div style={{ flex:1 }}>
                  <div className="cantiere-name">{c.nome}</div>
                  <div className="cantiere-addr">
                    {[c.indirizzo, c.comune].filter(Boolean).join(' – ')}{c.fase ? ` · ${c.fase}` : ''}
                  </div>
                  {c.note && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{c.note}</div>}
                </div>
                <div className="cantiere-actions" onClick={e => e.stopPropagation()}>
                  {statoBadge(c.stato)}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => toggleStato(c)}
                    title={c.stato === 'attivo' ? 'Segna come completato' : 'Riattiva'}
                  >
                    {c.stato === 'attivo' ? '✓ Completa' : '↩ Riattiva'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
