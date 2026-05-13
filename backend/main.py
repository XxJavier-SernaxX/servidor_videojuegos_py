from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import asyncio
import json
import uuid
import time
import os
from enum import Enum
from dataclasses import dataclass, field

# ================= MODELOS =================
class Level(str, Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    DIAMOND = "DIAMOND"

@dataclass
class Player:
    username: str
    password: str = ""
    points: int = 0
    wins: int = 0
    matches_played: int = 0
    level: Level = Level.BRONZE
    status: str = "offline"
    current_match: Optional[str] = None
    joined_queue_at: Optional[float] = None

@dataclass
class Match:
    id: str
    players: List[str]
    level: Level
    questions: List[Dict]
    current_question: int = 0
    scores: Dict[str, int] = field(default_factory=dict)
    answers: Dict[str, Dict] = field(default_factory=dict)
    started_at: float = field(default_factory=time.time)
    status: str = "waiting"
    winner: Optional[str] = None
    size: int = 2

# ================= CONFIGURACION =================
DEFAULT_SIZE = 2
MATCH_DURATION = {
    Level.BRONZE: 5,
    Level.SILVER: 4,
    Level.GOLD: 3,
    Level.DIAMOND: 2,
}
POINTS_PER_LEVEL = {
    Level.BRONZE: 10,
    Level.SILVER: 20,
    Level.GOLD: 30,
    Level.DIAMOND: 50,
}

# ================= COLAS =================
# Cada cola ahora guarda tuplas (username, size, joined_time)
queues: Dict[Level, List[Dict]] = {
    Level.BRONZE: [],
    Level.SILVER: [],
    Level.GOLD: [],
    Level.DIAMOND: [],
}

# ================= PREGUNTAS =================
QUESTIONS = {
    Level.BRONZE: [
        {"question": "¿Cuánto es 2 + 2?", "options": ["3", "4", "5", "6"], "correct": 1},
        {"question": "¿Qué color es el cielo?", "options": ["Verde", "Rojo", "Azul", "Amarillo"], "correct": 2},
        {"question": "¿Cuál es la capital de España?", "options": ["Barcelona", "Madrid", "Valencia", "Sevilla"], "correct": 1},
    ],
    Level.SILVER: [
        {"question": "¿Cuánto es 10 × 10?", "options": ["10", "50", "100", "1000"], "correct": 2},
        {"question": "¿Quién pintó la Mona Lisa?", "options": ["Van Gogh", "Picasso", "Dalí", "Da Vinci"], "correct": 3},
        {"question": "¿Cuál es el río más largo del mundo?", "options": ["Amazonas", "Nilo", "Yangtsé", "Misisipi"], "correct": 0},
    ],
    Level.GOLD: [
        {"question": "¿Cuál es la raíz cuadrada de 144?", "options": ["10", "11", "12", "13"], "correct": 2},
        {"question": "¿En qué año llegó el hombre a la luna?", "options": ["1967", "1968", "1969", "1970"], "correct": 2},
        {"question": "¿Quién escribió 'Cien años de soledad'?", "options": ["Mario Vargas Llosa", "Gabriel García Márquez", "Julio Cortázar", "Pablo Neruda"], "correct": 1},
    ],
    Level.DIAMOND: [
        {"question": "¿Cuál es el número de Euler?", "options": ["2.71828", "3.14159", "1.61803", "0.57721"], "correct": 0},
        {"question": "¿En qué año cayó el Imperio Romano de Occidente?", "options": ["395", "410", "476", "565"], "correct": 2},
        {"question": "¿Quién descubrió la penicilina?", "options": ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Isaac Newton"], "correct": 1},
    ],
}

# ================= APP =================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATOS =================
users: Dict[str, Player] = {}
active_matches: Dict[str, Match] = {}
matches_history: List[Match] = []
web_sockets: Dict[str, WebSocket] = {}

# ================= ARCHIVOS =================
def load_users():
    if os.path.exists("users.json"):
        with open("users.json", "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                for username, user_data in data.items():
                    users[username] = Player(
                        username=user_data["username"],
                        password=user_data["password"],
                        points=user_data.get("points", 0),
                        wins=user_data.get("wins", 0),
                        matches_played=user_data.get("matches_played", 0),
                        level=Level(user_data.get("level", "BRONZE")),
                        status=user_data.get("status", "offline"),
                        current_match=user_data.get("current_match"),
                        joined_queue_at=user_data.get("joined_queue_at")
                    )
            except:
                pass

def save_users():
    with open("users.json", "w", encoding="utf-8") as f:
        data = {}
        for username, user in users.items():
            data[username] = {
                "username": user.username,
                "password": user.password,
                "points": user.points,
                "wins": user.wins,
                "matches_played": user.matches_played,
                "level": user.level.value,
                "status": user.status,
                "current_match": user.current_match,
                "joined_queue_at": user.joined_queue_at
            }
        json.dump(data, f, indent=2, ensure_ascii=False)

# Cargar usuarios
load_users()

# Crear admin si no existe
if "admin" not in users:
    users["admin"] = Player(username="admin", password="123", status="online")
    save_users()

# ================= ENDPOINTS =================
@app.post("/register")
async def register(username: str, password: str):
    if username in users:
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    
    users[username] = Player(username=username, password=password)
    save_users()
    return {"message": "Usuario creado"}

@app.post("/login")
async def login(username: str, password: str):
    if username not in users:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if users[username].password != password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    users[username].status = "online"
    save_users()
    
    role = "admin" if username == "admin" else "player"
    return {"message": "Login exitoso", "role": role, "points": users[username].points}

@app.post("/join_queue")
async def join_queue(username: str, level: str, size: int = 2):
    if username not in users:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    try:
        level_enum = Level(level)
    except ValueError:
        raise HTTPException(status_code=400, detail="Nivel inválido")
    
    user = users[username]
    if user.status != "online":
        raise HTTPException(status_code=400, detail="Usuario no está disponible")
    
    # Remover de otras colas
    for lvl in queues:
        queues[lvl] = [p for p in queues[lvl] if p["username"] != username]
    
    user.status = "queue"
    user.joined_queue_at = time.time()
    user.level = level_enum
    queues[level_enum].append({
        "username": username,
        "size": size,
        "joined_at": time.time()
    })
    save_users()
    
    print(f"📊 {username} se unió a cola {level} con tamaño {size}")
    
    # Intentar crear match
    asyncio.create_task(try_create_match(level_enum, size))
    
    return {"message": f"Unido a cola {level}"}

@app.post("/leave_queue")
async def leave_queue(username: str):
    if username not in users:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user = users[username]
    if user.status == "queue":
        for level in queues:
            queues[level] = [p for p in queues[level] if p["username"] != username]
        user.status = "online"
        save_users()
    
    return {"message": "Saliste de la cola"}

@app.get("/status")
async def get_status():
    now = time.time()
    return {
        "queues": {
            level.value: {
                "waiting": len(queues[level]),
                "players": [
                    {
                        "username": p["username"],
                        "size": p["size"],
                        "waiting_time": int(now - p["joined_at"])
                    }
                    for p in queues[level]
                ],
                "needed_players": DEFAULT_SIZE
            }
            for level in queues
        },
        "active_matches": [
            {
                "id": m.id,
                "players": m.players,
                "level": m.level.value,
                "status": m.status,
                "scores": m.scores,
                "time_left": max(0, int(MATCH_DURATION[m.level] * 3 - (now - m.started_at))) if m.status == "active" else 0,
                "current_question": m.current_question + 1 if m.status == "active" else 0,
                "total_questions": len(m.questions)
            }
            for m in active_matches.values()
        ],
        "online_players": len([u for u in users.values() if u.status in ["online", "queue", "playing"]]),
        "queue_players": sum(len(queues[l]) for l in queues),
        "playing_players": len([u for u in users.values() if u.status == "playing"]),
        "players_status": [
            {
                "username": u.username,
                "status": u.status,
                "points": u.points,
                "wins": u.wins
            }
            for u in users.values() if u.username != "admin"
        ],
        "leaderboard": sorted(
            [{"username": u.username, "points": u.points, "wins": u.wins} 
             for u in users.values() if u.username != "admin"],
            key=lambda x: x["points"],
            reverse=True
        )[:10],
        "recent_matches": [
            {
                "id": m.id,
                "winner": m.winner,
                "level": m.level.value,
                "players": m.players,
                "scores": m.scores
            }
            for m in matches_history[-10:]
        ]
    }

# ================= MATCHMAKING =================
async def try_create_match(level: Level, target_size: int):
    await asyncio.sleep(0.5)
    
    # Agrupar jugadores por tamaño
    players_by_size = {}
    for p in queues[level]:
        size = p["size"]
        if size not in players_by_size:
            players_by_size[size] = []
        players_by_size[size].append(p["username"])
    
    # Buscar grupo con suficiente jugadores
    for size, players_list in players_by_size.items():
        if len(players_list) >= size:
            selected_players = players_list[:size]
            
            # Remover jugadores seleccionados de la cola
            remaining = []
            for p in queues[level]:
                if p["username"] not in selected_players:
                    remaining.append(p)
            queues[level] = remaining
            
            match_id = str(uuid.uuid4())[:8]
            match = Match(
                id=match_id,
                players=selected_players,
                level=level,
                questions=QUESTIONS[level][:3],
                size=size
            )
            
            active_matches[match_id] = match
            
            for player_name in selected_players:
                users[player_name].status = "playing"
                users[player_name].current_match = match_id
            
            save_users()
            
            print(f"✅ Match creado: {match_id} - {selected_players} (tamaño {size})")
            
            await broadcast_to_players(selected_players, {
                "type": "match_found",
                "match_id": match.id,
                "players": match.players,
                "level": match.level.value,
                "size": size
            })
            
            asyncio.create_task(start_match_countdown(match_id))
            return
    
    # Si no se encontró grupo, reintentar más tarde
    if queues[level]:
        asyncio.create_task(try_create_match(level, target_size))

async def start_match_countdown(match_id: str):
    await asyncio.sleep(3)
    if match_id in active_matches:
        match = active_matches[match_id]
        match.status = "active"
        match.started_at = time.time()
        await broadcast_to_players(match.players, {
            "type": "match_start",
            "match_id": match_id
        })
        asyncio.create_task(run_quiz(match_id))

async def run_quiz(match_id: str):
    match = active_matches[match_id]
    print(f"🎮 Iniciando quiz match {match_id}")
    
    for q_idx, question in enumerate(match.questions):
        match.current_question = q_idx
        
        await broadcast_to_players(match.players, {
            "type": "question",
            "question": question["question"],
            "options": question["options"],
            "timeout": MATCH_DURATION[match.level],
            "question_number": q_idx + 1,
            "total_questions": len(match.questions),
            "level": match.level.value
        })
        
        await asyncio.sleep(MATCH_DURATION[match.level])
        
        correct_answer = question["correct"]
        
        for player_name in match.players:
            if player_name in match.answers and q_idx in match.answers[player_name]:
                if match.answers[player_name][q_idx] == correct_answer:
                    match.scores[player_name] = match.scores.get(player_name, 0) + 10
        
        await broadcast_to_players(match.players, {
            "type": "answers_result",
            "correct_answer": correct_answer,
            "scores": match.scores
        })
        
        await asyncio.sleep(2)
    
    await finish_match(match_id)

async def finish_match(match_id: str):
    if match_id not in active_matches:
        return
    
    match = active_matches[match_id]
    
    if match.scores:
        winner = max(match.scores.items(), key=lambda x: x[1])[0]
        match.winner = winner
        points = POINTS_PER_LEVEL[match.level]
        users[winner].points += points
        users[winner].wins += 1
    
    for player_name in match.players:
        users[player_name].matches_played += 1
        users[player_name].status = "online"
        users[player_name].current_match = None
    
    save_users()
    
    for player_name in match.players:
        points_earned = POINTS_PER_LEVEL[match.level] if player_name == match.winner else 0
        await send_to_player(player_name, {
            "type": "match_end",
            "winner": match.winner,
            "scores": match.scores,
            "points_earned": points_earned,
            "level": match.level.value
        })
    
    matches_history.append(match)
    del active_matches[match_id]

# ================= WEBSOCKET =================
async def broadcast_to_players(players: List[str], message: dict):
    for player_name in players:
        await send_to_player(player_name, message)

async def send_to_player(player_name: str, message: dict):
    if player_name in web_sockets:
        try:
            await web_sockets[player_name].send_text(json.dumps(message))
        except:
            pass

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    web_sockets[username] = websocket
    print(f"🔌 Conectado: {username}")
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                if json_data.get("type") == "answer":
                    match_id = json_data.get("match_id")
                    question_idx = json_data.get("question_idx")
                    answer = json_data.get("answer")
                    
                    if match_id in active_matches:
                        match = active_matches[match_id]
                        if username in match.players:
                            if username not in match.answers:
                                match.answers[username] = {}
                            if question_idx not in match.answers[username]:
                                match.answers[username][question_idx] = answer
                                print(f"📝 {username} respondió: {answer}")
            except:
                pass
    except:
        pass
    finally:
        if username in web_sockets:
            del web_sockets[username]
        print(f"🔌 Desconectado: {username}")