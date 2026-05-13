import { useEffect, useState } from "react";

export default function MatchFound({ players, level, onStart }) {

  const [count, setCount] = useState(3);

  useEffect(() => {

    if (count <= 0) {

      setTimeout(() => {
        onStart();
      }, 800);

      return;
    }

    const timer = setTimeout(() => {
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);

  }, [count]);

  return (

    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#020617,#0F172A)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#fff",
      overflow: "hidden",
      position: "relative"
    }}>

      {/* EFECTOS */}
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "#2563EB33",
        filter: "blur(100px)"
      }} />

      <div style={{
        textAlign: "center",
        zIndex: 10
      }}>

        <h1 style={{
          fontSize: "4rem",
          marginBottom: 10
        }}>
          ⚔️ PARTIDA ENCONTRADA
        </h1>

        <h2 style={{
          color: "#38BDF8",
          marginBottom: 30
        }}>
          Sala {level}
        </h2>

        <div style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: 40
        }}>

          {players.map((p, i) => (

            <div
              key={i}
              style={{
                background: "#111827",
                border: "2px solid #2563EB",
                borderRadius: 20,
                padding: 20,
                minWidth: 200
              }}
            >

              <h2 style={{
                margin: 0,
                color: "#38BDF8"
              }}>
                👤 {p}
              </h2>

            </div>

          ))}

        </div>

        <h1 style={{
          fontSize: "8rem",
          margin: 0,
          color: count === 0 ? "#10B981" : "#FBBF24",
          textShadow: "0 0 40px rgba(255,255,255,0.4)"
        }}>
          {count <= 0 ? "GO!" : count}
        </h1>

        <h2 style={{
          marginTop: 20
        }}>
          {players.length}/{players.length} jugadores listos
        </h2>

      </div>

    </div>

  );

}