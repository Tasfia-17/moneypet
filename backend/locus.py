"""
Locus API layer — all Locus calls in one place.
"""
import os
import httpx

LOCUS_BASE = os.getenv("LOCUS_API_BASE", "https://beta-api.paywithlocus.com/api")
LOCUS_KEY  = os.getenv("LOCUS_API_KEY", "")
HEADERS    = {"Authorization": f"Bearer {LOCUS_KEY}", "Content-Type": "application/json"}


async def _post(path: str, body: dict, timeout: int = 15) -> dict:
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{LOCUS_BASE}{path}", headers=HEADERS, json=body, timeout=timeout)
        if r.status_code == 202:          # pending approval
            return {"_pending": True, **r.json().get("data", {})}
        r.raise_for_status()
        return r.json().get("data", {})


async def _get(path: str, timeout: int = 10) -> dict:
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{LOCUS_BASE}{path}", headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.json().get("data", {})


# ── Wallet ────────────────────────────────────────────────────────────────────

async def register_agent(name: str) -> dict:
    """Agent self-registration — no human signup needed."""
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{LOCUS_BASE}/register", json={"name": name}, timeout=15)
        r.raise_for_status()
        return r.json().get("data", {})


async def get_balance() -> float:
    data = await _get("/pay/balance")
    # Beta API returns usdc_balance
    return float(data.get("usdc_balance") or data.get("balance") or 0)


async def get_spending_controls() -> dict:
    status = await _get("/status")
    bal    = await _get("/pay/balance")
    return {
        "allowance_usdc":     bal.get("allowance") or "UNLIMITED",
        "max_tx_usdc":        bal.get("max_transaction_size") or "UNLIMITED",
        "approval_threshold": "NONE",
        "wallet_address":     status.get("walletAddress", ""),
        "wallet_status":      status.get("walletStatus", ""),
    }


async def get_spending_controls() -> dict:
    """Fetch current policy/spending controls for the agent."""
    data = await _get("/status")
    return {
        "allowance_usdc":    data.get("allowanceUsdc", "?"),
        "max_tx_usdc":       data.get("maxAllowedTxnSizeUsdc", "?"),
        "approval_threshold":data.get("approvalThresholdUsdc", "?"),
        "wallet_address":    data.get("walletAddress", ""),
        "wallet_status":     data.get("walletStatus", ""),
    }


async def send_usdc(to: str, amount: float, note: str = "") -> dict:
    return await _post("/pay/send", {"to": to, "amount": str(amount), "note": note})


# ── Wrapped APIs ──────────────────────────────────────────────────────────────

async def wrapped(provider: str, endpoint: str, body: dict) -> dict:
    """Generic wrapped API call — auto-handles 202 approval flow."""
    return await _post(f"/wrapped/{provider}/{endpoint}", body, timeout=20)


async def coingecko_price(coin: str) -> dict:
    return await wrapped("coingecko", "simple-price",
                         {"ids": coin, "vs_currencies": "usd", "include_24hr_change": True})

async def coingecko_trending() -> dict:
    return await wrapped("coingecko", "trending", {})

async def coingecko_global() -> dict:
    return await wrapped("coingecko", "global", {})

async def coingecko_market_chart(coin: str, days: int = 7) -> dict:
    return await wrapped("coingecko", "market-chart",
                         {"id": coin, "vs_currency": "usd", "days": days})

async def alpha_vantage_quote(symbol: str) -> dict:
    return await wrapped("alphavantage", "global-quote", {"symbol": symbol})

async def alpha_vantage_news(tickers: str = "CRYPTO:BTC") -> dict:
    return await wrapped("alphavantage", "news-sentiment", {"tickers": tickers, "sort": "LATEST"})

async def alpha_vantage_forex(from_cur: str, to_cur: str) -> dict:
    return await wrapped("alphavantage", "currency-exchange-rate",
                         {"from_currency": from_cur, "to_currency": to_cur})

async def wolfram_answer(query: str) -> dict:
    return await wrapped("wolframalpha", "short-answer", {"i": query})

async def brave_news(query: str) -> dict:
    return await wrapped("brave", "news-search", {"q": query})

async def brave_web(query: str) -> dict:
    return await wrapped("brave", "web-search", {"q": query})

async def perplexity_search(query: str) -> str:
    data = await wrapped("perplexity", "chat",
                         {"model": "sonar",
                          "messages": [{"role": "user", "content": f"Brief: {query}"}]})
    if data.get("_pending"):
        return f"PENDING_APPROVAL:{data.get('approval_url','')}"
    choices = data.get("choices", [])
    return choices[0]["message"]["content"] if choices else "No results."

async def openweather_current(city: str) -> dict:
    geo = await wrapped("openweather", "geocode", {"q": city, "limit": 1})
    if isinstance(geo, dict) and geo.get("_pending"): return geo
    locations = geo if isinstance(geo, list) else (geo.get("data") or [])
    if not locations: return {"error": "City not found"}
    lat = locations[0].get("lat") or locations[0].get("latitude")
    lon = locations[0].get("lon") or locations[0].get("longitude")
    return await wrapped("openweather", "current-weather", {"lat": lat, "lon": lon, "units": "metric"})

async def deepl_translate(text: str, target: str = "EN") -> dict:
    return await wrapped("deepl", "translate", {"text": [text], "target_lang": target})

async def x_search(query: str) -> dict:
    return await wrapped("x", "tweet-search-recent",
                         {"query": query, "max_results": 5,
                          "tweet.fields": "public_metrics,created_at"})

async def exa_search(query: str) -> dict:
    return await wrapped("exa", "search", {"query": query, "numResults": 3})

async def suno_generate(prompt: str, style: str = "electronic") -> dict:
    return await wrapped("suno", "generate-music",
                         {"customMode": True, "instrumental": True,
                          "model": "V3_5", "prompt": prompt, "style": style})

async def suno_status(task_id: str) -> dict:
    return await wrapped("suno", "get-music-status", {"taskId": task_id})


# ── Checkout ──────────────────────────────────────────────────────────────────

async def create_checkout(amount: float, description: str) -> dict:
    return await _post("/checkout/sessions",
                       {"amount": str(amount), "currency": "USDC", "description": description})


# ── Billboard (MPP) ───────────────────────────────────────────────────────────

async def billboard_get_price() -> float:
    data = await wrapped("billboard", "get-price", {})
    return float(data.get("price", 0.01))


async def billboard_post(text: str) -> dict:
    return await wrapped("billboard", "post", {"text": text[:280]})
