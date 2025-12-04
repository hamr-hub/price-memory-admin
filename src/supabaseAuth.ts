import { supabase } from "./supabase";

const supabaseAuthProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message } as any;
    return { success: true, redirectTo: "/" };
  },
  logout: async () => {
    await supabase.auth.signOut();
    return { success: true, redirectTo: "/login" };
  },
  check: async () => {
    const { data } = await supabase.auth.getSession();
    const authenticated = !!data.session;
    return { authenticated, redirectTo: authenticated ? undefined : "/login" };
  },
  getIdentity: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    return {
      id: user.id,
      name: user.email || user.user_metadata?.username || "用户",
      avatar: user.user_metadata?.avatar_url,
    };
  },
  onError: async (error: any) => ({ error }) as any,
};

export default supabaseAuthProvider;

