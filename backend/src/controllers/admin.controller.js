const {
  pollGmailAndIngest,
  isGmailIngestConfigured,
  getGmailConfig,
} = require("../services/gmailAnnouncements.js");

const db = require("../services/db.js");
const { announcementEvents } = require("../events/announcementEvents.js");

async function announcementsList(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT
          id,
          source,
          gmail_message_id AS gmailMessageId,
          title,
          body_text AS bodyText,
          from_address AS fromAddress,
          received_at AS receivedAt,
          created_at AS createdAt,
          email_dispatched_at AS emailDispatchedAt,
          dispatch_error AS dispatchError
        FROM scholarship_announcements
        ORDER BY id DESC
        LIMIT 200
      `
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function gmailSync(req, res) {
  try {
    if (!isGmailIngestConfigured()) {
      return res.status(503).json({
        status: "error",
        message:
          "Gmail ingest is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_ALLOWED_FROM_SUBSTRINGS (comma-separated), and run npm run gmail-oauth once.",
      });
    }

    const result = await pollGmailAndIngest();

    return res.json({ status: "success", data: result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("GMAIL_SYNC", err);
    return res.status(500).json({
      status: "error",
      message: err.message || "Gmail sync failed",
    });
  }
}

async function announcementsStream(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (eventName, data) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send("connected", { ts: new Date().toISOString() });

  const onIngested = (payload) => send("ingested", payload);
  const onDispatched = (payload) => send("dispatched", payload);

  announcementEvents.on("ingested", onIngested);
  announcementEvents.on("dispatched", onDispatched);

  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    announcementEvents.off("ingested", onIngested);
    announcementEvents.off("dispatched", onDispatched);
    res.end();
  });
}

module.exports = {
  announcementsList,
  gmailSync,
  announcementsStream,
};


