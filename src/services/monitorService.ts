import axios from "axios";

const API_BASE = process.env.VITE_API_URL || "http://localhost:8000/api/v1";

// 系统指标接口
export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_connections: number;
  uptime: number;
}

// 任务指标接口
export interface TaskMetrics {
  total_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_response_time: number;
  queue_length: number;
}

// 价格指标接口
export interface PriceMetrics {
  total_products: number;
  active_products: number;
  last_update_time: string;
  avg_price_change: number;
  price_accuracy: number;
  scraping_success_rate: number;
}

// 告警指标接口
export interface AlertMetrics {
  total_alerts: number;
  triggered_alerts: number;
  sent_events: number;
  failed_events: number;
  success_rate: number;
}

// 任务日志接口
export interface TaskLog {
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

// 价格历史接口
export interface PriceHistory {
  timestamp: string;
  product_id: number;
  price: number;
  currency: string;
  change?: number;
}

// API错误处理
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 基础API配置
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error?.message || `请求失败 (${status})`;
      const code = data?.error?.code || "UNKNOWN_ERROR";
      return Promise.reject(new ApiError(message, status, code));
    } else if (error.request) {
      return Promise.reject(new ApiError("网络连接失败", 0, "NETWORK_ERROR"));
    } else {
      return Promise.reject(new ApiError("请求配置错误", 0, "REQUEST_ERROR"));
    }
  }
);

// 监控服务
export const monitorService = {
  // 获取系统指标
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await api.get("/system/status");
      return {
        cpu_usage: response.data.cpu_usage || 0,
        memory_usage: response.data.memory_usage || 0,
        disk_usage: response.data.disk_usage || 0,
        network_io: response.data.network_io || 0,
        active_connections: response.data.active_connections || 0,
        uptime: response.data.uptime || 0,
      };
    } catch (error) {
      console.error("获取系统指标失败:", error);
      // 返回默认值
      return {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        network_io: 0,
        active_connections: 0,
        uptime: 0,
      };
    }
  },

  // 获取任务指标
  async getTaskMetrics(): Promise<TaskMetrics> {
    try {
      const response = await api.get("/spider/tasks/metrics");
      return {
        total_tasks: response.data.total_tasks || 0,
        running_tasks: response.data.running_tasks || 0,
        completed_tasks: response.data.completed_tasks || 0,
        failed_tasks: response.data.failed_tasks || 0,
        success_rate: response.data.success_rate || 0,
        avg_response_time: response.data.avg_response_time || 0,
        queue_length: response.data.queue_length || 0,
      };
    } catch (error) {
      console.error("获取任务指标失败:", error);
      return {
        total_tasks: 0,
        running_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        success_rate: 0,
        avg_response_time: 0,
        queue_length: 0,
      };
    }
  },

  // 获取价格指标
  async getPriceMetrics(): Promise<PriceMetrics> {
    try {
      const response = await api.get("/products/metrics");
      return {
        total_products: response.data.total_products || 0,
        active_products: response.data.active_products || 0,
        last_update_time: response.data.last_update_time || new Date().toISOString(),
        avg_price_change: response.data.avg_price_change || 0,
        price_accuracy: response.data.price_accuracy || 0,
        scraping_success_rate: response.data.scraping_success_rate || 0,
      };
    } catch (error) {
      console.error("获取价格指标失败:", error);
      return {
        total_products: 0,
        active_products: 0,
        last_update_time: new Date().toISOString(),
        avg_price_change: 0,
        price_accuracy: 0,
        scraping_success_rate: 0,
      };
    }
  },

  // 获取告警指标
  async getAlertMetrics(): Promise<AlertMetrics> {
    try {
      const response = await api.get("/alerts/metrics");
      return {
        total_alerts: response.data.total_alerts || 0,
        triggered_alerts: response.data.triggered_alerts || 0,
        sent_events: response.data.sent_events || 0,
        failed_events: response.data.failed_events || 0,
        success_rate: response.data.success_rate || 0,
      };
    } catch (error) {
      console.error("获取告警指标失败:", error);
      return {
        total_alerts: 0,
        triggered_alerts: 0,
        sent_events: 0,
        failed_events: 0,
        success_rate: 0,
      };
    }
  },

  // 获取任务日志
  async getTaskLogs(params?: {
    page?: number;
    size?: number;
    status?: string;
    product_id?: number;
  }): Promise<{ items: TaskLog[]; total: number; page: number; size: number }> {
    try {
      const response = await api.get("/spider/tasks/logs", { params });
      return {
        items: response.data.items || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        size: response.data.size || 10,
      };
    } catch (error) {
      console.error("获取任务日志失败:", error);
      return {
        items: [],
        total: 0,
        page: 1,
        size: 10,
      };
    }
  },

  // 获取价格历史
  async getPriceHistory(
    product_id: number,
    params?: {
      start_date?: string;
      end_date?: string;
      granularity?: "hourly" | "daily" | "weekly";
    }
  ): Promise<PriceHistory[]> {
    try {
      const response = await api.get(`/products/${product_id}/history`, { params });
      return response.data.items || [];
    } catch (error) {
      console.error("获取价格历史失败:", error);
      return [];
    }
  },

  // 获取实时价格更新（WebSocket）
  createWebSocketConnection(): WebSocket {
    const apiUrl = process.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = apiUrl.replace("http", "ws") + "/ws/price-updates";
    
    const token = localStorage.getItem("token");
    const url = token ? `${wsUrl}?token=${token}` : wsUrl;
    
    return new WebSocket(url);
  },

  // 批量获取监控数据
  async getDashboardData(): Promise<{
    systemMetrics: SystemMetrics;
    taskMetrics: TaskMetrics;
    priceMetrics: PriceMetrics;
    alertMetrics: AlertMetrics;
  }> {
    try {
      const [system, task, price, alert] = await Promise.all([
        this.getSystemMetrics(),
        this.getTaskMetrics(),
        this.getPriceMetrics(),
        this.getAlertMetrics(),
      ]);

      return {
        systemMetrics: system,
        taskMetrics: task,
        priceMetrics: price,
        alertMetrics: alert,
      };
    } catch (error) {
      console.error("批量获取监控数据失败:", error);
      return {
        systemMetrics: { cpu_usage: 0, memory_usage: 0, disk_usage: 0, network_io: 0, active_connections: 0, uptime: 0 },
        taskMetrics: { total_tasks: 0, running_tasks: 0, completed_tasks: 0, failed_tasks: 0, success_rate: 0, avg_response_time: 0, queue_length: 0 },
        priceMetrics: { total_products: 0, active_products: 0, last_update_time: new Date().toISOString(), avg_price_change: 0, price_accuracy: 0, scraping_success_rate: 0 },
        alertMetrics: { total_alerts: 0, triggered_alerts: 0, sent_events: 0, failed_events: 0, success_rate: 0 },
      };
    }
  },

  // 刷新监控数据
  async refreshMonitorData(): Promise<void> {
    try {
      await api.post("/system/refresh");
    } catch (error) {
      console.error("刷新监控数据失败:", error);
      throw error;
    }
  },

  // 获取系统健康状态
  async getHealthStatus(): Promise<{
    status: string;
    services: Array<{ name: string; status: string; message?: string }>;
  }> {
    try {
      const response = await api.get("/health");
      return response.data;
    } catch (error) {
      console.error("获取健康状态失败:", error);
      return {
        status: "unknown",
        services: [],
      };
    }
  },
};

export default monitorService;