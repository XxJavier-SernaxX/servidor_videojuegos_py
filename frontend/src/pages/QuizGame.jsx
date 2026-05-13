import { useState, useEffect } from "react";

const LEVEL_COLORS = {
  BRONZE: "#C17A2C",
  SILVER: "#9CA3AF",
  GOLD: "#FBBF24",
  DIAMOND: "#38BDF8"
};

export default function QuizGame({ 
  question, 
  options, 
  timeout, 
  questionNumber, 
  totalQuestions,
  level,
  onAnswer,
  showResult,
  scores
}) {
  const [timeLeft, setTimeLeft] = useState(timeout);
  const [selected, setSelected] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Resetear cuando cambia la pregunta
  useEffect(() => {
    setTimeLeft(timeout);
    setSelected(false);
    setSelectedAnswer(null);
  }, [questionNumber, timeout]);
  
  // Temporizador - sigue corriendo aunque ya haya respondido
  useEffect(() => {
    if (timeLeft <= 0) {
      if (!selected) {
        onAnswer(null);
        setSelected(true);
      }
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, selected, onAnswer]);
  
  const handleAnswer = (index) => {
    if (!selected) {
      setSelected(true);
      setSelectedAnswer(index);
      onAnswer(index);
    }
  };
  
  const levelColor = LEVEL_COLORS[level] || "#3B82F6";
  
  // Obtener puntuaciones ordenadas
  const sortedScores = scores ? Object.entries(scores).sort((a, b) => b[1] - a[1]) : [];
  // Encontrar líder (quien va primero)
  const leader = sortedScores.length > 0 ? sortedScores[0][0] : null;
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "Segoe UI, sans-serif"
    }}>
      <div style={{
        maxWidth: "900px",
        width: "100%",
        background: "#0F172A",
        borderRadius: "24px",
        padding: "40px",
        border: `3px solid ${levelColor}`,
        boxShadow: `0 0 20px ${levelColor}40`,
        position: "relative"
      }}>
        {/* Header con contador */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <span style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
              Pregunta {questionNumber} de {totalQuestions}
            </span>
            <div style={{
              marginTop: "8px",
              color: levelColor,
              fontWeight: "bold",
              fontSize: "1.1rem"
            }}>
              🎯 Nivel: {level}
            </div>
          </div>
          <div style={{ 
            background: timeLeft <= 3 ? "#EF4444" : levelColor,
            padding: "10px 20px",
            borderRadius: "12px",
            fontSize: "2rem",
            fontWeight: "bold",
            color: "#fff",
            minWidth: "80px",
            textAlign: "center",
            transition: "all 0.3s"
          }}>
            {timeLeft}s
          </div>
        </div>
        
        {/* Pregunta */}
        <h1 style={{
          fontSize: "1.8rem",
          color: "#fff",
          marginBottom: "40px",
          lineHeight: "1.4",
          textAlign: "center"
        }}>
          {question}
        </h1>
        
        {/* Opciones de respuesta */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "15px"
        }}>
          {options && options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected}
              style={{
                background: selectedAnswer === idx 
                  ? "#10B981" 
                  : selected && selectedAnswer !== idx
                    ? "#475569"
                    : "#1E293B",
                color: "#fff",
                padding: "18px",
                borderRadius: "16px",
                border: `2px solid ${selectedAnswer === idx ? "#10B981" : levelColor}`,
                fontSize: "1rem",
                cursor: selected ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.3s",
                fontWeight: selectedAnswer === idx ? "bold" : "normal",
                opacity: selected && selectedAnswer !== idx ? 0.5 : 1
              }}
            >
              <span style={{ 
                fontWeight: "bold", 
                marginRight: "15px",
                fontSize: "1.2rem",
                display: "inline-block",
                width: "30px"
              }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
        
        {/* Mensaje de espera mientras termina el tiempo */}
        {selected && timeLeft > 0 && (
          <div style={{
            marginTop: "30px",
            textAlign: "center",
            padding: "15px",
            background: "#1E293B",
            borderRadius: "12px",
            color: "#FBBF24",
            animation: "pulse 1s infinite"
          }}>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>
            ⏳ Esperando a los demás jugadores... {timeLeft}s
          </div>
        )}
      </div>
      
      {/* Panel de puntuaciones que aparece después de cada pregunta */}
      {showResult && scores && Object.keys(scores).length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          right: "20px",
          background: "#0F172A",
          border: `2px solid ${levelColor}`,
          borderRadius: "12px",
          padding: "15px 20px",
          textAlign: "center",
          animation: "slideUp 0.3s ease",
          zIndex: 100
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <h3 style={{ margin: 0, color: "#FBBF24", fontSize: "1rem" }}>📊 Puntuaciones después de la pregunta {questionNumber}</h3>
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: "20px", 
            marginTop: "10px", 
            flexWrap: "wrap" 
          }}>
            {sortedScores.map(([player, score]) => (
              <div key={player} style={{ 
                color: "#fff", 
                fontSize: "0.9rem",
                padding: "4px 12px",
                borderRadius: "20px",
                background: player === leader ? "#FBBF2440" : "transparent"
              }}>
                {player === leader && "👑 "}
                {player}: <strong style={{ color: "#10B981" }}>{score}</strong> pts
                {player === leader && " (líder)"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}