"use client";
import { useState, useCallback } from "react";
import { usePet } from "@/hooks/usePet";
import DeviceScreen from "@/components/DeviceScreen";
import CommandPanel from "@/components/CommandPanel";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Home() {
  const { state, loading, sendCommand, feedPet } = usePet();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCommand = useCallback(async (text: string) => {
    const reply = await sendCommand(text);
    if (/checkout|earn|pay me/i.test(text) && state?.checkout_session_id) {
      setShowCheckout(true);
    }
    return reply;
  }, [sendCommand, state]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.3)", fontSize:13, position:"relative", zIndex:1 }}>
      Initializing MoneyPet...
    </div>
  );

  if (!state) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#F87171", fontSize:13, position:"relative", zIndex:1 }}>
      Backend offline — run python3 main.py
    </div>
  );

  return (
    <main style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
                   alignItems:"center", justifyContent:"center",
                   gap:36, padding:24, position:"relative", zIndex:1 }}>

      {/* Title */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:6, marginBottom:8 }}>
          LOCUS PAYGENTIC HACKATHON 2026
        </div>
        <h1 style={{
          fontSize:36, fontWeight:900, margin:0, letterSpacing:1,
          background:"linear-gradient(135deg, #C4B5FD 0%, #7C5CFC 40%, #34D399 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>
          MoneyPet
        </h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.25)", marginTop:6 }}>
          An AI agent with a real Locus wallet on Base
        </p>
      </div>

      {/* Layout */}
      <div style={{ display:"flex", gap:28, alignItems:"flex-start",
                    flexWrap:"wrap", justifyContent:"center" }}>

        {/* Device */}
        <div className="device-shell">
          {/* Notch */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <div style={{ width:80, height:5, borderRadius:99,
                          background:"rgba(255,255,255,0.07)",
                          boxShadow:"inset 0 1px 0 rgba(0,0,0,0.3)" }} />
          </div>

          <DeviceScreen state={state} onCheckout={() => setShowCheckout(!!state.checkout_session_id)} />

          {/* Buttons */}
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button className="hw-btn">◄</button>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="hw-btn">▲</button>
                <button className="hw-btn">▼</button>
              </div>
              <button className="hw-btn">►</button>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="hw-btn" title="+1 USDC" onClick={() => feedPet(1)}>+1</button>
              <button className="hw-btn" title="+5 USDC" onClick={() => feedPet(5)}>+5</button>
              <button className="hw-btn primary"
                onClick={() => state.checkout_session_id && setShowCheckout(true)}>A</button>
              <button className="hw-btn">B</button>
              <button className="hw-btn">Y</button>
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.12)", letterSpacing:1 }}>
              +1 / +5 USDC demo feed
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, width:300 }}>
          {/* Status pill */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap",
                        background:"rgba(255,255,255,0.03)",
                        border:"1px solid rgba(255,255,255,0.07)",
                        borderRadius:14, padding:"10px 14px", fontSize:10 }}>
            <span style={{ color:"rgba(255,255,255,0.25)" }}>
              AGENT <span style={{ color:"#34D399", fontWeight:600 }}>ONLINE</span>
            </span>
            <span style={{ color:"rgba(255,255,255,0.25)" }}>
              LOCUS <span style={{ color:"#7C5CFC", fontWeight:600 }}>BETA</span>
            </span>
            <span style={{ color:"rgba(255,255,255,0.25)" }}>
              <span style={{ color:"#C4B5FD", fontWeight:600 }}>${state.balance_usdc.toFixed(4)}</span> USDC
            </span>
            <span style={{ color:"rgba(255,255,255,0.25)" }}>
              <span style={{ color:"#FB923C", fontWeight:600 }}>{state.emotion}</span>
            </span>
          </div>

          <CommandPanel onCommand={handleCommand} />

          <div style={{ fontSize:10, color:"rgba(255,255,255,0.12)", lineHeight:2 }}>
            Built with{" "}
            <a href="https://paywithlocus.com" target="_blank"
               style={{ color:"#7C5CFC", textDecoration:"none" }}>PayWithLocus</a>
            {" · "}
            <a href="/scene"
               style={{ color:"#34D399", textDecoration:"none", fontWeight:600 }}>
              View 3D Scene
            </a>
            {" · "}
            <a href="/moods"
               style={{ color:"#F97316", textDecoration:"none", fontWeight:600 }}>
              All 22 Moods
            </a>
            {" · "}
            <a href="https://github.com/Tasfia-17/moneypet" target="_blank"
               style={{ color:"rgba(255,255,255,0.2)", textDecoration:"none" }}>GitHub</a>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && state.checkout_session_id && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      zIndex:50, backdropFilter:"blur(12px)" }}>
          <div style={{ background:"rgba(255,255,255,0.05)", backdropFilter:"blur(40px)",
                        border:"1px solid rgba(255,255,255,0.1)", borderRadius:24,
                        padding:28, width:360, maxWidth:"90vw",
                        boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <span style={{ fontWeight:700, fontSize:15 }}>Pay {state.name}</span>
              <button onClick={() => setShowCheckout(false)}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)",
                         fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
            <div style={{ textAlign:"center", padding:"8px 0 16px" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>
                Session: {state.checkout_session_id.slice(0,24)}...
              </div>
              <a href={`https://checkout.paywithlocus.com/${state.checkout_session_id}`}
                 target="_blank" rel="noopener noreferrer"
                 style={{ display:"inline-block",
                          background:"linear-gradient(135deg,#7C5CFC,#4101F6)",
                          color:"white", padding:"13px 28px", borderRadius:14,
                          textDecoration:"none", fontWeight:700, fontSize:14,
                          boxShadow:"0 4px 20px rgba(124,92,252,0.5)" }}>
                Open Locus Checkout
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
