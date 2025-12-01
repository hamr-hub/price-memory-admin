import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";
import React from "react";

const ProductsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "products" });
  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑商品">
      <Form {...formProps} layout="vertical">
        <Form.Item label="名称" name="name" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>
        <Form.Item label="链接" name="url"> 
          <Input />
        </Form.Item>
        <Form.Item label="类别" name="category"> 
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default ProductsEdit;
