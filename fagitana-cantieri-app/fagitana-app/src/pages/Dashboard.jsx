import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ giornate: 0, cantieri: 0, operai: 7 })
  const [recenti, setRecenti] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [g, c, r] = await Promise.all([
        supabase.from('giornate').select('id', { count: 'exact', head: true }),
        supabase.from('cantieri').select('id', { count: 'exact', head: true }).eq('stato', 'attivo'),
        supabase.from('giornate')
          .select('*, cantieri(nome, comune)')
          .order('data', { ascending: false })
          .limit(5),
      ])
      setStats({ giornate: g.count || 0, cantieri: c.count || 0, operai: 7 })
      setRecenti(r.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const oggi = new Date().toLocaleDateString('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const fmt = d => new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' })

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          Dashboard
          <small>{oggi.charAt(0).toUpperCase() + oggi.slice(1)}</small>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/registrazione')}>
          ＋ Nuova Registrazione
        </button>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.cantieri}</div>
          <div className="stat-label">Cantieri Attivi</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.operai}</div>
          <div className="stat-label">Operai</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.giornate}</div>
          <div className="stat-label">Giornate Registrate</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#3498db' }}>
          <div className="stat-value" style={{ fontSize: 22, marginTop: 4 }}>
            {new Date().toLocaleDateString('it-IT', { month: 'short' }).toUpperCase()}
          </div>
          <div className="stat-label">Mese Corrente</div>
        </div>
      </div>

      {/* ULTIME REGISTRAZIONI */}
      <div className="card">
        <div className="card-header">
          <div className="card-icon">📋</div>
          <div>
            <div className="card-title">Ultime Registrazioni</div>
            <div className="card-subtitle">Le 5 giornate più recenti</div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/calendario')}>
            Vedi Calendario →
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : recenti.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 14 }}>
              Nessuna registrazione ancora.<br />
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/registrazione')}>
                Crea la prima →
              </button>
            </div>
          ) : (
            recenti.map(g => (
              <div key={g.id} className="cantiere-row" onClick={() => navigate(`/registrazione/${g.id}`)}>
                <div style={{ fontSize: 24 }}>{g.meteo?.split(' ')[0] || '🏗️'}</div>
                <div style={{ flex: 1 }}>
                  <div className="cantiere-name">{g.cantieri?.nome || '–'}</div>
                  <div className="cantiere-addr">{g.cantieri?.comune} · {g.fase || '–'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(g.data)}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    Avanz. {g.avanzamento || 0}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AZIONI RAPIDE */}
      <div className="grid-2">
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/registrazione')}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                Registra Giornata
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>
                Inserisci presenze, materiali e note
              </div>
            </div>
          </div>
        </div>
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/cantieri')}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>🏗️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                Gestisci Cantieri
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 3 }}>
                Aggiungi o archivia cantieri
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
