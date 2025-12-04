import type { AuthBindings } from "@refinedev/core";
import { supabase, hasSupabase } from "../supabase";

const localAuth: AuthBindings = {
  login: async ({ email, password }) => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "演示用户" }));
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true, redirectTo: "/login" };
  },
  check: async () => ({ authenticated: !!localStorage.getItem("token") }),
  getIdentity: async () => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  onError: async (error) => ({ error }) as any,
};

export const authProvider: AuthBindings = hasSupabase
  ? {
      login: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email: String(email), password: String(password) });
        if (error) return { success: false, error } as any;
        return { success: true, redirectTo: "/" };
      },
      logout: async () => {
        await supabase.auth.signOut();
        return { success: true, redirectTo: "/login" };
      },
      check: async () => {
        const { data } = await supabase.auth.getUser();
        return { authenticated: !!data.user };
      },
      getIdentity: async () => {
        const { data } = await supabase.auth.getUser();
        const u = data.user;
        if (!u) return null as any;
        return { id: u.id, name: u.user_metadata?.name || u.email, avatar: u.user_metadata?.avatar } as any;
      },
      onError: async (error) => ({ error }) as any,
    }
  : localAuth;
