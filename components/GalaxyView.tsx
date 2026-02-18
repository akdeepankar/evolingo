'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';

interface GalaxyNode {
    id: string;
    word: string;
    language: string;
    year: number;
    meaning?: string;
    position: [number, number, number];
    type: 'root' | 'path' | 'branch' | 'current';
    parentPosition?: [number, number, number];
}

interface GalaxyViewProps {
    data: any;
}

function Node({ node, isActive, onClick }: { node: GalaxyNode; isActive: boolean; onClick: () => void }) {
    const mesh = useRef<THREE.Mesh>(null);
    const [hovered, setHover] = useState(false);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y += 0.01;
            if (node.type === 'root') mesh.current.rotation.z -= 0.005;
        }
    });

    // Color Logic
    const color = useMemo(() => {
        if (node.type === 'root') return '#fbbf24'; // Amber-400
        if (node.type === 'current') return '#60a5fa'; // Blue-400
        if (node.type === 'branch') return '#a78bfa'; // Purple-400
        return '#ffffff';
    }, [node.type]);

    // Size Logic
    const size = useMemo(() => {
        if (node.type === 'root') return 2.5;
        if (node.type === 'current') return 2;
        if (node.type === 'branch') return 0.8;
        return 1.4;
    }, [node.type]);

    return (
        <group position={node.position}>
            {/* Connection Line to Parent */}
            {node.parentPosition && (
                <Line
                    points={[[0, 0, 0], [node.parentPosition[0] - node.position[0], node.parentPosition[1] - node.position[1], node.parentPosition[2] - node.position[2]]]}
                    color={color}
                    opacity={0.2}
                    transparent
                    lineWidth={1}
                />
            )}

            {/* The Node Sphere */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh
                    ref={mesh}
                    onClick={onClick}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <sphereGeometry args={[size * (hovered ? 1.2 : 1), 32, 32]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={hovered ? 2 : 0.8}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>
            </Float>

            {/* Label */}
            <Billboard>
                <Text
                    position={[0, size + 1.5, 0]}
                    fontSize={node.type === 'branch' ? 0.6 : 1.2}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="#000000"
                >
                    {node.word}
                </Text>
                <Text
                    position={[0, size + 0.5, 0]}
                    fontSize={0.5}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {node.language} {node.year ? `(${node.year})` : ''}
                </Text>
                {hovered && (
                    <Text
                        position={[0, -size - 1, 0]}
                        fontSize={0.5}
                        color="#a1a1aa"
                        maxWidth={10}
                        textAlign="center"
                        anchorX="center"
                        anchorY="top"
                    >
                        {node.meaning}
                    </Text>
                )}
            </Billboard>
        </group>
    );
}

function GalaxyScene({ data }: { data: any }) {
    if (!data) return null;

    // Process Data into Nodes
    const nodes = useMemo(() => {
        const nodeList: GalaxyNode[] = [];
        if (!data.root) return [];

        // Spiral Config
        let angle = 0;
        let radius = 0;
        const angleStep = 1.5; // Radians
        const radiusStep = 8;
        const branchRadius = 4;

        // 1. Root
        const rootPos: [number, number, number] = [0, 0, 0];
        nodeList.push({
            id: 'root',
            ...data.root,
            position: rootPos,
            type: 'root'
        });

        // Add Root Branches
        if (data.root.related_branches) {
            data.root.related_branches.forEach((branch: any, idx: number) => {
                const bAngle = (idx / data.root.related_branches.length) * Math.PI * 2;
                nodeList.push({
                    id: `root-branch-${idx}`,
                    ...branch,
                    position: [
                        rootPos[0] + Math.cos(bAngle) * branchRadius,
                        rootPos[1] + (Math.random() - 0.5) * 2, // slight height variation
                        rootPos[2] + Math.sin(bAngle) * branchRadius
                    ],
                    type: 'branch',
                    parentPosition: rootPos,
                    year: data.root.year
                });
            });
        }

        let prevPos = rootPos;

        // 2. Path
        if (data.path) {
            data.path.forEach((step: any, idx: number) => {
                angle += angleStep;
                radius += radiusStep;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = idx * 2; // Rising spiral

                const pos: [number, number, number] = [x, y, z];

                nodeList.push({
                    id: `path-${idx}`,
                    ...step,
                    position: pos,
                    type: 'path',
                    parentPosition: prevPos
                });

                // Add Branches for this Step
                if (step.related_branches) {
                    step.related_branches.forEach((branch: any, bIdx: number) => {
                        // Offset from parent
                        const bLocalAngle = (bIdx / step.related_branches.length) * Math.PI * 2 + angle;
                        const bPos: [number, number, number] = [
                            pos[0] + Math.cos(bLocalAngle) * branchRadius,
                            pos[1] + (Math.random() - 0.5) * 3,
                            pos[2] + Math.sin(bLocalAngle) * branchRadius
                        ];

                        nodeList.push({
                            id: `path-${idx}-branch-${bIdx}`,
                            ...branch,
                            position: bPos,
                            type: 'branch',
                            parentPosition: pos,
                            year: step.year
                        });
                    });
                }

                prevPos = pos;
            });
        }

        // 3. Current
        if (data.current) {
            angle += angleStep;
            radius += radiusStep;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (data.path?.length || 0) * 2 + 2;

            const pos: [number, number, number] = [x, y, z];
            nodeList.push({
                id: 'current',
                ...data.current,
                position: pos,
                type: 'current',
                parentPosition: prevPos
            });
        }

        return nodeList;

    }, [data]);

    return (
        <group>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#fbbf24" />
            <pointLight position={[-10, 20, -10]} intensity={1} color="#60a5fa" />

            {/* Nodes */}
            {nodes.map((node) => (
                <Node key={node.id} node={node} isActive={false} onClick={() => { }} />
            ))}

            {/* Stars Background */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </group>
    );
}

export default function GalaxyView({ data }: GalaxyViewProps) {
    if (!data) return null;

    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas camera={{ position: [30, 20, 30], fov: 60 }}>
                <GalaxyScene data={data} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate
                    autoRotateSpeed={0.5}
                    maxDistance={100}
                    minDistance={5}
                />
            </Canvas>

            {/* Overlay UI Tip */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs text-center pointer-events-none">
                <p>Drag to rotate &bull; Scroll to zoom</p>
            </div>
        </div>
    );
}
