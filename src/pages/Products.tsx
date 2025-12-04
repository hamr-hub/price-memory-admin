import { List, useTable, CreateButton, ShowButton, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Button, Form, Input } from "antd";
import { useCan, useCustom } from "@refinedev/core";
import React from "react";
import { API_BASE, getApiKey } from "../api";
import { downloadBlob } from "../utils/download";

const ProductsPage: React.FC = () => {
  const { tableProps, setFilters } = useTable({ resource: "products", filters: { initial: [] } });
  const { data: canExport } = useCan({ resource: "products", action: "export" });
  const { data: canEdit } = useCan({ resource: "products", action: "edit" });
  const { data: canDelete } = useCan({ resource: "products", action: "delete" });
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

  const exportSingle = async (id: number) => {
    try {
      const apiKey = getApiKey();
      const res = await fetch(`${API_BASE}/products/${id}/export`, { headers: { ...(apiKey ? { "X-API-Key": apiKey } : {}) } });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const dispo = res.headers.get("content-disposition") || "product_prices.csv";
      const filename = dispo.includes("filename=") ? dispo.split("filename=")[1].replace(/"/g, "") : `product_${id}_prices.csv`;
      downloadBlob(blob, filename);
    } catch (e: any) {
      message.error(e.message || "导出失败");
    }
  };

  return (
    <List title="商品列表" headerButtons={<><CreateButton />{canExport?.can && <Button style={{ marginLeft: 8 }} onClick={onExport}>批量导出</Button>}</>}> 
      <Form form={form} layout="inline" onFinish={onSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="name" label="名称"><Input allowClear placeholder="搜索名称" /></Form.Item>
        <Form.Item name="url" label="链接"><Input allowClear placeholder="搜索链接" /></Form.Item>
        <Form.Item name="category" label="类别"><Input allowClear placeholder="分类" /></Form.Item>
        <Form.Item><Button htmlType="submit" type="primary">搜索</Button></Form.Item>
      </Form>
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
                <EditButton size="small" recordItemId={record.id} disabled={!canEdit?.can} />
                <DeleteButton size="small" recordItemId={record.id} resource="products" disabled={!canDelete?.can} />
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};

export default ProductsPage;
  const [form] = Form.useForm();
  const onSearch = (values: any) => {
    const filters: any[] = [];
    if (values.name) filters.push({ field: "name", operator: "contains", value: values.name });
    if (values.url) filters.push({ field: "url", operator: "contains", value: values.url });
    if (values.category) filters.push({ field: "category", operator: "eq", value: values.category });
    setFilters(filters, "replace");
  };
