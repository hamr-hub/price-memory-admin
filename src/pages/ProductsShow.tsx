import { Show } from "@refinedev/antd";
import { Descriptions, Table, Card } from "antd";
import React from "react";
import { useShow } from "@refinedev/core";
import { API_BASE } from "../api";
import TrendChart from "../components/TrendChart";

const ProductsShow: React.FC = () => {
  const show: any = useShow({ resource: "products" });
  const record = show?.queryResult?.data?.data || {};
  const [prices, setPrices] = React.useState<any[]>([]);
  const [trend, setTrend] = React.useState<any[]>([]);
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
    }
  }, [record?.id]);
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
