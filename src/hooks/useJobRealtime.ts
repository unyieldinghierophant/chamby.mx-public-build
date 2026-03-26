import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type RealtimeFilter =
  | { column: 'id'; value: string }
  | { column: 'client_id'; value: string }
  | { column: 'provider_id'; value: string }
  | { column: 'status'; value: string };

/**
 * Subscribe to Supabase Realtime changes on the `jobs` table.
 *
 * @param channelName  unique channel name (e.g. `job-detail-<id>`)
 * @param onUpdate     callback fired on any INSERT/UPDATE/DELETE
 * @param filter       optional column-level filter (uses Postgres Changes filter syntax)
 * @param enabled      pass `false` to skip subscribing (e.g. when userId is null)
 */
export function useJobRealtime(
  channelName: string,
  onUpdate: () => void,
  filter?: RealtimeFilter,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const channelConfig: Parameters<typeof supabase.channel>[1] = undefined;
    const filterStr = filter ? `${filter.column}=eq.${filter.value}` : undefined;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          ...(filterStr ? { filter: filterStr } : {}),
        },
        () => {
          onUpdate();
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn(`[useJobRealtime] channel "${channelName}" error:`, err);
        }
      });

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);
}
