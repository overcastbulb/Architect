"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, Text } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { LayoutResponse, Room } from "@/types";

interface Props {
  layout: LayoutResponse;
}

const ROOM_COLORS: Record<string, string> = {
  living_room: "#3b82f6",
  kitchen: "#f59e0b",
  bedroom: "#8b5cf6",
  bathroom: "#10b981",
};

function getRoomColor(type: string): string {
  for (const key of Object.keys(ROOM_COLORS)) {
    if (type.includes(key)) return ROOM_COLORS[key];
  }
  return "#3a4055";
}

const WALL_HEIGHT = 3.0; // meters per floor
const WALL_THICKNESS = 0.15;

interface FloorRoomProps {
  room: Room;
  floorIndex: number;
  totalFloors: number;
  offsetX: number;
  offsetZ: number;
}

function FloorRoom({ room, floorIndex, offsetX, offsetZ }: FloorRoomProps) {
  const color = getRoomColor(room.type);
  const y = floorIndex * WALL_HEIGHT;

  const roomX = room.x + room.width / 2 - offsetX;
  const roomZ = room.y + room.height / 2 - offsetZ;

  return (
    <group position={[roomX, y, roomZ]}>
      {/* Floor slab */}
      <mesh receiveShadow castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[room.width - WALL_THICKNESS, 0.12, room.height - WALL_THICKNESS]} />
        <meshStandardMaterial color={color} opacity={0.85} transparent roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Walls - 4 sides */}
      {/* Front wall */}
      <mesh castShadow position={[0, WALL_HEIGHT / 2, room.height / 2 - WALL_THICKNESS / 2]}>
        <boxGeometry args={[room.width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={color} opacity={0.35} transparent roughness={0.8} />
      </mesh>
      {/* Back wall */}
      <mesh castShadow position={[0, WALL_HEIGHT / 2, -room.height / 2 + WALL_THICKNESS / 2]}>
        <boxGeometry args={[room.width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={color} opacity={0.35} transparent roughness={0.8} />
      </mesh>
      {/* Left wall */}
      <mesh castShadow position={[-room.width / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, room.height]} />
        <meshStandardMaterial color={color} opacity={0.35} transparent roughness={0.8} />
      </mesh>
      {/* Right wall */}
      <mesh castShadow position={[room.width / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, room.height]} />
        <meshStandardMaterial color={color} opacity={0.35} transparent roughness={0.8} />
      </mesh>

      {/* Room label (only ground floor) */}
      {floorIndex === 0 && (
        <Text
          position={[0, 0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={Math.min(room.width, room.height) * 0.12}
          color={color}
          anchorX="center"
          anchorY="middle"
          maxWidth={room.width - 0.5}
        >
          {room.label}
        </Text>
      )}
    </group>
  );
}

function Building({ layout }: { layout: LayoutResponse }) {
  const { rooms, building_width, building_length, floors } = layout;

  const offsetX = building_width / 2;
  const offsetZ = building_length / 2;

  const allFloors = useMemo(() => {
    const arr = [];
    for (let f = 0; f < floors; f++) {
      arr.push(f);
    }
    return arr;
  }, [floors]);

  return (
    <group>
      {/* Plot boundary (ground) */}
      <mesh receiveShadow position={[0, -0.01, 0]}>
        <boxGeometry args={[layout.dimensions.plot_width, 0.04, layout.dimensions.plot_length]} />
        <meshStandardMaterial color="#1e2230" roughness={0.9} />
      </mesh>

      {/* Setback outline */}
      <lineSegments position={[0, 0.02, 0]}>
        <edgesGeometry
          args={[new THREE.BoxGeometry(layout.dimensions.plot_width, 0.01, layout.dimensions.plot_length)]}
        />
        <lineBasicMaterial color="#e8ff47" opacity={0.3} transparent />
      </lineSegments>

      {/* Building floors */}
      {allFloors.map((floorIdx) =>
        rooms.map((room: Room) => (
          <FloorRoom
            key={`${floorIdx}-${room.id}`}
            room={room}
            floorIndex={floorIdx}
            totalFloors={floors}
            offsetX={offsetX}
            offsetZ={offsetZ}
          />
        ))
      )}

      {/* Roof slab */}
      <mesh
        castShadow
        position={[0, floors * WALL_HEIGHT + 0.06, 0]}
      >
        <boxGeometry args={[building_width, 0.12, building_length]} />
        <meshStandardMaterial color="#e8ff47" opacity={0.6} transparent roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
}

function Scene({ layout }: { layout: LayoutResponse }) {
  const camDistance = Math.max(layout.building_width, layout.building_length) * 2.5;

  return (
    <>
      <color attach="background" args={["#0a0c10"]} />
      <fog attach="fog" args={["#0a0c10", camDistance * 2, camDistance * 6]} />

      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 15, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[10, 5, 10]} intensity={0.3} color="#3b82f6" />

      {/* Grid */}
      <Grid
        args={[100, 100]}
        position={[0, -0.02, 0]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#1e2230"
        sectionSize={5}
        sectionThickness={0.5}
        sectionColor="#2a3040"
        fadeDistance={50}
        infiniteGrid
      />

      <Suspense fallback={null}>
        <Building layout={layout} />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, (layout.floors * WALL_HEIGHT) / 2, 0]}
        minDistance={3}
        maxDistance={camDistance * 2}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function ThreeScene({ layout }: Props) {
  const camPos: [number, number, number] = [
    layout.building_width * 1.8,
    layout.building_length * 1.5,
    layout.building_length * 1.8,
  ];

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: camPos, fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Scene layout={layout} />
      </Canvas>

      {/* Overlay labels */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-arch-text-dim space-y-1 pointer-events-none">
        <div>🖱️ Drag to orbit · Scroll to zoom · Right-drag to pan</div>
        <div className="text-arch-accent">{layout.floors} floor{layout.floors !== 1 ? "s" : ""} · {layout.rooms.length} rooms</div>
      </div>
    </div>
  );
}
