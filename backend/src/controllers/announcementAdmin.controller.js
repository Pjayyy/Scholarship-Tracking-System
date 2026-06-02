const db = require("../services/db.js");
const { dispatchAnnouncement } = require("../services/announcementDispatcher.js");
const { publishAnnouncementIngested } = require("../services/mqttClient.js");
const { announcementEvents } = require("../events/announcementEvents.js");

function requireNonEmpty(value, fieldName) {
  const v = typeof value === "string" ? value.trim() : value;
  if (!v) {
    const err = new Error(`${fieldName} is required`);
    err.statusCode = 400;
    throw err;
  }
  return v;
}

async function createAnnouncement(req, res) {
  try {
    const title = requireNonEmpty(req.body?.title, "title");
    const bodyText = String(req.body?.bodyText || "").slice(0, 65000);
    const fromAddress = req.body?.fromAddress ? String(req.body.fromAddress).trim() : null;
    const source = req.body?.source ? String(req.body.source).trim() : "admin";

    const [result] = await db.query(
      `INSERT INTO scholarship_announcements
        (source, title, body_text, from_address, received_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [source, title.slice(0, 500), bodyText, fromAddress]
    );

    const announcementId = result?.insertId;
    if (!announcementId) {
      return res.status(500).json({ status: "error", message: "Insert failed" });
    }

    // Emit in-process event + dispatch immediately (existing system behavior).
    announcementEvents.emit("ingested", { announcementId: Number(announcementId), source });
    await dispatchAnnouncement({ announcementId: Number(announcementId) });

    // Publish MQTT ingested event (best-effort) so external components can react.
    // Also persist dispatch/MQTT activity to make MQTT logs queryable.
    try {
      publishAnnouncementIngested({ announcementId: Number(announcementId), source });

      // Optional table: mqtt_logs(announcement_id, event_type, payload_json, created_at)
      // If the table doesn't exist, this will fail silently.
      try {
        await db.query(
          `INSERT INTO mqtt_logs (announcement_id, event_type, payload_json, created_at)
           VALUES (?, ?, ?, NOW())`,
          [Number(announcementId), "announcements.ingested", JSON.stringify({ source })]
        );
      } catch (_) {
        // ignore if mqtt_logs table isn't present
      }
    } catch (_) {
      // ignore
    }

    return res.json({ status: "success", data: { announcementId } });
  } catch (err) {
    const status = err?.statusCode || 500;
    return res.status(status).json({ status: "error", message: err.message || "Failed" });
  }
}

module.exports = { createAnnouncement };

