import { api, API_BASE } from "../src/api";

function url(path: string) {
  return `${API_BASE}${path}`;
}

async function http<T>(u: string, init?: RequestInit): Promise<T> {
  const res = await fetch(u, { headers: { "Content-Type": "application/json" }, ...init });
  const txt = await res.text();
  return JSON.parse(txt) as T;
}

test("create user, product, alert and trigger push via task", async () => {
  const u = await api.createUser(`u_front_${Date.now()}`);
  const uid = u.id;
  const p = await api.createProduct("前端测试商品", "http://example.com/f", "类目");
  const pid = p.id;
  const alert = await api.createAlert(uid, pid, "price_lte", 100000);
  expect(alert.id).toBeTruthy();
  const t = await api.createTask(pid);
  const executed = await api.executeTask(t.id);
  expect(executed.id).toBeTruthy();
  const pushes = await api.listPushes(uid);
  expect(Array.isArray(pushes)).toBe(true);
  expect(pushes.length).toBeGreaterThanOrEqual(1);
});

test("update push status via API", async () => {
  const u = await api.createUser(`u_front2_${Date.now()}`);
  const uid = u.id;
  const p = await api.createProduct("前端测试商品2", "http://example.com/f2", "类目");
  const pid = p.id;
  const payload = { recipient_id: uid, product_id: pid, message: "hello" };
  const created = await http<any>(url(`/users/${uid}/pushes`), { method: "POST", body: JSON.stringify(payload) });
  const pushId = created.data.id;
  const updated = await api.updatePushStatus(pushId, "accepted");
  expect(updated.status).toBe("accepted");
});

test("add product to public pool via API", async () => {
  const p = await api.createProduct("池中商品", "http://example.com/pool", "类目");
  const payload = { product_id: p.id };
  const added = await http<any>(url(`/pools/public/products`), { method: "POST", body: JSON.stringify(payload) });
  expect(added.success).toBe(true);
});
