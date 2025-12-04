import { useEffect, useMemo, useState } from "react";
import { List, Button, Space, Segmented, message, Typography, Tag } from "antd";
import { useGetIdentity, useCan, useSubscription, useTable } from "@refinedev/core";
import { dataProvider } from "../dataProvider";

type User = { id: number; username: string; display_name?: string | null };
type Push = { id: number; sender_id: number; recipient_id: number; product_id: number; message?: string | null; status: string; created_at?: string; updated_at?: string };

export default function PushesPage() {
  const { data: identity } = useGetIdentity<User>();
  const [box, setBox] = useState<"inbox" | "outbox">("inbox");
  const [status, setStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const { tableProps, setFilters, tableQueryResult, refetch } = useTable<Push>({ resource: "pushes", filters: [
    { field: "user_id", operator: "eq", value: identity?.id },
    { field: "box", operator: "eq", value: box },
    { field: "status", operator: "eq", value: status === "all" ? undefined : status },
  ], pagination: { pageSize: 10 } });
  const items = (tableProps as any)?.dataSource || [];
  const loading = tableQueryResult?.isLoading;

  const userLabel = useMemo(() => (u: User) => u.display_name || u.username, []);

  useEffect(() => { /* 身份由 refine 管理 */ }, []);

  useEffect(() => {
    setFilters([
      { field: "user_id", operator: "eq", value: identity?.id },
      { field: "box", operator: "eq", value: box },
      { field: "status", operator: "eq", value: status === "all" ? undefined : status },
    ], "replace");
  }, [box, status, identity?.id, setFilters]);

  useSubscription({ channel: "pushes", types: ["created","updated","deleted"], params: { resource: { name: "pushes" } } as any, callback: () => { refetch(); } });

  

  const accept = async (p: Push) => {
    try {
      await dataProvider.custom({ resource: "pushes", method: "post", meta: { path: `/${p.id}/status` }, payload: { status: "accepted" } });
      if (identity?.id) await dataProvider.custom({ resource: "users", method: "post", meta: { path: `/${identity.id}/follows` }, payload: { product_id: p.product_id } });
      message.success("已接受并关注");
      refetch();
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const reject = async (p: Push) => {
    try {
      await dataProvider.custom({ resource: "pushes", method: "post", meta: { path: `/${p.id}/status` }, payload: { status: "rejected" } });
      message.success("已拒绝");
      refetch();
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const canUpdate = (item: Push) => {
    const { data: can } = useCan({ resource: "pushes", action: "update", params: { box, itemRecipientId: item.recipient_id } });
    return can?.can;
  };
  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>推送中心</Typography.Title>
        <Segmented options={[{ label: "收件箱", value: "inbox" }, { label: "发件箱", value: "outbox" }]} value={box} onChange={(v) => setBox(v as any)} />
      </Space>
      <Space style={{ marginBottom: 12 }}>
        <Segmented options={[{ label: "全部", value: "all" }, { label: "待处理", value: "pending" }, { label: "已接受", value: "accepted" }, { label: "已拒绝", value: "rejected" }]} value={status} onChange={(v) => setStatus(v as any)} />
      </Space>
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>当前用户：</Typography.Text>
        <Tag color="blue">{identity ? userLabel(identity as any) : "加载中"}</Tag>
      </Space>
      <List
        loading={loading}
        dataSource={items}
        pagination={tableProps.pagination}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.status === "pending" && box === "inbox" && canUpdate(item) ? (
                <Space key="actions">
                  <Button type="primary" onClick={() => accept(item)}>接受</Button>
                  <Button danger onClick={() => reject(item)}>拒绝</Button>
                </Space>
              ) : (
                <Tag key="status" color={item.status === "accepted" ? "green" : item.status === "rejected" ? "red" : "blue"}>{item.status}</Tag>
              ),
            ]}
          >
            <List.Item.Meta
              title={<Space>
                <Typography.Text>商品 #{item.product_id}</Typography.Text>
                {item.message && <Tag>{item.message}</Tag>}
              </Space>}
              description={
                box === "inbox" ? (
                  <Typography.Text type="secondary">来自用户 #{item.sender_id}</Typography.Text>
                ) : (
                  <Typography.Text type="secondary">发送给用户 #{item.recipient_id}</Typography.Text>
                )
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
