import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";
import React from "react";

const ProductsCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: "products" });
  return (
    <Create saveButtonProps={saveButtonProps} title="新建商品">
      <Form {...formProps} layout="vertical">
        <Form.Item label="名称" name="name" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>
        <Form.Item label="链接" name="url" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>
        <Form.Item label="类别" name="category"> 
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default ProductsCreate;
