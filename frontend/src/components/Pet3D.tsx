"use client";
/**
 * Pet3D — cute 3D pet with full body parts, built with React Three Fiber.
 * Body: round torso, head, ears, arms, legs, tail.
 * Expressions driven by emotion prop.
 */
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Emotion → colors + animation style
const EMOTION_CONFIG: Record<string, {
  bodyColor: string; bellyColor: string; eyeColor: string;
  cheekColor: string; bounce: number; wobble: number; label: string;
}> = {
  happy:       { bodyColor:"#7C5CFC", bellyColor:"#C4B5FD", eyeColor:"#1a1a2e", cheekColor:"#F9A8D4", bounce:1.2, wobble:0.3, label:"Happy" },
  laughing:    { bodyColor:"#10B981", bellyColor:"#A7F3D0", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:2.0, wobble:0.6, label:"Laughing" },
  sad:         { bodyColor:"#6366F1", bellyColor:"#C7D2FE", eyeColor:"#1a1a2e", cheekColor:"#BAE6FD", bounce:0.2, wobble:0.1, label:"Sad" },
  crying:      { bodyColor:"#60A5FA", bellyColor:"#BFDBFE", eyeColor:"#1a1a2e", cheekColor:"#BAE6FD", bounce:0.1, wobble:0.05, label:"Crying" },
  angry:       { bodyColor:"#EF4444", bellyColor:"#FCA5A5", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:0.8, wobble:0.8, label:"Angry" },
  loving:      { bodyColor:"#EC4899", bellyColor:"#FBCFE8", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:1.0, wobble:0.2, label:"Loving" },
  shocked:     { bodyColor:"#F59E0B", bellyColor:"#FDE68A", eyeColor:"#1a1a2e", cheekColor:"#FDE68A", bounce:0.5, wobble:1.2, label:"Shocked" },
  thinking:    { bodyColor:"#8B5CF6", bellyColor:"#DDD6FE", eyeColor:"#1a1a2e", cheekColor:"#E9D5FF", bounce:0.4, wobble:0.15, label:"Thinking" },
  cool:        { bodyColor:"#0EA5E9", bellyColor:"#BAE6FD", eyeColor:"#1a1a2e", cheekColor:"#BAE6FD", bounce:0.6, wobble:0.1, label:"Cool" },
  sleepy:      { bodyColor:"#94A3B8", bellyColor:"#E2E8F0", eyeColor:"#1a1a2e", cheekColor:"#E2E8F0", bounce:0.1, wobble:0.05, label:"Sleepy" },
  excited:     { bodyColor:"#F97316", bellyColor:"#FED7AA", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:2.5, wobble:0.5, label:"Excited" },
  winking:     { bodyColor:"#34D399", bellyColor:"#A7F3D0", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:0.8, wobble:0.2, label:"Winking" },
  embarrassed: { bodyColor:"#F97316", bellyColor:"#FED7AA", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:0.3, wobble:0.3, label:"Embarrassed" },
  surprised:   { bodyColor:"#FBBF24", bellyColor:"#FEF3C7", eyeColor:"#1a1a2e", cheekColor:"#FDE68A", bounce:0.6, wobble:0.9, label:"Surprised" },
  confident:   { bodyColor:"#7C5CFC", bellyColor:"#DDD6FE", eyeColor:"#1a1a2e", cheekColor:"#C4B5FD", bounce:0.7, wobble:0.1, label:"Confident" },
  curious:     { bodyColor:"#06B6D4", bellyColor:"#CFFAFE", eyeColor:"#1a1a2e", cheekColor:"#A5F3FC", bounce:0.9, wobble:0.4, label:"Curious" },
  worried:     { bodyColor:"#A78BFA", bellyColor:"#EDE9FE", eyeColor:"#1a1a2e", cheekColor:"#DDD6FE", bounce:0.3, wobble:0.5, label:"Worried" },
  neutral:     { bodyColor:"#7C5CFC", bellyColor:"#C4B5FD", eyeColor:"#1a1a2e", cheekColor:"#F9A8D4", bounce:0.5, wobble:0.1, label:"Neutral" },
  delicious:   { bodyColor:"#F97316", bellyColor:"#FED7AA", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:1.0, wobble:0.3, label:"Delicious" },
  silly:       { bodyColor:"#A855F7", bellyColor:"#E9D5FF", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:1.8, wobble:0.7, label:"Silly" },
  kissy:       { bodyColor:"#EC4899", bellyColor:"#FCE7F3", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:0.8, wobble:0.2, label:"Kissy" },
  funny:       { bodyColor:"#EAB308", bellyColor:"#FEF9C3", eyeColor:"#1a1a2e", cheekColor:"#FCA5A5", bounce:1.5, wobble:0.5, label:"Funny" },
};

export const ALL_EMOTIONS = Object.keys(EMOTION_CONFIG);

function usePetAnimation(emotion: string, t: React.MutableRefObject<number>) {
  const cfg = EMOTION_CONFIG[emotion] ?? EMOTION_CONFIG.happy;
  return {
    bodyY:    Math.sin(t.current * 2) * 0.06 * cfg.bounce,
    bodyRotZ: Math.sin(t.current * 1.5) * 0.04 * cfg.wobble,
    tailRot:  Math.sin(t.current * 3) * 0.4 * cfg.bounce,
    earL:     Math.sin(t.current * 2.5) * 0.08 * cfg.wobble,
    earR:    -Math.sin(t.current * 2.5 + 0.5) * 0.08 * cfg.wobble,
    armL:     Math.sin(t.current * 2) * 0.15 * cfg.bounce,
    armR:    -Math.sin(t.current * 2 + 0.3) * 0.15 * cfg.bounce,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Eye({ x, y, z, open = 1, wink = false, heart = false, color = "#1a1a2e" }: {
  x:number; y:number; z:number; open?:number; wink?:boolean; heart?:boolean; color?:string;
}) {
  if (wink) {
    return (
      <mesh position={[x, y, z]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.03, 0.02]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (heart) {
    // Heart eye — two spheres
    return (
      <group position={[x, y, z]}>
        <mesh position={[-0.04, 0.02, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
        <mesh position={[0.04, 0.02, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
        <mesh position={[0, -0.03, 0]} rotation={[0, 0, Math.PI/4]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Shine */}
      <mesh position={[0.03, 0.03, 0.07]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 0.07]} scale={[1, open, 1]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#0a0a1e" />
      </mesh>
    </group>
  );
}

function Cheek({ x, y, z }: { x:number; y:number; z:number }) {
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.1, 10, 10]} />
      <meshStandardMaterial color="#F9A8D4" transparent opacity={0.5} />
    </mesh>
  );
}

function Mouth({ emotion }: { emotion: string }) {
  const z = 0.42;
  if (["laughing","excited","funny"].includes(emotion)) {
    // Big open mouth
    return (
      <group position={[0, -0.12, z]}>
        <mesh>
          <sphereGeometry args={[0.1, 12, 12, 0, Math.PI*2, 0, Math.PI/2]} />
          <meshStandardMaterial color="#1a1a2e" side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  if (["sad","crying","worried"].includes(emotion)) {
    return (
      <mesh position={[0, -0.14, z]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.08, 0.02, 8, 12, Math.PI]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    );
  }
  if (["shocked","surprised"].includes(emotion)) {
    return (
      <mesh position={[0, -0.12, z]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    );
  }
  if (emotion === "kissy") {
    return (
      <mesh position={[0, -0.12, z]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#EC4899" />
      </mesh>
    );
  }
  // Default smile
  return (
    <mesh position={[0, -0.12, z]}>
      <torusGeometry args={[0.09, 0.022, 8, 12, Math.PI]} />
      <meshStandardMaterial color="#1a1a2e" />
    </mesh>
  );
}

// ── Main Pet ──────────────────────────────────────────────────────────────────

export default function Pet3D({ emotion = "happy" }: { emotion?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);
  const cfg = EMOTION_CONFIG[emotion] ?? EMOTION_CONFIG.happy;

  const bodyMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.bodyColor,  roughness:0.3, metalness:0.1 }), [cfg.bodyColor]);
  const bellyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: cfg.bellyColor, roughness:0.4, metalness:0 }),   [cfg.bellyColor]);

  const tailRef = useRef<THREE.Mesh>(null);
  const earLRef = useRef<THREE.Mesh>(null);
  const earRRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    t.current += delta;
    if (!groupRef.current) return;
    const anim = usePetAnimationCalc(emotion, t.current);
    groupRef.current.position.y = anim.bodyY;
    groupRef.current.rotation.z = anim.bodyRotZ;
    if (tailRef.current) tailRef.current.rotation.z = anim.tailRot;
    if (earLRef.current) earLRef.current.rotation.z = 0.3 + anim.earL;
    if (earRRef.current) earRRef.current.rotation.z = -0.3 + anim.earR;
    if (armLRef.current) armLRef.current.rotation.z = 0.4 + anim.armL;
    if (armRRef.current) armRRef.current.rotation.z = -0.4 + anim.armR;
  });

  const isLoving  = emotion === "loving";
  const isWinking = emotion === "winking";
  const isSleepy  = emotion === "sleepy";
  const isAngry   = emotion === "angry";

  return (
    <group ref={groupRef}>
      {/* ── BODY ── */}
      <mesh position={[0, -0.1, 0]} material={bodyMat}>
        <sphereGeometry args={[0.55, 24, 24]} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, -0.08, 0.38]} material={bellyMat}>
        <sphereGeometry args={[0.32, 20, 20]} />
      </mesh>

      {/* ── HEAD ── */}
      <mesh position={[0, 0.62, 0]} material={bodyMat}>
        <sphereGeometry args={[0.44, 24, 24]} />
      </mesh>
      {/* Head belly patch */}
      <mesh position={[0, 0.58, 0.32]} material={bellyMat}>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>

      {/* ── EARS ── */}
      <mesh ref={earLRef} position={[-0.28, 1.0, 0]} rotation={[0, 0, 0.3]} material={bodyMat}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh position={[-0.28, 1.0, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={cfg.bellyColor} roughness={0.5} />
      </mesh>
      <mesh ref={earRRef} position={[0.28, 1.0, 0]} rotation={[0, 0, -0.3]} material={bodyMat}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh position={[0.28, 1.0, 0]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={cfg.bellyColor} roughness={0.5} />
      </mesh>

      {/* ── EYES ── */}
      <Eye x={-0.16} y={0.68} z={0.36}
        open={isSleepy ? 0.15 : 1}
        wink={false}
        heart={isLoving}
        color={cfg.eyeColor} />
      <Eye x={0.16} y={0.68} z={0.36}
        open={isSleepy ? 0.15 : 1}
        wink={isWinking}
        heart={isLoving}
        color={cfg.eyeColor} />

      {/* Angry brows */}
      {isAngry && <>
        <mesh position={[-0.16, 0.82, 0.38]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.18, 0.04, 0.02]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.16, 0.82, 0.38]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.18, 0.04, 0.02]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </>}

      {/* Cheeks */}
      <Cheek x={-0.28} y={0.58} z={0.32} />
      <Cheek x={0.28}  y={0.58} z={0.32} />

      {/* Mouth */}
      <Mouth emotion={emotion} />

      {/* Sleepy Zzz */}
      {isSleepy && (
        <group position={[0.4, 0.9, 0.3]}>
          {[0,1,2].map(i => (
            <mesh key={i} position={[i*0.12, i*0.12, 0]}>
              <sphereGeometry args={[0.04-i*0.008, 6, 6]} />
              <meshStandardMaterial color="white" transparent opacity={0.7-i*0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── ARMS ── */}
      <mesh ref={armLRef} position={[-0.62, 0.05, 0]} rotation={[0, 0, 0.4]} material={bodyMat}>
        <capsuleGeometry args={[0.1, 0.28, 8, 12]} />
      </mesh>
      <mesh ref={armRRef} position={[0.62, 0.05, 0]} rotation={[0, 0, -0.4]} material={bodyMat}>
        <capsuleGeometry args={[0.1, 0.28, 8, 12]} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.72, -0.2, 0]} material={bodyMat}>
        <sphereGeometry args={[0.12, 10, 10]} />
      </mesh>
      <mesh position={[0.72, -0.2, 0]} material={bodyMat}>
        <sphereGeometry args={[0.12, 10, 10]} />
      </mesh>

      {/* ── LEGS ── */}
      <mesh position={[-0.22, -0.58, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.12, 0.22, 8, 12]} />
      </mesh>
      <mesh position={[0.22, -0.58, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.12, 0.22, 8, 12]} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.22, -0.82, 0.08]} rotation={[0.3, 0, 0]} material={bodyMat}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
      <mesh position={[0.22, -0.82, 0.08]} rotation={[0.3, 0, 0]} material={bodyMat}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>

      {/* ── TAIL ── */}
      <mesh ref={tailRef} position={[0, -0.05, -0.5]} rotation={[0.5, 0, 0]} material={bodyMat}>
        <sphereGeometry args={[0.14, 10, 10]} />
      </mesh>

      {/* ── LOVING HEARTS ── */}
      {isLoving && [[-0.5, 1.1, 0.2], [0.5, 1.2, 0.1], [0, 1.3, 0.3]].map(([x,y,z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[0.06-i*0.01, 8, 8]} />
          <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Extracted so useFrame can call it without hook rules violation
function usePetAnimationCalc(emotion: string, time: number) {
  const cfg = EMOTION_CONFIG[emotion] ?? EMOTION_CONFIG.happy;
  return {
    bodyY:    Math.sin(time * 2) * 0.06 * cfg.bounce,
    bodyRotZ: Math.sin(time * 1.5) * 0.04 * cfg.wobble,
    tailRot:  Math.sin(time * 3) * 0.4 * cfg.bounce,
    earL:     Math.sin(time * 2.5) * 0.08 * cfg.wobble,
    earR:    -Math.sin(time * 2.5 + 0.5) * 0.08 * cfg.wobble,
    armL:     Math.sin(time * 2) * 0.15 * cfg.bounce,
    armR:    -Math.sin(time * 2 + 0.3) * 0.15 * cfg.bounce,
  };
}
