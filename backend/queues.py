import asyncio, time
from models import Player, Match, Level, MATCH_DURATION, PLAYERS_NEEDED

queues: dict[Level, asyncio.Queue] = {level: asyncio.Queue() for level in Level}

active_matches: list[Match] = []
completed_matches: list[Match] = []

async def add_player(player: Player):
    await queues[player.level].put(player)

async def finish_match(match: Match):
    await asyncio.sleep(match.duration)
    if match in active_matches:
        active_matches.remove(match)
        completed_matches.append(match)

async def matchmaking_loop():
    """Forma partidas automáticamente en background"""
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
                asyncio.create_task(finish_match(match))
        await asyncio.sleep(1)

def get_queue_status():
    """Devuelve información que React necesita"""
    return {
        level.name: {
            "waiting": queues[level].qsize(),
            "needed": PLAYERS_NEEDED,
            "players": [p.name for p in list(queues[level]._queue)],
            "eta_seconds": queues[level].qsize() * 10
        }
        for level in Level
    }