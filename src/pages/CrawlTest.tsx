import React from "react";
import { List } from "@refinedev/antd";
import { Form, Input, Select, Button, Space, Table, Tag, Typography, Card, InputNumber } from "antd";
import { usingSupabase, sbListRuntimeNodes, sbSubscribeRuntimeNodes, sbCreateTestCrawl, sbSubscribeCrawlLogs, sbCreateTestSteps, sbCreateCodegen } from "../supabaseApi";

const { Paragraph } = Typography;

const CrawlTestPage: React.FC = () => {
  const [nodes, setNodes] = React.useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = React.useState(false);
  const [form] = Form.useForm();
  const [jobId, setJobId] = React.useState<string | undefined>();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [sub, setSub] = React.useState<(() => void) | null>(null);
  const [mode, setMode] = React.useState<string>("server");

  React.useEffect(() => {
    let unsub: any;
    const run = async () => {
      setLoadingNodes(true);
      const list = usingSupabase ? await sbListRuntimeNodes() : [];
      setNodes(list);
      setLoadingNodes(false);
      if (usingSupabase) {
        unsub = sbSubscribeRuntimeNodes((payload: any) => {
          const row: any = payload?.new || payload?.record || payload;
          setNodes((prev) => {
            const idx = prev.findIndex((x) => x.id === row.id);
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = { ...next[idx], ...row };
              return next;
            }
            return [row, ...prev];
          });
        });
      }
    };
    run();
    return () => { if (unsub) unsub(); if (sub) sub(); };
  }, []);

  const startTest = async () => {
    if (!usingSupabase) return;
    const values = await form.getFieldsValue();
    let nodeId = values.nodeId;
    if (!nodeId) {
      if (mode === "client") {
        const local = nodes.find((n) => String(n.region).toLowerCase() === "local");
        if (local) {
          nodeId = local.id;
          form.setFieldsValue({ nodeId });
        }
      }
    }
    await form.validateFields();
    const url = values.url;
    const { jobId } = await sbCreateTestCrawl(nodeId, url, { timeout_ms: values.timeout_ms, retries: values.retries });
    setJobId(jobId);
    setLogs([]);
    if (sub) { sub(); setSub(null); }
    const unsubscribe = sbSubscribeCrawlLogs(jobId, (row: any) => {
      setLogs((prev) => [...prev, row]);
    });
    setSub(() => unsubscribe);
  };

  const runSteps = async () => {
    if (!usingSupabase) return;
    const values = await form.validateFields();
    const nodeId = values.nodeId;
    const url = values.url;
    let steps: any[] = [];
    try { steps = JSON.parse(String(values.steps || "[]")); } catch { steps = []; }
    const timeout_ms = values.timeout_ms;
    const retries = values.retries;
    const { jobId } = await sbCreateTestSteps(nodeId, url, steps, { timeout_ms, retries });
    setJobId(jobId);
    setLogs([]);
    if (sub) { sub(); setSub(null); }
    const unsubscribe = sbSubscribeCrawlLogs(jobId, (row: any) => {
      setLogs((prev) => [...prev, row]);
    });
    setSub(() => unsubscribe);
  };

  const runCodegen = async () => {
    if (!usingSupabase) return;
    const values = await form.validateFields();
    const nodeId = values.nodeId;
    const url = values.url;
    const target = values.codegen_target || "python";
    const duration_sec = values.codegen_duration || 10;
    const { jobId } = await sbCreateCodegen(nodeId, url, { target, duration_sec });
    setJobId(jobId);
    setLogs([]);
    if (sub) { sub(); setSub(null); }
    const unsubscribe = sbSubscribeCrawlLogs(jobId, (row: any) => {
      setLogs((prev) => [...prev, row]);
    });
    setSub(() => unsubscribe);
  };

  const resultLog = React.useMemo(() => logs.find((x) => x.level === "result"), [logs]);
  const parsedResult = React.useMemo(() => {
    try { return resultLog ? JSON.parse(String(resultLog.message || "{}")) : null; } catch { return null; }
  }, [resultLog]);
  const artifacts = React.useMemo(() => {
    const items = logs.filter((x) => x.level === "artifact");
    return items.map((x) => {
      try { const j = JSON.parse(String(x.message || "{}")); return { ...j, created_at: x.created_at }; } catch { return { type: "unknown", url: String(x.message || ""), created_at: x.created_at }; }
    });
  }, [logs]);

  return (
    <List title="爬虫测试">
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" initialValues={{ url: "https://example.com", mode: "server", timeout_ms: 30000, retries: 0 }}>
          <Form.Item name="url" label="目标URL" rules={[{ required: true, message: "请输入URL" }]}> 
            <Input style={{ width: 360 }} placeholder="https://..." />
          </Form.Item>
          <Form.Item name="mode" label="模式">
            <Select style={{ width: 160 }} onChange={(v) => {
              setMode(v);
              if (v === "client") {
                const local = nodes.find((n) => String(n.region).toLowerCase() === "local");
                if (local) form.setFieldsValue({ nodeId: local.id });
              }
            }}>
              <Select.Option value="server">服务节点</Select.Option>
              <Select.Option value="client">客户端优先</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="nodeId" label="节点" rules={[{ required: true, message: "请选择节点" }]}> 
            <Select style={{ width: 220 }} loading={loadingNodes} placeholder="选择节点">
              {nodes.map((n) => (
                <Select.Option key={n.id} value={n.id}>
                  {n.name} ({n.region}) - {n.status}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="timeout_ms" label="超时(ms)">
            <InputNumber style={{ width: 140 }} min={1000} step={1000} />
          </Form.Item>
          <Form.Item name="retries" label="重试次数">
            <InputNumber style={{ width: 120 }} min={0} max={5} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={startTest} disabled={!usingSupabase}>开始测试</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={runSteps} disabled={!usingSupabase}>执行步骤</Button>
          </Form.Item>
          <Form.Item name="codegen_target" label="codegen 目标">
            <Select style={{ width: 160 }}>
              <Select.Option value="python">python</Select.Option>
              <Select.Option value="javascript">javascript</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="codegen_duration" label="录制秒数">
            <InputNumber style={{ width: 140 }} min={5} max={60} />
          </Form.Item>
          <Form.Item>
            <Button onClick={runCodegen} disabled={!usingSupabase}>Codegen 录制</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="步骤 JSON（可选）" style={{ marginBottom: 16 }}>
        <Paragraph type="secondary">示例：[{`{ action: "wait_for_selector", selector: "#q" }`}, {`{ action: "fill", selector: "#q", value: "手机" }`}, {`{ action: "click", selector: "#search" }`}, {`{ action: "evaluate_text", selector: "#price" }`}]</Paragraph>
        <Form form={form} layout="vertical">
          <Form.Item name="steps">
            <Input.TextArea rows={6} placeholder="填写可执行步骤的 JSON 数组" />
          </Form.Item>
        </Form>
      </Card>

      {jobId && (
        <Card title={`任务日志 (${jobId})`}>
          <Table
            rowKey={(r) => r.id || `${r.created_at}_${Math.random()}`}
            dataSource={logs}
            pagination={false}
            size="small"
            columns={[
              { title: "时间", dataIndex: "created_at" },
              { title: "级别", dataIndex: "level", render: (v: string) => <Tag color={v === "error" ? "red" : v === "warn" ? "orange" : v === "result" ? "blue" : "green"}>{v}</Tag> },
              { title: "消息", dataIndex: "message", render: (v: string) => <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2, expandable: true }}>{String(v)}</Paragraph> },
            ]}
          />
        </Card>
      )}

      {parsedResult && (
        <Card title="解析结果" style={{ marginTop: 16 }}>
          <Space>
            <Tag color="blue">价格</Tag>
            <strong>{parsedResult.price}</strong>
            <Tag>来源</Tag>
            <span>{parsedResult.url}</span>
          </Space>
          {!!parsedResult.outputs && Array.isArray(parsedResult.outputs) && parsedResult.outputs.length > 0 && (
            <Table
              style={{ marginTop: 12 }}
              rowKey={(r) => (r.selector || r.type || "") + (r.index || "")}
              dataSource={parsedResult.outputs}
              pagination={false}
              size="small"
              columns={[
                { title: "类型", dataIndex: "type" },
                { title: "选择器", dataIndex: "selector" },
                { title: "值", dataIndex: "value" },
                { title: "截图", dataIndex: "url", render: (u: string) => u ? <a href={u} target="_blank" rel="noreferrer">查看</a> : null },
              ]}
            />
          )}
        </Card>
      )}

      {!!artifacts.length && (
        <Card title="回放工件" style={{ marginTop: 16 }}>
          <Table
            rowKey={(r) => r.created_at + r.type}
            dataSource={artifacts}
            pagination={false}
            size="small"
            columns={[
              { title: "时间", dataIndex: "created_at" },
              { title: "类型", dataIndex: "type", render: (v: string) => <Tag>{v}</Tag> },
              { title: "标题", dataIndex: "title" },
              { title: "时长(ms)", dataIndex: "duration_ms" },
              { title: "链接", dataIndex: "url", render: (u: string, r: any) => (
                <Space>
                  <a href={u} target="_blank" rel="noreferrer">下载</a>
                  {r.type === "trace" && (
                    <a href={`https://trace.playwright.dev/?trace=${encodeURIComponent(u)}`} target="_blank" rel="noreferrer">在线回放</a>
                  )}
                </Space>
              )},
            ]}
          />
        </Card>
      )}
    </List>
  );
};

export default CrawlTestPage;
