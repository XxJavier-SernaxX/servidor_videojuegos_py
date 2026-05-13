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
  const [selected, setSelected] = useState(null);
  
  useEffect(() => {
    setTimeLeft(timeout);
    setSelected(null);
  }, [questionNumber, timeout]);
  
  useEffect(() => {
    if (timeLeft > 0 && !selected) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selected) {
      onAnswer(null);
    }
  }, [timeLeft, selected, onAnswer]);
  
  const handleAnswer = (index) => {
    if (!selected) {
      setSelected(index);
      onAnswer(index);
    }
  };
  
  const levelColor = LEVEL_COLORS[level] || "#3B82F6";
  
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "900px",
        width: "100%",
        background: "#0F172A",
        borderRadius: "24px",
        padding: "40px",
        border: `3px solid ${levelColor}`,
        boxShadow: `0 0 20px ${levelColor}40`
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <span style={{ color: "#94A3B8" }}>
              Pregunta {questionNumber}/{totalQuestions}
            </span>
            <div style={{
              marginTop: "8px",
              color: levelColor,
              fontWeight: "bold"
            }}>
              Nivel: {level}
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
            textAlign: "center"
          }}>
            {timeLeft}s
          </div>
        </div>
        
        <h1 style={{
          fontSize: "1.8rem",
          color: "#fff",
          marginBottom: "40px",
          lineHeight: "1.4"
        }}>
          {question}
        </h1>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "15px"
        }}>
          {options && options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              style={{
                background: selected === idx 
                  ? "#10B981" 
                  : selected !== null
                    ? "#475569"
                    : "#1E293B",
                color: "#fff",
                padding: "18px",
                borderRadius: "16px",
                border: `2px solid ${selected === idx ? "#10B981" : levelColor}`,
                fontSize: "1.1rem",
                cursor: selected ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.3s",
                fontWeight: selected === idx ? "bold" : "normal"
              }}
            >
              <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
      
      {showResult && scores && Object.keys(scores).length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          right: "20px",
          background: "#0F172A",
          border: "2px solid #3B82F6",
          borderRadius: "12px",
          padding: "15px",
          textAlign: "center",
          animation: "slideUp 0.3s ease"
        }}>
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
          <h3 style={{ margin: 0, color: "#FBBF24" }}>📊 Puntuaciones</h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
            {Object.entries(scores).map(([player, score]) => (
              <div key={player} style={{ color: "#fff" }}>
                {player}: <strong style={{ color: "#10B981" }}>{score}</strong> pts
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}