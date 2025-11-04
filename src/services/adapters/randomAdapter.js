import { MAX_ALERT_ITEMS } from '../snapshot.js';

const WINDOW_SIZE = 60;

const alertSamples = [
  'CPU 使用率超过阈值',
  '磁盘空间不足 10%',
  '网络延迟升高',
  '内存占用异常',
  '服务重启成功',
  '检测到连接中断',
  '应用响应超时',
  'DNS 解析失败',
  '负载均衡异常',
  '写入 IO 飙升',
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function jitterPercent(value, amplitude = 10, min = 3, max = 97) {
  const delta = Math.round((Math.random() - 0.5) * amplitude);
  return clamp(value + delta, min, max);
}

function nextTrafficValue(current, max = 150) {
  const base = current + (Math.random() - 0.5) * 20;
  return clamp(Math.round(base), 2, max);
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function labelNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function randomStatus() {
  const r = Math.random();
  if (r < 0.12) return 'offline';
  if (r < 0.3) return 'warning';
  return 'online';
}

function randomAlertLevel() {
  const r = Math.random();
  if (r < 0.15) return 'critical';
  if (r < 0.45) return 'warn';
  return 'info';
}

function randomId() {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seedResourceGauges(state) {
  if (!state.resourceGauges) return;
  state.resourceGauges.cpu = 28;
  state.resourceGauges.mem = 46;
  state.resourceGauges.disk = 62;
}

function updateResourceGauges(state) {
  if (!state.resourceGauges) return;
  state.resourceGauges.cpu = jitterPercent(state.resourceGauges.cpu ?? 30);
  state.resourceGauges.mem = jitterPercent(state.resourceGauges.mem ?? 45);
  state.resourceGauges.disk = jitterPercent(state.resourceGauges.disk ?? 60);
}

function seedNetworkTraffic(state) {
  if (!state.networkTraffic) return;
  const { labels, inbound, outbound } = state.networkTraffic;
  if (!Array.isArray(labels) || !Array.isArray(inbound) || !Array.isArray(outbound)) return;

  labels.splice(0, labels.length);
  inbound.splice(0, inbound.length);
  outbound.splice(0, outbound.length);

  let inboundValue = Math.round(50 + Math.random() * 20);
  let outboundValue = Math.round(30 + Math.random() * 20);

  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    labels.push('');
    inboundValue = nextTrafficValue(inboundValue, 220);
    outboundValue = nextTrafficValue(outboundValue, 180);
    inbound.push(inboundValue);
    outbound.push(outboundValue);
  }
}

function tickNetworkTraffic(state) {
  if (!state.networkTraffic) return;
  const { labels, inbound, outbound } = state.networkTraffic;
  if (!Array.isArray(labels) || !Array.isArray(inbound) || !Array.isArray(outbound)) return;

  labels.push(labelNow());
  if (labels.length > WINDOW_SIZE) labels.shift();

  const lastIn = inbound.length ? inbound[inbound.length - 1] : 60;
  const lastOut = outbound.length ? outbound[outbound.length - 1] : 40;

  inbound.push(nextTrafficValue(lastIn, 220));
  outbound.push(nextTrafficValue(lastOut, 180));

  if (inbound.length > WINDOW_SIZE) inbound.shift();
  if (outbound.length > WINDOW_SIZE) outbound.shift();
}

function seedDiskUsage(state) {
  if (!state.diskUsage) return;
  const { labels, used } = state.diskUsage;
  if (!Array.isArray(labels) || !Array.isArray(used)) return;

  const initialLabels = ['/data', '/db', '/logs', '/backup', '/tmp'];
  const initialValues = [72, 58, 83, 45, 38];

  labels.splice(0, labels.length, ...initialLabels);
  used.splice(0, used.length, ...initialValues);
}

function updateDiskUsage(state) {
  if (!state.diskUsage) return;
  const { used } = state.diskUsage;
  if (!Array.isArray(used)) return;

  for (let i = 0; i < used.length; i += 1) {
    used[i] = jitterPercent(used[i] ?? 50, 6, 5, 95);
  }
}

function seedServers(state) {
  if (!Array.isArray(state.serverStatus)) return;

  state.serverStatus.splice(0, state.serverStatus.length);
  for (let i = 0; i < 8; i += 1) {
    state.serverStatus.push({
      id: i + 1,
      name: `Server-${pad(i + 1)}`,
      status: randomStatus(),
      cpu: 20 + Math.round(Math.random() * 60),
      mem: 20 + Math.round(Math.random() * 60),
    });
  }
}

function updateServers(state) {
  if (!Array.isArray(state.serverStatus)) return;
  state.serverStatus.forEach((server) => {
    if (Math.random() < 0.2) server.status = randomStatus();
    server.cpu = clamp(Math.round((server.cpu ?? 50) + (Math.random() - 0.5) * 15), 1, 99);
    server.mem = clamp(Math.round((server.mem ?? 50) + (Math.random() - 0.5) * 12), 1, 99);
  });
}

function seedAlerts(state) {
  if (!Array.isArray(state.alerts)) return;
  state.alerts.splice(0, state.alerts.length);
  for (let i = 0; i < 8; i += 1) {
    pushAlert(state);
  }
}

function pushAlert(state) {
  if (!Array.isArray(state.alerts)) return;
  state.alerts.unshift({
    id: randomId(),
    level: randomAlertLevel(),
    message: alertSamples[Math.floor(Math.random() * alertSamples.length)],
    time: labelNow(),
  });
  if (state.alerts.length > MAX_ALERT_ITEMS) {
    state.alerts.length = MAX_ALERT_ITEMS;
  }
}

function updateAlerts(state) {
  const bursts = Math.random() < 0.2 ? 2 : 1;
  for (let i = 0; i < bursts; i += 1) pushAlert(state);
}

export function createRandomAdapter(state) {
  const timers = new Set();

  const register = (intervalId) => {
    if (intervalId) timers.add(intervalId);
    return intervalId;
  };

  const clearAll = () => {
    timers.forEach((id) => clearInterval(id));
    timers.clear();
  };

  return {
    type: 'random',
    start() {
      clearAll();
      seedResourceGauges(state);
      seedNetworkTraffic(state);
      seedDiskUsage(state);
      seedServers(state);
      seedAlerts(state);

      updateResourceGauges(state);
      tickNetworkTraffic(state);
      updateDiskUsage(state);
      updateServers(state);
      updateAlerts(state);

      register(setInterval(() => updateResourceGauges(state), 2000));
      register(setInterval(() => tickNetworkTraffic(state), 1000));
      register(setInterval(() => updateDiskUsage(state), 2500));
      register(setInterval(() => updateServers(state), 2500));
      register(setInterval(() => updateAlerts(state), 3000));
    },
    stop() {
      clearAll();
    },
  };
}
