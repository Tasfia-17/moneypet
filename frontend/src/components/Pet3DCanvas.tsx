"use client";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import Pet3D from "./Pet3D";

export default function Pet3DCanvas({ emotion }: { emotion: string }) {
  return (
    <Canvas camera={{ position:[0, 0.4, 3.4], fov:42 }} style={{ background:"transparent" }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 4]} intensity={1.3} />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#7C5CFC" />
        <Pet3D emotion={emotion} />
        <ContactShadows position={[0,-1.1,0]} opacity={0.25} scale={3} blur={2} />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Suspense>
    </Canvas>
  );
}
