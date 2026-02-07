'use client';

import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

/**
 * Custom hook to listen for real-time changes to a specific project.
 * @param projectId The ID of the project to listen for.
 * @param onUpdate Callback function when a change occurs.
 */
export function useRealtimeProject(projectId: string, onUpdate: (payload: any) => void) {
    useEffect(() => {
        if (!projectId) return;

        // Listen for changes to Sections related to this project (via Page JOIN)
        // Note: In a production environment, you might need more complex filters 
        // or a dedicated 'project_updates' table for broadcast.
        const channel = supabase
            .channel(`project-updates-${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Section',
                },
                (payload) => {
                    // You can perform client-side filtering here if needed
                    onUpdate(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, onUpdate]);
}
