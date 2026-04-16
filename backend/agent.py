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
    ("global",     r"\b(global market|total crypto|market cap|dominance|crypto market overview)\b"),
    ("chart",      r"\b(chart|history|7 day|30 day|price history|performance)\b"),
    ("trending",   r"\b(trending|hot coins|popular coins|top coins|gainers|losers|top crypto)\b"),
    ("stock",      r"\b(stock|share|equity|aapl|apple|tesla|tsla|nvidia|nvda|sp500|nasdaq|s&p)\b"),
    ("forex",      r"\b(forex|exchange rate|convert currency|usd to|eur to|gbp|jpy|currency)\b"),
    ("weather",    r"\b(weather|temperature|forecast|rain|sunny|climate)\b"),
    ("translate",  r"\b(translate|translation|in spanish|in french|in german|in japanese|in arabic)\b"),
    ("twitter",    r"\b(twitter|tweet|x\.com|trending on x|what.s on twitter)\b"),
    ("web",        r"\b(search web|google|look up|find info about|what is|who is|explain)\b"),
    ("music",      r"\b(generate music|make music|create song|compose|music for)\b"),
    ("math",       r"\b(calculate|compute|math|formula|convert|equals|wolfram|sqrt|integral|derivative|solve)\b"),
    ("news",       r"\b(news|latest|headlines|article|what.s happening)\b"),
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


@tool(["global"])
async def h_global(text, pet):
    pet.on_research()
    try:
        data = await locus.coingecko_global()
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        d = data.get("data", {})
        mcap = d.get("total_market_cap", {}).get("usd", 0)
        vol  = d.get("total_volume", {}).get("usd", 0)
        btc_dom = d.get("market_cap_percentage", {}).get("btc", 0)
        pet.on_spend(0.06, "CoinGecko global", True)
        return (f"🌍 Global Crypto Market:\n"
                f"Total cap: ${mcap/1e12:.2f}T\n"
                f"24h volume: ${vol/1e9:.1f}B\n"
                f"BTC dominance: {btc_dom:.1f}%\n"
                f"Spent $0.06 via Locus"), {}, "thinking"
    except Exception as e:
        return f"Global market failed: {e}", {}, "confused"


@tool(["chart"])
async def h_chart(text, pet):
    coin = extract_coin(text)
    days = 30 if "30" in text else 7
    pet.on_research()
    try:
        data = await locus.coingecko_market_chart(coin, days)
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        prices = data.get("prices", [])
        if len(prices) >= 2:
            start = prices[0][1]
            end   = prices[-1][1]
            chg   = ((end - start) / start) * 100
            high  = max(p[1] for p in prices)
            low   = min(p[1] for p in prices)
            pet.on_spend(0.06, f"{coin} chart", True)
            return (f"📊 {coin.capitalize()} {days}d chart:\n"
                    f"Start: ${start:,.2f} → Now: ${end:,.2f}\n"
                    f"Change: {chg:+.1f}%\n"
                    f"High: ${high:,.2f} | Low: ${low:,.2f}\n"
                    f"Spent $0.06 via Locus"), {}, "thinking"
        return "No chart data available", {}, "confused"
    except Exception as e:
        return f"Chart failed: {e}", {}, "confused"


@tool(["forex"])
async def h_forex(text, pet):
    # Extract currency pair
    m = re.search(r"\b([A-Z]{3})\s+to\s+([A-Z]{3})\b", text.upper())
    if not m:
        m2 = re.search(r"\busd\b.*\b(eur|gbp|jpy|cny|inr|aud|cad)\b", text.lower())
        from_cur, to_cur = ("USD", m2.group(1).upper()) if m2 else ("USD", "EUR")
    else:
        from_cur, to_cur = m.group(1), m.group(2)
    pet.on_research()
    try:
        data = await locus.alpha_vantage_forex(from_cur, to_cur)
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        rate_data = data.get("Realtime Currency Exchange Rate", {})
        rate = rate_data.get("5. Exchange Rate", "?")
        pet.on_spend(0.008, f"forex {from_cur}/{to_cur}", True)
        return (f"💱 {from_cur} → {to_cur}: {rate}\n"
                f"Spent $0.008 via Locus wrapped Alpha Vantage"), {}, "thinking"
    except Exception as e:
        return f"Forex failed: {e}", {}, "confused"


@tool(["weather"])
async def h_weather(text, pet):
    city = re.sub(r"\b(weather|temperature|forecast|in|at|for)\b", "", text.lower()).strip() or "London"
    pet.on_research()
    try:
        data = await locus.openweather_current(city)
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        if data.get("error"): return f"City not found: {city}", {}, "confused"
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        temp = main.get("temp", "?")
        feels = main.get("feels_like", "?")
        desc = weather.get("description", "?")
        pet.on_spend(0.006, f"weather {city}", True)
        return (f"🌤 {city.title()}: {temp}°C, {desc}\n"
                f"Feels like {feels}°C\n"
                f"Spent $0.006 via Locus wrapped OpenWeather"), {}, "curious"
    except Exception as e:
        return f"Weather failed: {e}", {}, "confused"


@tool(["translate"])
async def h_translate(text, pet):
    lang_map = {"spanish":"ES","french":"FR","german":"DE","japanese":"JA",
                "arabic":"AR","chinese":"ZH","portuguese":"PT","italian":"IT",
                "korean":"KO","russian":"RU","hindi":"HI"}
    target = "ES"
    for lang, code in lang_map.items():
        if lang in text.lower():
            target = code
            break
    to_translate = re.sub(r"\b(translate|in\s+\w+|to\s+\w+)\b", "", text, flags=re.I).strip()
    if not to_translate or len(to_translate) < 3:
        return "What should I translate? Say: 'translate hello in Spanish'", {}, "confused"
    try:
        data = await locus.deepl_translate(to_translate, target)
        if isinstance(data, dict) and data.get("_pending"):
            return f"⏳ Needs approval!", {}, "embarrassed"
        translations = data.get("translations", [{}]) if isinstance(data, dict) else []
        result = translations[0].get("text", "?") if translations else "?"
        pet.on_spend(0.025, f"translate to {target}", True)
        return (f"🌐 Translation ({target}):\n\"{result}\"\n"
                f"Spent $0.025 via Locus wrapped DeepL"), {}, "winking"
    except Exception as e:
        return f"Translation unavailable right now: {str(e)[:40]}", {}, "confused"


@tool(["twitter"])
async def h_twitter(text, pet):
    query = re.sub(r"\b(twitter|tweet|x\.com|trending on x|what.s on)\b", "", text.lower()).strip()
    query = query or "crypto bitcoin"
    pet.on_research()
    try:
        data = await locus.x_search(f"{query} -is:retweet lang:en")
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        tweets = data.get("data", [])
        if not tweets:
            return "No recent tweets found.", {}, "confused"
        pet.on_spend(0.016, "X tweet search", True)
        top = tweets[0]
        text_out = top.get("text","")[:120]
        metrics = top.get("public_metrics", {})
        likes = metrics.get("like_count", 0)
        return (f"🐦 Latest on X about '{query}':\n"
                f"\"{text_out}...\"\n"
                f"Likes: {likes}\n"
                f"Spent $0.016 via Locus wrapped X API"), {}, "curious"
    except Exception as e:
        return f"Twitter search failed: {e}", {}, "confused"


@tool(["web"])
async def h_web(text, pet):
    query = re.sub(r"\b(search web|google|look up|find info about|what is|who is|explain)\b",
                   "", text, flags=re.I).strip()
    if not query: return "What should I search for?", {}, "confused"
    pet.on_research()
    try:
        data = await locus.brave_web(query)
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        results = data.get("web", {}).get("results", [])
        if not results:
            return "No results found.", {}, "confused"
        top = results[0]
        pet.on_spend(0.035, "Brave web search", True)
        return (f"🔎 {top.get('title','')}\n"
                f"{top.get('description','')[:150]}...\n"
                f"Source: {top.get('url','')[:50]}\n"
                f"Spent $0.035 via Locus wrapped Brave"), {}, "thinking"
    except Exception as e:
        return f"Web search failed: {e}", {}, "confused"


@tool(["music"])
async def h_music(text, pet):
    prompt = re.sub(r"\b(generate music|make music|create song|compose|music for)\b",
                    "", text, flags=re.I).strip() or "upbeat crypto trading"
    if pet.balance_usdc < 0.10:
        return f"Need at least $0.10 USDC to generate music (have ${pet.balance_usdc:.4f})", {}, "sad"
    try:
        data = await locus.suno_generate(prompt)
        if data.get("_pending"): return "⏳ Needs approval!", {}, "embarrassed"
        task_id = data.get("taskId", data.get("id", ""))
        pet.on_spend(0.10, "Suno music generation", True)
        return (f"🎵 Music generating! Prompt: '{prompt}'\n"
                f"Task ID: {task_id[:20]}...\n"
                f"Say 'music status {task_id[:8]}' to check\n"
                f"Spent $0.10 via Locus wrapped Suno"), {"last_music_task": task_id}, "laughing"
    except Exception as e:
        return f"Music generation failed: {e}", {}, "confused"
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
        "CRYPTO: bitcoin price | trending coins | global market | btc 7d chart\n"
        "STOCKS: apple stock | nvidia stock\n"
        "FOREX:  USD to EUR | GBP to JPY\n"
        "WEATHER: weather in Tokyo\n"
        "TRANSLATE: translate hello in Spanish\n"
        "SEARCH: search web [query] | search [news]\n"
        "TWITTER: twitter bitcoin\n"
        "MUSIC: generate music [style]\n"
        "MATH: calculate sqrt(144)\n"
        "WALLET: balance | controls | send X USDC to 0x...\n"
        "EARN: create checkout for 1 USDC | post to billboard"
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
