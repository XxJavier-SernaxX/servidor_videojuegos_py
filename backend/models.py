from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional
import time


class Level(Enum):
    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    DIAMOND = "DIAMOND"


@dataclass
class Player:
    username: str
    password: str = ""
    role: str = "player"

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


PLAYERS_NEEDED = 2

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