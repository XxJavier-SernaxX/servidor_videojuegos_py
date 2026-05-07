from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json, time
from models import Player, Level
from queues import add_player, matchmaking_loop, get_queue_status, active_matches, completed_matches

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start matchmaking loop on startup
@app.on_event("startup")
async def startup():
    asyncio.create_task(matchmaking_loop())

# Endpoint: unirse a cola
@app.post("/join")
async def join_queue(name: str, level: str):
    try:
        lvl = Level[level.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Nivel '{level}' no válido. Usa Bronze, Silver, Gold o Diamond.")

    player = Player(name=name, level=lvl)
    await add_player(player)
    return {"message": f"{name} entró a la cola {level}", "player_id": player.id}

# Endpoint: estado
@app.get("/status")
def status():
    return {
        "queues": get_queue_status(),
        "active_matches": [
            {
                "id": m.id,
                "level": m.level.name,
                "players": [p.name for p in m.players],
                "duration_seconds": m.duration,
                "time_left": max(0, int(m.duration - (time.time() - m.started_at)))
            }
            for m in active_matches
        ],
        "completed_total": len(completed_matches)
    }

# WebSocket
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = {
                "queues": get_queue_status(),
                "active_matches": [
                    {
                        "id": m.id,
                        "level": m.level.name,
                        "players": [p.name for p in m.players],
                        "duration_seconds": m.duration,
                        "time_left": max(0, int(m.duration - (time.time() - m.started_at)))
                    }
                    for m in active_matches
                ],
                "completed_total": len(completed_matches)
            }
            await ws.send_text(json.dumps(data))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Cliente WebSocket desconectado")

# Optional: home
@app.get("/")
def home():
    return {"message": "Servidor de matchmaking activo 🚀"}