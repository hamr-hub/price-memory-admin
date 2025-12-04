import { List } from "@refinedev/antd";
import { Table, Input, Space, message } from "antd";
import React from "react";
import { usingSupabase } from "../supabaseApi";
import { supabase } from "../supabase";

const PublicCollectionsPage: React.FC = () => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");

  React.useEffect(() => {
    const load = async () => {
      if (!usingSupabase) return;
      setLoading(true);
      try {
        let q = supabase.from("collections").select("id,name,description,visibility,created_at").eq("visibility", "public").order("id", { ascending: false });
        if (search && search.trim()) q = q.ilike("name", `%${search.trim()}%`);
        const { data, error } = await q;
        if (error) throw error;
        setItems(data || []);
      } catch (e: any) {
        message.error(e.message || "加载失败");
      } finally { setLoading(false); }
    };
    load();
  }, [search]);

  return (
    <List title="公开集合" headerButtons={<Space><Input.Search placeholder="搜索名称" allowClear onSearch={setSearch as any} /></Space>}>
      <Table
        dataSource={items}
        loading={loading}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "名称", dataIndex: "name" },
          { title: "简介", dataIndex: "description" },
          { title: "时间", dataIndex: "created_at" },
        ]}
      />
    </List>
  );
};

export default PublicCollectionsPage;

