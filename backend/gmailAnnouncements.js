const { google } = require("googleapis");
const db = require("./db.js");
const { publishAnnouncementIngested } = require("./mqttClient.js");
const { announcementEvents } = require("./announcementEvents.js");

function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GMAIL_REFRESH_TOKEN?.trim(),
    query:
      process.env.GMAIL_POLL_QUERY?.trim() ||
      "is:unread newer_than:60d",
    allowedSubstrings: (process.env.GMAIL_ALLOWED_FROM_SUBSTRINGS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };
}

function isGmailIngestConfigured() {
  const c = getGmailConfig();
  if (!c.clientId || !c.clientSecret || !c.refreshToken) {
    return false;
  }
  if (!c.allowedSubstrings.length) {
    return false;
  }
  if (process.env.GMAIL_INGEST_ENABLED === "false") {
    return false;
  }
  return true;
}

function buildOAuthClient() {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
    "http://127.0.0.1:49153/oauth2callback";

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

function headerValue(headers, name) {
  const lower = name.toLowerCase();
  const row = headers.find(
    (h) => h.name && h.name.toLowerCase() === lower
  );
  return row?.value || "";
}

function parseEmailFromFromHeader(fromHeader) {
  if (!fromHeader) return "";
  const m = fromHeader.match(/<([^>]+)>/);
  return (m ? m[1] : fromHeader).trim().toLowerCase();
}

function decodeBase64Url(data) {
  if (!data) return "";
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

function extractPlainFromPayload(payload) {
  if (!payload) return "";
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  const parts = payload.parts || [];
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }
  for (const part of parts) {
    if (part.parts) {
      const inner = extractPlainFromPayload(part);
      if (inner) return inner;
    }
  }
  for (const part of parts) {
    if (part.mimeType === "text/html" && part.body?.data) {
      const html = decodeBase64Url(part.body.data);
      return html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
    }
  }
  return "";
}

function fromAllowed(fromHeader, allowedSubstrings) {
  const email = parseEmailFromFromHeader(fromHeader);
  const blob = `${fromHeader || ""} ${email}`.toLowerCase();
  return allowedSubstrings.some((sub) => blob.includes(sub));
}

/**
 * Poll Gmail and insert new rows into scholarship_announcements.
 * @returns {Promise<{ scanned: number, inserted: number }>}
 */
const { dispatchAnnouncement } = require("./announcementDispatcher.js");

/**
 * Poll Gmail and insert new rows into scholarship_announcements.
 * Then dispatch portal notification + email.
 */
async function pollGmailAndIngest() {
  if (!isGmailIngestConfigured()) {
    return { scanned: 0, inserted: 0, skipped: "not_configured" };
  }

  const cfg = getGmailConfig();
  const auth = buildOAuthClient();
  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: cfg.query,
    maxResults: 20,
  });

  const messages = listRes.data.messages || [];
  let inserted = 0;

  for (const m of messages) {
    const id = m.id;
    if (!id) continue;

    const [existing] = await db.query(
      `SELECT id FROM scholarship_announcements WHERE gmail_message_id = ? LIMIT 1`,
      [id]
    );
    if (existing.length) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });

    const headers = full.data.payload?.headers || [];
    const subject = headerValue(headers, "Subject") || "(No subject)";
    const from = headerValue(headers, "From");

    if (!fromAllowed(from, cfg.allowedSubstrings)) {
      continue;
    }

    const bodyText =
      extractPlainFromPayload(full.data.payload) ||
      full.data.snippet ||
      "";

    const internalDate = full.data.internalDate
      ? new Date(Number(full.data.internalDate))
      : new Date();

    const title = subject.slice(0, 500);
    const body = bodyText.slice(0, 65000);

    const [result] = await db.query(
      `INSERT INTO scholarship_announcements
        (source, gmail_message_id, title, body_text, from_address, received_at)
       VALUES ('gmail', ?, ?, ?, ?, ?)`,
      [id, title, body, from || null, internalDate]
    );

    inserted += 1;

    // After insertion, dispatch portal notification + email.
    // Best effort; errors won't stop ingestion.
    try {
      const announcementId = result?.insertId;
      if (announcementId) {
        announcementEvents.emit("ingested", { announcementId, source: "gmail" });
        await dispatchAnnouncement({ announcementId });
        // Optional: publish MQTT event for real-time portal integrations.
        // Dispatch already happened above; MQTT is an extra signal for other clients.
        publishAnnouncementIngested({ announcementId, source: "gmail" });
      }
    } catch (e) {
      console.error(
        "Announcement dispatch failed:",
        e?.message || e
      );
    }
  }

  return { scanned: messages.length, inserted };
}

module.exports = {
  pollGmailAndIngest,
  isGmailIngestConfigured,
  getGmailConfig,
};
