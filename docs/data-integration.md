# 真实数据接入指南

本文档详细说明如何将真实生产数据接入「数据中心监控大屏」项目，包括数据流转架构、数据格式规范、配置方式以及 REST / WebSocket 对接示例。按照本文步骤完成配置后，随机模拟数据可以被真实数据源替换，实现生产级的监控可视化。

## 架构概览

项目在 `src/services` 目录下新增了一层数据源抽象：

```
Vue 组件 (展示层)
        │
        ▼
Dashboard Store (src/services/dashboardStore.js)
        │
        ▼
数据源管理器 (src/services/dataSourceManager.js)
        │
        ├── 随机数据适配器 (random)
        ├── REST API 适配器 (rest)
        └── WebSocket 适配器 (websocket)
```

- 组件仅通过 `useDashboardStore()` 读取响应式状态，不再直接生成数据。
- `dataSourceManager` 根据配置选择合适的适配器，并负责启动 / 停止。
- 每个适配器收到的数据会通过 `applySnapshot` 统一映射到 Store 中，确保字段名称一致、数据结构稳定。

## 当前随机数据生成机制说明

`src/services/adapters/randomAdapter.js` 内置了和旧版本逻辑一致的模拟数据，实现要点：

- **资源监控（CPU/内存/磁盘）**：每 2 秒对百分比做 ±10% 的扰动。
- **网络流量**：维护 60 个采样点窗口，每秒追加一条（包含时间标签、入站/出站速率）。
- **磁盘使用**：对默认 5 个挂载点的使用率做 ±6% 的扰动。
- **服务器状态**：共 8 台服务器，周期性随机切换状态并抖动 CPU/内存占比。
- **告警列表**：每 3 秒产生 1~2 条告警，最多缓存 50 条，展示最新 10 条。

了解随机数据的生成方式有助于在真实数据不足时构造对标的测试数据，或在调试阶段快速回退到模拟模式。

## 数据接口规范与 JSON Schema

真实数据接入时建议返回统一的 Dashboard 快照（Snapshot）。以下 JSON Schema 描述了推荐格式：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DashboardPayload",
  "type": "object",
  "required": ["resources", "traffic", "disks", "servers", "alerts"],
  "properties": {
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "生成快照的时间"
    },
    "resources": {
      "type": "object",
      "description": "整体资源占用率",
      "required": ["cpu", "mem", "disk"],
      "properties": {
        "cpu": { "type": "number", "minimum": 0, "maximum": 100 },
        "mem": { "type": "number", "minimum": 0, "maximum": 100 },
        "disk": { "type": "number", "minimum": 0, "maximum": 100 },
        "memory": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "traffic": {
      "type": "object",
      "description": "网络流量曲线",
      "required": ["window", "samples"],
      "properties": {
        "window": { "type": "integer", "minimum": 1, "maximum": 600 },
        "samples": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["label", "inbound", "outbound"],
            "properties": {
              "label": { "type": "string" },
              "inbound": { "type": "number", "minimum": 0 },
              "outbound": { "type": "number", "minimum": 0 }
            }
          }
        }
      }
    },
    "disks": {
      "type": "array",
      "description": "磁盘分区使用情况",
      "items": {
        "type": "object",
        "required": ["mount", "used"],
        "properties": {
          "mount": { "type": "string" },
          "used": { "type": "number", "minimum": 0, "maximum": 100 }
        }
      }
    },
    "servers": {
      "type": "array",
      "description": "服务器列表",
      "items": {
        "type": "object",
        "required": ["id", "name", "status", "cpu", "mem"],
        "properties": {
          "id": { "type": ["string", "number"] },
          "name": { "type": "string" },
          "status": {
            "type": "string",
            "enum": ["online", "warning", "offline", "warn", "down", "critical"]
          },
          "cpu": { "type": "number", "minimum": 0, "maximum": 100 },
          "mem": { "type": "number", "minimum": 0, "maximum": 100 },
          "memory": { "type": "number", "minimum": 0, "maximum": 100 }
        }
      }
    },
    "alerts": {
      "type": "array",
      "description": "告警事件",
      "items": {
        "type": "object",
        "required": ["id", "level", "message"],
        "properties": {
          "id": { "type": "string" },
          "level": {
            "type": "string",
            "enum": ["critical", "warn", "info", "warning", "error"]
          },
          "message": { "type": "string" },
          "time": { "type": "string" },
          "timestamp": { "type": "string" }
        }
      }
    }
  },
  "additionalProperties": true
}
```

> 说明：Schema 中对字段做了冗余兼容（如 `mem`/`memory`、`warn`/`warning`），`applySnapshot` 会自动规整到应用内部使用的字段。

## 数据字段说明

| 模块 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| 资源占用 resources | cpu / mem / disk | number (0-100) | 分别代表 CPU、内存、磁盘使用率 |
| 网络流量 traffic | window | number | 采样窗口大小（建议与数组长度一致） |
|  | samples[].label | string | 时间标签，可为空字符串 |
|  | samples[].inbound / outbound | number | 入站 / 出站带宽，单位自定义（文案为 MB/s） |
| 磁盘使用 disks | mount | string | 挂载点名称 |
|  | used | number (0-100) | 使用率百分比 |
| 服务器 servers | id | string/number | 唯一标识 |
|  | name | string | 展示名称 |
|  | status | string | 在线状态：`online` / `warning` / `offline` |
|  | cpu / mem | number (0-100) | 资源使用率 |
| 告警 alerts | id | string | 唯一标识（页面使用 `id + 索引`） |
|  | level | string | `critical` / `warn` / `info` |
|  | message | string | 告警描述 |
|  | time | string | 展示时间，支持 HH:mm:ss 或 ISO 格式 |

## 配置方式

### 1. Vite 环境变量

在构建或运行时可通过 `.env`/命令行设置以下变量：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `VITE_DATA_SOURCE_TYPE` | 选择数据源类型，支持 `random` / `rest` / `websocket` | `VITE_DATA_SOURCE_TYPE=rest` |
| `VITE_DATA_SOURCE_ENDPOINT` | REST 适配器请求地址 | `VITE_DATA_SOURCE_ENDPOINT=https://api.example.com/dashboard` |
| `VITE_DATA_SOURCE_POLL_INTERVAL` | REST 轮询间隔（毫秒） | `VITE_DATA_SOURCE_POLL_INTERVAL=5000` |
| `VITE_DATA_SOURCE_OPTIONS` | 其他配置，JSON 字符串形式 | `VITE_DATA_SOURCE_OPTIONS={"headers":{"Authorization":"Bearer xxx"}}` |

### 2. 运行时全局配置

对于纯静态部署，可在 `index.html` 注入全局变量：

```html
<script>
  window.__DATA_SOURCE__ = {
    type: 'rest',
    options: {
      endpoint: '/api/dashboard',
      interval: 3000,
      transform(payload) {
        // 可选：将后端返回的结构映射为标准 Snapshot
        return payload.data;
      },
      headers: {
        Authorization: 'Bearer xxx'
      }
    }
  };
</script>
```

该配置会优先于默认值，被 `resolveDataSourceConfig` 自动合并（并保留函数类型字段）。

### 3. 代码动态切换

在应用运行时也可以通过 `switchDataSource` 手动切换：

```js
import { switchDataSource } from './services/dataSourceManager.js';

// 切换到 REST 数据源
await switchDataSource('rest', { endpoint: '/api/dashboard', interval: 5000 });
```

## REST API 对接示例

以下示例演示如何启动一个返回标准快照的 REST 服务，并将前端指向该接口：

```js
// mock-server.js (Node/Express 示例)
import express from 'express';

const app = express();

app.get('/api/dashboard', (req, res) => {
  const now = new Date();
  res.json({
    timestamp: now.toISOString(),
    resources: { cpu: 48, mem: 62, disk: 71 },
    traffic: {
      window: 60,
      samples: Array.from({ length: 60 }).map((_, idx) => ({
        label: idx === 59 ? now.toLocaleTimeString('zh-CN', { hour12: false }) : '',
        inbound: 80 + Math.random() * 20,
        outbound: 50 + Math.random() * 15,
      })),
    },
    disks: [
      { mount: '/data', used: 72 },
      { mount: '/db', used: 55 },
      { mount: '/logs', used: 83 },
      { mount: '/backup', used: 47 },
      { mount: '/tmp', used: 36 },
    ],
    servers: Array.from({ length: 8 }).map((_, index) => ({
      id: index + 1,
      name: `Server-${String(index + 1).padStart(2, '0')}`,
      status: index % 6 === 0 ? 'warning' : 'online',
      cpu: 20 + Math.random() * 60,
      mem: 30 + Math.random() * 50,
    })),
    alerts: [
      { id: 'a-1', level: 'critical', message: '数据库连接超时', time: '12:01:03' },
      { id: 'a-2', level: 'warn', message: 'CPU 使用率接近阈值', time: '12:00:25' },
    ],
  });
});

app.listen(7001, () => console.log('Mock dashboard api on http://localhost:7001')); 
```

前端配置：

```bash
# .env.local
VITE_DATA_SOURCE_TYPE=rest
VITE_DATA_SOURCE_ENDPOINT=http://localhost:7001/api/dashboard
VITE_DATA_SOURCE_POLL_INTERVAL=4000
```

构建或运行后即会定时轮询该接口，并自动刷新界面。

> 如果后端返回结构与 Schema 不完全一致，可以在配置中提供 `transform(payload)` 将数据转换为标准格式，再交由 `applySnapshot` 处理。

## WebSocket 对接示例

WebSocket 适配器支持持续推送增量或全量快照：

```js
// server.js (ws 库示例)
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 7200 });

wss.on('connection', (socket) => {
  const sendSnapshot = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      resources: { cpu: 42 + Math.random() * 10, mem: 60, disk: 68 },
      traffic: {
        window: 60,
        samples: Array.from({ length: 60 }).map((_, idx) => ({
          label: idx === 59 ? new Date().toLocaleTimeString('zh-CN', { hour12: false }) : '',
          inbound: 75 + Math.random() * 20,
          outbound: 40 + Math.random() * 12,
        })),
      },
      disks: [
        { mount: '/data', used: 70 + Math.random() * 5 },
        { mount: '/logs', used: 65 },
      ],
      servers: [
        { id: 'api-01', name: 'API-01', status: 'online', cpu: 55, mem: 48 },
        { id: 'api-02', name: 'API-02', status: 'warning', cpu: 72, mem: 61 },
      ],
      alerts: [
        { id: `ws-${Date.now()}`, level: 'info', message: '定时同步成功', time: new Date().toLocaleTimeString('zh-CN', { hour12: false }) },
      ],
    };
    socket.send(JSON.stringify(payload));
  };

  const timer = setInterval(sendSnapshot, 2000);
  socket.on('close', () => clearInterval(timer));
});
```

前端配置：

```html
<script>
  window.__DATA_SOURCE__ = {
    type: 'websocket',
    options: {
      url: 'ws://localhost:7200',
      reconnectInterval: 5000,
      heartbeatInterval: 15000,
      heartbeatMessage: { type: 'ping' },
    },
  };
</script>
```

如果后端只推送增量字段，可通过 `mapMessage` 自行整合：

```html
<script>
  window.__DATA_SOURCE__ = {
    type: 'websocket',
    options: {
      url: 'ws://localhost:7200',
      mapMessage(raw) {
        const payload = JSON.parse(raw);
        // 将增量数据合并成完整快照
        return window.mergeToSnapshot(payload);
      },
    },
  };
</script>
```

## 数据源扩展与自定义适配器

- 现有适配器源码位于 `src/services/adapters/`，可直接参考并新增自定义实现。
- 适配器只需返回包含 `start()` / `stop()` 方法的对象，同时在 `start` 内部根据需要订阅接口、事件或定时器。
- 当新的适配器准备就绪后，可在 `dataSourceManager.js` 注册工厂，并通过配置或 `switchDataSource` 指定新的 `type`。

自定义适配器示例：

```js
// src/services/adapters/graphqlAdapter.js
import { applySnapshot } from '../snapshot.js';

export function createGraphQLAdapter(state, options = {}) {
  let timer = null;

  async function pullOnce() {
    const { endpoint, query, fetcher = fetch } = options;
    if (!endpoint || !query) return;
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: JSON.stringify({ query }),
    });
    const result = await response.json();
    const snapshot = options.transform ? options.transform(result) : result.data.dashboard;
    applySnapshot(state, snapshot);
  }

  return {
    start() {
      pullOnce();
      const interval = Number(options.interval ?? 5000);
      if (Number.isFinite(interval) && interval > 0) {
        timer = setInterval(pullOnce, interval);
      }
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
```

然后在 `src/services/dataSourceManager.js` 中注册新的工厂函数：

```js
import { createGraphQLAdapter } from './adapters/graphqlAdapter.js';

const factories = {
  random: createRandomAdapter,
  rest: createRestAdapter,
  websocket: createWebSocketAdapter,
  graphql: createGraphQLAdapter,
};
```

此后即可在配置中使用 `type: 'graphql'`，其余步骤与内置适配器一致。

> 注意：自定义适配器应在 `stop()` 中释放所有资源（定时器、连接、事件监听），避免内存泄露。

## 完整操作步骤示例

1. **启动真实数据服务**：后端按照 JSON Schema 返回监控快照。
2. **配置前端环境**：在 `.env.local` 中设置 `VITE_DATA_SOURCE_TYPE=rest` 及相关参数，或通过 `window.__DATA_SOURCE__` 注入。
3. **本地验证**：运行 `npm run dev`，打开大屏页面，确认各面板展示的实时数据与后端保持一致。
4. **打包部署**：`npm run build` 后将 `dist` 部署至生产环境，并确保 API/WebSocket 地址对前端可访问。
5. **回退策略**：若真实数据通道临时不可用，可将配置改回 `random`，页面将自动恢复为模拟数据模式。

## 常见问题排查

| 问题 | 可能原因 | 处理建议 |
| --- | --- | --- |
| 页面无数据 | API 返回格式不符合 Schema | 检查后端字段名或在配置中增加 `transform` 映射 |
| REST 报错 401/403 | 身份认证缺失 | 在 `VITE_DATA_SOURCE_OPTIONS` 或 `window.__DATA_SOURCE__.options.headers` 中添加凭证 |
| WebSocket 间歇断开 | 服务端主动关闭或网络异常 | 启用 `reconnectInterval`、`heartbeatInterval` 以保持连接活性 |
| 指标显示异常值 | 后端数据未限制范围 | 在后端或 `transform` 中提前做裁剪与校验 |

---

通过以上机制，项目已经支持随机数据、REST API、WebSocket 三种数据源，并提供了清晰的扩展路径。只需按照本文档定义的格式与步骤即可无缝接入真实监控数据。
