import { useDashboardStore } from '../services/dashboardStore.js';

const { computed } = window.Vue;

export default {
  name: 'ServerStatus',
  template: `
    <div class="content" style="display:flex; flex-direction:column; gap:8px;">
      <div class="card-list">
        <div class="server-card" v-for="s in servers" :key="s.id">
          <div class="server-name">{{ s.name }}</div>
          <div class="server-status">
            <span class="badge" :class="statusClass(s.status)">{{ statusText(s.status) }}</span>
          </div>
          <div class="server-metrics">CPU {{ s.cpu }}%</div>
          <div class="server-metrics">内存 {{ s.mem }}%</div>
          <div class="progress" style="grid-column: span 2;">
            <span :style="{ width: s.cpu + '%' }"></span>
          </div>
        </div>
      </div>
      <div class="footer-note">共 {{ servers.length }} 台服务器 · 在线率 {{ onlineRate }}%</div>
    </div>
  `,
  setup() {
    const store = useDashboardStore();

    const servers = computed(() => (Array.isArray(store.serverStatus) ? store.serverStatus : []));

    const onlineRate = computed(() => {
      const list = servers.value;
      const total = list.length;
      const online = list.filter((server) => server.status === 'online').length;
      return total ? Math.round((online / total) * 100) : 0;
    });

    const statusClass = (status) => (status === 'online' ? 'success' : status === 'warning' ? 'warn' : 'danger');
    const statusText = (status) => (status === 'online' ? '在线' : status === 'warning' ? '预警' : '离线');

    return {
      servers,
      onlineRate,
      statusClass,
      statusText,
    };
  },
};
