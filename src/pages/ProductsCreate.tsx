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
        <Form.Item label="标题" name="title"> 
          <Input />
        </Form.Item>
        <Form.Item label="价格" name="price"> 
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};

export default ProductsCreate;
