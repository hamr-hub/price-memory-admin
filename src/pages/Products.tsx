import { List, useTable, CreateButton, ShowButton, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Button, Form, Input, InputNumber, DatePicker, message } from "antd";
import { useCan, useCustom, useSubscription } from "@refinedev/core";
import React from "react";
import { API_BASE, getApiKey } from "../api";
import { usingSupabase, sbExportPrices } from "../supabaseApi";
import { downloadBlob } from "../utils/download";

const ProductsPage: React.FC = () => {
  const { tableProps, setFilters, tableQueryResult } = useTable({ resource: "products", filters: { initial: [] } });
  const { data: canExport } = useCan({ resource: "products", action: "export" });
  const { data: canEdit } = useCan({ resource: "products", action: "edit" });
  const { data: canDelete } = useCan({ resource: "products", action: "delete" });
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<any[]>([]);
  const [exportIds, setExportIds] = React.useState<string | null>(null);
  const [exportRange, setExportRange] = React.useState<any[] | null>(null);
  const [exportXlsxIds, setExportXlsxIds] = React.useState<string | null>(null);
  const [form] = Form.useForm();
  const onSearch = (values: any) => {
    const filters: any[] = [];
    if (values.name) filters.push({ field: "name", operator: "contains", value: values.name });
    if (values.url) filters.push({ field: "url", operator: "contains", value: values.url });
    if (values.category) filters.push({ field: "category", operator: "eq", value: values.category });
    if (values.price_min) filters.push({ field: "price_min", operator: "gte", value: values.price_min });
    if (values.price_max) filters.push({ field: "price_max", operator: "lte", value: values.price_max });
    const range = values.updated_range as any[] | undefined;
    if (range && range[0]) filters.push({ field: "updated_from", operator: "gte", value: range[0].toDate() });
    if (range && range[1]) filters.push({ field: "updated_to", operator: "lte", value: range[1].toDate() });
    setFilters(filters, "replace");
  };
  useSubscription({ channel: "products", types: ["created","updated","deleted"], params: { resource: { name: "products" } } as any, callback: () => { tableQueryResult?.refetch?.(); } });
  const exportQuery: any = useCustom({
    url: exportIds ? `${API_BASE}/export/zip` : "",
    method: "get",
    meta: { responseType: "blob" },
    query: (() => {
      if (!exportIds) return undefined as any;
      const params: any = { product_ids: exportIds };
      const r = exportRange;
      if (r && r[0]) params.start_date = r[0].format("YYYY-MM-DD");
      if (r && r[1]) params.end_date = r[1].format("YYYY-MM-DD");
      return params;
    })(),
    queryOptions: { enabled: !!exportIds },
  });
  const exportXlsxQuery: any = useCustom({ url: exportXlsxIds ? `${API_BASE}/export.xlsx?product_ids=${exportXlsxIds}` : "", method: "get", meta: { responseType: "blob" }, queryOptions: { enabled: !!exportXlsxIds } });
  React.useEffect(() => {
    const blob: Blob | undefined = exportQuery?.data?.data;
    if (blob) {
      downloadBlob(blob, "products_export.zip");
      setExportIds(null);
    }
  }, [exportQuery?.data?.data]);
  React.useEffect(() => {
    const blob: Blob | undefined = exportXlsxQuery?.data?.data;
    if (blob) {
      downloadBlob(blob, "products_export.xlsx");
      setExportXlsxIds(null);
    }
  }, [exportXlsxQuery?.data?.data]);
  const onExport = async () => {
    if (!selectedRowKeys.length) return;
    if (usingSupabase) {
      try {
        const rows = await sbExportPrices(selectedRowKeys as any);
        const header = ["product_id","product_name","url","category","price_id","price","created_at"]; 
        const lines = [header.join(","), ...rows.map((r: any) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))];
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, "products_export.csv");
      } catch (e: any) {
        message.error(e.message || "导出失败");
      }
    } else {
      setExportIds(selectedRowKeys.join(","));
    }
  };

  const onExportXlsx = async () => {
    if (!selectedRowKeys.length) return;
    setExportXlsxIds(selectedRowKeys.join(","));
  };

  const exportSingle = async (id: number) => {
    try {
      if (usingSupabase) {
        const header = ["product_id","product_name","url","category","price_id","price","created_at"]; 
        const lines: string[] = [header.join(",")];
        const r = exportRange;
        const sd = r && r[0] ? r[0].format("YYYY-MM-DD") : undefined;
        const ed = r && r[1] ? r[1].format("YYYY-MM-DD") : undefined;
        const prices = await (await import("../supabaseApi")).sbGetProductPrices(id, sd, ed);
        const src: any[] = (tableProps?.dataSource as any[]) || [];
        const p = src.find((x) => x.id === id) || {};
        for (const row of prices) {
          const out = { product_id: id, product_name: p.name, url: p.url, category: p.category, price_id: row.id, price: row.price, created_at: row.created_at } as any;
          lines.push(header.map((h) => JSON.stringify(out[h] ?? "")).join(","));
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        downloadBlob(blob, `product_${id}_prices.csv`);
      } else {
        const apiKey = getApiKey();
        const r = exportRange;
        const sd = r && r[0] ? r[0].format("YYYY-MM-DD") : undefined;
        const ed = r && r[1] ? r[1].format("YYYY-MM-DD") : undefined;
        const params = new URLSearchParams();
        if (sd) params.set("start_date", sd);
        if (ed) params.set("end_date", ed);
        const url = `${API_BASE}/products/${id}/export${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { headers: { ...(apiKey ? { "X-API-Key": apiKey } : {}) } });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const dispo = res.headers.get("content-disposition") || "product_prices.csv";
        const filename = dispo.includes("filename=") ? dispo.split("filename=")[1].replace(/"/g, "") : `product_${id}_prices.csv`;
        downloadBlob(blob, filename);
      }
    } catch (e: any) {
      message.error(e.message || "导出失败");
    }
  };

  return (
    <List title="商品列表" headerButtons={<><CreateButton />{canExport?.can && <><DatePicker.RangePicker style={{ marginLeft: 8 }} onChange={(v) => setExportRange(v as any)} /><Button style={{ marginLeft: 8 }} onClick={onExport}>ZIP批量打包</Button><Button style={{ marginLeft: 8 }} onClick={onExportXlsx}>导出Excel</Button></>}</>}> 
      <Form form={form} layout="inline" onFinish={onSearch} style={{ marginBottom: 16 }}>
        <Form.Item name="name" label="名称"><Input allowClear placeholder="搜索名称" /></Form.Item>
        <Form.Item name="url" label="链接"><Input allowClear placeholder="搜索链接" /></Form.Item>
        <Form.Item name="category" label="类别"><Input allowClear placeholder="分类" /></Form.Item>
        <Form.Item name="price_min" label="最低价"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
        <Form.Item name="price_max" label="最高价"><InputNumber min={0} style={{ width: 120 }} /></Form.Item>
        <Form.Item name="updated_range" label="更新时间"><DatePicker.RangePicker showTime /></Form.Item>
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
