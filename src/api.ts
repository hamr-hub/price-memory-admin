export const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
export const FILTER_PARAM_MAP: Record<string, string> = {
  // 在此按需覆盖映射，如后端采用不同参数名：
  // 前端字段: 后端查询参数名
  // updated_from: "updated_from",
  // updated_to: "updated_to",
  // price_min: "price_min",
  // price_max: "price_max",
};
export const CATEGORIES_ENDPOINT = "/categories";

export function getApiKey(): string | undefined {
  try { return localStorage.getItem("API_KEY") || undefined; } catch { return undefined; }
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const headers = { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) } as Record<string, string>;
  const res = await fetch(url, { headers, ...init });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  try { return JSON.parse(text) as T; } catch { return (text as any) as T; }
}

export const api = {
  async listUsers() {
    const j: any = await http(`${API_BASE}/users?page=1&size=100`);
    return j.data || { items: [] };
  },
  async createUser(username: string, display_name?: string) {
    const j: any = await http(`${API_BASE}/users`, { method: "POST", body: JSON.stringify({ username, display_name }) });
    try {
      const key = j?.data?.api_key;
      if (key) localStorage.setItem("API_KEY", key);
    } catch {}
    return j.data;
  },
  async listPushes(userId: number, box?: "inbox" | "outbox") {
    const j: any = await http(`${API_BASE}/users/${userId}/pushes${box ? `?box=${box}` : ""}`);
    return j.data || [];
  },
  async updatePushStatus(pushId: number, status: "accepted" | "rejected") {
    const j: any = await http(`${API_BASE}/pushes/${pushId}/status`, { method: "POST", body: JSON.stringify({ status }) });
    return j.data;
  },
  async addFollow(userId: number, productId: number) {
    const j: any = await http(`${API_BASE}/users/${userId}/follows`, { method: "POST", body: JSON.stringify({ product_id: productId }) });
    return j.data;
  },
  async listAlerts(userId?: number, productId?: number) {
    const q = [userId ? `user_id=${userId}` : "", productId ? `product_id=${productId}` : ""].filter(Boolean).join("&");
    const j: any = await http(`${API_BASE}/alerts${q ? `?${q}` : ""}`);
    return j.data || [];
  },
  async createAlert(userId: number, productId: number, ruleType: string, threshold?: number) {
    const j: any = await http(`${API_BASE}/alerts`, { method: "POST", body: JSON.stringify({ user_id: userId, product_id: productId, rule_type: ruleType, threshold }) });
    return j.data;
  },
  async listAlertEvents(alertId: number) {
    const j: any = await http(`${API_BASE}/alerts/${alertId}/events`);
    return j.data || [];
  },
  async updateAlert(alertId: number, payload: { threshold?: number; channel?: string; cooldown_minutes?: number }) {
    const params = new URLSearchParams();
    if (payload.threshold !== undefined) params.set("threshold", String(payload.threshold));
    if (payload.channel !== undefined) params.set("channel", String(payload.channel));
    if (payload.cooldown_minutes !== undefined) params.set("cooldown_minutes", String(payload.cooldown_minutes));
    const j: any = await http(`${API_BASE}/alerts/${alertId}/update${params.toString() ? `?${params.toString()}` : ""}`, { method: "POST" });
    return j.data;
  },
  async updateAlertStatus(alertId: number, status: "active" | "paused") {
    const j: any = await http(`${API_BASE}/alerts/${alertId}/status`, { method: "POST", body: JSON.stringify({ status }) });
    return j.data;
  },
  async deleteAlert(alertId: number) {
    const j: any = await http(`${API_BASE}/alerts/${alertId}`, { method: "DELETE" });
    return j.data;
  },
  async createProduct(name: string, url: string, category?: string) {
    const j: any = await http(`${API_BASE}/products`, { method: "POST", body: JSON.stringify({ name, url, category }) });
    return j.data;
  },
  async createTask(productId: number, priority?: number) {
    const j: any = await http(`${API_BASE}/spider/tasks`, { method: "POST", body: JSON.stringify({ product_id: productId, priority }) });
    return j.data;
  },
  async executeTask(taskId: number) {
    const j: any = await http(`${API_BASE}/spider/tasks/${taskId}/execute`, { method: "POST" });
    return j.data;
  },
  async updateAlertTarget(alertId: number, target: string) {
    const j: any = await http(`${API_BASE}/alerts/${alertId}/target?target=${encodeURIComponent(target)}`, { method: "POST" });
    return j.data;
  },
  async retryAlertEvent(eventId: number) {
    const j: any = await http(`${API_BASE}/alert_events/${eventId}/retry`, { method: "POST" });
    return j.data;
  },
};
