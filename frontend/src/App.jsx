import { useEffect, useMemo, useState } from "react";
import { api } from "./services/api";
import MatchFound from "./components/MatchFound";
import QuizGame from "./pages/QuizGame";

const LEVELS = {
  BRONZE: { color: "#CD7F32", icon: "🥉" },
  SILVER: { color: "#C0C0C0", icon: "🥈" },
  GOLD: { color: "#FFD700", icon: "🥇" },
  DIAMOND: { color: "#38BDF8", icon: "💎" },
};

const SIZE_OPTIONS = [2, 4, 6, 8];
const SEARCH_TIMEOUT = 30;

export default function App() {
  // ================= LOGIN =================
  const [screen, setScreen] = useState("login");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [registerUser, setRegisterUser] = useState("");
  const [registerPass, setRegisterPass] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState("dark");

  // ================= SERVER =================
  const [serverStatus, setServerStatus] = useState(null);

  // ================= MATCHMAKING =================
  const [queueState, setQueueState] = useState("idle");
  const [selectedLevel, setSelectedLevel] = useState("BRONZE");
  const [selectedSize, setSelectedSize] = useState(2);
  const [searchTime, setSearchTime] = useState(SEARCH_TIMEOUT);

  // ================= PARTIDA =================
  const [matchFound, setMatchFound] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [quizScores, setQuizScores] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [winner, setWinner] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  const [showFinal, setShowFinal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);

  // ================= WEBSOCKET =================
  const [ws, setWs] = useState(null);

  // ================= TEMAS =================
  const t = theme === "dark" ? {
    bg: "#020617", card: "#0F172A", border: "#1E293B", text: "#FFFFFF", sub: "#94A3B8", accent: "#2563EB"
  } : {
    bg: "#F3F4F6", card: "#FFFFFF", border: "#D1D5DB", text: "#111827", sub: "#6B7280", accent: "#2563EB"
  };

  // ================= OBTENER STATUS =================
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getStatus();
        setServerStatus(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // ================= WEBSOCKET =================
  useEffect(() => {
    if (!currentUser) return;

    // Usar la IP correcta o localhost según el entorno
    const wsUrl = `ws://${window.location.hostname}:8000/ws/${currentUser.username}`;
    console.log("🔌 Conectando WebSocket a:", wsUrl);
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WebSocket conectado");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📨 Mensaje WS:", data.type);

      if (data.type === "match_found") {
        setMatchFound(data);
        setQueueState("match_found");
        setShowCountdown(true);
        setCountdown(3);
      }

      if (data.type === "match_start") {
        // El juego empieza después del countdown
      }

      if (data.type === "question") {
        setCurrentQuestion(data);
        setShowResults(false);
        setShowCountdown(false);
      }

      if (data.type === "answers_result") {
        setQuizScores(data.scores);
        setShowResults(true);
        setTimeout(() => setShowResults(false), 2000);
      }

      if (data.type === "match_end") {
        setWinner(data.winner);
        setPointsEarned(data.points_earned);
        setShowFinal(true);
        setCurrentQuestion(null);
        setQueueState("idle");
        setMatchFound(null);
        setShowCountdown(false);
      }

      if (data.type === "status") {
        setServerStatus(data.data);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    setWs(socket);
    return () => socket.close();
  }, [currentUser]);

  // ================= COUNTDOWN TIMER =================
  useEffect(() => {
    if (!showCountdown) return;
    if (countdown <= 0) {
      setShowCountdown(false);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, showCountdown]);

  // ================= TIMER COLA =================
  useEffect(() => {
    if (queueState !== "waiting") return;
    if (searchTime <= 0) {
      leaveQueue();
      return;
    }
    const interval = setInterval(() => {
      setSearchTime(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [queueState, searchTime]);

  // ================= LOGIN =================
  const login = async () => {
    if (!loginUser || !loginPass) {
      alert("Completa todos los campos");
      return;
    }
    try {
      const res = await api.login(loginUser, loginPass);
      setCurrentUser({
        username: loginUser,
        role: res.role,
        points: res.points || 0,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const register = async () => {
    if (!registerUser || !registerPass) {
      alert("Completa todos los campos");
      return;
    }
    try {
      await api.register(registerUser, registerPass);
      alert("Cuenta creada");
      setScreen("login");
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = () => {
    if (ws) ws.close();
    setCurrentUser(null);
    setQueueState("idle");
    setCurrentQuestion(null);
    setMatchFound(null);
    setWinner("");
    setShowFinal(false);
    setShowCountdown(false);
  };

  // ================= COLA =================
  const joinQueue = async (level, size) => {
    try {
      await api.joinQueue(currentUser.username, level, size);
      setSelectedLevel(level);
      setSelectedSize(size);
      setQueueState("waiting");
      setSearchTime(SEARCH_TIMEOUT);
    } catch (err) {
      alert(err.message);
    }
  };

  const leaveQueue = async () => {
    try {
      await api.leaveQueue(currentUser.username);
      setQueueState("idle");
      setSearchTime(SEARCH_TIMEOUT);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= RESPUESTA QUIZ =================
  const sendAnswer = (answer) => {
    if (!ws || !matchFound || !currentQuestion) return;
    ws.send(JSON.stringify({
      type: "answer",
      match_id: matchFound.match_id,
      question_idx: currentQuestion.question_number - 1,
      answer: answer,
    }));
  };

  // ================= SALAS ORDENADAS =================
  const sortedRooms = useMemo(() => {
    const queues = serverStatus?.queues || {};
    return Object.entries(queues).map(([level, room]) => {
      const players = room.players || [];
      const needed = selectedSize;
      return {
        level,
        players,
        needed,
        missing: needed - players.length,
        percent: (players.length / needed) * 100,
      };
    }).sort((a, b) => a.missing - b.missing);
  }, [serverStatus, selectedSize]);

  // ================= GET PLAYER STATS =================
  const playerStats = serverStatus?.players_status?.find(p => p.username === currentUser?.username);

  // ================= LOGIN UI =================
  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <div style={{ width: 400, background: t.card, padding: 30, borderRadius: 20, border: `2px solid ${t.border}` }}>
          <h1 style={{ textAlign: "center", color: t.text }}>🎮 MATCHMAKING</h1>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setScreen("login")} style={tabStyle(screen === "login", t)}>LOGIN</button>
            <button onClick={() => setScreen("register")} style={tabStyle(screen === "register", t)}>REGISTRO</button>
          </div>
          {screen === "login" ? (
            <>
              <input placeholder="Usuario" value={loginUser} onChange={e => setLoginUser(e.target.value)} style={inputStyle(t)} />
              <input type="password" placeholder="Contraseña" value={loginPass} onChange={e => setLoginPass(e.target.value)} style={{ ...inputStyle(t), marginTop: 15 }} />
              <button onClick={login} style={mainButton(t)}>ENTRAR</button>
              <p style={{ color: t.sub, textAlign: "center", marginTop: 15, fontSize: 12 }}>Admin: admin / 123</p>
            </>
          ) : (
            <>
              <input placeholder="Usuario" value={registerUser} onChange={e => setRegisterUser(e.target.value)} style={inputStyle(t)} />
              <input type="password" placeholder="Contraseña" value={registerPass} onChange={e => setRegisterPass(e.target.value)} style={{ ...inputStyle(t), marginTop: 15 }} />
              <button onClick={register} style={mainButton(t)}>CREAR CUENTA</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ================= MATCH FOUND CON COUNTDOWN =================
  if (showCountdown && matchFound) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "black", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", zIndex: 1000,
        animation: "fadeIn 0.3s ease"
      }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        `}</style>
        <h1 style={{ fontSize: "3rem", color: "#FBBF24", marginBottom: 20, textAlign: "center" }}>
          🎮 MATCH FOUND! 🎮
        </h1>
        <div style={{ display: "flex", gap: 20, marginBottom: 30, flexWrap: "wrap", justifyContent: "center" }}>
          {matchFound.players?.map((p, i) => (
            <div key={i} style={{ background: "#1E293B", padding: "12px 24px", borderRadius: 12, color: "#fff", fontSize: "1.2rem" }}>
              👤 {p}
            </div>
          ))}
        </div>
        <div style={{ fontSize: countdown > 0 ? "8rem" : "4rem", fontWeight: "bold", color: "#3B82F6", animation: countdown > 0 ? "bounce 1s infinite" : "none" }}>
          {countdown > 0 ? countdown : "¡COMENZANDO!"}
        </div>
        <p style={{ color: "#94A3B8", marginTop: 30 }}>Nivel: {matchFound.level} | {matchFound.size || selectedSize} jugadores</p>
      </div>
    );
  }

  // ================= QUIZ =================
  if (currentQuestion) {
    return (
      <QuizGame
        question={currentQuestion.question}
        options={currentQuestion.options}
        timeout={currentQuestion.timeout}
        questionNumber={currentQuestion.question_number}
        totalQuestions={currentQuestion.total_questions}
        level={selectedLevel}
        onAnswer={sendAnswer}
        showResult={showResults}
        scores={quizScores}
      />
    );
  }

  // ================= FINAL =================
  if (showFinal) {
    const isWinner = winner === currentUser?.username;
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <div style={{ textAlign: "center", background: t.card, borderRadius: 24, padding: 50, border: `3px solid ${isWinner ? "#FBBF24" : "#EF4444"}`, animation: "fadeIn 0.5s ease" }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
          {isWinner ? (
            <>
              <div style={{ fontSize: "5rem" }}>🏆🏆🏆</div>
              <h1 style={{ color: "#FBBF24", fontSize: "3rem" }}>¡FELICIDADES!</h1>
              <h2 style={{ color: t.text }}>¡GANASTE LA PARTIDA!</h2>
              <div style={{ background: LEVELS[selectedLevel]?.color || t.accent, padding: 15, borderRadius: 16, margin: "20px 0" }}>
                <p style={{ fontSize: "1.2rem" }}>Nivel {selectedLevel}</p>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>+{pointsEarned} puntos</p>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "5rem" }}>😢</div>
              <h1 style={{ color: "#94A3B8", fontSize: "2.5rem" }}>¡POR POCO!</h1>
              <h2 style={{ color: "#FBBF24" }}>Ganó: {winner}</h2>
              <div style={{ background: "#1E293B", padding: 15, borderRadius: 16, margin: "20px 0" }}>
                <p>Puntuación del ganador: {quizScores[winner] || 0} pts</p>
                <p>Tu puntuación: {quizScores[currentUser?.username] || 0} pts</p>
              </div>
            </>
          )}
          <button onClick={() => { setShowFinal(false); setMatchFound(null); setWinner(""); }} style={mainButton(t)}>VOLVER AL LOBBY</button>
        </div>
      </div>
    );
  }

  // ================= ADMIN PANEL =================
  if (currentUser?.role === "admin") {
    const queuePlayers = Object.values(serverStatus?.queues || {}).reduce((acc, q) => acc + (q.players?.length || 0), 0);
    return (
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <h1>🛠 PANEL ADMIN</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={secondaryButton(t)}>
              {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
            </button>
            <button onClick={logout} style={logoutBtn}>Salir</button>
          </div>
        </div>
        
        <div style={gridStyle}>
          <AdminCard title="👥 Online" value={serverStatus?.online_players || 0} />
          <AdminCard title="⏳ En cola" value={queuePlayers} />
          <AdminCard title="🎮 Jugando" value={serverStatus?.playing_players || 0} />
          <AdminCard title="⚔️ Partidas" value={serverStatus?.active_matches?.length || 0} />
        </div>
        
        <h2 style={{ marginTop: 30 }}>🎯 ESTADO DE SALAS</h2>
        {Object.entries(serverStatus?.queues || {}).map(([level, room]) => (
          <div key={level} style={roomStyle(t)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>{LEVELS[level]?.icon} {level}</h2>
              <p>{room.players?.length || 0} jugadores en cola</p>
            </div>
            <div style={{ marginTop: 10 }}>
              {room.players?.map(player => (
                <div key={player.username} style={playerStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>👤 {player.username}</span>
                    <span>🎯 Tamaño: {player.size}</span>
                    <span>⏱ Espera: {player.waiting_time}s</span>
                  </div>
                </div>
              ))}
              {(!room.players || room.players.length === 0) && (
                <p style={{ color: t.sub }}>Sin jugadores en cola</p>
              )}
            </div>
          </div>
        ))}
        
        <h2 style={{ marginTop: 30 }}>⚔️ PARTIDAS ACTIVAS</h2>
        {serverStatus?.active_matches?.map(match => (
          <div key={match.id} style={roomStyle(t)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>Partida #{match.id}</h3>
              <span style={{ color: match.status === "active" ? "#10B981" : "#FBBF24" }}>
                {match.status === "active" ? "🟢 EN CURSO" : "⏳ ESPERANDO"}
              </span>
            </div>
            <p>Nivel: {match.level}</p>
            <p>Jugadores: {match.players?.join(", ")}</p>
            {match.status === "active" && (
              <>
                <p>⏱ Tiempo restante: {match.time_left}s</p>
                <p>📝 Pregunta: {match.current_question}/{match.total_questions}</p>
              </>
            )}
            {Object.keys(match.scores || {}).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Puntuaciones:</strong>
                {Object.entries(match.scores).map(([p, s]) => (
                  <div key={p}>• {p}: {s} pts</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {(!serverStatus?.active_matches || serverStatus.active_matches.length === 0) && (
          <p style={{ color: t.sub }}>No hay partidas activas</p>
        )}
        
        <h2 style={{ marginTop: 30 }}>⭐ TOP JUGADORES</h2>
        {serverStatus?.leaderboard?.map((p, idx) => (
          <div key={p.username} style={{ ...playerStyle, display: "flex", justifyContent: "space-between" }}>
            <span>{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx+1}°`} {p.username}</span>
            <span>⭐ {p.points} pts</span>
            <span>🏆 {p.wins} wins</span>
          </div>
        ))}
      </div>
    );
  }

  // ================= PLAYER PANEL =================
  const roomForLevel = serverStatus?.queues?.[selectedLevel];
  const playersInQueue = roomForLevel?.players || [];
  const waitingCount = playersInQueue.length;
  const currentSize = selectedSize;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <div>
          <h1>🎮 MATCHMAKING</h1>
          <p>Jugador: {currentUser?.username}</p>
          <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
            <p style={{ color: LEVELS[selectedLevel]?.color }}>🏆 Nivel: {selectedLevel}</p>
            <p>⭐ Puntos: {playerStats?.points || currentUser?.points || 0}</p>
            <p>🏅 Victorias: {playerStats?.wins || 0}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={secondaryButton(t)}>
            {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
          <button onClick={logout} style={logoutBtn}>Salir</button>
        </div>
      </div>

      {/* Configurar partida */}
      <div style={roomStyle(t)}>
        <h2>🎯 CONFIGURAR PARTIDA</h2>
        <p>Nivel:</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.keys(LEVELS).map(level => (
            <button key={level} onClick={() => setSelectedLevel(level)} style={{
              background: selectedLevel === level ? LEVELS[level].color : "#1E293B",
              border: "none", padding: "12px 20px", borderRadius: 12, cursor: "pointer", color: "#fff", fontWeight: "bold"
            }}>{LEVELS[level].icon} {level}</button>
          ))}
        </div>
        <p style={{ marginTop: 20 }}>Jugadores por sala:</p>
        <div style={{ display: "flex", gap: 10 }}>
          {SIZE_OPTIONS.map(size => (
            <button key={size} onClick={() => setSelectedSize(size)} style={{
              background: selectedSize === size ? t.accent : "#1E293B",
              border: "none", padding: "12px 20px", borderRadius: 12, cursor: "pointer", color: "#fff", fontWeight: "bold"
            }}>{size}</button>
          ))}
        </div>
        <button onClick={() => joinQueue(selectedLevel, selectedSize)} disabled={queueState === "waiting"} style={{ ...mainButton(t), marginTop: 25, opacity: queueState === "waiting" ? 0.6 : 1 }}>
          {queueState === "idle" ? "🔥 BUSCAR PARTIDA" : "⏳ ESPERANDO JUGADORES..."}
        </button>
      </div>

      {/* Salas activas con barras de progreso */}
      <div style={{ marginTop: 40 }}>
        <h2>🚀 SALAS ACTIVAS</h2>
        {sortedRooms.map(room => (
          <div key={room.level} style={roomStyle(t)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>{LEVELS[room.level]?.icon} {room.level}</h2>
              <h2>{room.players.length}/{room.needed}</h2>
            </div>
            <div style={{ background: "#1E293B", height: 14, borderRadius: 20, overflow: "hidden", marginTop: 10 }}>
              <div style={{ width: `${room.percent}%`, height: "100%", background: LEVELS[room.level]?.color, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ marginTop: 15 }}>
              {room.players.map(player => (
                <div key={player.username} style={playerStyle}>
                  👤 {player.username} (espera: {player.waiting_time}s)
                </div>
              ))}
            </div>
            {room.missing > 0 && <p style={{ color: t.sub, marginTop: 10 }}>Faltan {room.missing} jugadores para comenzar</p>}
          </div>
        ))}
      </div>

      {/* Pantalla de espera con barra de progreso */}
      {queueState === "waiting" && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: t.card, padding: 20, textAlign: "center", borderTop: `2px solid ${t.border}` }}>
          <h3>🔍 BUSCANDO PARTIDA - {selectedLevel} | {selectedSize} jugadores</h3>
          <div style={{ width: "100%", maxWidth: 400, margin: "10px auto", background: "#1E293B", height: 10, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ width: `${(searchTime / SEARCH_TIMEOUT) * 100}%`, height: "100%", background: searchTime <= 5 ? "#EF4444" : LEVELS[selectedLevel]?.color, transition: "width 1s linear" }} />
          </div>
          <p>Tiempo de espera: {searchTime}s</p>
          <p>Jugadores en tu sala: {waitingCount}/{currentSize}</p>
          <button onClick={leaveQueue} style={cancelBtn}>❌ Cancelar</button>
        </div>
      )}
    </div>
  );
}

// ================= COMPONENTES =================
function AdminCard({ title, value }) {
  return (
    <div style={{ background: "#111827", padding: 25, borderRadius: 20 }}>
      <h3>{title}</h3>
      <h1 style={{ fontSize: "3rem", color: "#3B82F6" }}>{value}</h1>
    </div>
  );
}

// ================= ESTILOS =================
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 };
const roomStyle = (t) => ({ background: t.card, border: `2px solid ${t.border}`, padding: 25, borderRadius: 20, marginTop: 20 });
const playerStyle = { background: "#1E293B", padding: "10px 14px", borderRadius: 12, marginTop: 10 };
const inputStyle = (t) => ({ width: "100%", background: t.bg, color: t.text, border: `2px solid ${t.border}`, padding: 15, borderRadius: 12, boxSizing: "border-box" });
const mainButton = (t) => ({ width: "100%", background: t.accent, color: "#fff", border: "none", padding: 16, borderRadius: 14, fontWeight: "bold", cursor: "pointer" });
const secondaryButton = (t) => ({ background: t.card, border: `2px solid ${t.border}`, color: t.text, padding: "10px 18px", borderRadius: 12, cursor: "pointer" });
const logoutBtn = { background: "#EF4444", border: "none", padding: "12px 20px", borderRadius: 12, color: "#fff", cursor: "pointer" };
const cancelBtn = { background: "#EF4444", border: "none", padding: "12px 24px", borderRadius: 12, color: "#fff", cursor: "pointer", marginTop: 10 };
const tabStyle = (active, t) => ({ flex: 1, padding: 14, border: "none", borderRadius: 12, background: active ? t.accent : t.border, color: "#fff", fontWeight: "bold", cursor: "pointer" });