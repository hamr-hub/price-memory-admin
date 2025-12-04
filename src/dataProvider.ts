import type { DataProvider } from "@refinedev/core";
import { API_BASE } from "./api";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const dataProvider: DataProvider = {
  getList: async (params: any) => {
    const { resource, pagination } = params;
    if (resource === "products") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const json: any = await http(`${API_BASE}/products?page=${page}&size=${size}`);
      const data = json.data?.items || [];
      const total = json.data?.total ?? data.length;
      return { data, total } as any;
    }
    if (resource === "public-pool") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const json: any = await http(`${API_BASE}/pools/public/products?page=${page}&size=${size}`);
      const data = json.data?.items || [];
      const total = json.data?.total ?? data.length;
      return { data, total } as any;
    }
    if (resource === "alerts") {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      const productId = params?.filters?.find((f: any) => f.field === "product_id")?.value;
      const userId = params?.filters?.find((f: any) => f.field === "user_id")?.value ?? user?.id;
      const q = [userId ? `user_id=${userId}` : "", productId ? `product_id=${productId}` : ""].filter(Boolean).join("&");
      const json: any = await http(`${API_BASE}/alerts${q ? `?${q}` : ""}`);
      const data = json.data || [];
      const total = data.length;
      return { data, total } as any;
    }
    throw new Error(`Resource not supported: ${resource}`);
  },
  getOne: async (params: any) => {
    const { resource, id } = params;
    const json: any = await http(`${API_BASE}/${resource}/${id}`);
    return { data: json.data } as any;
  },
  create: async (params: any) => {
    const { resource, variables } = params;
    const json: any = await http(`${API_BASE}/${resource}`, { method: "POST", body: JSON.stringify(variables) });
    return { data: json.data } as any;
  },
  update: async (params: any) => {
    const { resource, id, variables } = params;
    const json: any = await http(`${API_BASE}/${resource}/${id}`, { method: "PUT", body: JSON.stringify(variables) });
    return { data: json.data } as any;
  },
  deleteOne: async (params: any) => {
    const { resource, id } = params;
    const json: any = await http(`${API_BASE}/${resource}/${id}`, { method: "DELETE" });
    return { data: json.data } as any;
  },
  getMany: async () => ({ data: [] } as any),
  getApiUrl: () => API_BASE,
  custom: async ({ url, method, headers, meta, payload, query, resource }: any) => {
    const fullUrl = url || `${API_BASE}/${resource}${meta?.path || ""}`;
    const q = query ? `?${new URLSearchParams(query as any).toString()}` : "";
    const res = await fetch(`${fullUrl}${q}`, {
      method: method || "GET",
      headers: { "Content-Type": meta?.responseType === "blob" ? undefined : "application/json", ...(headers || {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    if (meta?.responseType === "blob") {
      const b = await res.blob();
      return { data: b } as any;
    }
    if (meta?.responseType === "text") {
      const t = await res.text();
      return { data: t } as any;
    }
    const t = await res.text();
    try { const j = JSON.parse(t); return { data: j.data ?? j } as any; } catch { return { data: t } as any; }
  },
} as any;
