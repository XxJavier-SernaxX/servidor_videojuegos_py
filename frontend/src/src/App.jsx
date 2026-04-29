import { useState, useEffect } from "react"

const LEVEL_COLORS = {
  BRONZE:  { bg: "#FAEEDA", text: "#633806", bar: "#BA7517" },
  SILVER:  { bg: "#F1EFE8", text: "#444441", bar: "#888780" },
  GOLD:    { bg: "#FAEEDA", text: "#BA7517", bar: "#EF9F27" },
  DIAMOND: { bg: "#E6F1FB", text: "#185FA5", bar: "#378ADD" },
}

export default function App() {
  const [data, setData] = useState(null)
  const [name, setName] = useState("")
  const [level, setLevel] = useState("BRONZE")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws")
    ws.onmessage = (e) => setData(JSON.parse(e.data))
    ws.onerror = () => setMsg("⚠️ No se pudo conectar al servidor")
    return () => ws.close()
  }, [])

  const joinQueue = async () => {
    if (!name.trim()) return setMsg("Escribe un nombre")
    const res = await fetch(`http://localhost:8000/join?name=${name}&level=${level}`, { method: "POST" })
    const json = await res.json()
    setMsg(json.message || json.error)
    setName("")
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", color: "#fff", fontFamily: "monospace", padding: "2rem" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1D9E75", animation: "pulse 1.5s infinite" }} />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 500, margin: 0 }}>Matchmaking Server</h1>
        <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>
          {data ? "🟢 Conectado" : "🔴 Desconectado"}
        </span>
      </div>

      <div style={{ background: "#1a1a22", border: "0.5px solid #333", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "10px" }}>Agregar jugador a la cola</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && joinQueue()}
            placeholder="Nombre del jugador"
            style={{ flex: 1, minWidth: "150px", background: "#0f0f13", border: "0.5px solid #444", borderRadius: "8px", padding: "8px 12px", color: "#fff", fontFamily: "monospace" }}
          />
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            style={{ background: "#0f0f13", border: "0.5px solid #444", borderRadius: "8px", padding: "8px 12px", color: "#fff", fontFamily: "monospace" }}
          >
            {["BRONZE","SILVER","GOLD","DIAMOND"].map(l => <option key={l}>{l}</option>)}
          </select>
          <button
            onClick={joinQueue}
            style={{ background: "#1D9E75", border: "none", borderRadius: "8px", padding: "8px 18px", color: "#fff", fontFamily: "monospace", cursor: "pointer", fontWeight: 500 }}
          >
            Unirse →
          </button>
        </div>
        {msg && <p style={{ fontSize: "12px", color: "#1D9E75", marginTop: "8px" }}>{msg}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "1.5rem" }}>
        {[
          { label: "En cola", value: data ? Object.values(data.queues).reduce((a,b) => a + b.waiting, 0) : "-" },
          { label: "Partidas activas", value: data?.active_matches?.length ?? "-" },
          { label: "Completadas", value: data?.completed_total ?? "-" },
        ].map(m => (
          <div key={m.label} style={{ background: "#1a1a22", border: "0.5px solid #333", borderRadius: "8px", padding: "12px 14px" }}>
            <p style={{ fontSize: "12px", color: "#666", margin: "0 0 4px" }}>{m.label}</p>
            <p style={{ fontSize: "22px", fontWeight: 500, margin: 0 }}>{m.value}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "12px", color: "#666", letterSpacing: "0.08em", marginBottom: "10px" }}>COLAS POR NIVEL</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "1.5rem" }}>
        {data && Object.entries(data.queues).map(([lvl, info]) => {
          const c = LEVEL_COLORS[lvl]
          const pct = (info.waiting / info.needed) * 100
          return (
            <div key={lvl} style={{ background: "#1a1a22", border: "0.5px solid #333", borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: 500 }}>{lvl}</span>
                <span style={{ fontSize: "11px", background: c.bg, color: c.text, padding: "2px 8px", borderRadius: "6px" }}>
                  {info.waiting} / {info.needed} jugadores
                </span>
              </div>
              <div style={{ background: "#0f0f13", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "6px", background: c.bar, borderRadius: "4px", transition: "width 0.5s" }} />
              </div>
              {info.players.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {info.players.map((p, i) => (
                    <span key={i} style={{ fontSize: "11px", background: "#0f0f13", border: "0.5px solid #444", borderRadius: "4px", padding: "2px 6px" }}>{p}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: "12px", color: "#666", letterSpacing: "0.08em", marginBottom: "10px" }}>PARTIDAS ACTIVAS</p>
      {data?.active_matches?.length === 0 && (
        <p style={{ color: "#444", fontSize: "13px" }}>No hay partidas activas aún.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {data?.active_matches?.map(m => {
          const c = LEVEL_COLORS[m.level]
          const pct = (m.time_left / m.duration_seconds) * 100
          return (
            <div key={m.id} style={{ background: "#1a1a22", border: "0.5px solid #333", borderRadius: "12px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 500, fontSize: "13px" }}>Partida #{m.id} · {m.level}</span>
                <span style={{ fontSize: "11px", background: c.bg, color: c.text, padding: "2px 8px", borderRadius: "6px" }}>
                  {Math.floor(m.time_left / 60)}:{String(m.time_left % 60).padStart(2, "0")} restantes
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                {m.players.map((p, i) => (
                  <span key={i} style={{ fontSize: "11px", background: "#0f0f13", border: `0.5px solid ${c.bar}`, borderRadius: "4px", padding: "2px 8px", color: c.bar }}>
                    {p}
                  </span>
                ))}
              </div>
              <div style={{ background: "#0f0f13", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "6px", background: c.bar, borderRadius: "4px", transition: "width 1s linear" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ fontSize: "11px", color: "#555" }}>Tiempo restante</span>
                <span style={{ fontSize: "11px", color: "#555" }}>{m.duration_seconds}s total</span>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
    </div>
  )
}