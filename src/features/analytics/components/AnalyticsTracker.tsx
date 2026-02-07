'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsTrackerProps {
    projectId: string;
}

export function AnalyticsTracker({ projectId }: AnalyticsTrackerProps) {
    const pathname = usePathname();
    // Use a ref to prevent double firing in strict mode or rapid re-renders if not handled specifically,
    // though useEffect dependency on pathname is usually what we want.
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        // Avoid double tracking the same path instantly if behavior suggests
        if (lastTrackedPath.current === pathname) return;

        const trackPageView = async () => {
            try {
                // Generate or get a simple session ID (stored in sessionStorage for session duration)
                let sessionId = sessionStorage.getItem('analytics_session_id');
                if (!sessionId) {
                    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
                    sessionStorage.setItem('analytics_session_id', sessionId);
                }

                await fetch('/api/analytics/collect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId,
                        path: pathname,
                        eventType: 'page_view',
                        sessionId,
                        referrer: document.referrer,
                    }),
                    keepalive: true, // Ensure request is sent even if unloading
                });
                lastTrackedPath.current = pathname;
            } catch (err) {
                // Silently fail
                console.error('Analytics failed', err);
            }
        };

        trackPageView();
    }, [pathname, projectId]);

    return null; // Renderless component
}
