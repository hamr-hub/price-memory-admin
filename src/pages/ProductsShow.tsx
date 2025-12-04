import { Show } from "@refinedev/antd";
import { Descriptions, Table, Card, Space, InputNumber, Button, message, Tag } from "antd";
import React from "react";
import { useShow, useList, useCreate, useCustom } from "@refinedev/core";
import { API_BASE } from "../api";
import TrendChart from "../components/TrendChart";

const ProductsShow: React.FC = () => {
  const show: any = useShow({ resource: "products" });
  const record = show?.queryResult?.data?.data || {};
  const [prices, setPrices] = React.useState<any[]>([]);
  const [trend, setTrend] = React.useState<any[]>([]);
  const { data: alertsList } = useList({ resource: "alerts", filters: [{ field: "product_id", operator: "eq", value: record?.id }] });
  const alerts = alertsList?.data ?? [];
  const [threshold, setThreshold] = React.useState<number | undefined>(undefined);
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  React.useEffect(() => {
    if (record?.id) {
      (async () => {
        const p = await fetch(`${API_BASE}/products/${record.id}/prices`).then(r => r.json());
        setPrices(p?.data || []);
        const t = await fetch(`${API_BASE}/products/${record.id}/trend`).then(r => r.json());
        setTrend(t?.data?.series || []);
      })();
    }
  }, [record?.id]);
  const { mutateAsync: createAlert } = useCreate();
  const onCreateAlert = async () => {
    if (!user?.id || !record?.id || threshold === undefined) return;
    try {
      const res: any = await createAlert({ resource: "alerts", values: { user_id: user.id, product_id: record.id, rule_type: "price_lte", threshold } });
      if (res?.data) {
        message.success("创建成功");
        setThreshold(undefined);
      } else {
        message.error("创建失败");
      }
    } catch (e: any) {
      message.error(e.message || "创建失败");
    }
  };
  return (
    <Show title="商品详情">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="名称">{record.name}</Descriptions.Item>
        <Descriptions.Item label="链接">{record.url}</Descriptions.Item>
        <Descriptions.Item label="类别">{record.category}</Descriptions.Item>
        <Descriptions.Item label="统计">最小:{record.stats?.min_price} 最大:{record.stats?.max_price} 平均:{record.stats?.avg_price}</Descriptions.Item>
      </Descriptions>
      <Card size="small" style={{ marginTop: 12 }} title="价格趋势">
        <TrendChart data={trend} />
      </Card>
      <Card size="small" style={{ marginTop: 12 }} title="价格告警">
        <Space style={{ marginBottom: 8 }}>
          <span>当价格≤</span>
          <InputNumber value={threshold} onChange={(v) => setThreshold(v as number)} min={0} />
          <Button type="primary" onClick={onCreateAlert} disabled={!user?.id || !record?.id || threshold === undefined}>创建告警</Button>
        </Space>
        <Table
          size="small"
          rowKey="id"
          dataSource={alerts}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "规则", dataIndex: "rule_type" },
            { title: "阈值", dataIndex: "threshold" },
            { title: "状态", dataIndex: "status", render: (v: string) => <Tag color={v === "active" ? "green" : "orange"}>{v}</Tag> },
            { title: "创建时间", dataIndex: "created_at" },
          ]}
        />
      </Card>
      <Table
        size="small"
        style={{ marginTop: 12 }}
        rowKey="id"
        dataSource={prices}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: "价格ID", dataIndex: "id" },
          { title: "价格", dataIndex: "price" },
          { title: "时间", dataIndex: "created_at" },
        ]}
      />
    </Show>
  );
};

export default ProductsShow;
