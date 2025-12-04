import type { LiveProvider, LiveContext } from "@refinedev/core";
import { supabase, hasSupabase } from "../supabase";

const dummy: LiveProvider = {
  subscribe: ({ callback }) => {
    return { unsubscribe: () => void 0 };
  },
  publish: () => void 0,
  unsubscribe: () => void 0,
};

const live: LiveProvider = {
  subscribe: ({ channel, types, params, callback }) => {
    if (!hasSupabase) return { unsubscribe: () => void 0 };
    const table = (params as any)?.resource?.name || channel;
    const ch = supabase
      .channel(`live:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const type = payload.eventType === 'INSERT' ? 'created' : payload.eventType === 'UPDATE' ? 'updated' : 'deleted';
          callback({ type, timestamp: Date.now(), payload });
        }
      )
      .subscribe();
    return { unsubscribe: () => { supabase.removeChannel(ch); } };
  },
  publish: () => void 0,
  unsubscribe: () => void 0,
};

export const liveProvider: LiveProvider = hasSupabase ? live : dummy;
