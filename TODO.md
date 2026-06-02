# TODO - MQTT implementation (end-to-end)

- [ ] Find the code path that creates/inserts rows into `scholarship_announcements` (announcement ingestion).
- [ ] After successful insert, publish MQTT message to `${MQTT_TOPIC_BASE}/announcements/ingested` with `{ announcementId, source }`.
- [ ] Ensure publishing uses `MQTT_ENABLED` and reuses `initMqtt()` client.
- [ ] Add safe logging on publish failures.
- [ ] Verify end-to-end: an ingested announcement publishes MQTT; subscriber triggers `dispatchAnnouncement`.

