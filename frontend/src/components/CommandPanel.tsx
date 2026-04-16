"use client";
import { useState, useCallback } from "react";
import { useVoice, speak } from "@/hooks/useVoice";

interface Props {
  onCommand: (text: string) => Promise<string>;
  disabled?: boolean;
}

const QUICK = [
  "check balance",
  "show spending controls",
  "bitcoin price",
  "trending coins",
  "apple stock",
  "calculate 42 * 1337",
  "search crypto news",
  "create checkout for 1 USDC",
  "post to billboard",
];

export default function CommandPanel({ onCommand, disabled }: Props) {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setReply("...");
    try {
      const r = await onCommand(text);
      setReply(r);
      speak(r);
    } catch {
      setReply("⚠ ERROR");
    } finally {
      setBusy(false);
      setInput("");
    }
  }, [onCommand, busy]);

  const { listening, startListening, stopListening } = useVoice(run);

  return (
    <div style={{ width:280, display:"flex", flexDirection:"column", gap:4 }}>

      {/* Reply */}
      {reply && (
        <div className="reply-bubble">{reply}</div>
      )}

      {/* Input row */}
      <div style={{ display:"flex", gap:2 }}>
        <input
          className="cmd-input"
          placeholder="> enter command..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && run(input)}
          disabled={busy || disabled}
          style={{ flex:1 }}
        />
        <button className="cmd-btn" onClick={() => run(input)}
          disabled={busy || !input.trim() || disabled}>
          SEND
        </button>
      </div>

      {/* Voice */}
      <button
        className={`cmd-btn-voice ${listening ? "listening" : ""}`}
        onClick={listening ? stopListening : startListening}
        disabled={busy || disabled}>
        {listening ? "● LISTENING... (CLICK TO STOP)" : "🎙 VOICE INPUT"}
      </button>

      {/* Quick commands */}
      <div style={{ borderTop:"1px solid #1a1a1a", paddingTop:4 }}>
        <div style={{ fontSize:8, color:"#444", marginBottom:3, letterSpacing:1 }}>QUICK COMMANDS</div>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {QUICK.map(cmd => (
            <button key={cmd} className="quick-cmd"
              onClick={() => run(cmd)} disabled={busy || disabled}>
              › {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
