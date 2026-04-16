"use client";
import dynamic from "next/dynamic";
import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import Pet3D, { ALL_EMOTIONS } from "@/components/Pet3D";

const EMOTION_COLORS: Record<string, string> = {
  happy:"#7C5CFC", laughing:"#10B981", sad:"#6366F1", crying:"#60A5FA",
  angry:"#EF4444", loving:"#EC4899", shocked:"#F59E0B", thinking:"#8B5CF6",
  cool:"#0EA5E9", sleepy:"#94A3B8", excited:"#F97316", winking:"#34D399",
  embarrassed:"#F97316", surprised:"#FBBF24", confident:"#7C5CFC",
  curious:"#06B6D4", worried:"#A78BFA", neutral:"#7C5CFC",
  delicious:"#F97316", silly:"#A855F7", kissy:"#EC4899", funny:"#EAB308",
};

const EMOTION_EMOJI: Record<string, string> = {
  happy:"🙂", laughing:"😆", sad:"😔", crying:"😭", angry:"😠",
  loving:"😍", shocked:"😱", thinking:"🤔", cool:"😎", sleepy:"😴",
  excited:"🤩", winking:"😉", embarrassed:"😳", surprised:"😯",
  confident:"😏", curious:"🧐", worried:"😰", neutral:"😶",
  delicious:"🤤", silly:"😜", kissy:"😘", funny:"😂",
};

export default function MoodsPage() {
  const [selected, setSelected] = useState("happy");
  const color = EMOTION_COLORS[selected] ?? "#7C5CFC";

  return (
    <div style={{ minHeight:"100vh", background:"#06040f", color:"white",
                  fontFamily:"-apple-system, 'Inter', sans-serif", position:"relative" }}>

      {/* Background glow */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
                    background:`radial-gradient(ellipse 800px 600px at 50% 40%, ${color}18 0%, transparent 70%)`,
                    transition:"background 0.5s" }} />

      {/* Header */}
      <div style={{ padding:"24px 32px 0", position:"relative", zIndex:1 }}>
        <a href="/" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none", fontSize:12 }}>
          ← Back to MoneyPet
        </a>
        <h1 style={{ fontSize:28, fontWeight:800, marginTop:12,
                     background:`linear-gradient(135deg, white, ${color})`,
                     WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Penny's Moods
        </h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
          Scroll through all 22 emotions. Click any to see the 3D animation.
        </p>
      </div>

      <div style={{ display:"flex", gap:0, height:"calc(100vh - 120px)", position:"relative", zIndex:1 }}>

        {/* 3D Viewer */}
        <div style={{ flex:1, position:"relative" }}>
          {/* Emotion label */}
          <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)",
                        zIndex:10, textAlign:"center" }}>
            <div style={{ fontSize:32 }}>{EMOTION_EMOJI[selected]}</div>
            <div style={{ fontSize:16, fontWeight:700, color:"white", marginTop:4, letterSpacing:1 }}>
              {selected.charAt(0).toUpperCase() + selected.slice(1)}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
              Drag to rotate · Scroll to zoom
            </div>
          </div>

          <Canvas camera={{ position:[0, 0.5, 3.5], fov:45 }}
            style={{ background:"transparent" }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-3, 2, -3]} intensity={0.4} color={color} />
              <pointLight position={[0, 3, 2]} intensity={0.8} color={color} />

              <Pet3D emotion={selected} />

              <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={4} blur={2} />
              <OrbitControls
                enablePan={false}
                minDistance={2}
                maxDistance={6}
                autoRotate
                autoRotateSpeed={1.5}
              />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        {/* Mood scroll list */}
        <div style={{ width:200, overflowY:"auto", borderLeft:"1px solid rgba(255,255,255,0.06)",
                      background:"rgba(0,0,0,0.3)", backdropFilter:"blur(20px)" }}>
          <div style={{ padding:"12px 14px 6px", fontSize:9, color:"rgba(255,255,255,0.25)",
                        letterSpacing:2, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            ALL MOODS ({ALL_EMOTIONS.length})
          </div>
          {ALL_EMOTIONS.map(em => {
            const c = EMOTION_COLORS[em] ?? "#7C5CFC";
            const isActive = em === selected;
            return (
              <button key={em} onClick={() => setSelected(em)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"10px 14px", border:"none", cursor:"pointer",
                  background: isActive ? `${c}18` : "transparent",
                  borderLeft: isActive ? `2px solid ${c}` : "2px solid transparent",
                  transition:"all 0.15s",
                }}>
                <span style={{ fontSize:18 }}>{EMOTION_EMOJI[em] ?? "😶"}</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:12, fontWeight: isActive ? 700 : 400,
                                color: isActive ? "white" : "rgba(255,255,255,0.5)" }}>
                    {em.charAt(0).toUpperCase() + em.slice(1)}
                  </div>
                  <div style={{ width:40, height:2, borderRadius:99, marginTop:3,
                                background: isActive ? c : "rgba(255,255,255,0.1)",
                                transition:"background 0.3s" }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
