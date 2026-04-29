from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio, json
from models import Player, Level
from queues import add_player, matchmaking_loop, get_queue_status, active_matches

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.on_event("startup")
async def startup():
    asyncio.create_task(matchmaking_loop())

@app.post("/join")
async def join_queue(name: str, level: str):
    player = Player(name=name, level=Level[level.upper()])
    await add_player(player)
    return {"message": f"{name} entró a la cola {level}", "player_id": player.id}

@app.get("/status")
def status():
    return {
        "queues": get_queue_status(),
        "active_matches": len(active_matches),
    }

# WebSocket para actualizar el frontend en tiempo real
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    while True:
        data = {
            "queues": get_queue_status(),
            "active_matches": [
                {"id": m.id, "level": m.level.name, "players": len(m.players)}
                for m in active_matches
            ]
        }
        await ws.send_text(json.dumps(data))
        await asyncio.sleep(1)