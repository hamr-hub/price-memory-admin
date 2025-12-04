import { List, useTable, CreateButton, ShowButton, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Button } from "antd";
import { useCan, useCustom } from "@refinedev/core";
import React from "react";
import { API_BASE } from "../api";
import { downloadBlob } from "../utils/download";

const ProductsPage: React.FC = () => {
  const { tableProps } = useTable({ resource: "products" });
  const { data: canExport } = useCan({ resource: "products", action: "export" });
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<any[]>([]);
  const [exportIds, setExportIds] = React.useState<string | null>(null);
  const exportQuery: any = useCustom({ url: exportIds ? `${API_BASE}/export?product_ids=${exportIds}` : "", method: "get", meta: { responseType: "blob" }, queryOptions: { enabled: !!exportIds } });
  React.useEffect(() => {
    const blob: Blob | undefined = exportQuery?.data?.data;
    if (blob) {
      downloadBlob(blob, "products_export.csv");
      setExportIds(null);
    }
  }, [exportQuery?.data?.data]);
  const onExport = () => {
    if (!selectedRowKeys.length) return;
    setExportIds(selectedRowKeys.join(","));
  };

  return (
    <List title="商品列表" headerButtons={<><CreateButton />{canExport?.can && <Button style={{ marginLeft: 8 }} onClick={onExport}>批量导出</Button>}</>}> 
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
                <EditButton size="small" recordItemId={record.id} />
                <DeleteButton size="small" recordItemId={record.id} resource="products" />
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};

export default ProductsPage;
