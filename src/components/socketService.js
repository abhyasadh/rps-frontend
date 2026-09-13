let socket = null;
let isConnected = false;
let messageHandler = null;
let connectionCallbacks = null;

const GAME_ID_PATTERN = /^[a-f0-9]{32}$/;
const MAX_SERVER_MESSAGE_BYTES = 8192;

const configuredHttpUrl = import.meta.env.VITE_BACKEND_HTTP_URL;
const configuredWsUrl = import.meta.env.VITE_BACKEND_WS_URL;

const endpoint = (value, fallback, protocols) => {
  const url = new URL(value || fallback, window.location.origin);
  if (!protocols.includes(url.protocol)) {
    throw new Error("Unsupported backend protocol");
  }
  if (window.location.protocol === "https:" && protocols.includes("http:") && url.protocol === "http:") {
    throw new Error("Insecure backend endpoint");
  }
  return url.href.replace(/\/$/, "");
};

const getBackendHttpUrl = () => endpoint(
  configuredHttpUrl,
  `http://${import.meta.env.VITE_IP}:${import.meta.env.VITE_PORT}`,
  ["http:", "https:"]
);

const getBackendWsUrl = () => endpoint(
  configuredWsUrl,
  `ws://${import.meta.env.VITE_IP}:${import.meta.env.VITE_PORT}`,
  ["ws:", "wss:"]
);

const isValidGameId = (gameId) => (
  typeof gameId === "string" && GAME_ID_PATTERN.test(gameId)
);

const parseServerMessage = (event) => {
  if (!event || typeof event.data !== "string") return null;
  if (new TextEncoder().encode(event.data).byteLength > MAX_SERVER_MESSAGE_BYTES) return null;
  try {
    const message = JSON.parse(event.data);
    if (!message || typeof message !== "object" || Array.isArray(message)) return null;
    if (typeof message.type !== "string" || message.type.length > 64) return null;
    return message;
  } catch {
    return null;
  }
};

const isAllowedWebSocketUrl = (value) => {
  try {
    const actual = new URL(value);
    const expected = new URL(getBackendWsUrl());
    return actual.protocol === expected.protocol && actual.host === expected.host;
  } catch {
    return false;
  }
};

const connectToServer = (url, onMessage, onError, onClose) => {
  if (socket || !isAllowedWebSocketUrl(url)) return false;

  try {
    socket = new WebSocket(url);
  } catch {
    socket = null;
    return false;
  }

  connectionCallbacks = { onMessage, onError, onClose };
  socket.onopen = () => {
    isConnected = true;
  };
  socket.onmessage = (event) => {
    const message = parseServerMessage(event);
    if (!message) return;
    if (messageHandler) messageHandler(message);
    else if (connectionCallbacks?.onMessage) connectionCallbacks.onMessage(message);
  };
  socket.onerror = (error) => {
    connectionCallbacks?.onError?.(error);
  };
  socket.onclose = () => {
    const callbacks = connectionCallbacks;
    socket = null;
    isConnected = false;
    connectionCallbacks = null;
    messageHandler = null;
    callbacks?.onClose?.();
  };
  return true;
};

const sendMessage = (message) => {
  if (!isConnected || !socket || !message || typeof message !== "object") return false;
  const serialized = JSON.stringify(message);
  if (serialized.length > 4096) return false;
  socket.send(serialized);
  return true;
};

const disconnect = () => {
  if (socket) socket.close(1000, "Navigation");
  socket = null;
  isConnected = false;
  messageHandler = null;
  connectionCallbacks = null;
};

const setMessageHandler = (handler) => {
  messageHandler = typeof handler === "function" ? handler : null;
};

const isSocketConnected = () => isConnected && Boolean(socket);

export {
  connectToServer,
  disconnect,
  getBackendHttpUrl,
  getBackendWsUrl,
  isAllowedWebSocketUrl,
  isSocketConnected,
  isValidGameId,
  parseServerMessage,
  sendMessage,
  setMessageHandler,
};
