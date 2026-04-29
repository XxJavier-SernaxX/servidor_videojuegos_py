import asyncio
from models import Player, Match, Level, MATCH_DURATION, PLAYERS_NEEDED

# Una cola por nivel — aquí está el corazón del tema
queues: dict[Level, asyncio.Queue] = {
    level: asyncio.Queue() for level in Level
}

active_matches: list[Match] = []
completed_matches: list[Match] = []

async def add_player(player: Player):
    await queues[player.level].put(player)

async def matchmaking_loop():
    """Corre en background — revisa colas y forma partidas"""
    while True:
        for level, queue in queues.items():
            if queue.qsize() >= PLAYERS_NEEDED:
                players = [await queue.get() for _ in range(PLAYERS_NEEDED)]
                match = Match(
                    players=players,
                    level=level,
                    duration=MATCH_DURATION[level]
                )
                active_matches.append(match)
                # Simula que la partida termina después de `duration` segundos
                asyncio.create_task(finish_match(match))
        await asyncio.sleep(1)

async def finish_match(match: Match):
    await asyncio.sleep(match.duration)
    active_matches.remove(match)
    completed_matches.append(match)

def get_queue_status():
    return {
        level.name: {
            "waiting": queues[level].qsize(),
            "needed": PLAYERS_NEEDED,
            "eta_seconds": queues[level].qsize() * 10  # estimado simple
        }
        for level in Level
    }