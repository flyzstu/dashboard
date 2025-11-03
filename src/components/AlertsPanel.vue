<template>
  <div class="content" style="overflow:auto;">
    <ul class="alert-list">
      <li class="alert-item" v-for="(a, idx) in displayAlerts" :key="a.id + '-' + idx">
        <span class="level" :class="levelClass(a.level)">{{ levelText(a.level) }}</span>
        <span class="msg">{{ a.message }}</span>
        <span class="time">{{ a.time }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const alerts = ref([]);
let timer;

const samples = [
  'CPU 使用率超过阈值',
  '磁盘空间不足 10%',
  '网络延迟升高',
  '内存占用异常',
  '服务重启成功',
  '检测到连接中断',
  '应用响应超时',
  'DNS 解析失败',
  '负载均衡异常',
  '写入 IO 飙升'
];

function pad(n) { return String(n).padStart(2, '0'); }
function nowStr() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function randomLevel() {
  const r = Math.random();
  if (r < 0.15) return 'critical';
  if (r < 0.45) return 'warn';
  return 'info';
}

function pushAlert() {
  alerts.value.unshift({
    id: cryptoRandomId(),
    level: randomLevel(),
    message: samples[Math.floor(Math.random() * samples.length)],
    time: nowStr(),
  });
  if (alerts.value.length > 50) alerts.value.pop();
}

function cryptoRandomId() {
  // Simple random id fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

onMounted(() => {
  for (let i = 0; i < 8; i++) pushAlert();
  timer = setInterval(() => {
    const bursts = Math.random() < 0.2 ? 2 : 1;
    for (let i = 0; i < bursts; i++) pushAlert();
  }, 3000);
});

onBeforeUnmount(() => clearInterval(timer));

const displayAlerts = computed(() => alerts.value.slice(0, 10));

function levelClass(level) {
  return level === 'critical' ? 'level-critical' : level === 'warn' ? 'level-warn' : 'level-info';
}
function levelText(level) {
  return level === 'critical' ? '严重' : level === 'warn' ? '警告' : '信息';
}
</script>

<style scoped>
</style>
