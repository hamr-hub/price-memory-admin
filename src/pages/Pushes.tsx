import { useEffect, useMemo, useState } from "react";
import { List, Button, Space, Segmented, message, Typography, Tag, Input, DatePicker, Select, InputNumber } from "antd";
import { useGetIdentity, useCan, useSubscription, useTable } from "@refinedev/core";
import { dataProvider } from "../dataProvider";

type User = { id: number; username: string; display_name?: string | null };
type Push = { id: number; sender_id: number; recipient_id: number; product_id: number; message?: string | null; status: string; created_at?: string; updated_at?: string };

export default function PushesPage() {
  const { data: identity } = useGetIdentity<User>();
  const [box, setBox] = useState<"inbox" | "outbox">("inbox");
  const [status, setStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [search, setSearch] = useState<string>("");
  const [range, setRange] = useState<any>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [senderId, setSenderId] = useState<number | undefined>(undefined);
  const [recipientId, setRecipientId] = useState<number | undefined>(undefined);
  const { tableProps, setFilters, setSorters, tableQueryResult, refetch } = useTable<Push>({ resource: "pushes", filters: [
    { field: "user_id", operator: "eq", value: identity?.id },
    { field: "box", operator: "eq", value: box },
    { field: "status", operator: "eq", value: status === "all" ? undefined : status },
    { field: "message", operator: "contains", value: search || undefined },
    { field: "created_from", operator: "eq", value: range?.[0] ? range[0].toISOString() : undefined },
    { field: "created_to", operator: "eq", value: range?.[1] ? range[1].toISOString() : undefined },
    { field: "sender_id", operator: "eq", value: senderId },
    { field: "recipient_id", operator: "eq", value: recipientId },
  ], sorters: [{ field: sortField, order: sortOrder }], pagination: { pageSize: 10 } });
  const items = (tableProps as any)?.dataSource || [];
  const loading = tableQueryResult?.isLoading;

  const userLabel = useMemo(() => (u: User) => u.display_name || u.username, []);

  useEffect(() => { /* 身份由 refine 管理 */ }, []);

  useEffect(() => {
    setFilters([
      { field: "user_id", operator: "eq", value: identity?.id },
      { field: "box", operator: "eq", value: box },
      { field: "status", operator: "eq", value: status === "all" ? undefined : status },
      { field: "message", operator: "contains", value: search || undefined },
      { field: "created_from", operator: "eq", value: range?.[0] ? range[0].toISOString() : undefined },
      { field: "created_to", operator: "eq", value: range?.[1] ? range[1].toISOString() : undefined },
      { field: "sender_id", operator: "eq", value: senderId },
      { field: "recipient_id", operator: "eq", value: recipientId },
    ], "replace");
    setSorters([{ field: sortField, order: sortOrder }]);
  }, [box, status, search, range, sortField, sortOrder, senderId, recipientId, identity?.id, setFilters, setSorters]);

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
        <Input.Search placeholder="搜索消息内容" allowClear style={{ width: 240 }} onSearch={(v) => setSearch(v)} onChange={(e) => setSearch(e.target.value)} value={search} />
        <DatePicker.RangePicker showTime onChange={(v) => setRange(v)} value={range} />
        <Select value={sortField} style={{ width: 160 }} onChange={(v) => setSortField(v)} options={[
          { label: "按创建时间", value: "created_at" },
          { label: "按更新时间", value: "updated_at" },
        ]} />
        <Segmented options={[{ label: "升序", value: "ascend" }, { label: "降序", value: "descend" }]} value={sortOrder} onChange={(v) => setSortOrder(v as any)} />
        <InputNumber placeholder="发送者ID" value={senderId} onChange={(v) => setSenderId(v as number)} style={{ width: 140 }} />
        <InputNumber placeholder="接收者ID" value={recipientId} onChange={(v) => setRecipientId(v as number)} style={{ width: 140 }} />
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
                {item.message && <Tag>{highlightMessage(item.message, search)}</Tag>}
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

function highlightMessage(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  const before = text.slice(0, i);
  const match = text.slice(i, i + q.length);
  const after = text.slice(i + q.length);
  return <span>{before}<mark>{match}</mark>{after}</span>;
}
