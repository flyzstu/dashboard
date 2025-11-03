<template>
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
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const servers = ref([]);
let timer;

function randomStatus() {
  const r = Math.random();
  if (r < 0.12) return 'offline';
  if (r < 0.30) return 'warning';
  return 'online';
}

function tick() {
  servers.value = servers.value.map((s) => ({
    ...s,
    status: Math.random() < 0.2 ? randomStatus() : s.status,
    cpu: Math.max(1, Math.min(99, Math.round(s.cpu + (Math.random() - 0.5) * 15))),
    mem: Math.max(1, Math.min(99, Math.round(s.mem + (Math.random() - 0.5) * 12))),
  }));
}

onMounted(() => {
  servers.value = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    name: `Server-${String(i + 1).padStart(2, '0')}`,
    status: randomStatus(),
    cpu: 20 + Math.round(Math.random() * 60),
    mem: 20 + Math.round(Math.random() * 60),
  }));
  timer = setInterval(tick, 2500);
});

onBeforeUnmount(() => clearInterval(timer));

function statusClass(status) {
  return status === 'online' ? 'success' : status === 'warning' ? 'warn' : 'danger';
}
function statusText(status) {
  return status === 'online' ? '在线' : status === 'warning' ? '预警' : '离线';
}

const onlineRate = computed(() => {
  const total = servers.value.length;
  const online = servers.value.filter((s) => s.status === 'online').length;
  return total ? Math.round((online / total) * 100) : 0;
});
</script>

<style scoped>
</style>
