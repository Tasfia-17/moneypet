<div align="center">
  <img src="assets/logo.svg" width="140" alt="MoneyPet Logo"/>
  <h1>MoneyPet</h1>
  <p>A simulated ESP32 AI agent device with a real Locus wallet. It earns, spends, and evolves based on its financial decisions.</p>
  <p>
    <strong>Locus Paygentic Hackathon 2026 submission</strong>
  </p>
</div>

---

<div align="center">
  <img src="assets/device-3d.svg" width="260" alt="MoneyPet Device"/>
</div>

---

## What is this

MoneyPet is a Tamagotchi-style AI companion that runs on ESP32 hardware (or a browser-based simulator) and manages a real USDC wallet through the Locus payment infrastructure. The pet has hunger, happiness, and health stats that decay over time. It earns money by selling market summaries through Locus Checkout. It spends money on real API calls through the Locus wrapped API marketplace. It evolves from Baby to Elder as its lifetime earnings grow.

The core idea is simple: every interaction the pet makes with the outside world costs real USDC, deducted from its Locus wallet on Base chain. When you ask it for a Bitcoin price, it pays CoinGecko through Locus. When you ask it to calculate something, it pays Wolfram Alpha through Locus. When someone pays it for a market summary, the USDC lands in its wallet. The pet lives or dies by its financial decisions, and you can watch every transaction happen in real time.

This is not a mockup. The wallet address is 0x5031b8660889a55808288e1fd9cf756f06c26c65 on Base. The transactions are real. As of submission, 18 confirmed on-chain USDC payments have been made by the agent.

---

## The hardware angle

The project is built on top of two open source ESP32 firmware projects: ava-trading-esp32 (a voice-driven crypto trading terminal for ESP32-S3) and xiaozhi-esp32 (a 30,000-star open source AI chatbot framework for embedded devices). Both run on real hardware with 320x240 LCD displays, microphones, speakers, and joystick controls.

The screen layout, color palette, and UI zones in MoneyPet are directly derived from the Ava Box LVGL screen system. The exact pixel dimensions (22px top bar, 25px bottom bar, 24px feed rows), the color values (0x0A0A0A background, 0x00C853 green, 0xFF1744 red, chain badge colors), and the multi-screen tab navigation all come from reading the actual C source code of screen_feed.c and screen_portfolio.c in the Ava Box repository.

The 21-emotion system comes from xiaozhi's emoji_collection.cc, which maps emotion names like "laughing", "crying", "shocked", "thinking" to Twemoji images rendered on the LCD. MoneyPet maps these same emotion names to financial states: the pet shows "laughing" when it earns money, "crying" when a transaction fails, "shocked" when a price spikes, "thinking" when it is researching markets.

The device state machine (idle, listening, thinking, speaking) comes from xiaozhi's application.cc event loop, which uses FreeRTOS event groups to transition between states. MoneyPet implements the same state machine in the backend and shows it live in the device status bar.

The stat bar system (hunger, happiness, health with pixel-sharp decay) comes from TamaFi, an open source WiFi-fed virtual pet on ESP32-S3 with a full PCB design. The evolution system (Baby to Teen to Adult to Elder based on lifetime earnings) is adapted from TamaFi's stage progression logic.

The voice pipeline architecture comes from ElatoAI, a 1,500-star open source project that runs realtime speech-to-speech AI on ESP32 using OpenAI Realtime API and Deno edge functions. MoneyPet uses the same Web Speech API approach for browser-based voice input.

Since we are running in simulation mode (no physical hardware required), the 320x240 device screen is rendered in the browser using React with inline styles that match the exact pixel layout of the real LVGL screens. The scanline CSS effect simulates the LCD panel. The hardware button row below the screen matches the Ava Box control layout.

---

## Locus integration

Locus is the entire reason this project works. Without Locus, the pet would just be a Tamagotchi with fake numbers. With Locus, every action the pet takes is a real financial transaction.

Here is exactly what we use:

**Agent wallet.** The pet has a non-custodial USDC wallet on Base, deployed through Locus. The wallet address is 0x5031b8660889a55808288e1fd9cf756f06c26c65. The agent self-registered using the beta API endpoint POST /api/register, which creates a wallet and returns an API key without any human signup. This is the key feature of the Locus beta: agents can create their own financial identity programmatically.

**Wrapped API marketplace.** Locus provides pay-per-use access to 44+ APIs through a single wallet. The pet uses five of them:

- CoinGecko (coingecko/simple-price, coingecko/trending): $0.06 per call. Used for crypto price lookups and trending coin discovery.
- Alpha Vantage (alphavantage/global-quote): $0.008 per call. Used for stock price lookups.
- Wolfram Alpha (wolframalpha/short-answer): $0.055 per call. Used for math and calculations.
- Brave Search (brave/news-search): $0.035 per call. Used for market news.
- Perplexity (perplexity/chat): $0.005 per call. Used as fallback for research queries.

Every one of these calls deducts USDC from the pet's wallet in real time. The reply shown on the device screen includes the exact cost paid. The Locus dashboard shows the full transaction history with memo fields like "Wrapped API call: coingecko/simple-price".

**Locus Checkout.** The pet can earn money. When you say "create checkout for 1 USDC", the backend calls POST /api/checkout/sessions and creates a payment session. A checkout modal appears on the device screen using the @withlocus/checkout-react SDK. When a human pays, the USDC lands in the pet's wallet and the pet's mood changes to "loving" with a notification overlay.

**USDC transfers.** The pet can send USDC to any Base wallet address using POST /api/pay/send. The command "send 0.5 USDC to 0x..." triggers a real on-chain transfer.

**Spending controls.** The balance endpoint (GET /api/pay/balance) returns the current USDC balance and any configured limits. The WALLET screen on the device shows these controls live: allowance, max transaction size, and approval threshold.

**Billboard (MPP).** The pet can post to @MPPBillboard on X using the Machine Payments Protocol. The command "post to billboard" calls wrapped/billboard/post, which costs $0.01 and doubles with each post. This demonstrates the HTTP 402 payment flow where the agent pays inline with the API call.

**Approval flow.** All wrapped API calls go through a handler that detects HTTP 202 responses (pending approval). When a call exceeds the approval threshold, the device shows a pending notification with the approval URL.

**Audit trail.** Every transaction is logged in the pet's transaction log with timestamp, amount, and purpose. The Locus dashboard independently records all transactions with memo fields. The combination gives a complete audit trail of every financial decision the agent made and why.

---

## Architecture

<div align="center">
  <img src="assets/architecture.svg" width="860" alt="System Architecture"/>
</div>

<div align="center">
  <img src="assets/payment-flow.svg" width="780" alt="Payment Flow"/>
</div>

---

## How it works

The system has three layers.

The hardware layer is either a real ESP32-S3 board (320x240 display, microphone, speaker, joystick) or the browser-based simulator. The simulator renders the exact same 320x240 pixel layout as the hardware, using the same color palette and screen zones derived from the Ava Box LVGL source code.

The backend is a Python FastAPI server. It maintains the pet state (hunger, happiness, health, stage, emotion, balance), handles voice commands through a rule-based intent parser, and calls the Locus API for all financial operations. The intent parser uses regex patterns to detect commands like "bitcoin price", "apple stock", "calculate sqrt(256)", "create checkout", and "post to billboard". Each intent maps to a plugin handler that calls the appropriate Locus wrapped API and updates the pet state.

The Locus layer handles all money movement. The backend never touches crypto directly. It just calls Locus endpoints with a Bearer token, and Locus handles wallet management, USDC transfers, API proxying, and on-chain settlement on Base.

---

## Screens

The device has four screens accessible via tab navigation:

**PET screen.** Shows the pet's current emotion (one of 21 emotions from the xiaozhi emotion system), stat bars for hunger, happiness, and health, and financial stats including balance, lifetime earned, lifetime spent, and age.

**FEED screen.** Shows a market feed with 8 token rows in the Ava Box style: chain badge, symbol, price, and 24-hour change with up/down arrows. The layout matches the exact column widths from screen_feed.c.

**WALLET screen.** Shows the Locus wallet balance, net P&L, spending controls fetched live from the Locus API, and a scrollable transaction log with color-coded entries.

**EARN screen.** Shows the Locus Checkout interface. When a checkout session is active, the [A] button opens the payment modal. The pet earns USDC when someone pays.

---

## Running it

You need a Locus API key from beta.paywithlocus.com (use code BETA-ACCESS-DOCS for free credits).

```
cd backend
pip install -r requirements.txt
cp .env.example .env
# add your LOCUS_API_KEY to .env
python main.py
```

```
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The device screen appears. Try these commands:

- "bitcoin price" (costs $0.06 via Locus wrapped CoinGecko)
- "trending coins" (costs $0.06 via Locus wrapped CoinGecko)
- "apple stock" (costs $0.008 via Locus wrapped Alpha Vantage)
- "calculate sqrt(144)" (costs $0.055 via Locus wrapped Wolfram Alpha)
- "search crypto news" (costs $0.035 via Locus wrapped Brave Search)
- "create checkout for 1 USDC" (creates a Locus Checkout session)
- "post to billboard" (posts to @MPPBillboard via MPP, costs $0.01)
- "show spending controls" (fetches live policy from Locus)

---

## Stack

Backend: Python, FastAPI, httpx, python-dotenv

Frontend: Next.js, React, TypeScript, Tailwind CSS, @withlocus/checkout-react

Payments: PayWithLocus (wallet, wrapped APIs, checkout, transfers, billboard)

Hardware reference: ESP32-S3, LVGL, ESP-IDF (via ava-trading-esp32 and xiaozhi-esp32)

---

## Open source credits

All borrowed code is MIT licensed. Nothing was copied verbatim; architecture patterns and design systems were adapted.

- ava-trading-esp32 by JupiterXiaoxiaoYu: screen layout, color palette, UI zones, feed/portfolio/confirm screen design
- xiaozhi-esp32 by 78: 21-emotion system, device state machine, MCP plugin architecture, WebSocket protocol
- TamaFi by cifertech: stat decay logic, mood system, evolution stage progression
- ElatoAI by akdeb: voice pipeline architecture, Web Speech API approach, device management patterns

---

## Live transactions

The agent wallet 0x5031b8660889a55808288e1fd9cf756f06c26c65 on Base has made 18 confirmed USDC transactions during development and testing. Every wrapped API call, every price lookup, every news search is a real on-chain payment. The Locus dashboard shows the full history with memo fields identifying each call.

This is what makes MoneyPet different from a demo: the money is real, the transactions are real, and the agent is making autonomous financial decisions within the guardrails set by the Locus spending control system.

---

<div align="center">
  <p>Built for the Locus Paygentic Hackathon 2026</p>
  <p>Powered by <a href="https://paywithlocus.com">PayWithLocus</a></p>
</div>
