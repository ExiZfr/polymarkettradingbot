"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
    RefreshCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Filter,
    Eye,
    Plus,
    Info,
} from "lucide-react";

interface GraphNode {
    id: string;
    address: string;
    tag: string;
    volume: number;
    pnl: number;
    winRate: number;
    trades: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

interface GraphEdge {
    source: string;
    target: string;
    cluster: string;
    confidence: number;
}

interface ClusterInfo {
    name: string;
    confidence: number;
    method: string;
    members: number;
    volume: number;
    firstDetected: string;
    lastActivity: string;
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: ClusterInfo[];
    stats: {
        totalClusters: number;
        totalClusteredWallets: number;
        totalNodes: number;
        totalEdges: number;
    };
}

export default function BubbleMap() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const nodesRef = useRef<GraphNode[]>([]);
    const animationRef = useRef<number>(0);

    const fetchClusters = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tracker/clusters');
            if (response.ok) {
                const result = await response.json();
                setData(result);
                // Initialize node positions
                const width = canvasRef.current?.width || 800;
                const height = canvasRef.current?.height || 600;
                nodesRef.current = result.nodes.map((node: GraphNode, i: number) => ({
                    ...node,
                    x: width / 2 + (Math.random() - 0.5) * 400,
                    y: height / 2 + (Math.random() - 0.5) * 400,
                    vx: 0,
                    vy: 0,
                }));
            }
        } catch (error) {
            console.error('Error fetching clusters:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClusters();
    }, [fetchClusters]);

    // Force simulation
    useEffect(() => {
        if (!data || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const nodes = nodesRef.current;
        const edges = data.edges;

        // Create edge lookup
        const edgeMap = new Map<string, string[]>();
        edges.forEach(edge => {
            if (!edgeMap.has(edge.source)) edgeMap.set(edge.source, []);
            if (!edgeMap.has(edge.target)) edgeMap.set(edge.target, []);
            edgeMap.get(edge.source)!.push(edge.target);
            edgeMap.get(edge.target)!.push(edge.source);
        });

        const simulate = () => {
            // Apply forces
            nodes.forEach(node => {
                node.vx = node.vx! * 0.9;
                node.vy = node.vy! * 0.9;

                // Center gravity
                node.vx! += (width / 2 - node.x!) * 0.0005;
                node.vy! += (height / 2 - node.y!) * 0.0005;

                // Repulsion from other nodes
                nodes.forEach(other => {
                    if (other.id === node.id) return;
                    const dx = node.x! - other.x!;
                    const dy = node.y! - other.y!;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = 1000 / (dist * dist);
                    node.vx! += (dx / dist) * force;
                    node.vy! += (dy / dist) * force;
                });

                // Attraction to connected nodes
                const connected = edgeMap.get(node.id) || [];
                connected.forEach(otherId => {
                    const other = nodes.find(n => n.id === otherId);
                    if (!other) return;
                    const dx = other.x! - node.x!;
                    const dy = other.y! - node.y!;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    node.vx! += dx * 0.01;
                    node.vy! += dy * 0.01;
                });

                // Update position
                node.x! += node.vx!;
                node.y! += node.vy!;

                // Bounds
                node.x = Math.max(50, Math.min(width - 50, node.x!));
                node.y = Math.max(50, Math.min(height - 50, node.y!));
            });

            // Draw
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.scale(zoom, zoom);

            // Draw edges
            edges.forEach(edge => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return;

                ctx.beginPath();
                ctx.moveTo(source.x!, source.y!);
                ctx.lineTo(target.x!, target.y!);
                ctx.strokeStyle = `rgba(6, 182, 212, ${edge.confidence * 0.5})`;
                ctx.lineWidth = 1 + edge.confidence * 2;
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach(node => {
                const radius = Math.max(8, Math.min(40, Math.sqrt(node.volume) / 50));

                // Glow effect
                const gradient = ctx.createRadialGradient(node.x!, node.y!, 0, node.x!, node.y!, radius * 2);
                const color = getNodeColor(node);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, radius * 2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Main circle
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = hoveredNode?.id === node.id || selectedNode?.id === node.id ? '#fff' : 'rgba(255,255,255,0.3)';
                ctx.lineWidth = hoveredNode?.id === node.id || selectedNode?.id === node.id ? 3 : 1;
                ctx.stroke();

                // Label for larger nodes
                if (radius > 15 || hoveredNode?.id === node.id) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${node.address.slice(0, 6)}...`, node.x!, node.y! + radius + 14);
                }
            });

            ctx.restore();
            animationRef.current = requestAnimationFrame(simulate);
        };

        simulate();

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [data, zoom, offset, hoveredNode, selectedNode]);

    const getNodeColor = (node: GraphNode) => {
        const tag = node.tag.toLowerCase();
        if (tag.includes('winner') || tag.includes('smart')) return '#10b981';
        if (tag.includes('loser') || tag.includes('dumb')) return '#f43f5e';
        if (tag.includes('insider')) return '#a855f7';
        return '#6b7280';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !nodesRef.current.length) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / zoom;
        const y = (e.clientY - rect.top - offset.y) / zoom;

        if (isDragging) {
            setOffset({
                x: offset.x + (e.clientX - dragStart.x),
                y: offset.y + (e.clientY - dragStart.y),
            });
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // Check hover
        const hovered = nodesRef.current.find(node => {
            const radius = Math.max(8, Math.min(40, Math.sqrt(node.volume) / 50));
            const dx = x - node.x!;
            const dy = y - node.y!;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
        setHoveredNode(hovered || null);
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (hoveredNode) {
            setSelectedNode(hoveredNode);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(z => Math.max(0.3, Math.min(3, z * delta)));
    };

    const formatCurrency = (value: number) => {
        if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    return (
        <div className="bg-[#0c0c0e] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Maximize2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Wallet Bubble Map</h3>
                        <p className="text-white/40 text-xs">
                            {data?.stats.totalClusters || 0} clusters · {data?.stats.totalNodes || 0} wallets
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(z => Math.min(3, z * 1.2))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <ZoomIn size={16} />
                    </button>
                    <button
                        onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button
                        onClick={fetchClusters}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative h-[500px]">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    onMouseMove={handleMouseMove}
                    onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => { setIsDragging(false); setHoveredNode(null); }}
                    onClick={handleClick}
                    onWheel={handleWheel}
                />

                {/* Hover Tooltip */}
                {hoveredNode && (
                    <div
                        className="absolute pointer-events-none bg-black/90 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-xl z-10"
                        style={{ top: 20, left: 20 }}
                    >
                        <p className="font-mono text-cyan-400 text-sm mb-2">
                            {hoveredNode.address.slice(0, 10)}...{hoveredNode.address.slice(-8)}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <span className="text-white/40">Tag:</span>
                            <span className="text-white">{hoveredNode.tag}</span>
                            <span className="text-white/40">Volume:</span>
                            <span className="text-white">{formatCurrency(hoveredNode.volume)}</span>
                            <span className="text-white/40">P&L:</span>
                            <span className={hoveredNode.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatCurrency(hoveredNode.pnl)}
                            </span>
                            <span className="text-white/40">Win Rate:</span>
                            <span className={hoveredNode.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}>
                                {hoveredNode.winRate.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Legend</p>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-white/70">Winner / Smart Money</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-white/70">Loser / Dumb Money</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-white/70">Insider</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-6 h-0.5 bg-cyan-500" />
                            <span className="text-white/70">Cluster Connection</span>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0c0c0e]/80">
                        <RefreshCw size={32} className="animate-spin text-cyan-400" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && (!data?.nodes.length) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                        <Maximize2 size={48} className="mb-4 opacity-30" />
                        <p>No wallet clusters detected yet</p>
                        <p className="text-xs mt-1">Clusters are detected automatically from trading patterns</p>
                    </div>
                )}
            </div>

            {/* Cluster List */}
            {data?.clusters && data.clusters.length > 0 && (
                <div className="border-t border-white/5 p-4">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Detected Clusters</p>
                    <div className="flex flex-wrap gap-2">
                        {data.clusters.map((cluster) => (
                            <div
                                key={cluster.name}
                                className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-xs"
                            >
                                <span className="text-cyan-400 font-mono">{cluster.name}</span>
                                <span className="text-white/40 ml-2">{cluster.members} wallets</span>
                                <span className="text-white/30 ml-2">·</span>
                                <span className="text-white/50 ml-2">{formatCurrency(cluster.volume)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
