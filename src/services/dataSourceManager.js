import { resolveDataSourceConfig } from '../config/dataSource.js';
import { getDashboardMutableState } from './dashboardStore.js';
import { createRandomAdapter } from './adapters/randomAdapter.js';
import { createRestAdapter } from './adapters/restAdapter.js';
import { createWebSocketAdapter } from './adapters/websocketAdapter.js';

const factories = {
  random: createRandomAdapter,
  rest: createRestAdapter,
  websocket: createWebSocketAdapter,
};

let currentAdapter = null;
let currentConfig = null;

function stopCurrentAdapter() {
  if (currentAdapter && typeof currentAdapter.stop === 'function') {
    currentAdapter.stop();
  }
  currentAdapter = null;
}

function startAdapter(adapter) {
  if (adapter && typeof adapter.start === 'function') {
    adapter.start();
  }
  return adapter;
}

function applyConfig(resolvedConfig) {
  if (!resolvedConfig || typeof resolvedConfig !== 'object') {
    resolvedConfig = resolveDataSourceConfig();
  }

  const state = getDashboardMutableState();
  stopCurrentAdapter();

  const factory = factories[resolvedConfig.type] || factories.random;
  currentAdapter = factory(state, resolvedConfig.options);
  currentConfig = resolvedConfig;

  return startAdapter(currentAdapter);
}

export function initDataSource(config) {
  const resolved = resolveDataSourceConfig(config);
  return applyConfig(resolved);
}

export function switchDataSource(type, options = {}) {
  const resolved = resolveDataSourceConfig({ type, options });
  return applyConfig(resolved);
}

export function getCurrentDataSource() {
  return {
    type: currentConfig?.type ?? 'random',
    options: currentConfig?.options ?? {},
    adapter: currentAdapter,
  };
}
