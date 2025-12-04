import { supabase, hasSupabase } from "./supabase";

export async function sbListProducts() {
  const { data, error } = await supabase.from("products").select("*").order("id", { ascending: false });
  if (error) throw error;
  return { items: data || [] };
}

export async function sbListUsers() {
  const { data, error } = await supabase.from("users").select("id,username,display_name,created_at").order("id", { ascending: false });
  if (error) throw error;
  return { items: data || [] };
}

export async function sbEnsureUser(username: string, display_name?: string) {
  const { data: exists, error: e1 } = await supabase.from("users").select("*").eq("username", username).limit(1).maybeSingle();
  if (e1) throw e1;
  if (exists) return exists;
  const { data, error } = await supabase.from("users").insert([{ username, display_name, created_at: new Date().toISOString() }]).select("*").single();
  if (error) throw error;
  return data;
}

export async function sbListUserFollows(userId: number) {
  const { data: links, error } = await supabase.from("user_follows").select("product_id").eq("user_id", userId);
  if (error) throw error;
  const ids = (links || []).map((x: any) => x.product_id);
  if (!ids.length) return [];
  const { data, error: e2 } = await supabase.from("products").select("*").in("id", ids).order("id", { ascending: false });
  if (e2) throw e2;
  return data || [];
}

export async function sbAddFollow(userId: number, productId: number) {
  const { error } = await supabase.from("user_follows").insert([{ user_id: userId, product_id: productId, created_at: new Date().toISOString() }]);
  if (error && !String(error.message).includes("duplicate key")) throw error;
  return { user_id: userId, product_id: productId };
}

export async function sbRemoveFollow(userId: number, productId: number) {
  const { error } = await supabase.from("user_follows").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) throw error;
  return { user_id: userId, product_id: productId };
}

export async function sbListFollowers(productId: number) {
  const { data: links, error } = await supabase.from("user_follows").select("user_id").eq("product_id", productId);
  if (error) throw error;
  const ids = (links || []).map((x: any) => x.user_id);
  if (!ids.length) return [];
  const { data, error: e2 } = await supabase.from("users").select("id,username,display_name").in("id", ids);
  if (e2) throw e2;
  return data || [];
}

export async function sbCreatePush(senderId: number, recipientId: number, productId: number, message?: string) {
  const { data, error } = await supabase
    .from("pushes")
    .insert([{ sender_id: senderId, recipient_id: recipientId, product_id: productId, message, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function sbListPushes(userId: number, box?: "inbox" | "outbox") {
  const col = box === "outbox" ? "sender_id" : "recipient_id";
  const { data, error } = await supabase.from("pushes").select("*").eq(col, userId).order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function sbUpdatePushStatus(pushId: number, status: "accepted" | "rejected") {
  const { data, error } = await supabase.from("pushes").update({ status, updated_at: new Date().toISOString() }).eq("id", pushId).select("*").single();
  if (error) throw error;
  return data;
}

export function sbSubscribePushes(userId: number, handler: (payload: any) => void) {
  const channel = supabase
    .channel("pushes:" + userId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "pushes", filter: `recipient_id=eq.${userId}` },
      (payload: any) => handler(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function sbSubscribePushesUpdate(userId: number, handler: (payload: any) => void) {
  const channel = supabase
    .channel("pushes:update:" + userId)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "pushes", filter: `recipient_id=eq.${userId}` },
      (payload: any) => handler(payload)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "pushes", filter: `sender_id=eq.${userId}` },
      (payload: any) => handler(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function sbSubscribeFollowsInsert(userId: number, handler: (payload: any) => void) {
  const channel = supabase
    .channel("follows:insert:" + userId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "user_follows", filter: `user_id=eq.${userId}` },
      (payload: any) => handler(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function sbSubscribePrices(handler: (payload: any) => void) {
  const channel = supabase
    .channel("prices")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "prices" },
      (payload: any) => handler(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sbListRuntimeNodes() {
  const { data, error } = await supabase
    .from("runtime_nodes")
    .select("id,name,host,region,version,status,current_tasks,queue_size,total_completed,last_seen,latency_ms")
    .order("last_seen", { ascending: false });
  if (error) throw error;
  return data || [];
}

export function sbSubscribeRuntimeNodes(handler: (payload: any) => void) {
  const channel = supabase
    .channel("runtime_nodes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "runtime_nodes" },
      (payload: any) => handler(payload)
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "runtime_nodes" },
      (payload: any) => handler(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sbCreateNodeCommand(nodeId: number, command: string, payload?: any) {
  const { data, error } = await supabase
    .from("node_commands")
    .insert([{ node_id: nodeId, command, payload, status: "pending", created_at: new Date().toISOString() }])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function sbCreateTestCrawl(nodeId: number, url: string, jobIdOrOpts?: string | { jobId?: string; timeout_ms?: number; retries?: number }) {
  const opts = typeof jobIdOrOpts === "string" ? { jobId: jobIdOrOpts } : (jobIdOrOpts || {} as any);
  const payload = { url, job_id: opts.jobId || `${Date.now()}_${Math.random().toString(36).slice(2)}`, timeout_ms: opts.timeout_ms, retries: opts.retries } as any;
  const cmd = await sbCreateNodeCommand(nodeId, "test_crawl", payload);
  return { command: cmd, jobId: payload.job_id };
}

export function sbSubscribeCrawlLogs(jobId: string, handler: (payload: any) => void) {
  const channel = supabase
    .channel("crawl_logs:" + jobId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "crawl_logs", filter: `job_id=eq.${jobId}` },
      (payload: any) => handler(payload?.new || payload?.record || payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function sbCreateTestSteps(nodeId: number, url: string, steps: any[], opts?: { jobId?: string; timeout_ms?: number; retries?: number }) {
  const payload = {
    url,
    steps,
    job_id: opts?.jobId || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timeout_ms: opts?.timeout_ms,
    retries: opts?.retries,
  };
  const cmd = await sbCreateNodeCommand(nodeId, "test_steps", payload);
  return { command: cmd, jobId: payload.job_id };
}

export async function sbCreateCodegen(nodeId: number, url: string, opts?: { jobId?: string; target?: "python" | "javascript"; duration_sec?: number }) {
  const payload = {
    url,
    job_id: opts?.jobId || `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    target: opts?.target || "python",
    duration_sec: opts?.duration_sec || 10,
  };
  const cmd = await sbCreateNodeCommand(nodeId, "codegen", payload);
  return { command: cmd, jobId: payload.job_id };
}

export async function sbUploadImage(file: File, filename: string) {
  const path = `${Date.now()}_${filename}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export function sbGetPublicUrl(path: string) {
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

export const usingSupabase = hasSupabase;

export async function sbGetProductStats(productId: number) {
  const { data, error } = await supabase.rpc("rpc_product_stats", { product_id: productId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { min_price: row?.min_price ?? null, max_price: row?.max_price ?? null, avg_price: row?.avg_price ?? null, count: row?.count ?? 0 };
}

export async function sbEnsureAuthUser() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const email = user.email || user.user_metadata?.email || `user_${user.id}`;
  const display = user.user_metadata?.username || user.user_metadata?.full_name || email;
  const { data: exists } = await supabase.from("users").select("id").eq("auth_uid", user.id).limit(1).maybeSingle();
  if (exists) return exists;
  const { data, error } = await supabase.from("users").insert([{ username: email, display_name: display, auth_uid: user.id, created_at: new Date().toISOString() }]).select("id").single();
  if (error) throw error;
  return data;
}

export async function sbGetCurrentUserRow() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data } = await supabase.from("users").select("id,username,display_name,auth_uid").eq("auth_uid", user.id).limit(1).maybeSingle();
  return data || null;
}

export async function sbSearchPublicPool(search?: string) {
  let q = supabase.from("products").select("*").order("id", { ascending: false });
  if (search && search.trim()) q = q.ilike("name", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function sbExportPrices(productIds: number[]) {
  const { data, error } = await supabase
    .from("v_product_prices_export")
    .select("product_id, product_name, url, category, price_id, price, created_at")
    .in("product_id", productIds);
  if (error) throw error;
  return data || [];
}

export async function sbGetProductPrices(productId: number, startDate?: string, endDate?: string) {
  let q = supabase.from("prices").select("id,product_id,price,created_at").eq("product_id", productId).order("created_at", { ascending: false });
  if (startDate) q = q.gte("created_at", startDate);
  if (endDate) q = q.lte("created_at", `${endDate} 23:59:59`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function sbGetTrendDailyOHLC(productId: number, startDate: string, endDate: string) {
  const { data, error } = await supabase.rpc("rpc_product_daily_ohlc", { product_id: productId, start_date: startDate, end_date: endDate });
  if (error) throw error;
  return (data || []).map((r: any) => ({ date: r.day, open: r.open, close: r.close, low: r.low, high: r.high, avg: r.avg, count: r.count }));
}

export async function sbGetTrendHourlyOHLC(productId: number, startTs: string, endTs: string) {
  const { data, error } = await supabase.rpc("rpc_product_hourly_ohlc", { product_id: productId, start_ts: startTs, end_ts: endTs });
  if (error) throw error;
  return (data || []).map((r: any) => ({ date: r.hour, open: r.open, close: r.close, low: r.low, high: r.high, avg: r.avg, count: r.count }));
}
