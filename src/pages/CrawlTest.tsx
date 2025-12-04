import React from "react";
import { List } from "@refinedev/antd";
import { Form, Input, Select, Button, Space, Table, Tag, Typography, Card } from "antd";
import { usingSupabase, sbListRuntimeNodes, sbSubscribeRuntimeNodes, sbCreateTestCrawl, sbSubscribeCrawlLogs } from "../supabaseApi";

const { Paragraph } = Typography;

const CrawlTestPage: React.FC = () => {
  const [nodes, setNodes] = React.useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = React.useState(false);
  const [form] = Form.useForm();
  const [jobId, setJobId] = React.useState<string | undefined>();
  const [logs, setLogs] = React.useState<any[]>([]);
  const [sub, setSub] = React.useState<(() => void) | null>(null);

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
    const values = await form.validateFields();
    const nodeId = values.nodeId;
    const url = values.url;
    const { jobId } = await sbCreateTestCrawl(nodeId, url);
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
        <Form form={form} layout="inline" initialValues={{ url: "https://example.com" }}>
          <Form.Item name="url" label="目标URL" rules={[{ required: true, message: "请输入URL" }]}> 
            <Input style={{ width: 360 }} placeholder="https://..." />
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
          <Form.Item>
            <Button type="primary" onClick={startTest} disabled={!usingSupabase}>开始测试</Button>
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
