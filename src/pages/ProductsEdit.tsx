import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useCustom } from "@refinedev/core";
import { API_BASE } from "../api";
import React from "react";

const ProductsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "products" });
  const { data: categoriesRes } = useCustom<{ data: Array<{ id: string; name: string }> }>({ url: `${API_BASE}/categories`, method: "get" });
  const categoryOptions = (categoriesRes?.data || []).map((c) => ({ label: c.name, value: c.name }));
  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑商品">
      <Form {...formProps} layout="vertical">
        <Form.Item label="名称" name="name" rules={[{ required: true }, { min: 2, message: "名称至少2个字符" }]}> 
          <Input />
        </Form.Item>
        <Form.Item label="链接" name="url" rules={[{ type: "url", message: "请输入有效链接" }]}> 
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item label="类别" name="category"> 
          {categoryOptions.length ? (
            <Select options={categoryOptions} allowClear />
          ) : (
            <Input />
          )}
        </Form.Item>
        <Form.Item label="价格" name="price" rules={[{ type: "number", min: 0, message: "价格必须为非负数" }]}> 
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default ProductsEdit;
