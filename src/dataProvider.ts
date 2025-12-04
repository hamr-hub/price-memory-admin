import type { DataProvider, BaseRecord } from "@refinedev/core";
import { API_BASE, getApiKey, FILTER_PARAM_MAP } from "./api";

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const apiKey = getApiKey();
  const headers = { "Content-Type": "application/json", ...(apiKey ? { "X-API-Key": apiKey } : {}) } as Record<string, string>;
  const res = await fetch(url, { headers, ...init });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
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

export const dataProvider: DataProvider = {
  getList: async (params: any) => {
    const { resource, pagination, filters } = params;
    if (resource === "products") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const data: any = await gql(`query($page:Int,$size:Int){ products(page:$page,size:$size){ items total page size } }`, { page, size });
      const items = data?.products?.items || [];
      const total = data?.products?.total ?? items.length;
      return { data: items, total };
    }
    if (resource === "public-pool") {
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const search = params?.filters?.find((f: any) => f.field === "search")?.value || "";
      const category = params?.filters?.find((f: any) => f.field === "category")?.value || "";
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      if (search) qs.set("search", String(search));
      if (category) qs.set("category", String(category));
      const json: any = await http(`${API_BASE}/pools/public/products?${qs.toString()}`);
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
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const search = params?.filters?.find((f: any) => f.field === "search")?.value || "";
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      if (search) qs.set("search", String(search));
      const json: any = await http(`${API_BASE}/users/${user?.id}/collections?${qs.toString()}`);
      const data = json.data?.items || [];
      const total = json.data?.total ?? data.length;
      return { data, total };
    }
    if (resource === "pushes") {
      const userId = params?.filters?.find((f: any) => f.field === "user_id")?.value;
      const box = params?.filters?.find((f: any) => f.field === "box")?.value;
      if (!userId) throw new Error("user_id is required for pushes list");
      const json: any = await http(`${API_BASE}/users/${userId}/pushes${box ? `?box=${box}` : ""}`);
      const data = json.data || [];
      const total = data.length;
      return { data, total };
    }
    throw new Error(`Resource not supported: ${resource}`);
  },
  getOne: async (params: any) => {
    const { resource, id } = params;
    if (resource === "products") {
      const data: any = await gql(`query($id:Int!){ product(id:$id){ id name url category last_updated stats{ min_price max_price avg_price count } } }`, { id });
      return { data: data?.product as BaseRecord };
    }
    const json: any = await http(`${API_BASE}/${resource}/${id}`);
    return { data: json.data as BaseRecord };
  },
  create: async (params: any) => {
    const { resource, variables } = params;
    if (resource === "products") {
      const data: any = await gql(`mutation($input:ProductInput){ createProduct(input:$input){ id name url category last_updated } }`, { input: variables });
      return { data: data?.createProduct as BaseRecord };
    }
    const json: any = await http(`${API_BASE}/${resource}`, { method: "POST", body: JSON.stringify(variables) });
    return { data: json.data as BaseRecord };
  },
  update: async (params: any) => {
    const { resource, id, variables } = params;
    if (resource === "products") {
      const data: any = await gql(`mutation($id:Int!,$input:ProductUpdate){ updateProduct(id:$id,input:$input){ id name url category last_updated } }`, { id, input: variables });
      return { data: data?.updateProduct as BaseRecord };
    }
    const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(variables) });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "UPDATE_FAILED");
    const json = text ? JSON.parse(text) : {};
    return { data: (json.data ?? {}) as BaseRecord };
  },
  deleteOne: async (params: any) => {
    const { resource, id } = params;
    if (resource === "products") {
      const data: any = await gql(`mutation($id:Int!){ deleteProduct(id:$id){ id } }`, { id });
      return { data: data?.deleteProduct as BaseRecord };
    }
    const res = await fetch(`${API_BASE}/${resource}/${id}`, { method: "DELETE" });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "DELETE_FAILED");
    const json = text ? JSON.parse(text) : {};
    return { data: (json.data ?? { id }) as BaseRecord };
  },
  getMany: async (params: any) => {
    const { resource, ids } = params;
    if (resource === "products") {
      const data: any = await gql(`query($ids:[Int!]){ getManyProducts(ids:$ids){ items } }`, { ids });
      const items = data?.getManyProducts?.items || [];
      return { data: items as BaseRecord[] };
    }
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
    const apiKey = getApiKey();
    const res = await fetch(`${fullUrl}${q}`, {
      method: method || "GET",
      headers: { "Content-Type": meta?.responseType === "blob" ? undefined : "application/json", ...(headers || {}), ...(apiKey ? { "X-API-Key": apiKey } : {}) },
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
