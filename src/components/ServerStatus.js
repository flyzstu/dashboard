const { ref, computed, onMounted, onBeforeUnmount } = Vue;

function randomStatus() {
  const r = Math.random();
  if (r < 0.12) return 'offline';
  if (r < 0.3) return 'warning';
  return 'online';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
    const servers = ref([]);
    let timer = null;

    function tick() {
      servers.value = servers.value.map((server) => ({
        ...server,
        status: Math.random() < 0.2 ? randomStatus() : server.status,
        cpu: clamp(Math.round(server.cpu + (Math.random() - 0.5) * 15), 1, 99),
        mem: clamp(Math.round(server.mem + (Math.random() - 0.5) * 12), 1, 99),
      }));
    }

    onMounted(() => {
      servers.value = Array.from({ length: 8 }).map((_, index) => ({
        id: index + 1,
        name: `Server-${String(index + 1).padStart(2, '0')}`,
        status: randomStatus(),
        cpu: 20 + Math.round(Math.random() * 60),
        mem: 20 + Math.round(Math.random() * 60),
      }));
      timer = setInterval(tick, 2500);
    });

    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
    });

    const onlineRate = computed(() => {
      const total = servers.value.length;
      const online = servers.value.filter((server) => server.status === 'online').length;
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
