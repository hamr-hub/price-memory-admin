import { test, expect } from "@playwright/test";

test("登录后在公共池选择并关注商品（网络拦截）", async ({ page }) => {
  const product = { id: 12345, name: "E2E商品", url: "http://example.com/e2e", category: "类目", last_updated: new Date().toISOString() };
  await page.route(/.*\/api\/v1\/pools\/public\/products.*/, async (route) => {
    const resp = { success: true, data: { items: [product], page: 1, size: 20, total: 1, pages: 1 }, message: "操作成功", timestamp: new Date().toISOString() };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resp) });
  });
  await page.route(/.*\/api\/v1\/users\/.+\/select_from_pool$/, async (route) => {
    const resp = { success: true, data: { user_id: 1, product_id: product.id }, message: "操作成功", timestamp: new Date().toISOString() };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resp) });
  });

  await page.addInitScript(() => {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("role", "admin");
    localStorage.setItem("user", JSON.stringify({ id: 1, name: "E2E用户" }));
  });

  await page.goto("/pool");
  await expect(page.getByText("公共商品池")).toBeVisible();
  await expect(page.getByText("E2E商品")).toBeVisible();
  await page.getByRole("button", { name: "选择并关注" }).click();
  await expect(page.getByText("已选择并关注")).toBeVisible();
});
