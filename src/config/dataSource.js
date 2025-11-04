export const SUPPORTED_DATA_SOURCES = ['random', 'rest', 'websocket'];

export const DEFAULT_DATA_SOURCE_CONFIG = {
  type: 'random',
  options: {},
};

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[DataSourceConfig] 无法解析 JSON 配置:', error);
    return null;
  }
}

function normalizeType(type) {
  if (!type) return DEFAULT_DATA_SOURCE_CONFIG.type;
  const normalized = String(type).trim().toLowerCase();
  return SUPPORTED_DATA_SOURCES.includes(normalized) ? normalized : DEFAULT_DATA_SOURCE_CONFIG.type;
}

export function resolveDataSourceConfig(overrides = {}) {
  const globalConfig = typeof window !== 'undefined' ? window.__DATA_SOURCE__ : null;
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

  const envType = env.VITE_DATA_SOURCE_TYPE || env.VITE_DATA_SOURCE;
  const envEndpoint = env.VITE_DATA_SOURCE_ENDPOINT;
  const envPollInterval = env.VITE_DATA_SOURCE_POLL_INTERVAL;
  const envOptionsJson = env.VITE_DATA_SOURCE_OPTIONS;

  const resolved = {
    type: DEFAULT_DATA_SOURCE_CONFIG.type,
    options: { ...DEFAULT_DATA_SOURCE_CONFIG.options },
  };

  if (globalConfig && typeof globalConfig === 'object') {
    if (globalConfig.type) resolved.type = normalizeType(globalConfig.type);
    if (globalConfig.options && typeof globalConfig.options === 'object') {
      Object.assign(resolved.options, globalConfig.options);
    }
  }

  if (overrides && typeof overrides === 'object') {
    if (overrides.type) resolved.type = normalizeType(overrides.type);
    if (overrides.options && typeof overrides.options === 'object') {
      Object.assign(resolved.options, overrides.options);
    }
  }

  if (envType) resolved.type = normalizeType(envType);

  if (envEndpoint) {
    resolved.options.endpoint = envEndpoint;
  }

  if (envPollInterval) {
    const numeric = Number(envPollInterval);
    if (Number.isFinite(numeric) && numeric > 0) {
      resolved.options.interval = numeric;
    }
  }

  const envOptions = parseJson(envOptionsJson);
  if (envOptions && typeof envOptions === 'object') {
    Object.assign(resolved.options, envOptions);
  }

  return resolved;
}
