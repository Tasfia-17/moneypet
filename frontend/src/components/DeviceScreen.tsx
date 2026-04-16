"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { PetState } from "@/hooks/usePet";

const Pet3DCanvas = dynamic(() => import("./Pet3DCanvas"), {
  ssr: false,
  loading: () => <div style={{ width:148, height:148, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>🐾</div>
});

const C = { green:"#34D399", red:"#F87171", orange:"#FB923C", gray:"#94A3B8", locus:"#7C5CFC" };
const STAGE: Record<string,string> = { baby:"Baby", teen:"Teen", adult:"Adult", elder:"Elder" };
const CHAIN_COLOR: Record<string,string> = { SOL:"#9945FF", ETH:"#627EEA", BASE:"#0052FF" };
const FEED = [
  { sym:"BTC",  price:"$75,040", chg:"+0.9%",  pos:true,  chain:"BASE" },
  { sym:"ETH",  price:"$1,612",  chg:"-0.8%",  pos:false, chain:"ETH"  },
  { sym:"SOL",  price:"$131.40", chg:"+5.3%",  pos:true,  chain:"SOL"  },
  { sym:"USDC", price:"$1.0000", chg:"0.0%",   pos:true,  chain:"BASE" },
  { sym:"DOGE", price:"$0.162",  chg:"+12.4%", pos:true,  chain:"ETH"  },
  { sym:"ADA",  price:"$0.381",  chg:"-3.2%",  pos:false, chain:"ETH"  },
  { sym:"AVAX", price:"$21.44",  chg:"+1.7%",  pos:true,  chain:"ETH"  },
  { sym:"LINK", price:"$12.88",  chg:"-0.4%",  pos:false, chain:"ETH"  },
];
const DS: Record<string,{label:string;color:string;blink:boolean}> = {
  idle:      { label:"IDLE",      color:"rgba(255,255,255,0.2)", blink:false },
  listening: { label:"LISTENING", color:"#F87171",               blink:true  },
  thinking:  { label:"THINKING",  color:"#A78BFA",               blink:true  },
  speaking:  { label:"SPEAKING",  color:"#34D399",               blink:false },
};

function StatBar({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ width:46, fontSize:10, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>{label}</span>
      <div className="stat-track" style={{ flex:1 }}>
        <div className="stat-fill" style={{ width:`${Math.max(0,Math.min(100,value))}%`, background:color }} />
      </div>
      <span style={{ width:26, fontSize:10, color:"rgba(255,255,255,0.35)", textAlign:"right" }}>{Math.round(value)}</span>
    </div>
  );
}

const EMOTION_BODY_COLORS: Record<string,string> = {
  happy:"#7C5CFC", laughing:"#10B981", sad:"#6366F1", crying:"#60A5FA",
  angry:"#EF4444", loving:"#EC4899", shocked:"#F59E0B", thinking:"#8B5CF6",
  cool:"#0EA5E9", sleepy:"#94A3B8", excited:"#F97316", winking:"#34D399",
  neutral:"#7C5CFC", curious:"#06B6D4", worried:"#A78BFA",
};

// ── PET SCREEN ────────────────────────────────────────────────────────────────
function ScreenPet({ state }: { state: PetState }) {
  const cfg = { bodyColor: EMOTION_BODY_COLORS[state.emotion] ?? "#7C5CFC" };
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
                  alignItems:"center", padding:"16px 16px 12px", gap:14 }}>
      {/* Pet 3D canvas */}
      <div style={{ width:148, height:148, flexShrink:0 }}>
        <Pet3DCanvas emotion={state.emotion} />
      </div>

      {/* Name */}
      <div style={{ textAlign:"center", lineHeight:1.3 }}>
        <div style={{ fontSize:18, fontWeight:700, color:"white", letterSpacing:0.5 }}>
          {state.name}
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2, letterSpacing:1.5 }}>
          {STAGE[state.stage]} · {state.emotion}
        </div>
      </div>

      {/* Stats */}
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:7 }}>
        <StatBar label="Hunger" value={state.hunger}    color="linear-gradient(90deg,#FB923C,#FBBF24)" />
        <StatBar label="Happy"  value={state.happiness} color="linear-gradient(90deg,#34D399,#6EE7B7)" />
        <StatBar label="Health" value={state.health}    color="linear-gradient(90deg,#7C5CFC,#A78BFA)" />
      </div>

      {/* Balance */}
      <div style={{
        background:"linear-gradient(135deg,rgba(124,92,252,0.2),rgba(65,1,246,0.1))",
        border:"1px solid rgba(124,92,252,0.3)",
        borderRadius:99, padding:"8px 20px",
        fontSize:14, fontWeight:700, color:"#C4B5FD",
        letterSpacing:0.5,
        boxShadow:"0 0 20px rgba(124,92,252,0.2)",
      }}>
        ${state.balance_usdc.toFixed(4)} USDC
      </div>

      {/* Mini stats row */}
      <div style={{ display:"flex", gap:20, fontSize:10, color:"rgba(255,255,255,0.25)" }}>
        <span>+<span style={{color:C.green}}>${state.lifetime_earned.toFixed(3)}</span></span>
        <span>-<span style={{color:C.red}}>${state.lifetime_spent.toFixed(3)}</span></span>
        <span style={{color:"rgba(255,255,255,0.2)"}}>{state.age_hours.toFixed(1)}h</span>
      </div>
    </div>
  );
}

// ── FEED SCREEN ───────────────────────────────────────────────────────────────
function ScreenFeed({ sel, onSel }: { sel:number; onSel:(i:number)=>void }) {
  return (
    <div style={{ height:"100%", overflowY:"auto" }}>
      <div style={{ display:"flex", padding:"8px 14px 6px",
                    fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:1,
                    borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <span style={{width:44}}>CHAIN</span>
        <span style={{flex:1}}>SYMBOL</span>
        <span style={{width:72,textAlign:"right"}}>PRICE</span>
        <span style={{width:60,textAlign:"right"}}>24H</span>
      </div>
      {FEED.map((t,i) => (
        <div key={t.sym} className={`feed-row ${i===sel?"sel":""}`} onClick={()=>onSel(i)}>
          <span style={{width:44,flexShrink:0}}>
            <span className="chain-badge" style={{
              color:CHAIN_COLOR[t.chain]??C.locus,
              background:`${CHAIN_COLOR[t.chain]??C.locus}18`,
              border:`1px solid ${CHAIN_COLOR[t.chain]??C.locus}35`,
            }}>{t.chain}</span>
          </span>
          <span style={{flex:1,fontSize:12,fontWeight:600,color:"white"}}>{t.sym}</span>
          <span style={{width:72,fontSize:11,color:"rgba(255,255,255,0.65)",textAlign:"right"}}>{t.price}</span>
          <span style={{width:60,fontSize:11,fontWeight:600,textAlign:"right",color:t.pos?C.green:C.red}}>
            {t.pos?"▲":"▼"} {t.chg}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── WALLET SCREEN ─────────────────────────────────────────────────────────────
function ScreenWallet({ state }: { state: PetState }) {
  const pnl = state.lifetime_earned - state.lifetime_spent;
  const sc  = state.spending_controls;
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflowY:"auto" }}>
      {/* Balance card */}
      <div style={{ margin:"12px 12px 8px",
                    background:"linear-gradient(135deg,rgba(124,92,252,0.15),rgba(65,1,246,0.08))",
                    border:"1px solid rgba(124,92,252,0.25)", borderRadius:16, padding:"14px 16px" }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:1.5, marginBottom:6 }}>
          LOCUS WALLET
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:"#C4B5FD", letterSpacing:0.5 }}>
          ${state.balance_usdc.toFixed(4)}
        </div>
        <div style={{ fontSize:11, marginTop:4, color:pnl>=0?C.green:C.red }}>
          {pnl>=0?"▲":"▼"} ${Math.abs(pnl).toFixed(4)} net P&L
        </div>
      </div>

      {/* Spending controls */}
      {sc && (
        <div style={{ margin:"0 12px 8px",
                      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
                      borderRadius:12, padding:"10px 14px" }}>
          <div style={{ fontSize:9, color:"rgba(124,92,252,0.7)", letterSpacing:1.5, marginBottom:8 }}>
            SPENDING CONTROLS
          </div>
          {[
            { k:"Allowance", v:sc.allowance_usdc,  c:C.green  },
            { k:"Max TX",    v:sc.max_tx_usdc,      c:C.orange },
            { k:"Status",    v:sc.wallet_status,    c:sc.wallet_status==="deployed"?C.green:C.orange },
          ].map(r => (
            <div key={r.k} style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{r.k}</span>
              <span style={{ fontSize:10, color:r.c, fontWeight:600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tx log */}
      <div style={{ flex:1 }}>
        {state.tx_log.length === 0 && (
          <div style={{ padding:20, textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.15)" }}>
            No transactions yet
          </div>
        )}
        {state.tx_log.map((tx,i) => {
          const c = tx.msg.startsWith("+") ? C.green
                  : tx.msg.startsWith("-") ? C.red
                  : tx.msg.startsWith("FAIL") ? C.red : C.gray;
          return (
            <div key={i} className="tx-row">
              <span style={{ color:"rgba(255,255,255,0.18)", flexShrink:0, fontSize:9 }}>{tx.time}</span>
              <span style={{ flex:1, color:c, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {tx.msg}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EARN SCREEN ───────────────────────────────────────────────────────────────
function ScreenEarn({ state, onCheckout }: { state:PetState; onCheckout:()=>void }) {
  const [t, setT] = useState(10);
  useEffect(() => { const id = setInterval(()=>setT(c=>Math.max(0,c-1)),1000); return ()=>clearInterval(id); }, []);
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:"16px 14px", gap:12 }}>
      <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:2 }}>
        EARN USDC
      </div>
      <div style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)",
                    borderRadius:14, padding:"14px 16px" }}>
        {[
          { k:"Pet",     v:state.name },
          { k:"Stage",   v:STAGE[state.stage] },
          { k:"Amount",  v:"1.00 USDC" },
          { k:"Service", v:"Market Summary" },
          { k:"Balance", v:`$${state.balance_usdc.toFixed(4)}` },
        ].map(r => (
          <div key={r.k} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{r.k}</span>
            <span style={{ fontSize:11, color:"white", fontWeight:500 }}>{r.v}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign:"center", fontSize:10,
                    color:state.checkout_session_id?"#34D399":"rgba(255,255,255,0.2)" }}>
        {state.checkout_session_id ? "Session ready" : "Say 'create checkout' first"}
      </div>
      <button onClick={onCheckout} disabled={!state.checkout_session_id}
        style={{ background:state.checkout_session_id
                  ?"linear-gradient(135deg,#7C5CFC,#4101F6)"
                  :"rgba(255,255,255,0.04)",
                 border:"none", borderRadius:14, color:"white",
                 padding:"13px", fontSize:13, fontWeight:600,
                 cursor:state.checkout_session_id?"pointer":"not-allowed",
                 opacity:state.checkout_session_id?1:0.4,
                 boxShadow:state.checkout_session_id?"0 4px 20px rgba(124,92,252,0.4)":"none" }}>
        Open Locus Checkout
      </button>
      <div style={{ textAlign:"center", fontSize:10, color:"rgba(255,255,255,0.15)" }}>
        {t>0?`Auto-close in ${t}s`:"Timed out"}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS = ["PET","FEED","WALLET","EARN"] as const;
type Tab = typeof TABS[number];

export default function DeviceScreen({ state, onCheckout }: { state:PetState; onCheckout:()=>void }) {
  const [tab, setTab] = useState<Tab>("PET");
  const [feedSel, setFeedSel] = useState(0);
  const [notify, setNotify] = useState("");
  const prevEmotion = useRef(state.emotion);

  useEffect(() => {
    if (state.emotion === prevEmotion.current) return;
    prevEmotion.current = state.emotion;
    const msgs: Record<string,string> = {
      laughing:"Payment received!", crying:"Transaction failed",
      shocked:"Price alert!", loving:"Wallet funded!", cool:"Transfer complete",
    };
    if (msgs[state.emotion]) {
      setNotify(msgs[state.emotion]);
      setTimeout(()=>setNotify(""), 2500);
    }
  }, [state.emotion]);

  const ds = DS[state.device_state] ?? DS.idle;

  return (
    <div className="device-screen" style={{ width:320, height:580, display:"flex", flexDirection:"column" }}>
      {/* Status bar */}
      <div style={{ height:38, display:"flex", alignItems:"center", padding:"0 14px",
                    background:"rgba(0,0,0,0.35)", borderBottom:"1px solid rgba(255,255,255,0.05)",
                    flexShrink:0, gap:8 }}>
        <span style={{ fontSize:9, color:ds.color, letterSpacing:1, flex:"0 0 72px", fontWeight:600,
                        animation:ds.blink?"blink 0.8s step-end infinite":undefined }}>
          {ds.label}
        </span>
        <div style={{ flex:1, display:"flex", justifyContent:"center", gap:1 }}>
          {TABS.map(t => (
            <button key={t} className={`screen-tab ${t===tab?"active":""}`} onClick={()=>setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)", flex:"0 0 56px", textAlign:"right" }}>
          ${state.balance_usdc.toFixed(2)}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        {tab==="PET"    && <ScreenPet    state={state} />}
        {tab==="FEED"   && <ScreenFeed   sel={feedSel} onSel={setFeedSel} />}
        {tab==="WALLET" && <ScreenWallet state={state} />}
        {tab==="EARN"   && <ScreenEarn   state={state} onCheckout={onCheckout} />}
        {notify && <div className="notify-overlay">{notify}</div>}
      </div>

      {/* Tab bar */}
      <div className="screen-tabs">
        {TABS.map(t => (
          <button key={t} className={`screen-tab ${t===tab?"active":""}`} onClick={()=>setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}
