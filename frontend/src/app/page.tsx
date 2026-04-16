"use client";
import { useState, useCallback } from "react";
import { usePet } from "@/hooks/usePet";
import DeviceScreen from "@/components/DeviceScreen";
import CommandPanel from "@/components/CommandPanel";
import CheckoutPanel from "@/components/CheckoutPanel";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Device hardware buttons
function DevBtn({ label, title, onClick, primary }: {
  label: string; title: string; onClick: () => void; primary?: boolean;
}) {
  return (
    <button className={`dev-btn ${primary ? "primary" : ""}`} title={title} onClick={onClick}>
      {label}
    </button>
  );
}

export default function Home() {
  const { state, loading, sendCommand, feedPet } = usePet();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCommand = useCallback(async (text: string) => {
    const reply = await sendCommand(text);
    if (state?.checkout_session_id) setShowCheckout(true);
    return reply;
  }, [sendCommand, state]);

  const handlePaid = useCallback(async (amount: string) => {
    await fetch(`${API}/webhook/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "checkout.session.paid", data: { amount } }),
    });
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#444", fontFamily:"'Courier New',monospace", fontSize:11 }}>
      INITIALIZING MONEYPET...
    </div>
  );

  if (!state) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#FF1744", fontFamily:"'Courier New',monospace", fontSize:11 }}>
      ⚠ BACKEND OFFLINE — START python main.py ON PORT 8000
    </div>
  );

  return (
    <main style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
                   alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>

      {/* Title */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#444", letterSpacing:4, marginBottom:4 }}>
          LOCUS PAYGENTIC HACKATHON
        </div>
        <div style={{ fontSize:20, fontWeight:"bold", color:"#fff", letterSpacing:2 }}>
          MONEY<span style={{ color:"#5934FF" }}>PET</span>
        </div>
        <div style={{ fontSize:9, color:"#555", marginTop:2 }}>
          AI AGENT · LOCUS WALLET · PHYSICAL SIMULATION
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap", justifyContent:"center" }}>

        {/* Device shell */}
        <div className="device-shell">
          <div className="device-label">MONEYPET v1.0 · ESP32-S3 SIM</div>

          {/* The 320×240 screen */}
          <DeviceScreen
            state={state}
            onCheckout={() => setShowCheckout(true)}
          />

          {/* Hardware buttons below screen */}
          <div style={{ marginTop:10 }}>
            {/* D-pad row */}
            <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:4 }}>
              <DevBtn label="◄" title="LEFT" onClick={() => {}} />
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <DevBtn label="▲" title="UP" onClick={() => {}} />
                <DevBtn label="▼" title="DOWN" onClick={() => {}} />
              </div>
              <DevBtn label="►" title="RIGHT" onClick={() => {}} />
            </div>
            {/* Action buttons */}
            <div className="btn-group">
              <DevBtn label="💊" title="+1 USDC (demo feed)" onClick={() => feedPet(1)} />
              <DevBtn label="💰" title="+5 USDC (demo feed)" onClick={() => feedPet(5)} />
              <DevBtn label="A"  title="Confirm / Buy" onClick={() => setShowCheckout(!!state.checkout_session_id)} primary />
              <DevBtn label="B"  title="Back / Cancel" onClick={() => {}} />
              <DevBtn label="Y"  title="Portfolio" onClick={() => {}} />
            </div>
            <div style={{ textAlign:"center", fontSize:8, color:"#333", marginTop:4 }}>
              💊 +1 USDC &nbsp;|&nbsp; 💰 +5 USDC &nbsp;|&nbsp; [A] CONFIRM &nbsp;|&nbsp; [B] BACK
            </div>
          </div>
        </div>

        {/* Right panel: command + info */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

          {/* Agent status bar */}
          <div style={{ background:"#0d0d0d", border:"1px solid #1a1a1a",
                        padding:"6px 10px", fontSize:9, color:"#555",
                        display:"flex", gap:12, flexWrap:"wrap" }}>
            <span>AGENT: <span style={{ color:"#00C853" }}>ONLINE</span></span>
            <span>LOCUS: <span style={{ color:"#5934FF" }}>BETA</span></span>
            <span>WALLET: <span style={{ color:"#9E9E9E" }}>{state.balance_usdc.toFixed(4)} USDC</span></span>
            <span>MOOD: <span style={{ color:"#FF6D00" }}>{state.mood.toUpperCase()}</span></span>
          </div>

          <CommandPanel onCommand={handleCommand} />

          {/* Attribution */}
          <div style={{ fontSize:8, color:"#333", lineHeight:1.6 }}>
            BUILT WITH{" "}
            <a href="https://paywithlocus.com" target="_blank" style={{ color:"#5934FF" }}>PAYWITHLOCUS</a>
            {" "}· INSPIRED BY{" "}
            <a href="https://github.com/JupiterXiaoxiaoYu/ava-trading-esp32" target="_blank" style={{ color:"#444" }}>AVA BOX</a>
            {" "}+{" "}
            <a href="https://github.com/cifertech/TamaFi" target="_blank" style={{ color:"#444" }}>TAMAFI</a>
            {" "}+{" "}
            <a href="https://github.com/akdeb/ElatoAI" target="_blank" style={{ color:"#444" }}>ELATOAI</a>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && state.checkout_session_id && (
        <CheckoutPanel
          sessionId={state.checkout_session_id}
          onPaid={handlePaid}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </main>
  );
}
