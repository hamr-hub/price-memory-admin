import { describe, test, expect } from "vitest";
import { hasSupabase } from "../src/supabase";
import { sbEnsureUser, sbListUsers, sbSearchPublicPool } from "../src/supabaseApi";

describe("Supabase 集成", () => {
  test.runIf(hasSupabase)("确保用户存在并可查询", async () => {
    const u = await sbEnsureUser(`sb_user_${Date.now()}`, "SB用户");
    expect(u?.id).toBeTruthy();
    const list = await sbListUsers();
    expect(Array.isArray(list.items)).toBe(true);
  });

  test.runIf(hasSupabase)("公共池搜索接口返回数组", async () => {
    const rows = await sbSearchPublicPool("");
    expect(Array.isArray(rows)).toBe(true);
  });
});
