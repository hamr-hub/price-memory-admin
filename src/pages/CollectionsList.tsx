import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, message, Space, DatePicker, InputNumber } from "antd";
import { useTable, useCreate, useNavigation, useGetIdentity, useSubscription } from "@refinedev/core";
import React from "react";

const CollectionsListPage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [form] = Form.useForm();
  const { data: identity } = useGetIdentity<any>();
  const { show } = useNavigation();
  const table: any = useTable({ resource: "collections", pagination: { pageSize: 20 } });
  const { tableProps, refetch, setFilters } = table;
  const [range, setRange] = React.useState<[any, any] | null>(null);
  const [minMembers, setMinMembers] = React.useState<number | undefined>();
  const [maxMembers, setMaxMembers] = React.useState<number | undefined>();

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

  useSubscription({ channel: "collections", types: ["created","updated","deleted"], params: { resource: { name: "collections" } } as any, callback: () => { refetch?.(); } });

  return (
    <List title="我的集合" headerButtons={
      <Space>
        <Input.Search placeholder="搜索集合名称" allowClear onSearch={(v) => setFilters?.([{ field: "search", operator: "contains", value: v }])} />
        <DatePicker.RangePicker onChange={(v) => { setRange(v as any); const [s, e] = v || []; setFilters?.([
          ...(s ? [{ field: "start_date", operator: "gte", value: s.format("YYYY-MM-DD") }] : []),
          ...(e ? [{ field: "end_date", operator: "lte", value: e.format("YYYY-MM-DD") }] : []),
        ]); }} />
        <InputNumber placeholder="最少成员" min={0} value={minMembers} onChange={(v) => { setMinMembers(v as any); setFilters?.([{ field: "min_members", operator: "gte", value: v }]); }} />
        <InputNumber placeholder="最多成员" min={0} value={maxMembers} onChange={(v) => { setMaxMembers(v as any); setFilters?.([{ field: "max_members", operator: "lte", value: v }]); }} />
        <Button type="primary" onClick={() => setOpen(true)}>新建集合</Button>
      </Space>
    }>
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
