import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { useTable, useCreate, useNavigation, useGetIdentity } from "@refinedev/core";
import React from "react";

const CollectionsListPage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [form] = Form.useForm();
  const { data: identity } = useGetIdentity<any>();
  const { show } = useNavigation();
  const { tableProps, refetch } = useTable({ resource: "collections", pagination: { pageSize: 20 } });

  React.useEffect(() => { /* 数据通过 useTable 加载 */ }, []);

  const { mutateAsync: create } = useCreate();
  const onCreate = async () => {
    const values = await form.validateFields();
    try {
      await create({ resource: "collections", values: { name: values.name, owner_user_id: identity?.id } });
      message.success("创建成功");
      setOpen(false);
      form.resetFields();
      refetch();
    } catch (e: any) {
      message.error(e.message || "创建失败");
    }
  };

  return (
    <List title="我的集合" headerButtons={<Button type="primary" onClick={() => setOpen(true)}>新建集合</Button>}>
      <Table
        {...tableProps}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "创建时间", dataIndex: "created_at" },
          {
            title: "操作",
            render: (_, r: any) => (
              <Button onClick={() => show("collections", r.id)}>
                查看
              </Button>
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
