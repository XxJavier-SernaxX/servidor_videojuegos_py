export default function HamburgerMenu({
  open,
  setOpen,
  setSection
}) {

  return (

    <>

      {/* BOTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          zIndex: 999,
          background: "#2563EB",
          border: "none",
          width: 55,
          height: 55,
          borderRadius: 14,
          color: "#fff",
          fontSize: "1.6rem",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(37,99,235,0.5)"
        }}
      >
        ☰
      </button>

      {/* MENU */}
      <div style={{
        position: "fixed",
        top: 0,
        left: open ? 0 : -320,
        width: 300,
        height: "100vh",
        background: "#0F172A",
        transition: "0.3s",
        zIndex: 998,
        padding: 25,
        boxSizing: "border-box",
        borderRight: "2px solid #1E293B"
      }}>

        <h1 style={{
          color: "#fff",
          marginBottom: 30
        }}>
          🎮 MENU
        </h1>

        <MenuButton
          text="🏠 Lobby"
          onClick={() => {
            setSection("lobby");
            setOpen(false);
          }}
        />

        <MenuButton
          text="🏆 Ranking"
          onClick={() => {
            setSection("ranking");
            setOpen(false);
          }}
        />

        <MenuButton
          text="📊 Estadísticas"
          onClick={() => {
            setSection("stats");
            setOpen(false);
          }}
        />

        <MenuButton
          text="🌙 Cambiar tema"
          onClick={() => {
            document.body.classList.toggle("light");
          }}
        />

        <div style={{
          marginTop: 40,
          color: "#64748B",
          fontSize: "0.9rem"
        }}>
          Sistema de Colas Multiplayer
        </div>

      </div>

    </>

  );

}

function MenuButton({ text, onClick }) {

  return (

    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "#111827",
        border: "1px solid #1E293B",
        color: "#fff",
        padding: 16,
        borderRadius: 14,
        marginBottom: 14,
        cursor: "pointer",
        textAlign: "left",
        fontSize: "1rem",
        transition: "0.2s"
      }}
    >
      {text}
    </button>

  );

}