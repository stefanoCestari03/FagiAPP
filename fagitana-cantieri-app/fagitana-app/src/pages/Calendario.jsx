import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
              'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const GIORNI_SHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']

function pad(n) { return String(n).padStart(2,'0') }
function dateKey(y,m,d) { return `${y}-${pad(m+1)}-${pad(d)}` }

export default function Calendario() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [giornate, setGiornate] = useState({})
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchMonth = useCallback(async () => {
    setLoading(true)
    const from = `${year}-${pad(month+1)}-01`
    const to   = `${year}-${pad(month+1)}-${new Date(year,month+1,0).getDate()}`
    const { data } = await supabase
      .from('giornate')
      .select('id, data, meteo, fase, cantieri(nome)')
      .gte('data', from).lte('data', to)
    const map = {}
    ;(data || []).forEach(g => { map[g.data] = g })
    setGiornate(map)
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchMonth() }, [fetchMonth])

  async function openDetail(key) {
    setSelected(key)
    setDetailLoading(true)
    const { data } = await supabase
      .from('giornate')
      .select(`
        *,
        cantieri(nome, indirizzo, comune),
        presenze(*, operai(nome, cognome)),
        materiali(nome, quantita),
        mezzi(nome, utilizzo)
      `)
      .eq('data', key)
      .single()
    setDetail(data)
    setDetailLoading(false)
  }

  async function handleDelete() {
    if (!detail) return
    setDeleting(true)
    const { error } = await supabase.from('giornate').delete().eq('id', detail.id)
    setDeleting(false)
    if (error) { alert('Errore durante l\'eliminazione. Riprova.'); return }
    setSelected(null)
    setDetail(null)
    setConfirmDelete(false)
    fetchMonth()
  }

  function closeModal() {
    setSelected(null)
    setDetail(null)
    setConfirmDelete(false)
  }

  function changeMonth(dir) {
    let m = month + dir, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  // Build calendar cells
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate())
  let cells = []
  for (let i = offset-1; i >= 0; i--) cells.push({ day: daysInPrev-i, cur: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, cur: false })

  const presentCount = detail?.presenze?.filter(p => p.stato !== 'assente').length || 0

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          Calendario
          <small>Clicca su un giorno per vedere il dettaglio</small>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}>‹</button>
          <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, minWidth:160, textAlign:'center' }}>
            {loading ? '...' : `${MESI[month]} ${year}`}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}>›</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/registrazione')}>
            ＋ Registra
          </button>
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="cal-weekdays">
          {GIORNI_SHORT.map(d => <div key={d} className="cal-wd">{d}</div>)}
        </div>
        <div className="cal-body">
          {cells.map((cell, i) => {
            const key = cell.cur ? dateKey(year, month, cell.day) : null
            const g = key && giornate[key]
            const isToday = key === todayKey
            return (
              <div
                key={i}
                className={`cal-cell${!cell.cur?' other-month':''}${isToday?' today':''}`}
                onClick={() => cell.cur && g && openDetail(key)}
                style={cell.cur && !g ? { cursor:'default' } : {}}
              >
                <div className="cal-num">{cell.day}</div>
                {g && (
                  <>
                    <div className="cal-dot-bar"><div className="cal-dot" /></div>
                    <span className="cal-label">{g.cantieri?.nome?.split('–')[0]?.trim() || g.cantieri?.nome}</span>
                    <div className="cal-operai">{g.meteo}</div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#888' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--green)' }} />
          Registrazione presente
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#888' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#e0e0e0', border:'1px solid #ccc' }} />
          Nessuna attività
        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  {detailLoading ? 'Caricamento...' : detail?.cantieri?.nome || '–'}
                </div>
                {detail && (
                  <div style={{ color:'#888', fontSize:12, marginTop:3 }}>
                    {new Date(detail.data).toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {detail && !confirmDelete && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { closeModal(); navigate(`/registrazione/${detail.id}`) }}>
                    ✏️ Modifica
                  </button>
                )}
                {detail && isAdmin && !confirmDelete && (
                  <button
                    className="btn btn-sm"
                    style={{ background:'#fee2e2', color:'#b91c1c', border:'1px solid #fca5a5' }}
                    onClick={() => setConfirmDelete(true)}
                  >
                    🗑️ Elimina
                  </button>
                )}
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>
            </div>

            {/* BARRA CONFERMA ELIMINAZIONE */}
            {confirmDelete && (
              <div style={{
                background:'#fef2f2', borderBottom:'1px solid #fca5a5',
                padding:'14px 20px', display:'flex', alignItems:'center',
                justifyContent:'space-between', gap:12, flexWrap:'wrap'
              }}>
                <div style={{ fontSize:13, color:'#b91c1c', fontWeight:600 }}>
                  ⚠️ Eliminare questa registrazione? L'azione è irreversibile.
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Annulla
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background:'#b91c1c', color:'white', border:'none' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Eliminazione...' : 'Sì, elimina'}
                  </button>
                </div>
              </div>
            )}

            <div className="modal-body">
              {detailLoading ? (
                <div className="loading"><div className="spinner" /></div>
              ) : detail ? (
                <>
                  {/* Orari */}
                  <div className="modal-section">
                    <div className="modal-section-title">⏰ Orario & Condizioni</div>
                    <div className="form-grid-2" style={{ gap:10 }}>
                      {[
                        ['Inizio lavori', detail.ora_inizio || '–'],
                        ['Fine lavori',   detail.ora_fine   || '–'],
                        ['Meteo',         detail.meteo      || '–'],
                        ['Fase',          detail.fase       || '–'],
                      ].map(([l,v]) => (
                        <div key={l} style={{ background:'#f4f4f4', borderRadius:8, padding:'10px 14px' }}>
                          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#888' }}>{l}</div>
                          <div style={{ fontWeight:600, marginTop:3 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Presenze */}
                  <div className="modal-section">
                    <div className="modal-section-title">
                      👷 Operai · {presentCount}/{detail.presenze?.length} presenti
                    </div>
                    <div className="chip-list">
                      {detail.presenze?.sort((a,b) => {
                        const order = { presente:0, parziale:1, assente:2 }
                        return order[a.stato] - order[b.stato]
                      }).map(p => (
                        <div key={p.id} className={`chip chip-${p.stato === 'presente' ? 'present' : p.stato === 'assente' ? 'absent' : 'partial'}`}>
                          {p.stato === 'presente' ? '✅' : p.stato === 'assente' ? '❌' : '⚡'}
                          {p.operai?.nome} {p.operai?.cognome}
                          {p.stato !== 'assente' && p.ora_entrata && (
                            <span style={{ fontWeight:400, opacity:.7 }}>
                              {' '}{p.ora_entrata?.slice(0,5)}–{p.ora_uscita?.slice(0,5)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materiali */}
                  {detail.materiali?.length > 0 && (
                    <div className="modal-section">
                      <div className="modal-section-title">🧱 Materiali</div>
                      <div className="tag-list">
                        {detail.materiali.map(m => (
                          <div key={m.id} className="tag">
                            {m.nome}{m.quantita ? ` – ${m.quantita}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mezzi */}
                  {detail.mezzi?.length > 0 && (
                    <div className="modal-section">
                      <div className="modal-section-title">🚛 Mezzi & Attrezzature</div>
                      <div className="tag-list">
                        {detail.mezzi.map(m => (
                          <div key={m.id} className="tag" style={{ background:'#f0f8f0' }}>
                            {m.nome}{m.utilizzo ? ` – ${m.utilizzo}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  {detail.note_attivita && (
                    <div className="modal-section">
                      <div className="modal-section-title">📝 Attività Svolte</div>
                      <div style={{ background:'#f9f9f9', borderRadius:8, padding:14, fontSize:13, lineHeight:1.6, borderLeft:'3px solid var(--green)' }}>
                        {detail.note_attivita}
                      </div>
                    </div>
                  )}
                  {detail.note_problemi && (
                    <div className="modal-section">
                      <div className="modal-section-title">⚠️ Problemi / Segnalazioni</div>
                      <div style={{ background:'#fff8f0', borderRadius:8, padding:14, fontSize:13, lineHeight:1.6, borderLeft:'3px solid var(--orange)' }}>
                        {detail.note_problemi}
                      </div>
                    </div>
                  )}
                  {detail.note_prossimi && (
                    <div className="modal-section">
                      <div className="modal-section-title">🔜 Prossimi Lavori</div>
                      <div style={{ background:'#f0f4ff', borderRadius:8, padding:14, fontSize:13, lineHeight:1.6, borderLeft:'3px solid #3498db' }}>
                        {detail.note_prossimi}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign:'center', color:'#999', padding:24 }}>Dati non trovati.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
