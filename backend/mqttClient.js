const mqtt = require("mqtt");

let client = null;
let ready = false;

function isMqttEnabled() {
  return String(process.env.MQTT_ENABLED || "false").toLowerCase() === "true";
}

function getMqttUrl() {
  const url = (process.env.MQTT_URL || "").trim();
  if (url) return url;

  const host = (process.env.MQTT_HOST || "127.0.0.1").trim();
  const port = Number(process.env.MQTT_PORT || 1883);
  return `mqtt://${host}:${port}`;
}

function getTopicBase() {
  return (process.env.MQTT_TOPIC_BASE || "scholarship_system").trim();
}

function initMqtt() {
  if (!isMqttEnabled()) return null;
  if (client) return client;

  const url = getMqttUrl();
  const username = (process.env.MQTT_USERNAME || "").trim() || undefined;
  const password = (process.env.MQTT_PASSWORD || "").trim() || undefined;
  const clientId =
    (process.env.MQTT_CLIENT_ID || "").trim() ||
    `scholarship-backend-${Math.random().toString(16).slice(2)}`;

  client = mqtt.connect(url, {
    clientId,
    username,
    password,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 8000,
  });

  client.on("connect", () => {
    ready = true;
    console.log(`MQTT connected: ${url}`);
  });

  client.on("reconnect", () => {
    ready = false;
  });

  client.on("close", () => {
    ready = false;
  });

  client.on("error", (err) => {
    ready = false;
    console.error("MQTT error:", err?.message || err);
  });

  return client;
}

function publishAnnouncementIngested({ announcementId, source }) {
  if (!client || !ready) return false;
  const topic = `${getTopicBase()}/announcements/ingested`;
  const payload = JSON.stringify({
    announcementId,
    source: source || "unknown",
    ts: new Date().toISOString(),
  });
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) console.error("MQTT publish failed:", err?.message || err);
  });
  return true;
}

function subscribeToAnnouncementIngested(onMessage) {
  if (!client) return false;
  const topic = `${getTopicBase()}/announcements/ingested`;
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) console.error("MQTT subscribe failed:", err?.message || err);
  });

  client.on("message", (t, buf) => {
    if (t !== topic) return;
    try {
      const msg = JSON.parse(String(buf || ""));
      onMessage?.(msg);
    } catch (e) {
      console.error("MQTT message parse failed:", e?.message || e);
    }
  });
  return true;
}

module.exports = {
  initMqtt,
  isMqttEnabled,
  publishAnnouncementIngested,
  subscribeToAnnouncementIngested,
};

