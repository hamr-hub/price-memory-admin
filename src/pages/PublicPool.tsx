import { List } from "@refinedev/antd";
import { Table, Button, message } from "antd";
import { useTable, useGetIdentity, useCan } from "@refinedev/core";
import React from "react";
import { API_BASE } from "../api";

const PublicPoolPage: React.FC = () => {
  const { tableProps } = useTable({ resource: "public-pool", pagination: { pageSize: 20 } });
  const { data: identity } = useGetIdentity<any>();
  const { data: canSelect } = useCan({ resource: "public-pool", action: "select" });

  const onSelect = async (record: any) => {
    const userId = identity?.id;
    if (!userId) return message.error("未登录");
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/select_from_pool`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: record.id }) });
      const j = await res.json();
      if (j.success) message.success("已选择并关注"); else message.error(j.error?.message || "操作失败");
    } catch (e: any) { message.error(e.message || "操作失败"); }
  };

  return (
    <List title="公共商品池">
      <Table
        {...tableProps}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "链接", dataIndex: "url" },
          { title: "类别", dataIndex: "category" },
          {
            title: "操作",
            render: (_, record: any) => (
              <Button type="primary" disabled={!canSelect?.can} onClick={() => onSelect(record)}>选择并关注</Button>
            ),
          },
        ]}
      />
    </List>
  );
};

export default PublicPoolPage;
