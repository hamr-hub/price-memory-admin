import { List, useTable, CreateButton, ShowButton } from "@refinedev/antd";
import { Table, Space, Button } from "antd";
import React from "react";
import { API_BASE } from "../api";

const ProductsPage: React.FC = () => {
  const { tableProps } = useTable({ resource: "products" });
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<any[]>([]);
  const onExport = async () => {
    if (!selectedRowKeys.length) return;
    const ids = selectedRowKeys.join(",");
    const res = await fetch(`${API_BASE}/export?product_ids=${ids}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <List title="商品列表" headerButtons={<><CreateButton /><Button style={{ marginLeft: 8 }} onClick={onExport}>批量导出</Button></>}> 
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys as any }}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "链接", dataIndex: "url" },
          { title: "类别", dataIndex: "category" },
          { title: "更新时间", dataIndex: "last_updated" },
          {
            title: "操作",
            dataIndex: "actions",
            render: (_, record: any) => (
              <Space>
                <ShowButton size="small" recordItemId={record.id} />
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};

export default ProductsPage;
