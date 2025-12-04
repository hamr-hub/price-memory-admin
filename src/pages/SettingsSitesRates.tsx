import React from "react";
import { List } from "@refinedev/antd";
import { Table, Form, Input, InputNumber, Button, Space, message } from "antd";
import { supabase } from "../supabase";

const SettingsSitesRatesPage: React.FC = () => {
  const [rates, setRates] = React.useState<any[]>([]);
  const [sites, setSites] = React.useState<any[]>([]);
  const [rateForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const [ratesPage, setRatesPage] = React.useState<number>(1);
  const [sitesPage, setSitesPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(10);

  const loadRates = async () => {
    const { data, error } = await supabase.from("exchange_rates").select("currency,rate_to_usd,updated_at").order("currency", { ascending: true });
    if (error) message.error(error.message); else setRates(data || []);
  };
  const loadSites = async () => {
    const { data, error } = await supabase.from("sites").select("id,domain,name,region_code,currency,created_at").order("id", { ascending: false });
    if (error) message.error(error.message); else setSites(data || []);
  };

  React.useEffect(() => { loadRates(); loadSites(); }, []);

  const onAddRate = async (values: any) => {
    try {
      const { error } = await supabase.from("exchange_rates").upsert([{ currency: String(values.currency).toUpperCase(), rate_to_usd: Number(values.rate_to_usd) }], { onConflict: "currency" });
      if (error) throw error;
      rateForm.resetFields();
      await loadRates();
      message.success("汇率已保存");
    } catch (e: any) { message.error(e.message || "保存失败"); }
  };

  const onDeleteRate = async (currency: string) => {
    try { const { error } = await supabase.from("exchange_rates").delete().eq("currency", currency); if (error) throw error; await loadRates(); } catch (e: any) { message.error(e.message || "删除失败"); }
  };

  const onAddSite = async (values: any) => {
    try {
      const row = { domain: values.domain, name: values.name, region_code: values.region_code, currency: values.currency };
      const { error } = await supabase.from("sites").upsert([row], { onConflict: "domain" });
      if (error) throw error;
      siteForm.resetFields();
      await loadSites();
      message.success("站点已保存");
    } catch (e: any) { message.error(e.message || "保存失败"); }
  };

  const onDeleteSite = async (id: number) => {
    try { const { error } = await supabase.from("sites").delete().eq("id", id); if (error) throw error; await loadSites(); } catch (e: any) { message.error(e.message || "删除失败"); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <List title="币种汇率">
        <Form form={rateForm} layout="inline" onFinish={onAddRate} style={{ marginBottom: 16 }}>
          <Form.Item name="currency" label="币种" rules={[{ required: true }]}><Input placeholder="如 USD" style={{ width: 120 }} /></Form.Item>
          <Form.Item name="rate_to_usd" label="对USD汇率" rules={[{ required: true }]}><InputNumber placeholder="如 1.08" step={0.0001} style={{ width: 160 }} /></Form.Item>
          <Form.Item><Button htmlType="submit" type="primary">保存</Button></Form.Item>
        </Form>
        <Table
          dataSource={rates}
          rowKey={(r) => r.currency}
          columns={[
            { title: "币种", dataIndex: "currency" },
            { title: "对USD汇率", dataIndex: "rate_to_usd" },
            { title: "更新时间", dataIndex: "updated_at" },
            { title: "操作", dataIndex: "actions", render: (_: any, r: any) => (
              <Space>
                <Button size="small" onClick={() => rateForm.setFieldsValue({ currency: r.currency, rate_to_usd: r.rate_to_usd })}>编辑</Button>
                <Button danger size="small" onClick={() => onDeleteRate(r.currency)}>删除</Button>
              </Space>
            ) },
          ]}
          pagination={{ current: ratesPage, pageSize, onChange: setRatesPage }}
        />
      </List>

      <List title="站点配置">
        <Form form={siteForm} layout="inline" onFinish={onAddSite} style={{ marginBottom: 16 }}>
          <Form.Item name="domain" label="域名" rules={[{ required: true }]}><Input placeholder="如 www.amazon.co.uk" style={{ width: 220 }} /></Form.Item>
          <Form.Item name="name" label="名称"><Input placeholder="站点名称" style={{ width: 200 }} /></Form.Item>
          <Form.Item name="region_code" label="区域"><Input placeholder="如 GB" style={{ width: 120 }} /></Form.Item>
          <Form.Item name="currency" label="币种"><Input placeholder="如 GBP" style={{ width: 120 }} /></Form.Item>
          <Form.Item><Button htmlType="submit" type="primary">保存</Button></Form.Item>
        </Form>
        <Table
          dataSource={sites}
          rowKey="id"
          columns={[
            { title: "ID", dataIndex: "id" },
            { title: "域名", dataIndex: "domain" },
            { title: "名称", dataIndex: "name" },
            { title: "区域", dataIndex: "region_code" },
            { title: "币种", dataIndex: "currency" },
            { title: "操作", dataIndex: "actions", render: (_: any, r: any) => (
              <Space>
                <Button size="small" onClick={() => siteForm.setFieldsValue({ domain: r.domain, name: r.name, region_code: r.region_code, currency: r.currency })}>编辑</Button>
                <Button danger size="small" onClick={() => onDeleteSite(r.id)}>删除</Button>
              </Space>
            ) },
          ]}
          pagination={{ current: sitesPage, pageSize, onChange: setSitesPage }}
        />
      </List>
    </div>
  );
};

export default SettingsSitesRatesPage;
