export const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
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
  async updateAlertStatus(alertId: number, status: "active" | "paused") {
    const j: any = await http(`${API_BASE}/alerts/${alertId}/status`, { method: "POST", body: JSON.stringify({ status }) });
    return j.data;
  },
  async deleteAlert(alertId: number) {
    const j: any = await http(`${API_BASE}/alerts/${alertId}`, { method: "DELETE" });
    return j.data;
  },
};
