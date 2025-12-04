import type { DataProvider, GetListResponse } from "@refinedev/core";
import { API_BASE } from "../api";

const toQuery = (params: Record<string, any>) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((i) => usp.append(k, String(i)));
    else usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
};

const parseJSON = async (res: Response) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const unwrap = (json: any) => {
  if (json && typeof json === "object") {
    if ("data" in json) return json.data;
    if ("result" in json) return json.result;
  }
  return json;
};

const getTotal = (res: Response, body: any) => {
  const header = res.headers.get("X-Total-Count");
  if (header) return Number(header);
  if (body && typeof body === "object" && "total" in body) return Number(body.total);
  if (Array.isArray(body)) return body.length;
  return undefined;
};

export const restDataProvider: DataProvider = {
  getApiUrl: () => API_BASE,
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const { current = 1, pageSize = 20 } = pagination ?? {};
    const query: Record<string, any> = {
      _page: current,
      _limit: pageSize,
    };
    if (sorters && sorters.length > 0) {
      const s = sorters[0];
      query._sort = s.field;
      query._order = s.order;
    }
    if (filters && filters.length > 0) {
      filters.forEach((f) => {
        const key = f.operator === "contains" ? `${f.field}_like` : f.field;
        query[key] = f.value;
      });
    }
    const url = `${API_BASE}/${resource}${toQuery(query)}`;
    const res = await fetch(url);
    const json = await parseJSON(res);
    const data = unwrap(json);
    const total = getTotal(res, json);
    const items = Array.isArray(data) ? data : data?.items ?? [];
    const out: GetListResponse<any> = { data: items, total: total ?? items.length };
    return out;
  },
  getOne: async ({ resource, id }) => {
    const res = await fetch(`${API_BASE}/${resource}/${id}`);
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  getMany: async ({ resource, ids }) => {
    const qs = toQuery({ id: ids });
    const res = await fetch(`${API_BASE}/${resource}${qs}`);
    const json = await parseJSON(res);
    const data = unwrap(json);
    const items = Array.isArray(data) ? data : data?.items ?? [];
    return { data: items };
  },
  create: async ({ resource, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables),
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  createMany: async ({ resource, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables),
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  update: async ({ resource, id, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(variables),
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  updateMany: async ({ resource, ids, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/bulk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, ...variables }),
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  deleteOne: async ({ resource, id, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: variables ? JSON.stringify(variables) : undefined,
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
  deleteMany: async ({ resource, ids, variables }) => {
    const res = await fetch(`${API_BASE}/${resource}/bulk`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, ...variables }),
    });
    const json = await parseJSON(res);
    const data = unwrap(json);
    return { data };
  },
};

export default restDataProvider;
