import { Show } from "@refinedev/antd";
import { Descriptions, Table, Card, Space, InputNumber, Button, message, Tag, Select, DatePicker } from "antd";
import React from "react";
import { useShow, useList, useCreate, useCustom } from "@refinedev/core";
import { API_BASE } from "../api";
import TrendChart from "../components/TrendChart";
import { usingSupabase, sbUploadImage, sbGetPublicUrl, sbGetProductStats, sbGetProductPrices, sbGetTrendDailyOHLC, sbGetTrendHourlyOHLC } from "../supabaseApi";

const ProductsShow: React.FC = () => {
  const show: any = useShow({ resource: "products" });
  const record = show?.queryResult?.data?.data || {};
  const pricesQuery: any = useCustom({ url: record?.id && !usingSupabase ? `${API_BASE}/products/${record.id}/prices` : "", method: "get", queryOptions: { enabled: !!record?.id && !usingSupabase } });
  const [granularity, setGranularity] = React.useState<string>("daily");
  const [metric, setMetric] = React.useState<string>("close");
  const [range, setRange] = React.useState<any>(null);
  const [comparePrev, setComparePrev] = React.useState<boolean>(false);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(undefined);
  const [stats, setStats] = React.useState<{ min_price: number | null; max_price: number | null; avg_price: number | null; count: number } | null>(null);
  React.useEffect(() => {
    const loadStats = async () => {
      const id = record?.id;
      if (!id || !usingSupabase) return;
      try {
        const s = await sbGetProductStats(id);
        setStats(s);
      } catch {}
    };
    loadStats();
  }, [record?.id]);
  const qs: string[] = [];
  if (range?.[0] && range?.[1]) {
    qs.push(`start_date=${range[0].format("YYYY-MM-DD")}`);
    qs.push(`end_date=${range[1].format("YYYY-MM-DD")}`);
  }
  const trendQuery: any = useCustom({ url: record?.id && !usingSupabase ? `${API_BASE}/products/${record.id}/trend?granularity=${granularity}${qs.length ? `&${qs.join("&")}` : ""}` : "", method: "get", queryOptions: { enabled: !!record?.id && !usingSupabase, keepPreviousData: true } });
  let prevQs: string[] = [];
  if (range?.[0] && range?.[1] && comparePrev) {
    const days = range[1].diff(range[0], "days") + 1;
    const prevStart = range[0].clone().subtract(days, "days");
    const prevEnd = range[1].clone().subtract(days, "days");
    prevQs = [`start_date=${prevStart.format("YYYY-MM-DD")}`, `end_date=${prevEnd.format("YYYY-MM-DD")}`];
  }
  const prevTrendQuery: any = useCustom({ url: record?.id && comparePrev && !usingSupabase ? `${API_BASE}/products/${record.id}/trend?granularity=${granularity}${prevQs.length ? `&${prevQs.join("&")}` : ""}` : "", method: "get", queryOptions: { enabled: !!record?.id && !!comparePrev && !usingSupabase } });
  const alertsQuery: any = useList({ resource: "alerts", filters: [{ field: "product_id", operator: "eq", value: record?.id }] });
  const alerts = alertsList?.data ?? [];
  const [threshold, setThreshold] = React.useState<number | undefined>(undefined);
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);
  const [prices, setPrices] = React.useState<any[]>([]);
  const [trend, setTrend] = React.useState<any[]>([]);
  const [prevTrend, setPrevTrend] = React.useState<any[]>([]);
  React.useEffect(() => {
    const load = async () => {
      const id = record?.id;
      if (!id || !usingSupabase) return;
      const start = range?.[0]?.format("YYYY-MM-DD");
      const end = range?.[1]?.format("YYYY-MM-DD");
      try {
        const p = await sbGetProductPrices(id, start, end);
        setPrices(p);
        if (granularity === "daily") {
          const t = await sbGetTrendDailyOHLC(id, start || end || new Date().toISOString().slice(0,10), end || start || new Date().toISOString().slice(0,10));
          setTrend(t);
          if (comparePrev && start && end) {
            const days = range[1].diff(range[0], "days") + 1;
            const prevStart = range[0].clone().subtract(days, "days").format("YYYY-MM-DD");
            const prevEnd = range[1].clone().subtract(days, "days").format("YYYY-MM-DD");
            const pt = await sbGetTrendDailyOHLC(id, prevStart, prevEnd);
            setPrevTrend(pt);
          } else {
            setPrevTrend([]);
          }
        } else {
          const t = await sbGetTrendHourlyOHLC(id, `${start || end || new Date().toISOString().slice(0,10)} 00:00:00`, `${end || start || new Date().toISOString().slice(0,10)} 23:59:59`);
          setTrend(t);
          setPrevTrend([]);
        }
      } catch {}
    };
    load();
  }, [record?.id, usingSupabase, granularity, range, comparePrev]);
  const apiPrices = pricesQuery?.data?.data || [];
  const apiTrend = trendQuery?.data?.data?.series || [];
  const apiPrevTrend = prevTrendQuery?.data?.data?.series || [];
  const [selectedAlert, setSelectedAlert] = React.useState<any | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [channel, setChannel] = React.useState<string>("inapp");
  const [target, setTarget] = React.useState<string>("");
  const [cooldown, setCooldown] = React.useState<number>(60);
  React.useEffect(() => {
    const a = selectedAlert;
    if (!a) return;
    setChannel(a.channel || "inapp");
    setCooldown(a.cooldown_minutes ?? 60);
    setTarget(a.target || "");
    fetch(`${API_BASE}/alerts/${a.id}/events`).then(async (r) => {
      const j = await r.json();
      setEvents(j?.data || []);
    }).catch(() => setEvents([]));
  }, [selectedAlert?.id]);
  const onSaveAlert = async () => {
    if (!selectedAlert) return;
    try {
      await fetch(`${API_BASE}/alerts/${selectedAlert.id}/update${`?channel=${channel}&cooldown_minutes=${cooldown}`}` , { method: "POST" });
      if (target) await fetch(`${API_BASE}/alerts/${selectedAlert.id}/target?target=${encodeURIComponent(target)}`, { method: "POST" });
      message.success("已保存配置");
    } catch (e: any) {
      message.error(e.message || "保存失败");
    }
  };
  const onToggleAlert = async (a: any) => {
    try {
      const to = a.status === "active" ? "paused" : "active";
      const res = await fetch(`${API_BASE}/alerts/${a.id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }) });
      const j = await res.json();
      if (j.success) message.success("已更新状态"); else message.error(j.error?.message || "更新失败");
    } catch (e: any) { message.error(e.message || "更新失败"); }
  };
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
        <Descriptions.Item label="统计">最小:{(stats?.min_price ?? record.stats?.min_price) as any} 最大:{(stats?.max_price ?? record.stats?.max_price) as any} 平均:{(stats?.avg_price ?? record.stats?.avg_price) as any}</Descriptions.Item>
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
            { title: "操作", render: (_: any, a: any) => <Space><Button size="small" onClick={() => setSelectedAlert(a)}>查看</Button><Button size="small" onClick={() => onToggleAlert(a)}>{a.status === "active" ? "停用" : "启用"}</Button></Space> },
          ]}
        />
        {selectedAlert && (
          <div style={{ marginTop: 8 }}>
            <Space style={{ marginBottom: 8 }}>
              <span>通道</span>
              <Select value={channel} onChange={setChannel as any} options={[{ value: "inapp", label: "站内" }, { value: "email", label: "邮件" }, { value: "webhook", label: "Webhook" }]} style={{ width: 120 }} />
              <span>目标</span>
              <InputNumber value={undefined} style={{ display: "none" }} />
              <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder={channel === "email" ? "邮箱地址" : channel === "webhook" ? "Webhook URL" : "可留空"} style={{ width: 260, padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
              <span>静默(分钟)</span>
              <InputNumber value={cooldown} onChange={(v) => setCooldown(Number(v))} min={0} />
              <Button onClick={onSaveAlert} type="primary">保存</Button>
            </Space>
            <Table size="small" rowKey="id" dataSource={events} pagination={{ pageSize: 5 }} columns={[{ title: "时间", dataIndex: "created_at" }, { title: "价格", dataIndex: "price" }, { title: "通道", dataIndex: "channel" }, { title: "状态", dataIndex: "status" }, { title: "错误", dataIndex: "error" }]} />
          </div>
        )}
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
