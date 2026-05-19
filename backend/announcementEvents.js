const { EventEmitter } = require("events");

// Simple in-process pub/sub for real-time UI updates (SSE/WebSocket/MQTT bridges).
const announcementEvents = new EventEmitter();

module.exports = { announcementEvents };

