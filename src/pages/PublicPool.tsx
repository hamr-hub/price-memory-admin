import { List } from "@refinedev/antd";
import { Table, Button, message } from "antd";
import React from "react";
import { API_BASE } from "../api";

const PublicPoolPage: React.FC = () => {
  const [data, setData] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  const load = React.useCallback(async (p: number) => {
    const res = await fetch(`${API_BASE}/pools/public/products?page=${p}&size=20`);
    const json = await res.json();
    setData(json.data?.items || []);
    setTotal(json.data?.total || 0);
  }, []);

  React.useEffect(() => { load(page); }, [page, load]);

  const onSelect = async (record: any) => {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : { id: 1 };
    const res = await fetch(`${API_BASE}/users/${user.id}/select_from_pool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: record.id }),
    });
    const json = await res.json();
    if (json.success) {
      message.success("已选择并关注");
    } else {
      message.error(json.error?.message || "操作失败");
    }
  };

  return (
    <List title="公共商品池">
      <Table
        dataSource={data}
        rowKey="id"
        pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p) }}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "链接", dataIndex: "url" },
          { title: "类别", dataIndex: "category" },
          {
            title: "操作",
            render: (_, record: any) => (
              <Button type="primary" onClick={() => onSelect(record)}>选择并关注</Button>
            ),
          },
        ]}
      />
    </List>
  );
};

export default PublicPoolPage;
