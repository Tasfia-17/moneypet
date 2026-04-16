"use client";
import { useState, useCallback } from "react";
import { useVoice, speak } from "@/hooks/useVoice";

const QUICK = [
  "check balance",
  "bitcoin price",
  "global market",
  "btc 7d chart",
  "trending coins",
  "apple stock",
  "USD to EUR",
  "weather in Tokyo",
  "translate hello in Spanish",
  "twitter bitcoin",
  "search web what is DeFi",
  "generate music crypto vibes",
  "calculate 1 BTC in USD",
  "search DeFi news",
  "show spending controls",
  "create checkout for 1 USDC",
  "post to billboard",
];

export default function CommandPanel({ onCommand, disabled }: {
  onCommand: (t: string) => Promise<string>;
  disabled?: boolean;
}) {
  const [input, setInput]   = useState("");
  const [reply, setReply]   = useState("");
  const [busy,  setBusy]    = useState(false);

  const run = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setReply("...");
    try {
      const r = await onCommand(text);
      setReply(r);
      speak(r);
    } catch {
      setReply("Error connecting to backend.");
    } finally {
      setBusy(false);
      setInput("");
    }
  }, [onCommand, busy]);

  const { listening, startListening, stopListening } = useVoice(run);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {reply && <div className="reply">{reply}</div>}

      <div style={{ display:"flex", gap:6 }}>
        <input className="cmd-input" placeholder="Type a command..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && run(input)}
          disabled={busy || disabled} />
        <button className="cmd-btn" onClick={() => run(input)}
          disabled={busy || !input.trim() || disabled}>
          Send
        </button>
      </div>

      <button className={`voice-btn ${listening?"listening":""}`}
        onClick={listening ? stopListening : startListening}
        disabled={busy || disabled}>
        {listening ? "🎙 Listening... (click to stop)" : "🎙 Voice Input"}
      </button>

      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:1 }}>QUICK COMMANDS</div>
        {QUICK.map(cmd => (
          <button key={cmd} className="quick-btn"
            onClick={() => run(cmd)} disabled={busy || disabled}>
            › {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
