import type { DataProvider, BaseRecord } from "@refinedev/core";
import { API_BASE } from "./api";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination }) => {
    if (resource === "products") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const json: any = await http(`${API_BASE}/products?page=${page}&size=${size}`);
      const data = json.data?.items || [];
      const total = json.data?.total ?? data.length;
      return { data, total };
    }
    if (resource === "public-pool") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const json: any = await http(`${API_BASE}/pools/public/products?page=${page}&size=${size}`);
      const data = json.data?.items || [];
      const total = json.data?.total ?? data.length;
      return { data, total };
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
      return { data, total };
    }
    if (resource === "collections") {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      const json: any = await http(`${API_BASE}/users/${user?.id}/collections`);
      const data = json.data || [];
      const total = data.length;
      return { data, total };
    }
    throw new Error(`Resource not supported: ${resource}`);
  },
  getOne: async ({ resource, id }) => {
    const json: any = await http(`${API_BASE}/${resource}/${id}`);
    return { data: json.data as BaseRecord };
  },
  create: async ({ resource, variables }) => {
    const json: any = await http(`${API_BASE}/${resource}`, { method: "POST", body: JSON.stringify(variables) });
    return { data: json.data as BaseRecord };
  },
  update: async ({ resource, id, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(variables) });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "UPDATE_FAILED");
    const json = text ? JSON.parse(text) : {};
    return { data: (json.data ?? {}) as BaseRecord };
  },
  deleteOne: async ({ resource, id }) => {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "DELETE" });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "DELETE_FAILED");
    const json = text ? JSON.parse(text) : {};
    return { data: (json.data ?? { id }) as BaseRecord };
  },
  getMany: async ({ resource, ids }) => {
    const results: BaseRecord[] = [];
    for (const id of ids) {
      try {
        const json: any = await http(`${API_BASE}/${resource}/${id}`);
        if (json?.data) results.push(json.data as BaseRecord);
      } catch {}
    }
    return { data: results };
  },
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
