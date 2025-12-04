import { Show } from "@refinedev/antd";
import { Descriptions, Table, Button, Space, Modal, Form, Input, message } from "antd";
import React from "react";
import { API_BASE } from "../api";
import { useCan } from "@refinedev/core";
import { useShow, useCustom } from "@refinedev/core";

const CollectionShowPage: React.FC = () => {
  const { queryResult } = useShow({ resource: "collections" });
  const data = (queryResult as any)?.data?.data || {};
  const [shareOpen, setShareOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [shareForm] = Form.useForm();
  const [addForm] = Form.useForm();
  const { data: canShare } = useCan({ resource: "collections", action: "share" });
  const { data: canExport } = useCan({ resource: "collections", action: "export" });


  const onShare = async () => {
    const values = await shareForm.validateFields();
    try {
      const res = await fetch(`${API_BASE}/collections/${data.id}/share`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: Number(values.user_id), role: values.role || "editor" }) });
      const json = await res.json();
      if (json.success) {
      message.success("分享成功");
      setShareOpen(false);
      shareForm.resetFields();
      (queryResult as any)?.refetch?.();
      } else {
        message.error(json.error?.message || "操作失败");
      }
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const onAddProduct = async () => {
    const values = await addForm.validateFields();
    try {
      const res = await fetch(`${API_BASE}/collections/${data.id}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: Number(values.product_id) }) });
      const json = await res.json();
      if (json.success) {
      message.success("已添加商品");
      setAddOpen(false);
      addForm.resetFields();
      (queryResult as any)?.refetch?.();
      } else {
        message.error(json.error?.message || "操作失败");
      }
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const onExport = async () => {
    const url = `${API_BASE}/collections/${data.id}/export.xlsx`;
    const res = await fetch(url);
    if (res.ok && res.headers.get("content-type")?.includes("application/vnd.openxmlformats-officedocument")) {
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `collection_${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      try { const json = await res.json(); message.error(json.error?.message || "导出失败"); } catch { message.error("导出失败"); }
    }
  };

  return (
    <Show title="集合详情">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
        <Descriptions.Item label="名称">{data.name}</Descriptions.Item>
      </Descriptions>
      <Space style={{ margin: "12px 0" }}>
        {canShare?.can && <Button type="primary" onClick={() => setShareOpen(true)}>分享成员</Button>}
        <Button onClick={() => setAddOpen(true)}>添加商品</Button>
        {canExport?.can && <Button onClick={onExport}>导出Excel</Button>}
      </Space>
      <Table
        dataSource={data.products || []}
        rowKey="id"
        title={() => "集合商品"}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "链接", dataIndex: "url" },
          { title: "类别", dataIndex: "category" },
        ]}
      />
      <Table
        dataSource={data.members || []}
        rowKey="id"
        title={() => "成员"}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "用户名", dataIndex: "username" },
          { title: "昵称", dataIndex: "display_name" },
          { title: "角色", dataIndex: "role" },
        ]}
      />
      <Modal title="分享成员" open={shareOpen} onOk={onShare} onCancel={() => setShareOpen(false)}>
        <Form form={shareForm} layout="vertical">
          <Form.Item label="用户ID" name="user_id" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role">
            <Input placeholder="admin/editor/viewer" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="添加商品" open={addOpen} onOk={onAddProduct} onCancel={() => setAddOpen(false)}>
        <Form form={addForm} layout="vertical">
          <Form.Item label="商品ID" name="product_id" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};

export default CollectionShowPage;
