# 🎮 Servidor de Videojuego con Colas — Python

Proyecto universitario que simula un servidor de matchmaking usando colas (queues) en Python con FastAPI y React.

## ¿Qué hace?
- Gestiona colas de espera separadas por nivel: Bronze, Silver, Gold y Diamond
- Cuando 4 jugadores del mismo nivel se unen, se forma una partida automáticamente
- El dashboard muestra en tiempo real el estado de las colas y partidas activas

---

## Requisitos previos

Instalar antes de todo:

- [Python 3.11+](https://www.python.org/downloads/) — marcar ✅ "Add Python to PATH"
- [Node.js 18+](https://nodejs.org/) — descargar la versión LTS
- [Git](https://git-scm.com/downloads)

---

## Instalación desde cero

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

### 2. Configurar el backend
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar el frontend
```bash
cd ../fronted/src
npm install
```

---

## Cómo ejecutar

Necesitas **2 terminales abiertas al mismo tiempo**.

### Terminal 1 — Backend
```bash
cd backend
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
uvicorn main:app --reload
```
Servidor corriendo en: http://localhost:8000  
Documentación API: http://localhost:8000/docs

### Terminal 2 — Frontend
```bash
cd fronted/src
npm run dev
```
Dashboard en: http://localhost:5173

---

## Cómo usar

1. Abre http://localhost:5173
2. Escribe un nombre y selecciona un nivel
3. Haz clic en **Unirse →**
4. Repite hasta tener 4 jugadores del mismo nivel
5. La partida arranca automáticamente y se ve en tiempo real

---

## Estructura del proyecto
├── backend/
│   ├── main.py          # API con FastAPI + WebSocket
│   ├── models.py        # Clases Player, Match, Level
│   ├── queues.py        # Lógica de colas con asyncio.Queue
│   └── requirements.txt
└── fronted/src/
└── App.jsx          # Dashboard en React

## Integrantes
- Javier Serna — 192546
- Juan Garrido — 192544


