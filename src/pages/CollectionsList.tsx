import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, message, Space, DatePicker, InputNumber, Switch, Select } from "antd";
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
  const [ownerOnly, setOwnerOnly] = React.useState<boolean>(false);
  const [sortBy, setSortBy] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<string>("desc");
  const [minProducts, setMinProducts] = React.useState<number | undefined>();
  const [maxProducts, setMaxProducts] = React.useState<number | undefined>();

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
        <InputNumber placeholder="最少商品" min={0} value={minProducts} onChange={(v) => { setMinProducts(v as any); setFilters?.([{ field: "min_products", operator: "gte", value: v }]); }} />
        <InputNumber placeholder="最多商品" min={0} value={maxProducts} onChange={(v) => { setMaxProducts(v as any); setFilters?.([{ field: "max_products", operator: "lte", value: v }]); }} />
        <Switch checked={ownerOnly} onChange={(v) => { setOwnerOnly(v); setFilters?.([{ field: "owner_only", operator: "eq", value: v }]); }} /> 只看我拥有
        <Select value={sortBy} onChange={(v) => { setSortBy(v); setFilters?.([{ field: "sort_by", operator: "eq", value: v }, { field: "sort_order", operator: "eq", value: sortOrder }]); }}
          options={[{ value: "created_at", label: "按创建时间" }, { value: "last_updated", label: "按最近更新" }, { value: "name", label: "按名称" }]} />
        <Select value={sortOrder} onChange={(v) => { setSortOrder(v); setFilters?.([{ field: "sort_by", operator: "eq", value: sortBy }, { field: "sort_order", operator: "eq", value: v }]); }}
          options={[{ value: "desc", label: "降序" }, { value: "asc", label: "升序" }]} />
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
