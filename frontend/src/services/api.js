// Detectar la IP del servidor automáticamente
const getBaseUrl = () => {
  // Si estamos en localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  // Si no, usar la IP del servidor (cambia esto por la IP de tu servidor)
  return `http://${window.location.hostname}:8000`;
};

const API_URL = getBaseUrl();

export const api = {
  async register(username, password) {
    const url = `${API_URL}/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    console.log("📝 Registro URL:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error en registro");
    return data;
  },
  
  async login(username, password) {
    const url = `${API_URL}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    console.log("🔐 Login URL:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error en login");
    return data;
  },
  
  async joinQueue(username, level, size = 2) {
    const url = `${API_URL}/join_queue?username=${encodeURIComponent(username)}&level=${level}&size=${size}`;
    console.log("🎮 JoinQueue URL:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error al unirse a la cola");
    return data;
  },
  
  async leaveQueue(username) {
    const url = `${API_URL}/leave_queue?username=${encodeURIComponent(username)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    const data = await res.json();
    return data;
  },
  
  async getStatus() {
    const url = `${API_URL}/status`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  }
};