import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabase = !!(supabaseUrl && supabaseAnonKey);

export const supabase: any = hasSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from() {
        return {
          select: async () => ({ data: [], error: null }),
          insert: async () => ({ data: [], error: null }),
          update: async () => ({ data: [], error: null }),
          delete: async () => ({ data: [], error: null }),
          in: async () => ({ data: [], error: null }),
          eq: async () => ({ data: [], error: null }),
          order: async () => ({ data: [], error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
        } as any;
      },
      rpc: async () => ({ data: [], error: null }),
      auth: {
        async signInWithPassword() { return { data: {}, error: null }; },
        async signOut() { return { error: null }; },
        async getSession() { return { data: { session: null } }; },
        async getUser() { return { data: { user: null } }; },
      },
      channel() {
        return {
          on() { return this; },
          subscribe() { return this; },
        } as any;
      },
      removeChannel() {},
      storage: {
        from() {
          return {
            upload: async () => ({ error: null }),
            getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
          };
        },
      },
    };
