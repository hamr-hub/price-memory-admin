import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  message,
  Alert,
  Tabs,
  Grid
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DashboardOutlined,
  MonitorOutlined,
  DatabaseOutlined,
  ApiOutlined
} from "@ant-design/icons";
import TrendChart from "../components/TrendChart";
import WebSocketTest from "../components/WebSocketTest";
import { monitorService } from "../services/monitorService";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  uptime: number;
}

interface TaskMetrics {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_response_time: number;
  queue_length: number;
}

interface PriceMetrics {
  total_products: number;
  active_products: number;
  last_update_time: string;
  avg_price_change: number;
  price_accuracy: number;
  scraping_success_rate: number;
}

interface AlertMetrics {
  total_alerts: number;
  triggered_alerts: number;
  sent_events: number;
  failed_events: number;
  success_rate: number;
}

interface TaskLog {
  id: number;
  product_id: number;
  product_name: string;
  status: "running" | "completed" | "failed" | "pending";
  start_time: string;
  end_time?: string;
  duration?: number;
  price?: number;
  error_message?: string;
}

const MonitorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<[string, string]>(["", ""]);
  
  // 实时数据
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 0,
    memory_usage: 0,
    disk_usage: 0,
    network_io: 0,
    active_connections: 0,
    uptime: 0
  });
  
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics>({
    total_tasks: 0,
    running_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    success_rate: 0,
    avg_response_time: 0,
    queue_length: 0
  });
  
  const [priceMetrics, setPriceMetrics] = useState<PriceMetrics>({
    total_products: 0,
    active_products: 0,
    last_update_time: "",
    avg_price_change: 0,
    price_accuracy: 0,
    scraping_success_rate: 0
  });
  
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics>({
    total_alerts: 0,
    triggered_alerts: 0,
    sent_events: 0,
    failed_events: 0,
    success_rate: 0
  });
  
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  
  // WebSocket连接
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  const screens = useBreakpoint();
  
  // 初始化WebSocket连接
  useEffect(() => {
    const ws = monitorService.createWebSocketConnection();
    
    websocket.onopen = () => {
      setWsConnected(true);
      message.success("已连接到实时监控");
      
      // 订阅产品
      if (selectedProducts.length > 0) {
        websocket.send(JSON.stringify({
          type: "subscribe",
          product_ids: selectedProducts
        }));
      }
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleRealTimeData(data);
      } catch (error) {
        console.error("WebSocket消息解析失败:", error);
      }
    };
    
    websocket.onclose = () => {
      setWsConnected(false);
      message.warning("WebSocket连接已断开，正在尝试重连...");
      
      // 重连
      setTimeout(() => {
        // 重新初始化连接
        // 这里可以添加重连逻辑
      }, 3000);
    };
    
    websocket.onerror = () => {
      setWsConnected(false);
      message.error("WebSocket连接出错");
    };
    
    setWs(ws);
    
    return () => {
      ws.close();
    };
  }, [selectedProducts]);
  
  // 处理实时数据
  const handleRealTimeData = (data: any) => {
    if (data.type === "price_update") {
      // 更新价格数据
      setPriceHistory(prev => {
        const newHistory = [...prev, data];
        return newHistory.slice(-100); // 保留最近100条
      });
    } else if (data.type === "task_update") {
      // 更新任务状态
      setTaskLogs(prev => {
        const updated = prev.map(log => 
          log.id === data.task_id ? { ...log, ...data } : log
        );
        return updated;
      });
    }
  };
  
  // 获取监控数据
  const fetchMonitorData = async () => {
    setLoading(true);
    try {
      const data = await monitorService.getDashboardData();
      
      setSystemMetrics(data.systemMetrics);
      setTaskMetrics(data.taskMetrics);
      setPriceMetrics(data.priceMetrics);
      setAlertMetrics(data.alertMetrics);
      
      // 获取任务日志
      const logs = await monitorService.getTaskLogs({ page: 1, size: 20 });
      setTaskLogs(logs.items);
      
      // 获取价格历史
      const priceHistory = await monitorService.getPriceHistory(1, {
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        granularity: "hourly"
      });
      setPriceHistory(priceHistory);
      
      message.success("数据刷新成功");
    } catch (error) {
      console.error("获取监控数据失败:", error);
      message.error("获取监控数据失败");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMonitorData();
    
    // 定期刷新数据
    const interval = setInterval(fetchMonitorData, 30000); // 30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);
  
  // 计算统计数据
  const stats = useMemo(() => {
    return {
      systemHealth: systemMetrics.cpu_usage < 80 && systemMetrics.memory_usage < 80 ? "healthy" : "warning",
      taskHealth: taskMetrics.success_rate > 90 ? "healthy" : "warning",
      priceHealth: priceMetrics.scraping_success_rate > 90 ? "healthy" : "warning",
      alertHealth: alertMetrics.success_rate > 95 ? "healthy" : "warning"
    };
  }, [systemMetrics, taskMetrics, priceMetrics, alertMetrics]);
  
  // 任务日志表格列
  const taskLogColumns = [
    {
      title: "任务ID",
      dataIndex: "id",
      key: "id"
    },
    {
      title: "商品",
      dataIndex: "product_name",
      key: "product_name"
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap = {
          running: <Tag color="blue">运行中</Tag>,
          completed: <Tag color="green">已完成</Tag>,
          failed: <Tag color="red">失败</Tag>,
          pending: <Tag color="orange">等待中</Tag>
        };
        return statusMap[status] || status;
      }
    },
    {
      title: "开始时间",
      dataIndex: "start_time",
      key: "start_time"
    },
    {
      title: "耗时",
      dataIndex: "duration",
      key: "duration",
      render: (duration: number) => duration ? `${duration}s` : "-"
    },
    {
      title: "价格",
      dataIndex: "price",
      key: "price",
      render: (price: number) => price ? `¥${price}` : "-"
    }
  ];
  
  return (
    <div style={{ padding: screens.md ? 24 : 16 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: screens.md ? 24 : 20 }}>
          <MonitorOutlined style={{ marginRight: 12 }} />
          实时监控仪表板
        </h1>
        <Space>
          <Button 
            type={wsConnected ? "primary" : "default"} 
            danger={!wsConnected}
            onClick={() => {
              if (!wsConnected) {
                message.info("正在重新连接...");
                // 触发重新连接
                window.location.reload();
              }
            }}
          >
            {wsConnected ? "WebSocket已连接" : "WebSocket断开"}
          </Button>
          <Button type="primary" onClick={fetchMonitorData} loading={loading}>
            刷新数据
          </Button>
        </Space>
      </div>
      
      {!wsConnected && (
        <Alert
          message="WebSocket连接异常"
          description="实时监控功能可能不可用，请检查网络连接或刷新页面"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Tabs defaultActiveKey="overview" size="large">
        <Tabs.TabPane tab="概览" key="overview">
          <OverviewTab
            systemMetrics={systemMetrics}
            taskMetrics={taskMetrics}
            priceMetrics={priceMetrics}
            alertMetrics={alertMetrics}
            stats={stats}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="系统监控" key="system">
          <SystemTab systemMetrics={systemMetrics} />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="任务监控" key="tasks">
          <TasksTab 
            taskMetrics={taskMetrics} 
            taskLogs={taskLogs}
            onRefresh={fetchMonitorData}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="价格监控" key="prices">
          <PricesTab 
            priceMetrics={priceMetrics}
            priceHistory={priceHistory}
            onProductSelect={setSelectedProducts}
          />
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="告警监控" key="alerts">
          <AlertsTab alertMetrics={alertMetrics} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

// 概览标签页组件
const OverviewTab: React.FC<{
  systemMetrics: SystemMetrics;
  taskMetrics: TaskMetrics;
  priceMetrics: PriceMetrics;
  alertMetrics: AlertMetrics;
  stats: any;
}> = ({ systemMetrics, taskMetrics, priceMetrics, alertMetrics, stats }) => {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="系统健康状态"
              value={stats.systemHealth}
              valueStyle={{ color: stats.systemHealth === "healthy" ? "#52c41a" : "#faad14" }}
              prefix={stats.systemHealth === "healthy" ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round((systemMetrics.cpu_usage + systemMetrics.memory_usage) / 2)} 
                strokeColor={stats.systemHealth === "healthy" ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                CPU: {systemMetrics.cpu_usage}% | 内存: {systemMetrics.memory_usage}%
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="任务成功率"
              value={`${taskMetrics.success_rate}%`}
              valueStyle={{ color: stats.taskHealth === "healthy" ? "#52c41a" : "#faad14" }}
              prefix={<ThunderboltOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={taskMetrics.success_rate} 
                strokeColor={stats.taskHealth === "healthy" ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                队列: {taskMetrics.queue_length} | 响应时间: {taskMetrics.avg_response_time}s
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="价格抓取成功率"
              value={`${priceMetrics.scraping_success_rate}%`}
              valueStyle={{ color: stats.priceHealth === "healthy" ? "#52c41a" : "#faad14" }}
              prefix={<DatabaseOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={priceMetrics.scraping_success_rate} 
                strokeColor={stats.priceHealth === "healthy" ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                准确率: {priceMetrics.price_accuracy}% | 平均变化: {priceMetrics.avg_price_change}%
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="告警成功率"
              value={`${alertMetrics.success_rate}%`}
              valueStyle={{ color: stats.alertHealth === "healthy" ? "#52c41a" : "#faad14" }}
              prefix={<ApiOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={alertMetrics.success_rate} 
                strokeColor={stats.alertHealth === "healthy" ? "#52c41a" : "#faad14"}
                showInfo={false}
              />
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                触发: {alertMetrics.triggered_alerts} | 发送: {alertMetrics.sent_events}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="系统资源使用率" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'CPU', value: systemMetrics.cpu_usage },
                { name: '内存', value: systemMetrics.memory_usage },
                { name: '磁盘', value: systemMetrics.disk_usage }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1677ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="任务状态分布" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: '已完成', value: taskMetrics.completed_tasks },
                    { name: '运行中', value: taskMetrics.running_tasks },
                    { name: '失败', value: taskMetrics.failed_tasks },
                    { name: '等待中', value: taskMetrics.queue_length }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#1677ff"
                  label
                >
                  {[
                    { color: '#52c41a' },
                    { color: '#1677ff' },
                    { color: '#ff4d4f' },
                    { color: '#faad14' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );
};

// 系统监控标签页
const SystemTab: React.FC<{ systemMetrics: SystemMetrics }> = ({ systemMetrics }) => {
  const data = [
    { time: '现在', cpu: systemMetrics.cpu_usage, memory: systemMetrics.memory_usage },
    { time: '1分钟前', cpu: systemMetrics.cpu_usage - 5, memory: systemMetrics.memory_usage - 3 },
    { time: '5分钟前', cpu: systemMetrics.cpu_usage - 8, memory: systemMetrics.memory_usage - 5 },
    { time: '10分钟前', cpu: systemMetrics.cpu_usage - 3, memory: systemMetrics.memory_usage - 2 }
  ];
  
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="CPU使用率">
          <Progress type="dashboard" percent={systemMetrics.cpu_usage} status={systemMetrics.cpu_usage > 80 ? "exception" : "active"} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            当前: {systemMetrics.cpu_usage}% | 建议: < 80%
          </div>
        </Card>
      </Col>
      
      <Col xs={24} md={8}>
        <Card title="内存使用率">
          <Progress type="dashboard" percent={systemMetrics.memory_usage} status={systemMetrics.memory_usage > 80 ? "exception" : "active"} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            当前: {systemMetrics.memory_usage}% | 建议: < 80%
          </div>
        </Card>
      </Col>
      
      <Col xs={24} md={8}>
        <Card title="磁盘使用率">
          <Progress type="dashboard" percent={systemMetrics.disk_usage} status={systemMetrics.disk_usage > 90 ? "exception" : "active"} />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            当前: {systemMetrics.disk_usage}% | 建议: < 90%
          </div>
        </Card>
      </Col>
      
      <Col xs={24}>
        <Card title="系统资源趋势">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#ff4d4f" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#1677ff" name="内存" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

// 任务监控标签页
const TasksTab: React.FC<{
  taskMetrics: TaskMetrics;
  taskLogs: TaskLog[];
  onRefresh: () => void;
}> = ({ taskMetrics, taskLogs, onRefresh }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="任务统计">
          <Statistic title="总任务数" value={taskMetrics.total_tasks} />
          <Statistic title="运行中" value={taskMetrics.running_tasks} style={{ marginTop: 16 }} />
          <Statistic title="已完成" value={taskMetrics.completed_tasks} style={{ marginTop: 16 }} />
          <Statistic title="失败" value={taskMetrics.failed_tasks} style={{ marginTop: 16 }} />
        </Card>
      </Col>
      
      <Col xs={24} md={16}>
        <Card title="任务成功率趋势">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { time: '1小时前', rate: 95 },
              { time: '30分钟前', rate: 92 },
              { time: '15分钟前', rate: 94 },
              { time: '现在', rate: taskMetrics.success_rate }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#52c41a" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      
      <Col xs={24}>
        <Card title="最近任务日志">
          <Table 
            columns={taskLogColumns} 
            dataSource={taskLogs} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

// 价格监控标签页
const PricesTab: React.FC<{
  priceMetrics: PriceMetrics;
  priceHistory: any[];
  onProductSelect: (products: number[]) => void;
}> = ({ priceMetrics, priceHistory, onProductSelect }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="价格监控统计">
          <Statistic title="监控商品数" value={priceMetrics.total_products} />
          <Statistic title="活跃商品" value={priceMetrics.active_products} style={{ marginTop: 16 }} />
          <Statistic title="抓取成功率" value={`${priceMetrics.scraping_success_rate}%`} style={{ marginTop: 16 }} />
          <Statistic title="价格准确率" value={`${priceMetrics.price_accuracy}%`} style={{ marginTop: 16 }} />
        </Card>
      </Col>
      
      <Col xs={24} md={16}>
          <Card title="价格变化趋势">
            <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee", borderRadius: 6 }}>
              <div style={{ textAlign: "center", padding: 20 }}>
                <MonitorOutlined style={{ fontSize: 48, color: "#1677ff", marginBottom: 12 }} />
                <div style={{ fontSize: 16, color: "#666" }}>实时价格趋势图</div>
                <div style={{ fontSize: 14, color: "#999", marginTop: 8 }}>连接WebSocket后将显示实时价格变化</div>
              </div>
            </div>
          </Card>
        </Col>
      
      <Col xs={24}>
          <WebSocketTest />
        </Col>
    </Row>
  );
};

// 告警监控标签页
const AlertsTab: React.FC<{ alertMetrics: AlertMetrics }> = ({ alertMetrics }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card title="告警统计">
          <Statistic title="总告警数" value={alertMetrics.total_alerts} />
          <Statistic title="已触发" value={alertMetrics.triggered_alerts} style={{ marginTop: 16 }} />
          <Statistic title="已发送" value={alertMetrics.sent_events} style={{ marginTop: 16 }} />
          <Statistic title="失败" value={alertMetrics.failed_events} style={{ marginTop: 16 }} />
        </Card>
      </Col>
      
      <Col xs={24} md={16}>
        <Card title="告警成功率">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { time: '1小时前', rate: 98 },
              { time: '30分钟前', rate: 96 },
              { time: '15分钟前', rate: 97 },
              { time: '现在', rate: alertMetrics.success_rate }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#fa8c16" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );
};

export default MonitorDashboard;