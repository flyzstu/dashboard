# 数据中心监控大屏

## 项目简介
数据中心监控大屏是一个基于 **Vue 3** 与 **ECharts** 打造的实时可视化监控面板，适用于展示服务器集群的运行状态、网络流量、资源使用率及告警信息。项目以静态页面形式交付，可直接部署到 GitHub Pages 或任何静态文件服务器。

## 功能特性
- **总览面板**：展示大屏标题与实时时钟，营造值班场景氛围。
- **服务器状态卡片**：动态模拟多台服务器的在线、预警、离线状态及 CPU/内存占用比例。
- **网络流量监控**：实时折线图展示过去 60 秒的入站与出站带宽变化。
- **磁盘使用分析**：TOP5 分区的使用率柱状图，支持动态抖动模拟。
- **资源使用率仪表盘**：CPU、内存、磁盘的百分比仪表，实时刷新。
- **告警队列**：滚动显示最近告警事件，区分严重、警告、信息级别。
- **自适应布局**：CSS Grid + Flexbox 架构，适配典型大屏比例与分辨率。

## 技术栈
- **Vue.js 3 (全局构建)**：通过 CDN 直接引入，使用组合式 API 构建组件。
- **Vite**：提供开发服务器与构建流程。
- **ECharts 5**：负责各类图表渲染与动态效果。
- **原生 CSS**：使用现代 CSS 变量、渐变与滤镜打造深色系大屏视觉。

## 在线演示
- GitHub Pages：<https://flyzstu.github.io/dashboard/>

> 如需在企业内网或其他平台演示，可按下方“部署说明”进行静态资源发布。

## 效果展示
当前仓库暂未提供静态截图，可通过在线演示链接或本地运行查看实时效果。若需要将截图展示在 README 中，建议将图片放置于 `docs/` 目录并在此处引用。

## 本地开发指南
### 环境准备
- Node.js ≥ 18
- npm ≥ 9（随 Node.js LTS 安装即可满足）

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```
开发服务器默认监听 <http://localhost:5173>，支持热更新，可实时预览图表变化。

### 生产构建
```bash
npm run build
```
构建产物将输出至 `dist/` 目录，可直接部署为静态站点。

### 构建结果预览（可选）
```bash
npm run preview
```
在本地以生产模式预览打包结果（默认端口 4173）。

## 项目结构
```text
.
├── docs
│   └── data-integration.md     # 真实数据接入指南
├── index.html                  # 入口 HTML，加载全局 Vue 与 ECharts CDN
├── package.json                # 项目信息与脚本命令
├── package-lock.json           # 锁定依赖版本
├── vite.config.js              # Vite 配置
└── src
    ├── config
    │   └── dataSource.js       # 数据源类型及参数解析
    ├── services
    │   ├── adapters            # 各类数据源适配器
    │   │   ├── randomAdapter.js
    │   │   ├── restAdapter.js
    │   │   └── websocketAdapter.js
    │   ├── dashboardStore.js   # 全局响应式数据仓库
    │   ├── dataSourceManager.js # 数据源调度管理
    │   └── snapshot.js         # 快照归一化工具
    ├── main.js                 # 应用入口，挂载 Vue 实例
    ├── App.js                  # 根组件，定义页面布局
    ├── style.css               # 全局样式与主题
    └── components              # 功能组件目录
        ├── AlertsPanel.js      # 告警列表
        ├── DiskUsage.js        # 磁盘使用柱状图
        ├── EChart.js           # ECharts 通用封装
        ├── NetworkTraffic.js   # 网络流量折线图
        ├── ResourceGauges.js   # CPU/内存/磁盘仪表
        └── ServerStatus.js     # 服务器状态卡片
```

## 真实数据接入
如需接入真实数据，请查阅 [docs/data-integration.md](./docs/data-integration.md)，其中提供了数据格式规范、配置方法以及 REST/WebSocket 对接示例。

## 部署说明（GitHub Pages 示例）
1. 执行 `npm run build`，生成 `dist/` 目录。
2. 将 `dist/` 目录内容推送到仓库的 `gh-pages` 分支（可使用 `gh-pages` npm 包或 GitHub Actions 自动化）。
3. 在 GitHub 仓库的 **Settings → Pages** 中，将源设置为 `gh-pages` 分支。
4. 稍候片刻即可通过 `https://<your-username>.github.io/dashboard/` 访问上线版本。

如需部署到企业服务器，只需将 `dist/` 中的静态文件上传至第三方 CDN 或任意静态站点托管服务即可。

## 贡献指南
欢迎社区与团队成员共同完善大屏数据可视化：
1. Fork 本仓库或在组织内创建新分支。
2. 基于 `main` 创建功能分支并完成开发。
3. 运行 `npm run build` 确保能够正常打包。
4. 提交 Pull Request，描述修改内容与测试情况。
5. 由仓库维护者 Code Review 后合并。

如发现 bug 或希望新增图表模块，亦可通过 Issue 进行讨论。
