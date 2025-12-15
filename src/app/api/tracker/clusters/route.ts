'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tracker/clusters - Fetch all wallet clusters for bubble map
export async function GET() {
    try {
        // Get all clusters
        const clusters = await prisma.walletCluster.findMany({
            orderBy: { lastActivity: 'desc' },
            take: 50,
        });

        // Build nodes and edges for the bubble map
        const allAddresses = new Set<string>();
        const edges: Array<{ source: string; target: string; cluster: string; confidence: number }> = [];

        clusters.forEach(cluster => {
            const addresses = cluster.addresses as string[];
            addresses.forEach(addr => allAddresses.add(addr));

            // Create edges between all addresses in the cluster
            for (let i = 0; i < addresses.length; i++) {
                for (let j = i + 1; j < addresses.length; j++) {
                    edges.push({
                        source: addresses[i],
                        target: addresses[j],
                        cluster: cluster.clusterName,
                        confidence: cluster.confidence,
                    });
                }
            }
        });

        // Get profile data for all addresses
        const profiles = await prisma.whaleProfile.findMany({
            where: { address: { in: Array.from(allAddresses) } },
        });

        const profileMap = new Map(profiles.map(p => [p.address, p]));

        // Build nodes
        const nodes = Array.from(allAddresses).map(addr => {
            const profile = profileMap.get(addr);
            return {
                id: addr,
                address: addr,
                tag: profile?.currentTag || 'Unknown',
                volume: profile?.totalVolume || 0,
                pnl: profile?.totalPnl || 0,
                winRate: profile?.winRate || 0,
                trades: profile?.totalTrades || 0,
            };
        });

        // Also get unclustered top whales for context
        const topWhales = await prisma.whaleProfile.findMany({
            where: {
                address: { notIn: Array.from(allAddresses) },
                totalTrades: { gte: 5 },
            },
            orderBy: { totalVolume: 'desc' },
            take: 30,
        });

        topWhales.forEach(whale => {
            nodes.push({
                id: whale.address,
                address: whale.address,
                tag: whale.currentTag,
                volume: whale.totalVolume,
                pnl: whale.totalPnl,
                winRate: whale.winRate,
                trades: whale.totalTrades,
            });
        });

        return NextResponse.json({
            nodes,
            edges,
            clusters: clusters.map(c => ({
                name: c.clusterName,
                confidence: c.confidence,
                method: c.detectionMethod,
                members: (c.addresses as string[]).length,
                volume: c.totalVolume,
                firstDetected: c.firstDetected,
                lastActivity: c.lastActivity,
            })),
            stats: {
                totalClusters: clusters.length,
                totalClusteredWallets: allAddresses.size,
                totalNodes: nodes.length,
                totalEdges: edges.length,
            },
        });
    } catch (error) {
        console.error('[Clusters] Error fetching clusters:', error);
        return NextResponse.json({ error: 'Failed to fetch clusters' }, { status: 500 });
    }
}

// POST /api/tracker/clusters - Create or update a cluster (called by Python script)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clusterName, addresses, confidence, detectionMethod } = body;

        if (!clusterName || !addresses || !Array.isArray(addresses)) {
            return NextResponse.json({ error: 'Invalid cluster data' }, { status: 400 });
        }

        // Calculate total volume from members
        const profiles = await prisma.whaleProfile.findMany({
            where: { address: { in: addresses } },
        });
        const totalVolume = profiles.reduce((sum, p) => sum + p.totalVolume, 0);

        // Upsert cluster
        const cluster = await prisma.walletCluster.upsert({
            where: { clusterName },
            update: {
                addresses,
                confidence: confidence || 0.5,
                totalMembers: addresses.length,
                totalVolume,
                lastActivity: new Date(),
            },
            create: {
                clusterName,
                addresses,
                confidence: confidence || 0.5,
                detectionMethod: detectionMethod || 'SAME_MARKET_PATTERN',
                totalMembers: addresses.length,
                totalVolume,
            },
        });

        // Update transactions with cluster name
        await prisma.whaleTransaction.updateMany({
            where: { walletAddress: { in: addresses } },
            data: { clusterName },
        });

        return NextResponse.json({ success: true, cluster });
    } catch (error) {
        console.error('[Clusters] Error creating cluster:', error);
        return NextResponse.json({ error: 'Failed to create cluster' }, { status: 500 });
    }
}
