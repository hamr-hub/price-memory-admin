import { Show } from "@refinedev/antd";
import { Descriptions, Table, Card, Space, InputNumber, Button, message, Tag, Select, DatePicker } from "antd";
import React from "react";
import { useShow, useList, useCreate, useCustom } from "@refinedev/core";
import { API_BASE } from "../api";
import TrendChart from "../components/TrendChart";
import { usingSupabase, sbUploadImage, sbGetPublicUrl } from "../supabaseApi";

const ProductsShow: React.FC = () => {
  const show: any = useShow({ resource: "products" });
  const record = show?.queryResult?.data?.data || {};
  const pricesQuery: any = useCustom({ url: record?.id ? `${API_BASE}/products/${record.id}/prices` : "", method: "get", queryOptions: { enabled: !!record?.id } });
  const [granularity, setGranularity] = React.useState<string>("daily");
  const [metric, setMetric] = React.useState<string>("close");
  const [range, setRange] = React.useState<any>(null);
  const [comparePrev, setComparePrev] = React.useState<boolean>(false);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(undefined);
  const qs: string[] = [];
  if (range?.[0] && range?.[1]) {
    qs.push(`start_date=${range[0].format("YYYY-MM-DD")}`);
    qs.push(`end_date=${range[1].format("YYYY-MM-DD")}`);
  }
  const trendQuery: any = useCustom({ url: record?.id ? `${API_BASE}/products/${record.id}/trend?granularity=${granularity}${qs.length ? `&${qs.join("&")}` : ""}` : "", method: "get", queryOptions: { enabled: !!record?.id, keepPreviousData: true } });
  let prevQs: string[] = [];
  if (range?.[0] && range?.[1] && comparePrev) {
    const days = range[1].diff(range[0], "days") + 1;
    const prevStart = range[0].clone().subtract(days, "days");
    const prevEnd = range[1].clone().subtract(days, "days");
    prevQs = [`start_date=${prevStart.format("YYYY-MM-DD")}`, `end_date=${prevEnd.format("YYYY-MM-DD")}`];
  }
  const prevTrendQuery: any = useCustom({ url: record?.id && comparePrev ? `${API_BASE}/products/${record.id}/trend?granularity=${granularity}${prevQs.length ? `&${prevQs.join("&")}` : ""}` : "", method: "get", queryOptions: { enabled: !!record?.id && !!comparePrev } });
  const alertsQuery: any = useList({ resource: "alerts", filters: [{ field: "product_id", operator: "eq", value: record?.id }] });
  const alerts = alertsQuery?.data?.data ?? [];
  const [threshold, setThreshold] = React.useState<number | undefined>(undefined);
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  const prices = pricesQuery?.data?.data || [];
  const trend = trendQuery?.data?.data?.series || [];
  const prevTrend = prevTrendQuery?.data?.data?.series || [];
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
        {usingSupabase && (
          <Descriptions.Item label="图片">
            <Space>
              <input type="file" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const path = await sbUploadImage(file, file.name);
                  const url = sbGetPublicUrl(path);
                  setImageUrl(url);
                  message.success("已上传图片");
                } catch (err: any) {
                  message.error(err.message || "上传失败");
                }
              }} />
              {imageUrl && <a href={imageUrl} target="_blank" rel="noreferrer">查看</a>}
            </Space>
          </Descriptions.Item>
        )}
      </Descriptions>
      <Card size="small" style={{ marginTop: 12 }} title="价格趋势">
        <Space style={{ marginBottom: 8 }}>
          <span>粒度</span>
          <Select value={granularity} onChange={setGranularity} options={[{ value: "daily", label: "按日" }, { value: "hourly", label: "按小时" }]} style={{ width: 120 }} />
          <span>指标</span>
          <Select value={metric} onChange={setMetric} options={[{ value: "close", label: "收盘" }, { value: "avg", label: "均价" }, { value: "open", label: "开盘" }]} style={{ width: 120 }} />
          <span>区间</span>
          <DatePicker.RangePicker value={range} onChange={setRange} />
          <Button onClick={() => setComparePrev((v) => !v)}>{comparePrev ? "取消对比" : "对比上一区间"}</Button>
        </Space>
        <TrendChart data={trend} metric={metric as any} overlayData={prevTrend} />
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
        loading={pricesQuery?.isLoading}
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
