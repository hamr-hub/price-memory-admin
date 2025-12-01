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
        <Form.Item label="标题" name="title"> 
          <Input />
        </Form.Item>
        <Form.Item label="价格" name="price"> 
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default ProductsEdit;
