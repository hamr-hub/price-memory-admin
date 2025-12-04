import { List } from "@refinedev/antd";
import { Table, Button, message, Input, Space, Select } from "antd";
import { useTable, useGetIdentity, useCan } from "@refinedev/core";
import React from "react";
import { API_BASE } from "../api";
import { dataProvider } from "../dataProvider";
import { usingSupabase, sbSearchPublicPool, sbEnsureAuthUser, sbAddFollow } from "../supabaseApi";

const PublicPoolPage: React.FC = () => {
  const table: any = useTable({ resource: "public-pool", pagination: { pageSize: 20 } });
  const { tableProps, setFilters } = table;
  const { data: identity } = useGetIdentity<any>();
  const { data: canSelect } = useCan({ resource: "public-pool", action: "select" });
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");
  const [catOptions, setCatOptions] = React.useState<{ value: string; label: string }[]>([]);

  React.useEffect(() => {
    const load = async () => {
      if (!usingSupabase) return;
      setLoading(true);
      try {
        const data = await sbSearchPublicPool(search);
        setItems(data);
        const cats = Array.from(new Set((data || []).map((x: any) => x.category).filter(Boolean)));
        setCatOptions(cats.map((c) => ({ value: c, label: c })));
      } catch (e: any) {
        message.error(e.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  React.useEffect(() => {
    if (!usingSupabase) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/pools/public/categories`);
          const json = await res.json();
          const cats: string[] = json.data || [];
          setCatOptions(cats.map((c) => ({ value: c, label: c })));
        } catch {}
      })();
    }
  }, [tableProps]);

  const onSelect = async (record: any) => {
    const userId = identity?.id;
    if (!userId) return message.error("未登录");
    try {
      if (usingSupabase) {
        const row = await sbEnsureAuthUser();
        const uid = row?.id;
        if (!uid) throw new Error("用户映射不存在");
        await sbAddFollow(uid, record.id);
        message.success("已选择并关注");
      } else {
        const res: any = await (dataProvider as any).custom({ resource: "users", method: "post", meta: { path: `/${userId}/select_from_pool` }, payload: { product_id: record.id } });
        if (res?.data) message.success("已选择并关注"); else message.error("操作失败");
      }
    } catch (e: any) { message.error(e.message || "操作失败"); }
  };

  return (
    <List title="公共商品池" headerButtons={
      <Space>
        <Input.Search placeholder="搜索名称" allowClear onSearch={(v) => setFilters?.([{ field: "search", operator: "contains", value: v }])} />
        {!usingSupabase ? (
          <Select
            placeholder="类别"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => setFilters?.([{ field: "category", operator: "eq", value: v || "" }])}
            options={catOptions}
          />
        ) : (
          <Select
            placeholder="类别"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => setItems((prev) => prev.filter((x: any) => !v || x.category === v))}
            options={catOptions}
          />
        )}
      </Space>
    }>
      {usingSupabase ? (
        <Table
          dataSource={items}
          loading={loading}
          rowKey="id"
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "名称", dataIndex: "name" },
            { title: "链接", dataIndex: "url" },
            { title: "类别", dataIndex: "category" },
            { title: "更新时间", dataIndex: "last_updated" },
            { title: "操作", render: (_, record: any) => (<Button type="primary" disabled={!canSelect?.can} onClick={() => onSelect(record)}>选择并关注</Button>) },
          ]}
        />
      ) : (
        <Table
          {...tableProps}
          rowKey="id"
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "名称", dataIndex: "name" },
            { title: "链接", dataIndex: "url" },
            { title: "类别", dataIndex: "category" },
            { title: "操作", render: (_, record: any) => (<Button type="primary" disabled={!canSelect?.can} onClick={() => onSelect(record)}>选择并关注</Button>) },
          ]}
        />
      )}
    </List>
  );
};

export default PublicPoolPage;
