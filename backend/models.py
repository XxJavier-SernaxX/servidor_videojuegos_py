from enum import Enum
from dataclasses import dataclass, field
import time, uuid

class Level(Enum):
    BRONZE   = 1   # partida ~5 min
    SILVER   = 2   # partida ~8 min
    GOLD     = 3   # partida ~12 min
    DIAMOND  = 4   # partida ~20 min

MATCH_DURATION = {
    Level.BRONZE:  300,
    Level.SILVER:  480,
    Level.GOLD:    720,
    Level.DIAMOND: 1200,
}

PLAYERS_NEEDED = 4  # jugadores por partida

@dataclass
class Player:
    name: str
    level: Level
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    joined_at: float = field(default_factory=time.time)

@dataclass
class Match:
    players: list
    level: Level
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    started_at: float = field(default_factory=time.time)
    duration: int = 0  # segundos