import { Show } from "@refinedev/antd";
import { Descriptions, Table, Button, Space, Modal, Form, Input, message, AutoComplete, Select } from "antd";
import React from "react";
import { API_BASE } from "../api";
import { dataProvider } from "../dataProvider";
import { usingSupabase, sbSearchUsers, sbCollectionShare, sbSearchPublicPool, sbCollectionAddProduct } from "../supabaseApi";
import { downloadBlob } from "../utils/download";
import { useCan } from "@refinedev/core";
import { useShow, useCustom } from "@refinedev/core";

const CollectionShowPage: React.FC = () => {
  const show: any = useShow({ resource: "collections" });
  const data = show?.queryResult?.data?.data || {};
  const [shareOpen, setShareOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [shareForm] = Form.useForm();
  const [addForm] = Form.useForm();
  const [userOptions, setUserOptions] = React.useState<any[]>([]);
  const [poolOptions, setPoolOptions] = React.useState<any[]>([]);
  const { data: canShare } = useCan({ resource: "collections", action: "share", params: { id: data?.id } });
  const { data: canExport } = useCan({ resource: "collections", action: "export", params: { id: data?.id } });


  const onShare = async () => {
    const values = await shareForm.validateFields();
    try {
      if (usingSupabase) {
        await sbCollectionShare(Number(data.id), Number(values.user_id), values.role || "editor");
        message.success("分享成功");
        setShareOpen(false);
        shareForm.resetFields();
        show?.queryResult?.refetch?.();
      } else {
        const res: any = await (dataProvider as any).custom({ resource: "collections", method: "post", meta: { path: `/${data.id}/share` }, payload: { user_id: Number(values.user_id), role: values.role || "editor" } });
        if (res?.data) {
          message.success("分享成功");
          setShareOpen(false);
          shareForm.resetFields();
          show?.queryResult?.refetch?.();
        } else {
          message.error("操作失败");
        }
      }
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const onAddProduct = async () => {
    const values = await addForm.validateFields();
    try {
      if (usingSupabase) {
        await sbCollectionAddProduct(Number(data.id), Number(values.product_id));
        message.success("已添加商品");
        setAddOpen(false);
        addForm.resetFields();
        show?.queryResult?.refetch?.();
      } else {
        const res: any = await (dataProvider as any).custom({ resource: "collections", method: "post", meta: { path: `/${data.id}/products` }, payload: { product_id: Number(values.product_id) } });
        if (res?.data) {
          message.success("已添加商品");
          setAddOpen(false);
          addForm.resetFields();
          show?.queryResult?.refetch?.();
        } else {
          message.error("操作失败");
        }
      }
    } catch (e: any) {
      message.error(e.message || "操作失败");
    }
  };

  const [exportStart, setExportStart] = React.useState(false);
  const exportQuery: any = useCustom({ url: data?.id ? `${API_BASE}/collections/${data.id}/export.xlsx` : "", method: "get", meta: { responseType: "blob" }, queryOptions: { enabled: !!data?.id && exportStart } });
  React.useEffect(() => {
    const blob: Blob | undefined = exportQuery?.data?.data;
    if (blob) {
      downloadBlob(blob, `collection_${data.id}.xlsx`);
      setExportStart(false);
    }
  }, [exportQuery?.data?.data]);
  const onExport = () => {
    if (!data?.id) return;
    setExportStart(true);
  };

  const searchUsers = async (q: string) => {
    if (!q) { setUserOptions([]); return; }
    try {
      if (usingSupabase) {
        const rows = await sbSearchUsers(q);
        const items = (rows || []).map((u: any) => ({ value: String(u.id), label: `${u.username}${u.display_name ? ` <${u.display_name}>` : ""}` }));
        setUserOptions(items);
      } else {
        const res = await fetch(`${API_BASE}/users?search=${encodeURIComponent(q)}&page=1&size=10`);
        const json = await res.json();
        const items = (json.data?.items || []).map((u: any) => ({ value: String(u.id), label: `${u.username}${u.email ? ` <${u.email}>` : ""}` }));
        setUserOptions(items);
      }
    } catch {}
  };

  const searchPoolProducts = async (q: string) => {
    try {
      if (usingSupabase) {
        const rows = await sbSearchPublicPool(q || "");
        const items = (rows || []).map((p: any) => ({ value: String(p.id), label: `${p.name}` }));
        setPoolOptions(items);
      } else {
        const res = await fetch(`${API_BASE}/pools/public/products?search=${encodeURIComponent(q || "")}&page=1&size=10`);
        const json = await res.json();
        const items = (json.data?.items || []).map((p: any) => ({ value: String(p.id), label: `${p.name}` }));
        setPoolOptions(items);
      }
    } catch {}
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
          <Form.Item label="用户" name="user_id" rules={[{ required: true }]}> 
            <AutoComplete options={userOptions} onSearch={searchUsers} placeholder="搜索用户名或邮箱" allowClear />
          </Form.Item>
          <Form.Item label="角色" name="role">
            <Input placeholder="admin/editor/viewer" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal title="添加商品" open={addOpen} onOk={onAddProduct} onCancel={() => setAddOpen(false)}>
        <Form form={addForm} layout="vertical">
          <Form.Item label="公共池商品" name="product_id" rules={[{ required: true }]}> 
            <Select showSearch filterOption={false} onSearch={searchPoolProducts} options={poolOptions} placeholder="搜索公共池商品" />
          </Form.Item>
        </Form>
      </Modal>
    </Show>
  );
};

export default CollectionShowPage;
