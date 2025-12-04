import React from "react";
import { List } from "@refinedev/antd";
import { Table, Space, Button, Tag } from "antd";
import { usingSupabase, sbListRuntimeNodes, sbSubscribeRuntimeNodes, sbCreateNodeCommand } from "../supabaseApi";

const NodesPage: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    let unsub: any;
    const run = async () => {
      const list = usingSupabase ? await sbListRuntimeNodes() : [];
      setItems(list);
      if (usingSupabase) {
        unsub = sbSubscribeRuntimeNodes((payload: any) => {
          const row: any = payload?.new || payload?.record || payload;
          setItems((prev) => {
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
    return () => { if (unsub) unsub(); };
  }, []);

  const sorted = React.useMemo(() => {
    const score = (n: any) => {
      const st = n.status === "online" ? 0 : n.status === "paused" ? 1 : 2;
      const rg = String(n.region).toLowerCase() === "local" ? 0 : 1;
      const lat = typeof n.latency_ms === "number" ? n.latency_ms : 999999;
      return [st, rg, lat];
    };
    return items.slice().sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      for (let i = 0; i < sa.length; i++) {
        if (sa[i] !== sb[i]) return sa[i] - sb[i];
      }
      return 0;
    });
  }, [items]);

  const send = async (record: any, command: string) => {
    if (!usingSupabase) return;
    await sbCreateNodeCommand(record.id, command);
  };

  return (
    <List title="运行时节点">
      <Table
        rowKey="id"
        dataSource={sorted}
        pagination={false}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "主机", dataIndex: "host" },
          { title: "区域", dataIndex: "region" },
          { title: "版本", dataIndex: "version" },
          { title: "状态", dataIndex: "status", render: (v: string) => <Tag color={v === "online" ? "green" : v === "paused" ? "orange" : "red"}>{v}</Tag> },
          { title: "延迟(ms)", dataIndex: "latency_ms" },
          { title: "执行中", dataIndex: "current_tasks" },
          { title: "队列", dataIndex: "queue_size" },
          { title: "累计完成", dataIndex: "total_completed" },
          { title: "最后心跳", dataIndex: "last_seen" },
          {
            title: "操作",
            dataIndex: "actions",
            render: (_: any, record: any) => (
              <Space>
                <Button size="small" onClick={() => send(record, "pause")}>暂停</Button>
                <Button size="small" onClick={() => send(record, "resume")}>恢复</Button>
                <Button size="small" onClick={() => send(record, "ping")}>测延迟</Button>
              </Space>
            ),
          },
        ]}
      />
    </List>
  );
};

export default NodesPage;
