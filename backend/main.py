"""
MoneyPet backend — FastAPI server with xiaozhi-style device state machine.
Device states: idle → listening → thinking → speaking
"""
import asyncio
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pet import PetState
import agent
import locus

pet = PetState.load()
pet.name = os.getenv("PET_NAME", "Penny")

device_state    = "idle"
current_emotion = "neutral"
spending_controls: dict = {}


async def tick_loop():
    while True:
        await asyncio.sleep(30)
        pet.tick()
        pet.save()


async def boot_sequence():
    """On startup: fetch balance + spending controls. Self-register if no key."""
    global spending_controls, current_emotion
    try:
        pet.balance_usdc = await locus.get_balance()
        spending_controls = await locus.get_spending_controls()
        pet.save()
    except Exception:
        # No key yet — that's fine, demo mode
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(tick_loop())
    asyncio.create_task(boot_sequence())
    yield

app = FastAPI(title="MoneyPet API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    text: str

class WebhookPayload(BaseModel):
    event: str
    data: dict


@app.get("/state")
async def get_state():
    return {**pet.to_dict(), "device_state": device_state,
            "emotion": current_emotion, "spending_controls": spending_controls}


@app.post("/command")
async def command(req: CommandRequest):
    global device_state, current_emotion
    if not req.text.strip():
        raise HTTPException(400, "Empty command")

    device_state = "thinking"
    try:
        reply, updates, emotion = await agent.process_command(req.text, pet)
        current_emotion = emotion
        device_state = "speaking"
        # Auto-reset to idle after 3s
        asyncio.create_task(_reset_state())
        return {"reply": reply, "state": {**pet.to_dict(), "device_state": device_state,
                                           "emotion": emotion, "spending_controls": spending_controls}}
    except Exception as e:
        device_state = "idle"
        raise HTTPException(500, str(e))


async def _reset_state():
    global device_state
    await asyncio.sleep(3)
    device_state = "idle"


@app.post("/webhook/checkout")
async def checkout_webhook(payload: WebhookPayload):
    global current_emotion
    if payload.event == "checkout.session.paid":
        amount = float(payload.data.get("amount", 0))
        pet.on_earn(amount, "Locus Checkout")
        pet.checkout_session_id = ""
        current_emotion = "laughing"
        pet.save()
    return {"ok": True}


@app.post("/feed")
async def feed_pet(amount: float = 1.0):
    global current_emotion
    pet.on_earn(amount, "manual feed")
    current_emotion = "loving"
    pet.save()
    return {**pet.to_dict(), "device_state": device_state, "emotion": current_emotion}


@app.post("/state/listening")
async def set_listening():
    global device_state
    device_state = "listening"
    return {"device_state": device_state}


@app.post("/state/idle")
async def set_idle():
    global device_state
    device_state = "idle"
    return {"device_state": device_state}


@app.get("/stream")
async def stream_state():
    async def generator():
        import json
        while True:
            data = json.dumps({**pet.to_dict(), "device_state": device_state,
                               "emotion": current_emotion, "spending_controls": spending_controls})
            yield f"data: {data}\n\n"
            await asyncio.sleep(2)
    return StreamingResponse(generator(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
