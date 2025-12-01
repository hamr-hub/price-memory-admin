export const hasSupabase = false;
export const supabase: any = {
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
