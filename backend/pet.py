"""
MoneyPet - Pet state machine.
Inspired by TamaFi's stat/mood/evolution system, adapted for financial health.
"""
import json
import os
import time
from dataclasses import dataclass, asdict, field
from enum import Enum

STATE_FILE = "pet_state.json"


class Stage(str, Enum):
    BABY = "baby"
    TEEN = "teen"
    ADULT = "adult"
    ELDER = "elder"


class Mood(str, Enum):
    HAPPY = "happy"
    HUNGRY = "hungry"       # low balance
    EXCITED = "excited"     # just earned money
    WORRIED = "worried"     # balance dropping
    SICK = "sick"           # overspent / policy violation
    CURIOUS = "curious"     # researching markets
    SLEEPING = "sleeping"   # idle


# Balance thresholds that drive evolution
EVOLUTION_THRESHOLDS = {Stage.BABY: 5.0, Stage.TEEN: 20.0, Stage.ADULT: 50.0}


@dataclass
class PetState:
    name: str = "Penny"
    stage: Stage = Stage.BABY
    mood: Mood = Mood.HAPPY
    hunger: float = 80.0        # 0-100, drops over time, fed by earning
    happiness: float = 70.0     # 0-100, boosted by good decisions
    health: float = 90.0        # 0-100, drops on overspend/errors
    balance_usdc: float = 0.0
    lifetime_earned: float = 0.0
    lifetime_spent: float = 0.0
    tx_log: list = field(default_factory=list)  # last 20 transactions
    born_at: float = field(default_factory=time.time)
    last_tick: float = field(default_factory=time.time)
    checkout_session_id: str = ""

    def age_hours(self) -> float:
        return (time.time() - self.born_at) / 3600

    def tick(self):
        """Called periodically — decay stats over time."""
        now = time.time()
        elapsed = (now - self.last_tick) / 60  # minutes since last tick
        self.last_tick = now

        # Hunger decays ~1 point per minute
        self.hunger = max(0, self.hunger - elapsed * 1.0)
        # Happiness decays slower
        self.happiness = max(0, self.happiness - elapsed * 0.3)

        self._update_mood()
        self._check_evolution()

    def on_earn(self, amount: float, source: str):
        self.balance_usdc += amount
        self.lifetime_earned += amount
        self.hunger = min(100, self.hunger + amount * 10)
        self.happiness = min(100, self.happiness + amount * 5)
        self.health = min(100, self.health + 2)
        self.mood = Mood.EXCITED
        self._log_tx(f"+{amount:.2f} USDC from {source}")
        self._check_evolution()

    def on_spend(self, amount: float, purpose: str, success: bool):
        if success:
            self.balance_usdc = max(0, self.balance_usdc - amount)
            self.lifetime_spent += amount
            self.happiness = min(100, self.happiness + 3)
            self._log_tx(f"-{amount:.4f} USDC for {purpose}")
        else:
            self.health = max(0, self.health - 10)
            self.mood = Mood.SICK
            self._log_tx(f"FAILED: {purpose}")

    def on_research(self):
        self.mood = Mood.CURIOUS
        self.happiness = min(100, self.happiness + 1)

    def _update_mood(self):
        if self.health < 30:
            self.mood = Mood.SICK
        elif self.hunger < 20:
            self.mood = Mood.HUNGRY
        elif self.balance_usdc < 1.0:
            self.mood = Mood.WORRIED
        elif self.happiness > 80:
            self.mood = Mood.HAPPY
        elif self.mood not in (Mood.EXCITED, Mood.CURIOUS):
            self.mood = Mood.HAPPY

    def _check_evolution(self):
        threshold = EVOLUTION_THRESHOLDS.get(self.stage)
        if threshold and self.lifetime_earned >= threshold:
            stages = list(Stage)
            idx = stages.index(self.stage)
            if idx + 1 < len(stages):
                self.stage = stages[idx + 1]
                self.happiness = 100
                self._log_tx(f"🎉 Evolved to {self.stage.value}!")

    def _log_tx(self, msg: str):
        entry = {"time": time.strftime("%H:%M:%S"), "msg": msg}
        self.tx_log = ([entry] + self.tx_log)[:20]

    def save(self):
        with open(STATE_FILE, "w") as f:
            data = asdict(self)
            data["stage"] = self.stage.value
            data["mood"] = self.mood.value
            json.dump(data, f)

    @classmethod
    def load(cls) -> "PetState":
        if not os.path.exists(STATE_FILE):
            return cls()
        with open(STATE_FILE) as f:
            data = json.load(f)
        data["stage"] = Stage(data.get("stage", "baby"))
        data["mood"] = Mood(data.get("mood", "happy"))
        return cls(**data)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "stage": self.stage.value,
            "mood": self.mood.value,
            "hunger": round(self.hunger, 1),
            "happiness": round(self.happiness, 1),
            "health": round(self.health, 1),
            "balance_usdc": round(self.balance_usdc, 4),
            "lifetime_earned": round(self.lifetime_earned, 4),
            "lifetime_spent": round(self.lifetime_spent, 4),
            "tx_log": self.tx_log,
            "age_hours": round(self.age_hours(), 2),
            "checkout_session_id": self.checkout_session_id,
        }
