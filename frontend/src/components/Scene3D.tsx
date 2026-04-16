"use client";
/**
 * MoneyPet 3D Scene
 * - Realistic ESP32-S3 board with screen texture
 * - Cute 3D pet with full body parts + 22 emotions
 * - Orbiting USDC coins
 * - Particle burst on earn
 * - Fully agentic: reacts to live pet state
 */
import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text, ContactShadows, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { PetState } from "@/hooks/usePet";

// ── Colors ────────────────────────────────────────────────────────────────────
const EMOTION_COLOR: Record<string, string> = {
  happy:"#7C5CFC", laughing:"#10B981", sad:"#6366F1", crying:"#60A5FA",
  angry:"#EF4444", loving:"#EC4899", shocked:"#F59E0B", thinking:"#8B5CF6",
  cool:"#0EA5E9", sleepy:"#94A3B8", excited:"#F97316", winking:"#34D399",
  embarrassed:"#F97316", surprised:"#FBBF24", confident:"#7C5CFC",
  curious:"#06B6D4", worried:"#A78BFA", neutral:"#7C5CFC",
  delicious:"#F97316", silly:"#A855F7", kissy:"#EC4899", funny:"#EAB308",
};

// ── ESP32 Board ───────────────────────────────────────────────────────────────
function ESP32Board({ screenColor }: { screenColor: string }) {
  // PCB
  return (
    <group position={[0, -1.2, 0]}>
      {/* Main PCB */}
      <RoundedBox args={[3.2, 0.12, 2.0]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a3a1a" roughness={0.7} metalness={0.1} />
      </RoundedBox>

      {/* PCB silkscreen lines */}
      {[-1.2,-0.6,0,0.6,1.2].map((x,i) => (
        <mesh key={i} position={[x, 0.07, 0]}>
          <boxGeometry args={[0.01, 0.01, 1.8]} />
          <meshStandardMaterial color="#2a5a2a" />
        </mesh>
      ))}

      {/* LCD Screen */}
      <RoundedBox args={[1.6, 0.06, 1.1]} radius={0.03} smoothness={4} position={[-0.5, 0.09, 0]}>
        <meshStandardMaterial color="#050510" roughness={0.1} metalness={0.3} />
      </RoundedBox>
      {/* Screen glow */}
      <mesh position={[-0.5, 0.13, 0]}>
        <planeGeometry args={[1.5, 1.0]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={screenColor}
          emissiveIntensity={0.4}
          transparent opacity={0.9}
          roughness={0.05}
        />
      </mesh>
      {/* Screen bezel */}
      <RoundedBox args={[1.65, 0.04, 1.15]} radius={0.02} smoothness={4} position={[-0.5, 0.11, 0]}>
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
      </RoundedBox>

      {/* ESP32 chip */}
      <RoundedBox args={[0.55, 0.08, 0.4]} radius={0.02} smoothness={4} position={[0.9, 0.1, 0.2]}>
        <meshStandardMaterial color="#222" roughness={0.4} metalness={0.6} />
      </RoundedBox>
      <mesh position={[0.9, 0.15, 0.2]}>
        <planeGeometry args={[0.45, 0.3]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Header pins left */}
      {Array.from({length:8}).map((_,i) => (
        <mesh key={i} position={[-1.55, 0.15, -0.7+i*0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Header pins right */}
      {Array.from({length:8}).map((_,i) => (
        <mesh key={i} position={[1.55, 0.15, -0.7+i*0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* USB-C port */}
      <RoundedBox args={[0.18, 0.08, 0.12]} radius={0.03} smoothness={4} position={[0, 0.1, -1.05]}>
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </RoundedBox>

      {/* Buttons */}
      {[-0.3, 0.3].map((x,i) => (
        <mesh key={i} position={[x, 0.12, 0.95]}>
          <cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
          <meshStandardMaterial color={i===0?"#333":"#444"} roughness={0.5} />
        </mesh>
      ))}

      {/* Capacitors */}
      {[[0.6,0,-0.5],[0.8,0,0.4],[1.1,0,-0.3]].map(([x,y,z],i) => (
        <mesh key={i} position={[x as number, 0.14, z as number]}>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
          <meshStandardMaterial color={i%2===0?"#1a3a8a":"#8a1a1a"} roughness={0.4} />
        </mesh>
      ))}

      {/* Antenna trace */}
      <mesh position={[1.3, 0.08, -0.6]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.01, 0.02]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} />
      </mesh>
    </group>
  );
}

// ── Cute 3D Pet ───────────────────────────────────────────────────────────────
function PetBody({ emotion, balance }: { emotion: string; balance: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef  = useRef<THREE.Mesh>(null);
  const earLRef  = useRef<THREE.Mesh>(null);
  const earRRef  = useRef<THREE.Mesh>(null);
  const armLRef  = useRef<THREE.Group>(null);
  const armRRef  = useRef<THREE.Group>(null);
  const t = useRef(0);

  const color  = EMOTION_COLOR[emotion] ?? "#7C5CFC";
  const isHappy   = ["happy","laughing","excited","loving","winking","cool","funny","silly"].includes(emotion);
  const isSad     = ["sad","crying","worried"].includes(emotion);
  const isAngry   = emotion === "angry";
  const isSleepy  = emotion === "sleepy";
  const isLoving  = emotion === "loving";
  const bounce    = isHappy ? 1.4 : isSad ? 0.2 : 0.6;
  const wobble    = isAngry ? 1.2 : isSleepy ? 0.05 : 0.3;

  const bodyMat  = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness:0.25, metalness:0.05 }), [color]);
  const bellyMat = useMemo(() => new THREE.MeshStandardMaterial({ color:"#ffffff", roughness:0.4, transparent:true, opacity:0.35 }), []);
  const darkMat  = useMemo(() => new THREE.MeshStandardMaterial({ color:"#1a1a2e", roughness:0.5 }), []);
  const whiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color:"white", emissive:"white", emissiveIntensity:0.3 }), []);
  const pinkMat  = useMemo(() => new THREE.MeshStandardMaterial({ color:"#F9A8D4", transparent:true, opacity:0.55 }), []);
  const redMat   = useMemo(() => new THREE.MeshStandardMaterial({ color:"#EF4444", emissive:"#EF4444", emissiveIntensity:0.2 }), []);

  useFrame((_, delta) => {
    t.current += delta;
    if (!groupRef.current) return;
    groupRef.current.position.y = 0.5 + Math.sin(t.current * 2) * 0.06 * bounce;
    groupRef.current.rotation.z = Math.sin(t.current * 1.5) * 0.03 * wobble;
    if (tailRef.current)  tailRef.current.rotation.z  = Math.sin(t.current * 4) * 0.5 * bounce;
    if (earLRef.current)  earLRef.current.rotation.z  = 0.25 + Math.sin(t.current * 2.5) * 0.1 * wobble;
    if (earRRef.current)  earRRef.current.rotation.z  = -0.25 - Math.sin(t.current * 2.5) * 0.1 * wobble;
    if (armLRef.current)  armLRef.current.rotation.z  = 0.5 + Math.sin(t.current * 2) * 0.2 * bounce;
    if (armRRef.current)  armRRef.current.rotation.z  = -0.5 - Math.sin(t.current * 2) * 0.2 * bounce;
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      {/* Body */}
      <mesh material={bodyMat}>
        <sphereGeometry args={[0.42, 24, 24]} />
      </mesh>
      <mesh position={[0, -0.05, 0.3]} material={bellyMat}>
        <sphereGeometry args={[0.24, 18, 18]} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.52, 0]} material={bodyMat}>
        <sphereGeometry args={[0.36, 24, 24]} />
      </mesh>
      <mesh position={[0, 0.48, 0.26]} material={bellyMat}>
        <sphereGeometry args={[0.18, 16, 16]} />
      </mesh>

      {/* Ears */}
      <mesh ref={earLRef} position={[-0.24, 0.84, 0]} rotation={[0,0,0.25]} material={bodyMat}>
        <sphereGeometry args={[0.13, 12, 12]} />
      </mesh>
      <mesh position={[-0.24, 0.84, 0]} rotation={[0,0,0.25]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#FBCFE8" roughness={0.5} />
      </mesh>
      <mesh ref={earRRef} position={[0.24, 0.84, 0]} rotation={[0,0,-0.25]} material={bodyMat}>
        <sphereGeometry args={[0.13, 12, 12]} />
      </mesh>
      <mesh position={[0.24, 0.84, 0]} rotation={[0,0,-0.25]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshStandardMaterial color="#FBCFE8" roughness={0.5} />
      </mesh>

      {/* Eyes */}
      {[[-0.13, 0.56, 0.3], [0.13, 0.56, 0.3]].map(([x,y,z], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          {isLoving ? (
            // Heart eyes
            <>
              <mesh position={[-0.035, 0.015, 0]} material={redMat}><sphereGeometry args={[0.045,8,8]} /></mesh>
              <mesh position={[0.035, 0.015, 0]} material={redMat}><sphereGeometry args={[0.045,8,8]} /></mesh>
              <mesh position={[0, -0.02, 0]} rotation={[0,0,Math.PI/4]} material={redMat}><boxGeometry args={[0.06,0.06,0.02]} /></mesh>
            </>
          ) : isSleepy ? (
            <mesh material={darkMat}><boxGeometry args={[0.1, 0.025, 0.02]} /></mesh>
          ) : (
            <>
              <mesh material={darkMat}><sphereGeometry args={[0.075, 12, 12]} /></mesh>
              <mesh position={[0.025, 0.025, 0.055]} material={whiteMat}><sphereGeometry args={[0.022, 8, 8]} /></mesh>
              <mesh position={[0, 0, 0.055]} material={darkMat}><sphereGeometry args={[0.038, 8, 8]} /></mesh>
            </>
          )}
        </group>
      ))}

      {/* Angry brows */}
      {isAngry && [[-0.13, 0.68, 0.32], [0.13, 0.68, 0.32]].map(([x,y,z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}
          rotation={[0, 0, i===0 ? 0.45 : -0.45]} material={darkMat}>
          <boxGeometry args={[0.14, 0.03, 0.02]} />
        </mesh>
      ))}

      {/* Cheeks */}
      {[[-0.22, 0.46, 0.26], [0.22, 0.46, 0.26]].map(([x,y,z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} material={pinkMat}>
          <sphereGeometry args={[0.08, 10, 10]} />
        </mesh>
      ))}

      {/* Mouth */}
      {isSad ? (
        <mesh position={[0, 0.38, 0.32]} rotation={[0,0,Math.PI]}>
          <torusGeometry args={[0.065, 0.018, 8, 12, Math.PI]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      ) : emotion === "shocked" || emotion === "surprised" ? (
        <mesh position={[0, 0.38, 0.32]} material={darkMat}>
          <sphereGeometry args={[0.055, 10, 10]} />
        </mesh>
      ) : (
        <mesh position={[0, 0.38, 0.32]}>
          <torusGeometry args={[0.075, 0.018, 8, 12, Math.PI]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      )}

      {/* Arms */}
      <group ref={armLRef} position={[-0.5, 0.08, 0]}>
        <mesh material={bodyMat}><capsuleGeometry args={[0.08, 0.22, 8, 12]} /></mesh>
        <mesh position={[0, -0.2, 0]} material={bodyMat}><sphereGeometry args={[0.1, 10, 10]} /></mesh>
      </group>
      <group ref={armRRef} position={[0.5, 0.08, 0]}>
        <mesh material={bodyMat}><capsuleGeometry args={[0.08, 0.22, 8, 12]} /></mesh>
        <mesh position={[0, -0.2, 0]} material={bodyMat}><sphereGeometry args={[0.1, 10, 10]} /></mesh>
      </group>

      {/* Legs */}
      {[[-0.18, -0.44, 0], [0.18, -0.44, 0]].map(([x,y,z], i) => (
        <group key={i} position={[x as number, y as number, z as number]}>
          <mesh material={bodyMat}><capsuleGeometry args={[0.1, 0.18, 8, 12]} /></mesh>
          <mesh position={[0, -0.2, 0.06]} rotation={[0.3,0,0]} material={bodyMat}>
            <sphereGeometry args={[0.12, 12, 12]} />
          </mesh>
        </group>
      ))}

      {/* Tail */}
      <mesh ref={tailRef} position={[0, -0.05, -0.42]} rotation={[0.5,0,0]} material={bodyMat}>
        <sphereGeometry args={[0.11, 10, 10]} />
      </mesh>

      {/* Loving hearts */}
      {isLoving && [[-0.4,0.9,0.2],[0.4,1.0,0.1],[0,1.1,0.3]].map(([x,y,z],i) => (
        <Float key={i} speed={2+i} floatIntensity={0.3}>
          <mesh position={[x as number, y as number, z as number]} material={redMat}>
            <sphereGeometry args={[0.05-i*0.008, 8, 8]} />
          </mesh>
        </Float>
      ))}

      {/* Sleepy Zzz */}
      {isSleepy && (
        <Float speed={1} floatIntensity={0.2}>
          <Text position={[0.4, 0.85, 0.3]} fontSize={0.12} color="rgba(255,255,255,0.6)">
            zzz
          </Text>
        </Float>
      )}
    </group>
  );
}

// ── Orbiting USDC Coins ───────────────────────────────────────────────────────
function OrbitingCoins({ count = 5, radius = 2.2, earning }: {
  count?: number; radius?: number; earning: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * (earning ? 1.8 : 0.5);
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * 0.3;
        return (
          <Float key={i} speed={1.5 + i * 0.3} floatIntensity={0.2} rotationIntensity={0.5}>
            <group position={[x, y, z]}>
              {/* Coin body */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.04, 24]} />
                <meshStandardMaterial color="#0052FF" metalness={0.8} roughness={0.2}
                  emissive="#0052FF" emissiveIntensity={earning ? 0.5 : 0.1} />
              </mesh>
              {/* $ symbol */}
              <Text position={[0, 0, 0.03]} fontSize={0.12} color="white" fontWeight={700}>
                $
              </Text>
              {/* Coin rim */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.18, 0.015, 8, 24]} />
                <meshStandardMaterial color="#4488FF" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

// ── Earn Particles ────────────────────────────────────────────────────────────
function EarnParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const t   = useRef(0);

  const { positions, velocities } = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random()-0.5)*0.2;
      pos[i*3+1] = (Math.random()-0.5)*0.2;
      pos[i*3+2] = (Math.random()-0.5)*0.2;
      vel[i*3]   = (Math.random()-0.5)*2;
      vel[i*3+1] = Math.random()*3+1;
      vel[i*3+2] = (Math.random()-0.5)*2;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current || !active) return;
    t.current += delta;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 60; i++) {
      pos[i*3]   += velocities[i*3]   * delta * 0.5;
      pos[i*3+1] += velocities[i*3+1] * delta * 0.5;
      pos[i*3+2] += velocities[i*3+2] * delta * 0.5;
      velocities[i*3+1] -= delta * 2; // gravity
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    if (t.current > 1.5) {
      // Reset
      for (let i = 0; i < 60; i++) {
        pos[i*3]   = (Math.random()-0.5)*0.2;
        pos[i*3+1] = (Math.random()-0.5)*0.2;
        pos[i*3+2] = (Math.random()-0.5)*0.2;
        velocities[i*3]   = (Math.random()-0.5)*2;
        velocities[i*3+1] = Math.random()*3+1;
        velocities[i*3+2] = (Math.random()-0.5)*2;
      }
      t.current = 0;
    }
  });

  if (!active) return null;

  return (
    <points ref={ref} position={[0, 0.5, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#FFD700" size={0.06} transparent opacity={0.9}
        sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ── Scene Lighting ────────────────────────────────────────────────────────────
function SceneLights({ color }: { color: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow
        shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 3, -4]} intensity={0.4} color={color} />
      <pointLight position={[0, 3, 2]} intensity={1.0} color={color} distance={8} />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#0052FF" distance={5} />
    </>
  );
}

// ── Main 3D Scene ─────────────────────────────────────────────────────────────
export default function Scene3D({ state }: { state: PetState }) {
  const [earning, setEarning] = useState(false);
  const prevBalance = useRef(state.balance_usdc);

  // Detect earning event
  useEffect(() => {
    if (state.balance_usdc > prevBalance.current) {
      setEarning(true);
      setTimeout(() => setEarning(false), 2000);
    }
    prevBalance.current = state.balance_usdc;
  }, [state.balance_usdc]);

  const emotionColor = EMOTION_COLOR[state.emotion] ?? "#7C5CFC";
  const screenColor  = state.device_state === "idle" ? "#0a0a2e"
                     : state.device_state === "listening" ? "#1a0a0a"
                     : state.device_state === "thinking"  ? "#0a0a1a"
                     : emotionColor + "44";

  return (
    <Canvas
      camera={{ position:[0, 1.5, 6], fov:45 }}
      shadows
      style={{ background:"transparent" }}
    >
      <Suspense fallback={null}>
        <SceneLights color={emotionColor} />

        {/* ESP32 Board */}
        <ESP32Board screenColor={screenColor} />

        {/* Pet sitting on board */}
        <PetBody emotion={state.emotion} balance={state.balance_usdc} />

        {/* Orbiting coins */}
        <OrbitingCoins count={6} radius={2.4} earning={earning} />

        {/* Earn particles */}
        <EarnParticles active={earning} />

        {/* Balance text floating above */}
        <Float speed={1} floatIntensity={0.15}>
          <Text
            position={[0, 2.2, 0]}
            fontSize={0.22}
            color={emotionColor}
            fontWeight={700}
            anchorX="center"
          >
            {`$${state.balance_usdc.toFixed(4)} USDC`}
          </Text>
        </Float>

        {/* Emotion label */}
        <Text
          position={[0, 1.85, 0]}
          fontSize={0.13}
          color="rgba(255,255,255,0.5)"
          anchorX="center"
        >
          {state.name} · {state.emotion}
        </Text>

        <ContactShadows position={[0,-1.27,0]} opacity={0.5} scale={8} blur={2.5} />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  );
}
