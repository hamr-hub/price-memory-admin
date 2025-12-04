import { List } from "@refinedev/antd";
import { Table, Button, message, Input, Space } from "antd";
import { useTable, useGetIdentity, useCan } from "@refinedev/core";
import React from "react";
import { API_BASE } from "../api";
import { dataProvider } from "../dataProvider";

const PublicPoolPage: React.FC = () => {
  const table: any = useTable({ resource: "public-pool", pagination: { pageSize: 20 } });
  const { tableProps, setFilters } = table;
  const { data: identity } = useGetIdentity<any>();
  const { data: canSelect } = useCan({ resource: "public-pool", action: "select" });

  const onSelect = async (record: any) => {
    const userId = identity?.id;
    if (!userId) return message.error("未登录");
    try {
      const res: any = await (dataProvider as any).custom({ resource: "users", method: "post", meta: { path: `/${userId}/select_from_pool` }, payload: { product_id: record.id } });
      if (res?.data) message.success("已选择并关注"); else message.error("操作失败");
    } catch (e: any) { message.error(e.message || "操作失败"); }
  };

  return (
    <List title="公共商品池" headerButtons={
      <Space>
        <Input.Search placeholder="搜索名称" allowClear onSearch={(v) => setFilters?.([{ field: "search", operator: "contains", value: v }])} />
      </Space>
    }>
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
