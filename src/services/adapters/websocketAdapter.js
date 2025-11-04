import { applySnapshot } from '../snapshot.js';

export function createWebSocketAdapter(state, options = {}) {
  const {
    url,
    protocols,
    mapMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectInterval = 5000,
    heartbeatInterval,
    heartbeatMessage = 'ping',
  } = options;

  let socket = null;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let active = false;

  const shouldReconnect = reconnect !== false;
  const effectiveReconnectInterval = Number.isFinite(Number(reconnectInterval)) && Number(reconnectInterval) > 0
    ? Number(reconnectInterval)
    : 5000;

  const mapFn = typeof mapMessage === 'function'
    ? mapMessage
    : (raw) => {
        if (raw === null || raw === undefined) return null;
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch (error) {
            console.warn('[DataSource:WebSocket] 无法解析消息 JSON:', error);
            return null;
          }
        }
        return raw;
      };

  const sendHeartbeat = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const payload = typeof heartbeatMessage === 'function' ? heartbeatMessage() : heartbeatMessage;
    if (payload === undefined) return;
    if (typeof payload === 'string' || payload instanceof ArrayBuffer || payload instanceof Blob) {
      socket.send(payload);
      return;
    }
    try {
      socket.send(JSON.stringify(payload));
    } catch (error) {
      console.error('[DataSource:WebSocket] 发送心跳失败:', error);
    }
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    const interval = Number(heartbeatInterval);
    if (!Number.isFinite(interval) || interval <= 0) return;
    heartbeatTimer = setInterval(sendHeartbeat, interval);
  };

  const cleanupSocket = () => {
    stopHeartbeat();
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      socket = null;
    }
  };

  const scheduleReconnect = () => {
    if (!active || !shouldReconnect) return;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, effectiveReconnectInterval);
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const handleMessage = (event) => {
    try {
      const payload = mapFn(event.data, state, event);
      if (payload) {
        applySnapshot(state, payload);
      }
    } catch (error) {
      console.error('[DataSource:WebSocket] 处理数据失败:', error);
      if (typeof onError === 'function') {
        onError(error, event);
      }
    }
  };

  function connect() {
    if (!active) return;
    if (!url) {
      console.warn('[DataSource:WebSocket] 未配置 URL，无法建立连接。');
      return;
    }

    cleanupSocket();
    clearReconnect();

    try {
      socket = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    } catch (error) {
      console.error('[DataSource:WebSocket] 创建 WebSocket 失败:', error);
      if (typeof onError === 'function') onError(error);
      scheduleReconnect();
      return;
    }

    socket.onopen = (event) => {
      if (typeof onOpen === 'function') onOpen(event);
      startHeartbeat();
    };

    socket.onmessage = handleMessage;

    socket.onerror = (event) => {
      console.error('[DataSource:WebSocket] 连接发生错误。', event);
      if (typeof onError === 'function') onError(event);
    };

    socket.onclose = (event) => {
      stopHeartbeat();
      if (typeof onClose === 'function') onClose(event);
      cleanupSocket();
      scheduleReconnect();
    };
  }

  return {
    type: 'websocket',
    start() {
      if (active) return;
      active = true;
      connect();
    },
    stop() {
      active = false;
      clearReconnect();
      cleanupSocket();
    },
  };
}
