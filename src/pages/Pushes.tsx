import { useEffect, useMemo, useState } from "react";
import { List, Button, Space, Segmented, message, Typography, Tag } from "antd";
import { usingSupabase, sbListUsers, sbEnsureUser, sbListPushes, sbUpdatePushStatus, sbAddFollow, sbSubscribePushesUpdate, sbSubscribeFollowsInsert } from "../supabaseApi";
import { api } from "../api";

type User = { id: number; username: string; display_name?: string | null };
type Push = { id: number; sender_id: number; recipient_id: number; product_id: number; message?: string | null; status: string; created_at?: string; updated_at?: string };

export default function PushesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Push[]>([]);
  const [loading, setLoading] = useState(false);
  const [box, setBox] = useState<"inbox" | "outbox">("inbox");

  const userLabel = useMemo(() => (u: User) => u.display_name || u.username, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (usingSupabase) {
          const usersList = await sbListUsers();
          const list: User[] = usersList.items || [];
          let me = list[0];
          if (!me) {
            me = await sbEnsureUser("demo", "演示用户");
            const refreshed = await sbListUsers();
            setUsers(refreshed.items || []);
          } else {
            setUsers(list);
          }
          setCurrentUser(me);
        } else {
          const usersList = await api.listUsers();
          const list: User[] = usersList.items || [];
          let me = list[0];
          if (!me) {
            me = await api.createUser("demo", "演示用户");
            const refreshed = await api.listUsers();
            setUsers(refreshed.items || []);
          } else {
            setUsers(list);
          }
          setCurrentUser(me);
        }
      } catch (e: any) {
        message.error(e.message || "初始化失败");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        if (usingSupabase) {
          const data = await sbListPushes(currentUser.id, box);
          setItems(data || []);
        } else {
          const data = await api.listPushes(currentUser.id, box);
          setItems(data || []);
        }
      } catch (e: any) {
        message.error(e.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.id, box]);

  useEffect(() => {
    if (!usingSupabase || !currentUser?.id) return;
    const unsub1 = sbSubscribePushesUpdate(currentUser.id, () => {
      message.info("推送状态已更新");
    });
    const unsub2 = sbSubscribeFollowsInsert(currentUser.id, () => {
      message.info("关注池新增一条记录");
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [usingSupabase, currentUser?.id]);

  const accept = async (p: Push) => {
    try {
      if (usingSupabase) {
        await sbUpdatePushStatus(p.id, "accepted");
        if (currentUser?.id) await sbAddFollow(currentUser.id, p.product_id);
      } else {
        await api.updatePushStatus(p.id, "accepted");
        if (currentUser?.id) await api.addFollow(currentUser.id, p.product_id);
      }
      message.success("已接受并关注");
      setItems(prev => prev.map(x => (x.id === p.id ? { ...x, status: "accepted" } : x)));
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const reject = async (p: Push) => {
    try {
      if (usingSupabase) {
        await sbUpdatePushStatus(p.id, "rejected");
      } else {
        await api.updatePushStatus(p.id, "rejected");
      }
      message.success("已拒绝");
      setItems(prev => prev.map(x => (x.id === p.id ? { ...x, status: "rejected" } : x)));
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>推送中心</Typography.Title>
        <Segmented options={[{ label: "收件箱", value: "inbox" }, { label: "发件箱", value: "outbox" }]} value={box} onChange={(v) => setBox(v as any)} />
      </Space>
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>当前用户：</Typography.Text>
        <Tag color="blue">{currentUser ? userLabel(currentUser) : "加载中"}</Tag>
      </Space>
      <List
        loading={loading}
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.status === "pending" && box === "inbox" ? (
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
