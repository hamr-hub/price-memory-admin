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
  update: async () => { throw new Error("update not implemented") },
  deleteOne: async () => { throw new Error("delete not implemented") },
  getMany: async () => ({ data: [] } as any),
  getApiUrl: () => API_BASE,
} as any;
