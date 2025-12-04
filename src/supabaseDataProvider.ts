import type { DataProvider, BaseRecord } from "@refinedev/core";
import { supabase, hasSupabase } from "./supabase";
import { dataProvider as restDataProvider } from "./dataProvider";

function mapFilters(q: any, filters?: any[]) {
  if (!Array.isArray(filters)) return q;
  for (const f of filters) {
    if (f?.value === undefined || f?.value === null || f?.value === "") continue;
    const field: string = String(f.field);
    const op: string = String(f.operator || "eq");
    const val = f.value as any;
    if (op === "contains") {
      q = q.ilike(field, `%${String(val)}%`);
      continue;
    }
    if (op === "eq") {
      q = q.eq(field, val);
      continue;
    }
    if (op === "ne") {
      q = q.neq(field, val);
      continue;
    }
    if (op === "gt") {
      q = q.gt(field, val);
      continue;
    }
    if (op === "gte") {
      q = q.gte(field, val);
      continue;
    }
    if (op === "lt") {
      q = q.lt(field, val);
      continue;
    }
    if (op === "lte") {
      q = q.lte(field, val);
      continue;
    }
  }
  return q;
}

export const supabaseDataProvider: DataProvider = {
  getList: async (params: any) => {
    const { resource, pagination, filters, sorters } = params;
    if (!hasSupabase) return restDataProvider.getList(params);
    if (resource === "products" || resource === "public-pool") {
      let q = supabase.from("products").select("*", { count: "exact" });
      q = mapFilters(q, filters);
      const s = Array.isArray(sorters) && sorters[0] ? sorters[0] : { field: "id", order: "desc" };
      q = q.order(String(s.field || "id"), { ascending: String(s.order || "desc").toLowerCase() === "asc" });
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const from = (page - 1) * size;
      const to = from + size - 1;
      q = q.range(from, to);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data || [], total: count ?? (data?.length || 0) };
    }
    return restDataProvider.getList(params);
  },
  getOne: async (params: any) => {
    const { resource, id } = params;
    if (!hasSupabase) return restDataProvider.getOne(params);
    if (resource === "products") {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).limit(1).maybeSingle();
      if (error) throw error;
      return { data: (data || {}) as BaseRecord };
    }
    return restDataProvider.getOne(params);
  },
  create: async (params: any) => {
    if (!hasSupabase) return restDataProvider.create(params);
    const { resource, variables } = params;
    if (resource === "products") {
      const { data, error } = await supabase.from("products").insert([variables]).select("*").single();
      if (error) throw error;
      return { data: data as BaseRecord };
    }
    return restDataProvider.create(params);
  },
  update: async (params: any) => {
    if (!hasSupabase) return restDataProvider.update(params);
    const { resource, id, variables } = params;
    if (resource === "products") {
      const { data, error } = await supabase.from("products").update(variables).eq("id", id).select("*").single();
      if (error) throw error;
      return { data: data as BaseRecord };
    }
    return restDataProvider.update(params);
  },
  deleteOne: async (params: any) => {
    if (!hasSupabase) return restDataProvider.deleteOne(params);
    const { resource, id } = params;
    if (resource === "products") {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return { data: { id } as BaseRecord };
    }
    return restDataProvider.deleteOne(params);
  },
  getMany: async (params: any) => {
    if (!hasSupabase) return restDataProvider.getMany(params);
    const { resource, ids } = params;
    if (resource === "products") {
      const { data, error } = await supabase.from("products").select("*").in("id", ids);
      if (error) throw error;
      return { data: (data || []) as BaseRecord[] };
    }
    return restDataProvider.getMany(params);
  },
  getApiUrl: () => restDataProvider.getApiUrl(),
  custom: async (params: any) => {
    return restDataProvider.custom(params);
  },
} as any;

