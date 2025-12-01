import { List, useTable, CreateButton, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space } from "antd";
import React from "react";

const ProductsPage: React.FC = () => {
  const { tableProps } = useTable({ resource: "products" });

  return (
    <List title="商品列表" headerButtons={<CreateButton />}> 
      <Table
        {...tableProps}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "标题", dataIndex: "title" },
          { title: "价格", dataIndex: "price" },
          {
            title: "操作",
            dataIndex: "actions",
            render: (_, record: any) => (
              <Space>
                <EditButton size="small" recordItemId={record.id} />
                <ShowButton size="small" recordItemId={record.id} />
                <DeleteButton size="small" recordItemId={record.id} />
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};

export default ProductsPage;
