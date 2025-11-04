import { applySnapshot } from '../snapshot.js';

export function createRestAdapter(state, options = {}) {
  const {
    endpoint = '/api/dashboard',
    method = 'GET',
    headers = {},
    interval = 5000,
    transform,
    requestInit = {},
    credentials,
    onData,
    onError,
    immediate = true,
  } = options;

  let pollTimer = null;
  let abortController = null;

  const pollingInterval = Number(interval);
  const effectiveInterval = Number.isFinite(pollingInterval) && pollingInterval > 0 ? pollingInterval : 0;

  const buildRequestInit = () => {
    const init = { method, headers, ...requestInit };
    if (credentials) init.credentials = credentials;
    return init;
  };

  const fetchSnapshot = async () => {
    if (!endpoint) {
      console.warn('[DataSource:REST] 未设置 endpoint，跳过请求。');
      return;
    }

    try {
      if (abortController) abortController.abort();
      abortController = new AbortController();

      const init = { ...buildRequestInit(), signal: abortController.signal };

      const response = await fetch(endpoint, init);
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const processed = transform ? await transform(payload) : payload;

      if (typeof onData === 'function') {
        onData(processed);
      }

      applySnapshot(state, processed);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[DataSource:REST] 请求或解析失败:', error);
      if (typeof onError === 'function') {
        onError(error);
      }
    }
  };

  return {
    type: 'rest',
    start() {
      if (immediate) fetchSnapshot();
      if (effectiveInterval > 0) {
        pollTimer = setInterval(fetchSnapshot, effectiveInterval);
      }
    },
    stop() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    },
  };
}
