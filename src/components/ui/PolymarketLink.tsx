"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface PolymarketLinkProps {
    marketId: string;
    className?: string;
    children?: React.ReactNode;
}

// Simple in-memory cache to avoid repeated fetches
const slugCache: Record<string, string> = {};

export default function PolymarketLink({ marketId, className, children }: PolymarketLinkProps) {
    const [slug, setSlug] = useState<string | null>(slugCache[marketId] || null);
    const [loading, setLoading] = useState(!slug);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (slug) return; // Already cached

        let isMounted = true;

        async function fetchSlug() {
            try {
                // Try to fetch market details from Gamma API
                const res = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);
                if (!res.ok) throw new Error("Failed to fetch market");

                const data = await res.json();

                // The API usually returns 'slug' or 'question' which we can slugify
                // For simplified markets, it might be nested in 'events'
                let foundSlug = data.slug;

                // Sometimes market is just one outcome, need event slug
                if (!foundSlug && data.events && data.events.length > 0) {
                    foundSlug = data.events[0].slug;
                }

                if (foundSlug && isMounted) {
                    slugCache[marketId] = foundSlug;
                    setSlug(foundSlug);
                } else {
                    setError(true);
                }
            } catch (err) {
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchSlug();

        return () => { isMounted = false; };
    }, [marketId, slug]);

    if (error || (!slug && !loading)) {
        // Fallback to search if slug resolution fails
        return (
            <a
                href={`https://polymarket.com/?s=${marketId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
            >
                {children || (
                    <>
                        View on Polymarket <ExternalLink size={12} className="ml-1" />
                    </>
                )}
            </a>
        );
    }

    const href = loading
        ? "#" // Placeholder while loading
        : `https://polymarket.com/event/${slug}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${className} ${loading ? 'opacity-50 cursor-wait' : ''}`}
            onClick={(e) => loading && e.preventDefault()}
        >
            {children || (
                <>
                    View on Polymarket
                    {loading ? <Loader2 size={12} className="ml-1 animate-spin" /> : <ExternalLink size={12} className="ml-1" />}
                </>
            )}
        </a>
    );
}
