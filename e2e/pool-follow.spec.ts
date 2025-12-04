import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:8000/api/v1";

async function createUser(request: any, username: string, display_name?: string) {
  const res = await request.post(`${API_BASE}/users`, { json: { username, display_name } });
  const j = await res.json();
  return j.data;
}

async function createProduct(request: any, name: string) {
  const res = await request.post(`${API_BASE}/products`, { json: { name, url: "http://example.com/e2e", category: "类目" } });
  const j = await res.json();
  return j.data;
}

async function addToPublicPool(request: any, productId: number) {
  const res = await request.post(`${API_BASE}/pools/public/products`, { json: { product_id: productId } });
  const j = await res.json();
  return j.success;
}

test("登录后在公共池选择并关注商品", async ({ page, request }) => {
  const user = await createUser(request, `e2e_user_${Date.now()}`, "E2E用户");
  const product = await createProduct(request, "E2E商品");
  await addToPublicPool(request, product.id);

  await page.addInitScript(([u]) => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("role", "admin");
    localStorage.setItem("user", JSON.stringify({ id: u.id, name: u.username }));
  }, [user]);

  await page.goto("/pool");
  await expect(page.getByText("公共商品池")).toBeVisible();
  await expect(page.getByText("E2E商品")).toBeVisible();
  const btn = page.getByRole("button", { name: "选择并关注" });
  await btn.click();
  await expect(page.getByText("已选择并关注")).toBeVisible();
});
