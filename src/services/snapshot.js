export const MAX_ALERT_ITEMS = 50;

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampPercent(value, fallback = 0) {
  const numeric = toNumber(value, fallback);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
}

function replaceArray(target, items) {
  if (!Array.isArray(target)) return;
  const next = Array.isArray(items) ? items : [];
  target.splice(0, target.length, ...next);
}

function normalizeStatus(status) {
  const value = (status ?? '').toString().toLowerCase();
  if (['offline', 'down', 'critical', 'error', 'failed'].includes(value)) return 'offline';
  if (['warning', 'warn', 'degraded', 'partial'].includes(value)) return 'warning';
  return 'online';
}

function normalizeLevel(level) {
  const value = (level ?? '').toString().toLowerCase();
  if (['critical', 'fatal', 'high', 'severe'].includes(value)) return 'critical';
  if (['warning', 'warn', 'medium'].includes(value)) return 'warn';
  return 'info';
}

export function applySnapshot(state, snapshot) {
  if (!state || !snapshot || typeof snapshot !== 'object') return;

  const nowIso = new Date().toISOString();

  const resources = snapshot.resources ?? snapshot.resourceGauges ?? null;
  if (resources && typeof resources === 'object' && state.resourceGauges) {
    const cpuValue = resources.cpu ?? resources.cpuUsage;
    if (cpuValue !== undefined) {
      state.resourceGauges.cpu = clampPercent(cpuValue, state.resourceGauges.cpu);
    }

    const memValue =
      resources.mem ?? resources.memory ?? resources.memUsage ?? resources.memoryUsage ?? resources.ram;
    if (memValue !== undefined) {
      state.resourceGauges.mem = clampPercent(memValue, state.resourceGauges.mem);
    }

    const diskValue =
      resources.disk ?? resources.diskUsage ?? resources.storage ?? resources.diskPercent ?? resources.diskUse;
    if (diskValue !== undefined) {
      state.resourceGauges.disk = clampPercent(diskValue, state.resourceGauges.disk);
    }
  }

  const traffic = snapshot.traffic ?? snapshot.networkTraffic ?? null;
  if (traffic && typeof traffic === 'object' && state.networkTraffic) {
    const samplesSource = Array.isArray(traffic.samples)
      ? traffic.samples
      : Array.isArray(traffic.series)
      ? traffic.series
      : Array.isArray(traffic.points)
      ? traffic.points
      : [];

    const normalizedSamples = samplesSource.map((sample) => ({
      label: (sample?.label ?? sample?.time ?? sample?.timestamp ?? '').toString(),
      inbound: toNumber(
        sample?.inbound ?? sample?.in ?? sample?.ingress ?? sample?.inboundMbps ?? sample?.rx ?? 0,
        0,
      ),
      outbound: toNumber(
        sample?.outbound ?? sample?.out ?? sample?.egress ?? sample?.outboundMbps ?? sample?.tx ?? 0,
        0,
      ),
    }));

    const windowSize = Number(traffic.window ?? traffic.windowSize ?? traffic.limit ?? normalizedSamples.length);
    const effectiveWindow = Number.isFinite(windowSize) && windowSize > 0 ? windowSize : normalizedSamples.length;
    const trimmed = normalizedSamples.slice(-effectiveWindow);

    replaceArray(
      state.networkTraffic.labels,
      trimmed.map((item) => item.label),
    );
    replaceArray(
      state.networkTraffic.inbound,
      trimmed.map((item) => item.inbound),
    );
    replaceArray(
      state.networkTraffic.outbound,
      trimmed.map((item) => item.outbound),
    );
  }

  const diskUsage = snapshot.diskUsage ?? snapshot.disks ?? null;
  if (diskUsage && state.diskUsage) {
    const entriesSource = Array.isArray(diskUsage)
      ? diskUsage
      : Array.isArray(diskUsage.entries)
      ? diskUsage.entries
      : Array.isArray(diskUsage.list)
      ? diskUsage.list
      : [];

    const normalizedDisks = entriesSource.map((item, index) => ({
      mount: (item?.mount ?? item?.name ?? item?.path ?? `/disk-${index + 1}`).toString(),
      used: clampPercent(item?.used ?? item?.usage ?? item?.usedPercent ?? item?.value ?? 0),
    }));

    replaceArray(
      state.diskUsage.labels,
      normalizedDisks.map((item) => item.mount),
    );
    replaceArray(
      state.diskUsage.used,
      normalizedDisks.map((item) => item.used),
    );
  }

  const servers = snapshot.servers ?? snapshot.serverStatus ?? null;
  if (servers && Array.isArray(servers) && Array.isArray(state.serverStatus)) {
    const normalizedServers = servers.map((item, index) => ({
      id: item?.id ?? item?.serverId ?? item?.uuid ?? index + 1,
      name: (item?.name ?? item?.host ?? item?.hostname ?? `Server-${String(index + 1).padStart(2, '0')}`).toString(),
      status: normalizeStatus(item?.status ?? item?.state),
      cpu: clampPercent(item?.cpu ?? item?.cpuUsage ?? item?.cpuPercent ?? 0),
      mem: clampPercent(item?.mem ?? item?.memory ?? item?.memoryUsage ?? item?.memUsage ?? 0),
    }));

    replaceArray(state.serverStatus, normalizedServers);
  }

  const alerts = snapshot.alerts ?? snapshot.events ?? null;
  if (alerts && Array.isArray(alerts) && Array.isArray(state.alerts)) {
    const normalizedAlerts = alerts.map((item, index) => ({
      id: (item?.id ?? item?.uuid ?? item?.eventId ?? `alert-${index}`).toString(),
      level: normalizeLevel(item?.level ?? item?.severity ?? item?.priority),
      message: (item?.message ?? item?.title ?? '').toString(),
      time: (item?.time ?? item?.occurredAt ?? item?.timestamp ?? item?.createdAt ?? nowIso).toString(),
    }));

    replaceArray(state.alerts, normalizedAlerts.slice(0, MAX_ALERT_ITEMS));
  }
}
