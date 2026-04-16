"use client";
import dynamic from "next/dynamic";
import { usePet } from "@/hooks/usePet";
import Link from "next/link";

// Dynamic import — Three.js must not SSR
const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

export default function ScenePage() {
  const { state, loading, sendCommand, feedPet } = usePet();

  if (loading || !state) return (
    <div style={{ minHeight:"100vh", background:"#06040f", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.3)", fontFamily:"sans-serif" }}>
      {loading ? "Loading..." : "Backend offline — run python3 main.py"}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#06040f", color:"white",
                  fontFamily:"-apple-system,'Inter',sans-serif", display:"flex",
                  flexDirection:"column" }}>

      {/* Background glow */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
                    background:"radial-gradient(ellipse 800px 600px at 50% 40%, rgba(124,92,252,0.15) 0%, transparent 70%)" }} />

      {/* Header */}
      <div style={{ padding:"16px 24px", display:"flex", alignItems:"center",
                    justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.06)",
                    background:"rgba(0,0,0,0.3)", backdropFilter:"blur(20px)",
                    position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <Link href="/" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none", fontSize:12 }}>
            ← Back
          </Link>
          <span style={{ fontSize:16, fontWeight:700, background:"linear-gradient(135deg,#C4B5FD,#7C5CFC)",
                         WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            MoneyPet 3D
          </span>
        </div>

        {/* Live stats */}
        <div style={{ display:"flex", gap:16, fontSize:11 }}>
          <span style={{ color:"rgba(255,255,255,0.3)" }}>
            Balance: <span style={{ color:"#C4B5FD", fontWeight:700 }}>${state.balance_usdc.toFixed(4)}</span>
          </span>
          <span style={{ color:"rgba(255,255,255,0.3)" }}>
            Mood: <span style={{ color:"#34D399", fontWeight:700 }}>{state.emotion}</span>
          </span>
          <span style={{ color:"rgba(255,255,255,0.3)" }}>
            State: <span style={{ color:"#F97316", fontWeight:700 }}>{state.device_state}</span>
          </span>
        </div>

        {/* Quick actions */}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => feedPet(1)}
            style={{ background:"rgba(124,92,252,0.2)", border:"1px solid rgba(124,92,252,0.3)",
                     color:"#C4B5FD", padding:"6px 14px", borderRadius:8, cursor:"pointer",
                     fontSize:11, fontWeight:600 }}>
            +1 USDC
          </button>
          <button onClick={() => sendCommand("bitcoin price")}
            style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)",
                     color:"#34D399", padding:"6px 14px", borderRadius:8, cursor:"pointer",
                     fontSize:11, fontWeight:600 }}>
            BTC Price
          </button>
          <button onClick={() => sendCommand("trending coins")}
            style={{ background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)",
                     color:"#FB923C", padding:"6px 14px", borderRadius:8, cursor:"pointer",
                     fontSize:11, fontWeight:600 }}>
            Trending
          </button>
          <Link href="/moods"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                     color:"rgba(255,255,255,0.5)", padding:"6px 14px", borderRadius:8,
                     fontSize:11, fontWeight:600, textDecoration:"none" }}>
            All Moods
          </Link>
        </div>
      </div>

      {/* 3D Canvas — full remaining height */}
      <div style={{ flex:1, position:"relative" }}>
        <Scene3D state={state} />

        {/* Overlay hints */}
        <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
                      fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:1,
                      background:"rgba(0,0,0,0.3)", padding:"6px 14px", borderRadius:99,
                      backdropFilter:"blur(10px)" }}>
          Drag to rotate · Scroll to zoom · Pet reacts to live Locus transactions
        </div>

        {/* Tx log overlay */}
        {state.tx_log.length > 0 && (
          <div style={{ position:"absolute", top:16, right:16, width:260,
                        background:"rgba(0,0,0,0.5)", backdropFilter:"blur(20px)",
                        border:"1px solid rgba(255,255,255,0.06)", borderRadius:12,
                        padding:"10px 0", maxHeight:200, overflowY:"auto" }}>
            <div style={{ padding:"0 12px 6px", fontSize:9, color:"rgba(255,255,255,0.25)",
                          letterSpacing:1.5, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              LIVE TRANSACTIONS
            </div>
            {state.tx_log.slice(0,8).map((tx,i) => {
              const c = tx.msg.startsWith("+") ? "#34D399"
                      : tx.msg.startsWith("-") ? "#F87171" : "#94A3B8";
              return (
                <div key={i} style={{ display:"flex", gap:8, padding:"5px 12px",
                                      fontSize:10, borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ color:"rgba(255,255,255,0.2)", flexShrink:0 }}>{tx.time}</span>
                  <span style={{ color:c, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {tx.msg}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
