import type { DataProvider, BaseRecord } from "@refinedev/core";
import { supabase, hasSupabase } from "./supabase";
import { sbGetCurrentUserRow } from "./supabaseApi";
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
    if (resource === "collections") {
      const me = await sbGetCurrentUserRow();
      const uid = me?.id;
      if (!uid) return { data: [], total: 0 };
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const from = (page - 1) * size;
      const to = from + size - 1;
      const owned = await supabase.from("collections").select("*", { count: "exact" }).eq("owner_user_id", uid).order("id", { ascending: false }).range(from, to);
      const { data: mdata, error: merr } = await supabase
        .from("collection_members")
        .select("collection:collections(*)")
        .eq("user_id", uid)
        .range(from, to);
      if (owned.error) throw owned.error;
      if (merr) throw merr;
      const memberCollections = (mdata || []).map((x: any) => x.collection).filter(Boolean);
      const mergedMap = new Map<number, any>();
      for (const r of (owned.data || [])) mergedMap.set(r.id, r);
      for (const r of memberCollections) mergedMap.set(r.id, r);
      const list = Array.from(mergedMap.values()).sort((a: any, b: any) => b.id - a.id);
      const total = (owned.count || 0) + memberCollections.length;
      return { data: list, total };
    }
    if (resource === "alerts") {
      const me = await sbGetCurrentUserRow();
      const uid = me?.id;
      const productId = filters?.find((f: any) => f.field === "product_id")?.value;
      const userIdFilter = filters?.find((f: any) => f.field === "user_id")?.value;
      const userId = userIdFilter ?? uid;
      let q = supabase.from("alerts").select("*", { count: "exact" });
      if (userId) q = q.eq("user_id", userId);
      if (productId) q = q.eq("product_id", productId);
      const page = pagination?.current ?? 1;
      const size = pagination?.pageSize ?? 20;
      const from = (page - 1) * size;
      const to = from + size - 1;
      q = q.order("id", { ascending: false }).range(from, to);
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
    if (resource === "collections") {
      const { data: col, error: e1 } = await supabase.from("collections").select("*").eq("id", id).limit(1).maybeSingle();
      if (e1) throw e1;
      const { data: members, error: e2 } = await supabase
        .from("collection_members")
        .select("role, user:users(id,username,display_name)")
        .eq("collection_id", id);
      if (e2) throw e2;
      const { data: prods, error: e3 } = await supabase
        .from("collection_products")
        .select("product:products(id,name,url,category)")
        .eq("collection_id", id);
      if (e3) throw e3;
      const data = {
        id: col?.id,
        name: col?.name,
        created_at: col?.created_at,
        products: (prods || []).map((x: any) => x.product).filter(Boolean),
        members: (members || []).map((m: any) => ({ id: m.user?.id, username: m.user?.username, display_name: m.user?.display_name, role: m.role })),
      };
      return { data: data as BaseRecord };
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
    if (resource === "collections") {
      const me = await sbGetCurrentUserRow();
      const uid = me?.id;
      const payload = { name: variables?.name, owner_user_id: uid, created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("collections").insert([payload]).select("*").single();
      if (error) throw error;
      return { data: data as BaseRecord };
    }
    if (resource === "alerts") {
      const me = await sbGetCurrentUserRow();
      const uid = me?.id;
      const payload = { user_id: uid, product_id: variables?.product_id, rule_type: variables?.rule_type, threshold: variables?.threshold, status: "active", created_at: new Date().toISOString() };
      const { data, error } = await supabase.from("alerts").insert([payload]).select("*").single();
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
    if (resource === "alerts") {
      const { data, error } = await supabase.from("alerts").update(variables).eq("id", id).select("*").single();
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
    if (resource === "alerts") {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
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
