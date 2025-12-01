import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, message } from "antd";
import React from "react";
import { API_BASE } from "../api";
import { useNavigate } from "react-router";

const CollectionsListPage: React.FC = () => {
  const [data, setData] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : { id: 1 };

  const load = React.useCallback(async () => {
    const res = await fetch(`${API_BASE}/users/${user.id}/collections`);
    const json = await res.json();
    setData(json.data || []);
  }, [user.id]);

  React.useEffect(() => { load(); }, [load]);

  const onCreate = async () => {
    const values = await form.validateFields();
    const res = await fetch(`${API_BASE}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: values.name, owner_user_id: user.id }),
    });
    const json = await res.json();
    if (json.success) {
      message.success("创建成功");
      setOpen(false);
      form.resetFields();
      load();
    } else {
      message.error(json.error?.message || "创建失败");
    }
  };

  return (
    <List title="我的集合" headerButtons={<Button type="primary" onClick={() => setOpen(true)}>新建集合</Button>}>
      <Table
        dataSource={data}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "创建时间", dataIndex: "created_at" },
          {
            title: "操作",
            render: (_, r: any) => (
              <Button onClick={() => nav(`/collections/show/${r.id}`)}>查看</Button>
            ),
          },
        ]}
      />
      <Modal title="新建集合" open={open} onOk={onCreate} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="集合名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
};

export default CollectionsListPage;
