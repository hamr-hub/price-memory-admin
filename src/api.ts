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
export const SORT_FIELD_PARAM = "sort_by";
export const SORT_ORDER_PARAM = "order";
export const SORT_FIELD_MAP: Record<string, string> = {};

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

async function gql<T>(query: string, variables?: any): Promise<T> {
  const apiKey = getApiKey();
  const headers = { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) } as Record<string, string>;
  const res = await fetch(`${API_BASE}/graphql`, { method: "POST", headers, body: JSON.stringify({ query, variables }) });
  const text = await res.text();
  if (!res.ok) throw new Error(text || res.statusText);
  const j = JSON.parse(text);
  return j.data as T;
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
    const data: any = await gql(`query($user_id:Int!,$box:String){ userPushes(user_id:$user_id,box:$box) }`, { user_id: userId, box });
    return data?.userPushes || [];
  },
  async updatePushStatus(pushId: number, status: "accepted" | "rejected") {
    const data: any = await gql(`mutation($id:Int!,$status:String!){ updatePushStatus(id:$id,status:$status) }`, { id: pushId, status });
    return data?.updatePushStatus;
  },
  async addFollow(userId: number, productId: number) {
    const j: any = await http(`${API_BASE}/users/${userId}/follows`, { method: "POST", body: JSON.stringify({ product_id: productId }) });
    return j.data;
  },
  async listAlerts(userId?: number, productId?: number) {
    const data: any = await gql(`query($user_id:Int,$product_id:Int){ alerts(user_id:$user_id,product_id:$product_id) }`, { user_id: userId, product_id: productId });
    return data?.alerts || [];
  },
  async createAlert(userId: number, productId: number, ruleType: string, threshold?: number) {
    const data: any = await gql(`mutation($input:AlertInput){ createAlert(input:$input) }`, { input: { user_id: userId, product_id: productId, rule_type: ruleType, threshold } });
    return data?.createAlert;
  },
  async listAlertEvents(alertId: number) {
    const data: any = await gql(`query($alert_id:Int!){ alertEvents(alert_id:$alert_id,page:1,size:100){ items } }`, { alert_id: alertId });
    return data?.alertEvents?.items || [];
  },
  async updateAlert(alertId: number, payload: { threshold?: number; channel?: string; cooldown_minutes?: number }) {
    const data: any = await gql(`mutation($id:Int!,$input:AlertUpdate){ updateAlert(id:$id,input:$input) }`, { id: alertId, input: payload });
    return data?.updateAlert;
  },
  async updateAlertStatus(alertId: number, status: "active" | "paused") {
    const data: any = await gql(`mutation($id:Int!,$status:String!){ updateAlertStatus(id:$id,status:$status) }`, { id: alertId, status });
    return data?.updateAlertStatus;
  },
  async deleteAlert(alertId: number) {
    const data: any = await gql(`mutation($id:Int!){ deleteAlert(id:$id){ id } }`, { id: alertId });
    return data?.deleteAlert;
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
  async getNextTask() {
    const j: any = await http(`${API_BASE}/spider/tasks/next`);
    return j.data;
  },
  async executeNextTask() {
    const j: any = await http(`${API_BASE}/spider/tasks/next/execute`, { method: "POST" });
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
