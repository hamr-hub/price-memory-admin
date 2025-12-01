import { Show } from "@refinedev/antd";
import { Descriptions, Table, Card, Space, InputNumber, Button, message, Tag } from "antd";
import React from "react";
import { useShow } from "@refinedev/core";
import { API_BASE } from "../api";
import TrendChart from "../components/TrendChart";

const ProductsShow: React.FC = () => {
  const show: any = useShow({ resource: "products" });
  const record = show?.queryResult?.data?.data || {};
  const [prices, setPrices] = React.useState<any[]>([]);
  const [trend, setTrend] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [threshold, setThreshold] = React.useState<number | undefined>(undefined);
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  React.useEffect(() => {
    if (record?.id) {
      fetch(`${API_BASE}/products/${record.id}/prices`).then(async (r) => {
        const j = await r.json();
        setPrices(j?.data || []);
      });
      fetch(`${API_BASE}/products/${record.id}/trend`).then(async (r) => {
        const j = await r.json();
        setTrend(j?.data?.series || []);
      });
      if (user?.id) {
        fetch(`${API_BASE}/alerts?user_id=${user.id}&product_id=${record.id}`).then(async (r) => {
          const j = await r.json();
          setAlerts(j?.data || []);
        });
      }
    }
  }, [record?.id]);
  const onCreateAlert = async () => {
    if (!user?.id || !record?.id) return;
    try {
      const res = await fetch(`${API_BASE}/alerts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.id, product_id: record.id, rule_type: "price_lte", threshold }) });
      const j = await res.json();
      if (j.success) {
        message.success("创建成功");
        setAlerts((prev) => [j.data, ...prev]);
        setThreshold(undefined);
      } else {
        message.error(j.error?.message || "创建失败");
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
