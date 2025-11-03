import ResourceGauges from './components/ResourceGauges.js';
import NetworkTraffic from './components/NetworkTraffic.js';
import AlertsPanel from './components/AlertsPanel.js';
import ServerStatus from './components/ServerStatus.js';
import DiskUsage from './components/DiskUsage.js';

const { ref, onMounted, onBeforeUnmount } = Vue;

export default {
  name: 'App',
  components: {
    ResourceGauges,
    NetworkTraffic,
    AlertsPanel,
    ServerStatus,
    DiskUsage,
  },
  template: `
    <div class="app-container">
      <header class="header">
        <div class="brand">
          <div class="title">数据中心监控大屏</div>
          <div class="subtitle">Vue 3 + ECharts 静态版</div>
        </div>
        <div class="clock">{{ now }}</div>
      </header>

      <main class="grid">
        <section class="panel" style="grid-column: 1; grid-row: span 2;">
          <div class="panel-header">
            <div class="panel-title">服务器状态</div>
            <div class="panel-subtitle">实时健康度</div>
          </div>
          <ServerStatus class="content" />
        </section>

        <section class="panel" style="grid-column: 2; grid-row: 1; min-height: 340px;">
          <div class="panel-header">
            <div class="panel-title">网络流量监控</div>
            <div class="panel-subtitle">过去 60 秒</div>
          </div>
          <NetworkTraffic class="content" />
        </section>

        <section class="panel" style="grid-column: 2; grid-row: 2; min-height: 320px;">
          <div class="panel-header">
            <div class="panel-title">磁盘使用情况</div>
            <div class="panel-subtitle">TOP5 分区</div>
          </div>
          <DiskUsage class="content" />
        </section>

        <section class="panel" style="grid-column: 3; grid-row: 1; min-height: 340px;">
          <div class="panel-header">
            <div class="panel-title">资源使用率</div>
            <div class="panel-subtitle">CPU / 内存 / 磁盘</div>
          </div>
          <ResourceGauges class="content" />
        </section>

        <section class="panel" style="grid-column: 3; grid-row: 2; min-height: 320px;">
          <div class="panel-header">
            <div class="panel-title">实时告警</div>
            <div class="panel-subtitle">最近事件</div>
          </div>
          <AlertsPanel class="content" />
        </section>
      </main>
    </div>
  `,
  setup() {
    const now = ref('');
    let timer = null;

    const updateClock = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    onMounted(() => {
      updateClock();
      timer = setInterval(updateClock, 1000);
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    return { now };
  },
};
