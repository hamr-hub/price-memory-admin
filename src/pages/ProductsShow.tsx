import { Show } from "@refinedev/antd";
import { Descriptions } from "antd";
import React from "react";
import { useShow } from "@refinedev/core";

const ProductsShow: React.FC = () => {
  const { queryResult } = useShow({ resource: "products" });
  const record = queryResult?.data?.data || {};
  return (
    <Show title="商品详情">
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="名称">{record.name}</Descriptions.Item>
        <Descriptions.Item label="标题">{record.title}</Descriptions.Item>
        <Descriptions.Item label="价格">{record.price}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default ProductsShow;
