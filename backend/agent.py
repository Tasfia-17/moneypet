"""
MoneyPet agent — plugin registry with full Locus utilization.
"""
import re, random, os, json
import locus
from pet import PetState

TOOLS: dict = {}

def tool(keys):
    def dec(fn):
        for k in keys: TOOLS[k] = fn
        return fn
    return dec

# ── Intent detection ──────────────────────────────────────────────────────────

PATTERNS = [
    ("balance",    r"\b(balance|wallet|how much money|my funds|usdc balance|my balance)\b"),
    ("controls",   r"\b(limit|controls|policy|allowance|spending|budget|rules|governance)\b"),
    ("trending",   r"\b(trending|hot coins|popular coins|top coins|gainers|losers|top crypto)\b"),
    ("stock",      r"\b(stock|share|equity|aapl|apple|tesla|tsla|nvidia|nvda|sp500|nasdaq|s&p)\b"),
    ("math",       r"\b(calculate|compute|math|formula|convert|equals|wolfram|sqrt|integral|derivative|solve)\b"),
    ("news",       r"\b(news|search|research|what.s happening|latest|headlines|article)\b"),
    ("price",      r"\b(price|worth|how much is|bitcoin|btc|eth|ethereum|solana|sol|crypto|doge|ada|avax|bnb|xrp)\b"),
    ("checkout",   r"\b(checkout|earn|sell|charge|pay me|create.*pay|get paid|invoice|payment link)\b"),
    ("send",       r"\b(send|transfer|pay|give).*(0x[a-fA-F0-9]{10,}|\d+(\.\d+)?\s*usdc)\b"),
    ("billboard",  r"\b(billboard|announce|post|tweet|shout|publish)\b"),
    ("register",   r"\b(register|setup|create wallet|init|initialize|new wallet)\b"),
    ("status",     r"\b(how are you|feeling|status|mood|health|hungry|happy|stats|report)\b"),
    ("help",       r"\b(help|what can you do|commands|options|guide|tutorial)\b"),
]

COIN_MAP = {
    "bitcoin":"bitcoin","btc":"bitcoin","ethereum":"ethereum","eth":"ethereum",
    "solana":"solana","sol":"solana","dogecoin":"dogecoin","doge":"dogecoin",
    "cardano":"cardano","ada":"cardano","avalanche":"avalanche-2","avax":"avalanche-2",
}
EMOTION_MAP = {
    "happy":"happy","hungry":"sad","excited":"laughing","worried":"embarrassed",
    "sick":"crying","curious":"thinking","sleeping":"sleepy",
}

def detect_intent(text: str) -> str:
    t = text.lower()
    for intent, pat in PATTERNS:
        if re.search(pat, t): return intent
    return "unknown"

def extract_coin(text: str) -> str:
    t = text.lower()
    for name, cg in COIN_MAP.items():
        if name in t: return cg
    return "bitcoin"

def extract_amount(text: str) -> float:
    m = re.search(r"(\d+(\.\d+)?)\s*(usdc)?", text.lower())
    return float(m.group(1)) if m else 1.0

def extract_address(text: str):
    m = re.search(r"0x[a-fA-F0-9]{40}", text)
    return m.group(0) if m else None

# ── Handlers ──────────────────────────────────────────────────────────────────

@tool(["balance"])
async def h_balance(text, pet):
    try:
        bal = await locus.get_balance()
        pet.balance_usdc = bal
        em = "cool" if bal > 5 else "sad" if bal < 1 else "happy"
        msg = f"💰 ${bal:.4f} USDC in my Locus wallet!"
        if bal < 1: msg += " Feed me! 🥺"
        return msg, {"balance": bal}, em
    except Exception as e:
        return f"Balance check failed: {e}", {}, "confused"


@tool(["controls"])
async def h_controls(text, pet):
    try:
        c = await locus.get_spending_controls()
        return (
            f"📋 Spending controls:\n"
            f"Allowance: ${c['allowance_usdc']} USDC\n"
            f"Max per tx: ${c['max_tx_usdc']} USDC\n"
            f"Approval threshold: ${c['approval_threshold']} USDC\n"
            f"Wallet: {str(c['wallet_address'])[:12]}..."
        ), {"spending_controls": c}, "confident"
    except Exception as e:
        return f"Couldn't fetch controls: {e}", {}, "confused"


@tool(["price"])
async def h_price(text, pet):
    coin = extract_coin(text)
    pet.on_research()
    try:
        data = await locus.coingecko_price(coin)
        if data.get("_pending"):
            return f"⏳ Needs approval! URL: {data.get('approval_url','')}", {}, "embarrassed"
        pd = data.get(coin, {})
        price, chg = pd.get("usd", 0), pd.get("usd_24h_change", 0)
        pet.on_spend(0.06, f"CoinGecko {coin}", True)
        em = "laughing" if chg > 5 else "crying" if chg < -5 else "thinking"
        return (f"{'📈' if chg>=0 else '📉'} {coin}: ${price:,.2f} ({chg:+.1f}% 24h)\n"
                f"Spent $0.06 via Locus wrapped CoinGecko"), {"mood": pet.mood.value}, em
    except Exception as e:
        return f"Price failed: {e}", {}, "confused"


@tool(["trending"])
async def h_trending(text, pet):
    pet.on_research()
    try:
        data = await locus.coingecko_trending()
        if data.get("_pending"):
            return f"⏳ Needs approval!", {}, "embarrassed"
        coins = data.get("coins", [])[:5]
        names = [c.get("item", {}).get("symbol", "?") for c in coins]
        pet.on_spend(0.06, "CoinGecko trending", True)
        return f"🔥 Trending: {', '.join(names)}\nSpent $0.06 via Locus", {}, "excited"
    except Exception as e:
        return f"Trending failed: {e}", {}, "confused"


@tool(["stock"])
async def h_stock(text, pet):
    # Extract stock symbol
    m = re.search(r"\b(AAPL|TSLA|NVDA|MSFT|GOOGL|AMZN|META|apple|tesla|nvidia|microsoft)\b", text, re.I)
    sym = {"apple":"AAPL","tesla":"TSLA","nvidia":"NVDA","microsoft":"MSFT"}.get(
        m.group(1).lower(), m.group(1).upper()) if m else "AAPL"
    pet.on_research()
    try:
        data = await locus.alpha_vantage_quote(sym)
        if data.get("_pending"):
            return f"⏳ Needs approval!", {}, "embarrassed"
        q = data.get("Global Quote", {})
        price = q.get("05. price", "?")
        chg   = q.get("10. change percent", "?")
        pet.on_spend(0.008, f"Alpha Vantage {sym}", True)
        return (f"📊 {sym}: ${price} ({chg})\n"
                f"Spent $0.008 via Locus wrapped Alpha Vantage"), {}, "thinking"
    except Exception as e:
        return f"Stock lookup failed: {e}", {}, "confused"


@tool(["math"])
async def h_math(text, pet):
    query = re.sub(r"\b(calculate|compute|math|formula|convert|wolfram)\b", "", text, flags=re.I).strip()
    pet.on_research()
    try:
        data = await locus.wolfram_answer(query or text)
        if data.get("_pending"):
            return f"⏳ Needs approval!", {}, "embarrassed"
        answer = data.get("text", str(data)) if isinstance(data, dict) else str(data)
        pet.on_spend(0.055, "Wolfram Alpha", True)
        return f"🧮 {answer}\nSpent $0.055 via Locus wrapped Wolfram", {}, "thinking"
    except Exception as e:
        return f"Math failed: {e}", {}, "confused"


@tool(["news"])
async def h_news(text, pet):
    query = re.sub(r"\b(news|market|research|search|about|for)\b", "", text.lower()).strip() or "crypto"
    pet.on_research()
    try:
        # Try Brave news first (cheaper), fall back to Perplexity
        data = await locus.brave_news(query)
        if data.get("_pending"):
            return f"⏳ Needs approval!", {}, "embarrassed"
        results = data.get("results", [])
        if results:
            top = results[0]
            pet.on_spend(0.035, "Brave Search news", True)
            return (f"📰 {top.get('title','')}\n{top.get('description','')[:150]}...\n"
                    f"Spent $0.035 via Locus wrapped Brave"), {}, "thinking"
        # fallback
        result = await locus.perplexity_search(query)
        pet.on_spend(0.005, "Perplexity search", True)
        return f"🔍 {result[:200]}\nSpent $0.005 via Locus wrapped Perplexity", {}, "thinking"
    except Exception as e:
        return f"News failed: {e}", {}, "confused"


@tool(["checkout"])
async def h_checkout(text, pet):
    amount = extract_amount(text)
    try:
        session = await locus.create_checkout(amount, f"Pay {pet.name} for market summary 🐾")
        sid = session.get("id", "")
        pet.checkout_session_id = sid
        return (f"💳 Checkout ready! ${amount:.2f} USDC\nClick [A] to open payment!",
                {"checkout_session_id": sid}, "winking")
    except Exception as e:
        return f"Checkout failed: {e}", {}, "confused"


@tool(["send"])
async def h_send(text, pet):
    addr = extract_address(text)
    amt  = extract_amount(text)
    if not addr: return "Need a wallet address (0x...) 🤔", {}, "confused"
    if amt > pet.balance_usdc:
        return f"Only have ${pet.balance_usdc:.4f}, can't send ${amt:.2f}! 😰", {}, "crying"
    try:
        result = await locus.send_usdc(addr, amt, f"From {pet.name} 🐾")
        if result.get("_pending"):
            return f"⏳ Send needs approval! ${amt:.2f} USDC pending.", {}, "embarrassed"
        pet.on_spend(amt, f"send to {addr[:8]}...", True)
        tx = result.get("txHash", "pending")
        return f"✅ Sent ${amt:.2f} USDC! TX: {tx[:12]}...", {"balance": pet.balance_usdc}, "cool"
    except Exception as e:
        return f"Send failed: {e}", {}, "crying"


@tool(["billboard"])
async def h_billboard(text, pet):
    try:
        price = await locus.billboard_get_price()
        if pet.balance_usdc < price:
            return f"Billboard costs ${price:.2f} but I only have ${pet.balance_usdc:.4f}! 😰", {}, "sad"
        msg = f"🐾 MoneyPet says: {pet.name} is a {pet.stage.value} with ${pet.balance_usdc:.4f} USDC! #MoneyPet #Locus"
        result = await locus.billboard_post(msg)
        if result.get("_pending"):
            return f"⏳ Billboard post needs approval (${price:.2f})!", {}, "embarrassed"
        pet.on_spend(price, "Billboard post", True)
        return f"📢 Posted to @MPPBillboard for ${price:.2f} USDC!\n\"{msg[:80]}...\"", {}, "laughing"
    except Exception as e:
        return f"Billboard failed: {e}", {}, "confused"


@tool(["register"])
async def h_register(text, pet):
    try:
        data = await locus.register_agent(pet.name)
        api_key = data.get("apiKey", "")
        claim   = data.get("claimUrl", "")
        wallet  = data.get("ownerAddress", "")
        return (f"🤖 Registered! New wallet: {wallet[:12]}...\n"
                f"Claim URL: {claim[:40]}...\n"
                f"API key saved (starts with: {api_key[:12]}...)"),\
               {"wallet_registered": True}, "laughing"
    except Exception as e:
        return f"Registration failed: {e}", {}, "confused"


@tool(["status"])
async def h_status(text, pet):
    em = EMOTION_MAP.get(pet.mood.value, "neutral")
    replies = {
        "happy":["Doing great! 😊","Life is good! ✨"],
        "hungry":["SO hungry... feed me USDC 🥺","Wallet is empty 😢"],
        "excited":["SO excited!! 🎉💸","Just made money!!"],
        "worried":["Worried about my balance 😰","Things are tight 😟"],
        "sick":["Not feeling well 🤒","Something went wrong 😷"],
        "curious":["Researching markets! 🔍","So curious 🧐"],
        "sleeping":["Zzz... 😴","I was napping!"],
    }
    base = random.choice(replies.get(pet.mood.value, ["I'm here! 🐾"]))
    return (f"{base}\nStage: {pet.stage.value} | ${pet.balance_usdc:.4f} USDC\n"
            f"Hunger: {pet.hunger:.0f}% | Happy: {pet.happiness:.0f}% | Health: {pet.health:.0f}%"
            ), {}, em


@tool(["help"])
async def h_help(text, pet):
    return (
        "Commands 🐾:\n"
        "• balance / controls\n"
        "• bitcoin/eth/sol price\n"
        "• trending coins\n"
        "• apple/tesla stock\n"
        "• calculate [math]\n"
        "• search [news]\n"
        "• create checkout [amount]\n"
        "• send [amount] to [0x...]\n"
        "• billboard — post to X\n"
        "• register — new wallet"
    ), {}, "winking"


@tool(["unknown"])
async def h_unknown(text, pet):
    return random.choice([
        "Hmm 🤔 Say 'help'!",
        "I'm just a pet! 😅 Try 'help'.",
        "*tilts head* 🐾 Say 'help'!",
    ]), {}, "confused"


# ── Dispatcher ────────────────────────────────────────────────────────────────

async def process_command(text: str, pet: PetState) -> tuple[str, dict, str]:
    intent  = detect_intent(text)
    handler = TOOLS.get(intent, TOOLS["unknown"])
    reply, updates, emotion = await handler(text, pet)
    for k, v in updates.items():
        if k == "mood":
            from pet import Mood
            pet.mood = Mood(v) if isinstance(v, str) else v
        elif hasattr(pet, k):
            setattr(pet, k, v)
    pet.save()
    return reply, updates, emotion
