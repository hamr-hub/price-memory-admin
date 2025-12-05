import React, { useState, useEffect, useRef } from "react";
import { Card, Space, Button, Input, Typography, Tag, List, Divider } from "antd";
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  DisconnectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined
} from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

const WebSocketTest: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [productIds, setProductIds] = useState<string>("1,2,3");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connectWebSocket = () => {
    try {
      const apiUrl = process.env.VITE_API_URL || "http://localhost:8000";
      const wsUrl = apiUrl.replace("http", "ws") + ":8001";
      
      setStatus("connecting");
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        setStatus("connected");
        setWs(websocket);
        addMessage({ type: "system", data: "WebSocket连接成功", timestamp: new Date().toISOString() });
      };
      
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage({ type: "message", data, timestamp: new Date().toISOString() });
        } catch (error) {
          addMessage({ type: "error", data: "消息解析失败", timestamp: new Date().toISOString() });
        }
      };
      
      websocket.onerror = () => {
        setStatus("error");
        addMessage({ type: "error", data: "WebSocket连接出错", timestamp: new Date().toISOString() });
      };
      
      websocket.onclose = () => {
        setStatus("disconnected");
        setWs(null);
        addMessage({ type: "system", data: "WebSocket连接已关闭", timestamp: new Date().toISOString() });
      };
      
    } catch (error) {
      setStatus("error");
      addMessage({ type: "error", data: "连接失败", timestamp: new Date().toISOString() });
    }
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  const subscribeProducts = () => {
    if (!ws || status !== "connected") return;
    
    const ids = productIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    const message = {
      type: "subscribe",
      product_ids: ids
    };
    
    ws.send(JSON.stringify(message));
    addMessage({ type: "sent", data: message, timestamp: new Date().toISOString() });
  };

  const unsubscribeProducts = () => {
    if (!ws || status !== "connected") return;
    
    const ids = productIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    const message = {
      type: "unsubscribe",
      product_ids: ids
    };
    
    ws.send(JSON.stringify(message));
    addMessage({ type: "sent", data: message, timestamp: new Date().toISOString() });
  };

  const sendMessage = () => {
    if (!ws || status !== "connected" || !inputMessage.trim()) return;
    
    try {
      const message = JSON.parse(inputMessage);
      ws.send(JSON.stringify(message));
      addMessage({ type: "sent", data: message, timestamp: new Date().toISOString() });
      setInputMessage("");
    } catch (error) {
      addMessage({ type: "error", data: "消息格式无效，必须是有效的JSON", timestamp: new Date().toISOString() });
    }
  };

  const addMessage = (message: WebSocketMessage) => {
    setMessages(prev => [...prev, message]);
  };

  useEffect(() => {
    // 自动滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "green";
      case "connecting": return "blue";
      case "error": return "red";
      default: return "default";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected": return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "connecting": return <MessageOutlined style={{ color: "#1677ff" }} />;
      case "error": return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default: return <DisconnectOutlined style={{ color: "#999" }} />;
    }
  };

  return (
    <Card title="WebSocket测试工具" style={{ margin: "16px 0" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space wrap>
          <Tag color={getStatusColor()} icon={getStatusIcon()}>
            状态: {status}
          </Tag>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={connectWebSocket}
            disabled={status === "connecting" || status === "connected"}
          >
            连接
          </Button>
          <Button 
            danger 
            icon={<PauseCircleOutlined />} 
            onClick={disconnectWebSocket}
            disabled={status !== "connected"}
          >
            断开
          </Button>
        </Space>

        <Divider />

        <div>
          <Title level={5}>订阅管理</Title>
          <Space wrap style={{ width: "100%" }}>
            <Input
              placeholder="输入商品ID，用逗号分隔，如: 1,2,3"
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
              style={{ width: 300 }}
            />
            <Button type="primary" onClick={subscribeProducts}>
              订阅
            </Button>
            <Button onClick={unsubscribeProducts}>
              取消订阅
            </Button>
          </Space>
        </div>

        <Divider />

        <div>
          <Title level={5}>消息发送</Title>
          <Space direction="vertical" style={{ width: "100%" }}>
            <TextArea
              placeholder='输入要发送的JSON消息，例如: {"type": "ping"}'
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              rows={4}
              style={{ width: "100%" }}
            />
            <Button type="primary" icon={<MessageOutlined />} onClick={sendMessage}>
              发送消息
            </Button>
          </Space>
        </div>

        <Divider />

        <div>
          <Title level={5}>消息日志</Title>
          <List
            bordered
            dataSource={messages}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <Text type="secondary">{new Date(item.timestamp).toLocaleTimeString()}</Text>
                    <Tag color={
                      item.type === "sent" ? "blue" :
                      item.type === "message" ? "green" :
                      item.type === "error" ? "red" : "default"
                    }>
                      {item.type}
                    </Tag>
                  </Space>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {typeof item.data === "object" ? JSON.stringify(item.data, null, 2) : item.data}
                  </pre>
                </Space>
              </List.Item>
            )}
            locale={{ emptyText: "暂无消息" }}
          />
          <div ref={messagesEndRef} />
        </div>
      </Space>
    </Card>
  );
};

export default WebSocketTest;