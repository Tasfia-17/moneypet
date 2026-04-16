"use client";
import { useState, useEffect, useRef } from "react";
import { PetState } from "@/hooks/usePet";

// ── Exact Ava Box palette ─────────────────────────────────────────────────────
const C = {
  green:"#00C853", red:"#FF1744", orange:"#FF6D00",
  gray:"#9E9E9E", white:"#FFFFFF", locus:"#5934FF",
  sol:"#9945FF", eth:"#627EEA", base:"#0052FF",
};

// ── xiaozhi 21-emotion system → Twemoji ──────────────────────────────────────
// Mapped from emoji_collection.cc
const EMOTIONS: Record<string, { emoji: string; color: string; glow: string }> = {
  neutral:     { emoji:"😶", color:"#9E9E9E", glow:"rgba(158,158,158,0.4)" },
  happy:       { emoji:"🙂", color:"#00C853", glow:"rgba(0,200,83,0.5)"   },
  laughing:    { emoji:"😆", color:"#00C853", glow:"rgba(0,200,83,0.6)"   },
  funny:       { emoji:"😂", color:"#00C853", glow:"rgba(0,200,83,0.4)"   },
  sad:         { emoji:"😔", color:"#627EEA", glow:"rgba(98,126,234,0.4)" },
  angry:       { emoji:"😠", color:"#FF1744", glow:"rgba(255,23,68,0.5)"  },
  crying:      { emoji:"😭", color:"#627EEA", glow:"rgba(98,126,234,0.6)" },
  loving:      { emoji:"😍", color:"#FF6D00", glow:"rgba(255,109,0,0.5)"  },
  embarrassed: { emoji:"😳", color:"#FF6D00", glow:"rgba(255,109,0,0.4)"  },
  surprised:   { emoji:"😯", color:"#FF6D00", glow:"rgba(255,109,0,0.5)"  },
  shocked:     { emoji:"😱", color:"#FF1744", glow:"rgba(255,23,68,0.6)"  },
  thinking:    { emoji:"🤔", color:"#9945FF", glow:"rgba(153,69,255,0.5)" },
  winking:     { emoji:"😉", color:"#00C853", glow:"rgba(0,200,83,0.4)"   },
  cool:        { emoji:"😎", color:"#5934FF", glow:"rgba(89,52,255,0.5)"  },
  relaxed:     { emoji:"😌", color:"#00C853", glow:"rgba(0,200,83,0.3)"   },
  delicious:   { emoji:"🤤", color:"#FF6D00", glow:"rgba(255,109,0,0.4)"  },
  kissy:       { emoji:"😘", color:"#FF6D00", glow:"rgba(255,109,0,0.5)"  },
  confident:   { emoji:"😏", color:"#5934FF", glow:"rgba(89,52,255,0.4)"  },
  sleepy:      { emoji:"😴", color:"#9E9E9E", glow:"rgba(158,158,158,0.3)"},
  silly:       { emoji:"😜", color:"#FF6D00", glow:"rgba(255,109,0,0.4)"  },
  confused:    { emoji:"🙄", color:"#9E9E9E", glow:"rgba(158,158,158,0.4)"},
  // fallback for pet moods not in xiaozhi list
  microchip_ai:{ emoji:"🤖", color:"#5934FF", glow:"rgba(89,52,255,0.5)"  },
};

// ── xiaozhi device state → status indicator ───────────────────────────────────
const DEVICE_STATE_UI: Record<string, { label: string; color: string; blink: boolean }> = {
  idle:      { label:"● IDLE",      color:"#2A2A2A", blink:false },
  listening: { label:"◉ LISTENING", color:"#FF1744", blink:true  },
  thinking:  { label:"◌ THINKING",  color:"#9945FF", blink:true  },
  speaking:  { label:"▶ SPEAKING",  color:"#00C853", blink:false },
};

const STAGE_LABEL: Record<string, string> = {
  baby:"EGG", teen:"HATCH", adult:"GROWN", elder:"ELDER",
};

// ── Stat bar (TamaFi pixel-sharp) ─────────────────────────────────────────────
function StatBar({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, height:14 }}>
      <span style={{ width:36, fontSize:9, color:"#9E9E9E", flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:4, background:"#1a1a1a", border:"1px solid #2A2A2A" }}>
        <div style={{ height:"100%", width:`${Math.max(0,Math.min(100,value))}%`,
                      background:color, transition:"width 0.5s ease" }} />
      </div>
      <span style={{ width:24, fontSize:9, color:"#9E9E9E", textAlign:"right" }}>{Math.round(value)}</span>
    </div>
  );
}

// ── SCREEN: PET ───────────────────────────────────────────────────────────────
function ScreenPet({ state }: { state: PetState }) {
  const em = EMOTIONS[state.emotion] ?? EMOTIONS.neutral;
  const isPulsing = ["laughing","loving","excited","cool"].includes(state.emotion);
  const isShaking = ["shocked","angry","crying"].includes(state.emotion);

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      {/* Emotion display — xiaozhi SetEmotion style */}
      <div style={{ flex:"0 0 82px", display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    borderBottom:"1px solid #2A2A2A", position:"relative",
                    background:"#050505" }}>
        {/* Glow ring */}
        <div style={{ position:"absolute", width:56, height:56, borderRadius:"50%",
                      background:`radial-gradient(circle, ${em.glow} 0%, transparent 70%)`,
                      transition:"all 0.4s" }} />
        <div style={{
          fontSize:36, lineHeight:1, zIndex:1,
          filter:`drop-shadow(0 0 12px ${em.color})`,
          animation: isPulsing ? "petpulse 1s ease-in-out infinite"
                   : isShaking ? "petshake 0.4s ease-in-out infinite"
                   : undefined,
          transition:"all 0.3s",
        }}>
          {em.emoji}
        </div>
        <div style={{ fontSize:8, color: em.color, marginTop:3, letterSpacing:1.5, zIndex:1 }}>
          {state.name.toUpperCase()} · {STAGE_LABEL[state.stage]} · {state.emotion.toUpperCase()}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:"5px 8px", borderBottom:"1px solid #2A2A2A",
                    display:"flex", flexDirection:"column", gap:3 }}>
        <StatBar label="HUNGER" value={state.hunger}    color="#FF6D00" />
        <StatBar label="HAPPY"  value={state.happiness} color="#00C853" />
        <StatBar label="HEALTH" value={state.health}    color="#5934FF" />
      </div>

      {/* Financial rows — Ava Box confirm-row style */}
      <div style={{ flex:1 }}>
        {[
          { k:"BALANCE", v:`$${state.balance_usdc.toFixed(4)}`,      c:C.locus  },
          { k:"EARNED",  v:`+$${state.lifetime_earned.toFixed(4)}`,  c:C.green  },
          { k:"SPENT",   v:`-$${state.lifetime_spent.toFixed(4)}`,   c:C.red    },
          { k:"AGE",     v:`${state.age_hours.toFixed(1)}h`,          c:C.gray   },
        ].map(row => (
          <div key={row.k} style={{ height:22, display:"flex", alignItems:"center",
                                    justifyContent:"space-between", padding:"0 8px",
                                    borderBottom:"1px solid #111" }}>
            <span style={{ fontSize:9, color:"#9E9E9E" }}>{row.k}</span>
            <span style={{ fontSize:10, color:row.c, fontWeight:"bold" }}>{row.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SCREEN: FEED ──────────────────────────────────────────────────────────────
const FEED = [
  { sym:"BTC",  price:"$84,210",  chg:"+2.1%",  pos:true,  chain:"BASE" },
  { sym:"ETH",  price:"$1,612",   chg:"-0.8%",  pos:false, chain:"ETH"  },
  { sym:"SOL",  price:"$131.40",  chg:"+5.3%",  pos:true,  chain:"SOL"  },
  { sym:"USDC", price:"$1.0000",  chg:"0.0%",   pos:true,  chain:"BASE" },
  { sym:"DOGE", price:"$0.1621",  chg:"+12.4%", pos:true,  chain:"ETH"  },
  { sym:"ADA",  price:"$0.3812",  chg:"-3.2%",  pos:false, chain:"ETH"  },
  { sym:"AVAX", price:"$21.44",   chg:"+1.7%",  pos:true,  chain:"ETH"  },
  { sym:"LINK", price:"$12.88",   chg:"-0.4%",  pos:false, chain:"ETH"  },
];
const CHAIN_COLOR: Record<string,string> = { SOL:C.sol, ETH:C.eth, BASE:C.base };

function ScreenFeed({ sel, onSel }: { sel:number; onSel:(i:number)=>void }) {
  return (
    <div style={{ height:"100%" }}>
      <div style={{ height:16, display:"flex", alignItems:"center", background:"#1E1E1E",
                    borderBottom:"1px solid #2A2A2A", padding:"0 4px" }}>
        {["CHAIN","SYMBOL","PRICE","24H"].map((h,i) => (
          <span key={h} style={{ fontSize:8, color:"#555",
            width: i===0?32:i===1?90:i===2?90:72, flexShrink:0,
            textAlign: i>1?"right":"left" }}>{h}</span>
        ))}
      </div>
      {FEED.map((tok, i) => (
        <div key={tok.sym} onClick={() => onSel(i)}
          style={{ height:24, display:"flex", alignItems:"center", padding:"0 4px",
                   borderBottom:"1px solid #1a1a1a", cursor:"pointer",
                   background: i===sel ? "#0D2010" : i%2===0 ? "#0A0A0A" : "#0D0D0D" }}>
          <span style={{ width:32, flexShrink:0 }}>
            <span style={{ fontSize:8, fontWeight:"bold", padding:"1px 3px",
                           border:`1px solid ${CHAIN_COLOR[tok.chain]??C.locus}`,
                           color: CHAIN_COLOR[tok.chain]??C.locus,
                           background:`${CHAIN_COLOR[tok.chain]??C.locus}22` }}>
              {tok.chain}
            </span>
          </span>
          <span style={{ width:90, fontSize:10, color:"#fff", fontWeight:"bold", flexShrink:0 }}>{tok.sym}</span>
          <span style={{ width:90, fontSize:10, color:"#fff", textAlign:"right", flexShrink:0 }}>{tok.price}</span>
          <span style={{ width:72, fontSize:10, color: tok.pos?C.green:C.red, textAlign:"right", flexShrink:0 }}>
            {tok.pos?"▲":"▼"} {tok.chg}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── SCREEN: WALLET ────────────────────────────────────────────────────────────
function ScreenWallet({ state }: { state: PetState }) {
  const pnl = state.lifetime_earned - state.lifetime_spent;
  const sc  = state.spending_controls;
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      {/* Balance header */}
      <div style={{ padding:"4px 8px", background:"#141414", borderBottom:"1px solid #2A2A2A" }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:9, color:"#9E9E9E" }}>LOCUS WALLET</span>
          <span style={{ fontSize:13, fontWeight:"bold", color:C.locus }}>${state.balance_usdc.toFixed(4)}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:1 }}>
          <span style={{ fontSize:9, color:"#9E9E9E" }}>NET P&L</span>
          <span style={{ fontSize:10, color: pnl>=0?C.green:C.red }}>
            {pnl>=0?"▲":"▼"} ${Math.abs(pnl).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Spending controls — the key Locus feature */}
      {sc && (
        <div style={{ background:"#0d0d0d", borderBottom:"1px solid #2A2A2A", padding:"3px 0" }}>
          <div style={{ height:13, display:"flex", alignItems:"center", padding:"0 8px",
                        background:"#1E1E1E", borderBottom:"1px solid #111" }}>
            <span style={{ fontSize:8, color:"#5934FF", letterSpacing:1 }}>● LOCUS SPENDING CONTROLS</span>
          </div>
          {[
            { k:"ALLOWANCE",  v:`$${sc.allowance_usdc} USDC`,    c:C.green  },
            { k:"MAX TX",     v:`$${sc.max_tx_usdc} USDC`,       c:C.orange },
            { k:"APPROVAL",   v:`>$${sc.approval_threshold}`,    c:C.locus  },
            { k:"STATUS",     v:sc.wallet_status.toUpperCase(),  c:sc.wallet_status==="deployed"?C.green:C.orange },
          ].map(r => (
            <div key={r.k} style={{ height:16, display:"flex", alignItems:"center",
                                    justifyContent:"space-between", padding:"0 8px",
                                    borderBottom:"1px solid #0a0a0a" }}>
              <span style={{ fontSize:8, color:"#555" }}>{r.k}</span>
              <span style={{ fontSize:9, color:r.c, fontWeight:"bold" }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tx log */}
      <div style={{ height:13, display:"flex", alignItems:"center", background:"#1E1E1E",
                    borderBottom:"1px solid #2A2A2A", padding:"0 4px" }}>
        <span style={{ flex:1, fontSize:8, color:"#555" }}>TIME</span>
        <span style={{ flex:3, fontSize:8, color:"#555" }}>ACTIVITY</span>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {state.tx_log.length === 0 && (
          <div style={{ padding:"12px 8px", fontSize:9, color:"#333", textAlign:"center" }}>
            NO TRANSACTIONS YET
          </div>
        )}
        {state.tx_log.map((tx, i) => {
          const c = tx.msg.startsWith("+") ? C.green
                  : tx.msg.startsWith("-") ? C.red
                  : tx.msg.startsWith("FAIL") ? "#FF1744" : C.gray;
          return (
            <div key={i} style={{ height:16, display:"flex", alignItems:"center", gap:6,
                                  padding:"0 4px", borderBottom:"1px solid #111",
                                  background: i%2===0?"#0A0A0A":"#0D0D0D" }}>
              <span style={{ fontSize:8, color:"#444", flexShrink:0 }}>{tx.time}</span>
              <span style={{ flex:1, fontSize:9, color:c, overflow:"hidden",
                             textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.msg}</span>
            </div>
          );
        })}
      </div>
      <div style={{ height:16, display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"0 8px", background:"#141414", borderTop:"1px solid #2A2A2A" }}>
        <span style={{ fontSize:8, color:"#9E9E9E" }}>+<span style={{color:C.green}}>${state.lifetime_earned.toFixed(4)}</span></span>
        <span style={{ fontSize:8, color:"#9E9E9E" }}>-<span style={{color:C.red}}>${state.lifetime_spent.toFixed(4)}</span></span>
      </div>
    </div>
  );
}

// ── SCREEN: EARN ──────────────────────────────────────────────────────────────
function ScreenEarn({ state, onCheckout }: { state:PetState; onCheckout:()=>void }) {
  const [t, setT] = useState(10);
  useEffect(() => {
    const id = setInterval(() => setT(c => Math.max(0,c-1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ height:28, display:"flex", alignItems:"center", justifyContent:"center",
                    background:"#0D2010", borderBottom:"1px solid #2A2A2A" }}>
        <span style={{ fontSize:11, color:C.green, fontWeight:"bold", letterSpacing:2 }}>
          ▶ EARN USDC VIA LOCUS
        </span>
      </div>
      {[
        { k:"PET",     v:state.name },
        { k:"STAGE",   v:STAGE_LABEL[state.stage] },
        { k:"AMOUNT",  v:"1.00 USDC" },
        { k:"SERVICE", v:"MARKET SUMMARY" },
        { k:"PAYMENT", v:"LOCUS CHECKOUT" },
        { k:"BALANCE", v:`$${state.balance_usdc.toFixed(4)}` },
      ].map(r => (
        <div key={r.k} style={{ height:22, display:"flex", alignItems:"center",
                                justifyContent:"space-between", padding:"0 8px",
                                borderBottom:"1px solid #111" }}>
          <span style={{ fontSize:9, color:"#9E9E9E" }}>{r.k}</span>
          <span style={{ fontSize:10, color:"#fff" }}>{r.v}</span>
        </div>
      ))}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", gap:6 }}>
        <div style={{ fontSize:9, color: state.checkout_session_id?"#00C853":"#444" }}>
          {state.checkout_session_id ? "● SESSION ACTIVE" : "○ NO SESSION — SAY 'CREATE CHECKOUT'"}
        </div>
        <button onClick={onCheckout} disabled={!state.checkout_session_id}
          style={{ background: state.checkout_session_id?C.locus:"#1a1a1a",
                   border:`1px solid ${state.checkout_session_id?C.locus:"#333"}`,
                   color: state.checkout_session_id?"white":"#444",
                   fontFamily:"'Courier New',monospace", fontSize:10,
                   padding:"5px 14px", cursor: state.checkout_session_id?"pointer":"not-allowed",
                   letterSpacing:1 }}>
          [A] OPEN CHECKOUT
        </button>
        <div style={{ fontSize:8, color:"#333" }}>
          {t > 0 ? `AUTO-CLOSE IN ${t}s` : "TIMED OUT"}
        </div>
      </div>
    </div>
  );
}

// ── MAIN DEVICE SCREEN ────────────────────────────────────────────────────────
const TABS = ["PET","FEED","WALLET","EARN"] as const;
type Tab = typeof TABS[number];

interface Props { state: PetState; onCheckout: () => void; }

export default function DeviceScreen({ state, onCheckout }: Props) {
  const [tab, setTab] = useState<Tab>("PET");
  const [feedSel, setFeedSel] = useState(0);
  const [notify, setNotify] = useState("");
  const prevEmotion = useRef(state.emotion);
  const prevDevState = useRef(state.device_state);

  // xiaozhi ShowNotification — trigger on state changes
  useEffect(() => {
    if (state.emotion !== prevEmotion.current) {
      prevEmotion.current = state.emotion;
      const msgs: Record<string,string> = {
        laughing: "💰 PAYMENT RECEIVED!",
        crying:   "⚠ TRANSACTION FAILED",
        shocked:  "🚨 PRICE ALERT!",
        loving:   "💖 WALLET FUNDED!",
        cool:     "✅ TRANSFER COMPLETE",
      };
      if (msgs[state.emotion]) {
        setNotify(msgs[state.emotion]);
        setTimeout(() => setNotify(""), 2500);
      }
    }
  }, [state.emotion]);

  const em = EMOTIONS[state.emotion] ?? EMOTIONS.neutral;
  const ds = DEVICE_STATE_UI[state.device_state] ?? DEVICE_STATE_UI.idle;

  // Top/bottom bar content per tab
  const topRight: Record<Tab,string> = {
    PET: `${state.emotion.toUpperCase()}`,
    FEED: "8 PAIRS",
    WALLET: `${state.tx_log.length} TXS`,
    EARN: state.checkout_session_id ? "READY" : "IDLE",
  };
  const botLeft: Record<Tab,string> = {
    PET: "[◄►] NAV  [Y] WALLET",
    FEED: "[▲▼] SCROLL  [A] SELECT",
    WALLET: "[▲▼] SCROLL  [B] BACK",
    EARN: "[A] PAY  [B] CANCEL",
  };
  const botRight: Record<Tab,string> = {
    PET: `$${state.balance_usdc.toFixed(2)}`,
    FEED: `SEL: ${FEED[feedSel]?.sym}`,
    WALLET: `P&L: ${(state.lifetime_earned-state.lifetime_spent)>=0?"+":""}$${(state.lifetime_earned-state.lifetime_spent).toFixed(3)}`,
    EARN: state.checkout_session_id ? "SESSION ACTIVE" : "NO SESSION",
  };

  return (
    <div style={{ width:320, height:240, background:"#0A0A0A", position:"relative",
                  overflow:"hidden", border:"1px solid #333",
                  backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 1px,rgba(0,0,0,0.07) 1px,rgba(0,0,0,0.07) 2px)" }}>

      {/* ── TOP BAR 22px — xiaozhi status bar ── */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:22,
                    background:"#141414", borderBottom:"1px solid #2A2A2A",
                    display:"flex", alignItems:"center", padding:"0 4px", zIndex:10, gap:2 }}>

        {/* Device state indicator — xiaozhi style */}
        <span style={{ fontSize:8, color:ds.color, flexShrink:0, width:72,
                       animation: ds.blink ? "blink 0.8s step-end infinite" : undefined }}>
          {ds.label}
        </span>

        {/* Tab buttons */}
        <div style={{ flex:1, display:"flex", gap:1, height:14 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, height:14, border:"none", cursor:"pointer",
              background: t===tab ? "#2A2A2A" : "transparent",
              color: t===tab ? "#fff" : "#444",
              fontSize:8, fontFamily:"'Courier New',monospace",
              borderBottom: t===tab ? `1px solid ${C.locus}` : "none",
            }}>{t}</button>
          ))}
        </div>

        {/* Right: emotion color dot + label */}
        <span style={{ fontSize:8, color: em.color, flexShrink:0, width:60, textAlign:"right" }}>
          {topRight[tab]}
        </span>
      </div>

      {/* ── SCREEN BODY ── */}
      <div style={{ position:"absolute", top:22, bottom:25, left:0, right:0, overflow:"hidden" }}>
        {tab==="PET"    && <ScreenPet    state={state} />}
        {tab==="FEED"   && <ScreenFeed   sel={feedSel} onSel={setFeedSel} />}
        {tab==="WALLET" && <ScreenWallet state={state} />}
        {tab==="EARN"   && <ScreenEarn   state={state} onCheckout={onCheckout} />}
      </div>

      {/* ── NOTIFY OVERLAY — xiaozhi ShowNotification ── */}
      {notify && (
        <div style={{ position:"absolute", bottom:26, left:4, right:4, zIndex:20,
                      background:"#1a1a00", border:`1px solid ${C.orange}`,
                      padding:"3px 8px", fontSize:10, color:C.orange,
                      animation:"notifyin 0.2s ease" }}>
          {notify}
        </div>
      )}

      {/* ── BOTTOM BAR 25px — Ava Box style ── */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:25,
                    background:"#141414", borderTop:"1px solid #2A2A2A",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"0 4px", zIndex:10 }}>
        <span style={{ fontSize:8, color:"#444" }}>{botLeft[tab]}</span>
        <span style={{ fontSize:9, color:C.locus, fontWeight:"bold" }}>{botRight[tab]}</span>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes petpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes petshake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes notifyin { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
