const nodemailer = require("nodemailer");
const db = require("./db.js");
const { announcementEvents } = require("./announcementEvents.js");

const inFlightDispatch = new Set();

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

function buildTransport() {
  const pool = String(process.env.SMTP_POOL || "true").toLowerCase() === "true";
  const maxConnections = Number(process.env.SMTP_MAX_CONNECTIONS || 5);
  const rateLimit = Number(process.env.SMTP_RATE_LIMIT || 0); // messages per rateDelta
  const rateDelta = Number(process.env.SMTP_RATE_DELTA_MS || 1000);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Boolean(process.env.SMTP_SECURE === "true"),
    pool,
    maxConnections: Number.isFinite(maxConnections) ? maxConnections : 5,
    rateLimit: Number.isFinite(rateLimit) && rateLimit > 0 ? rateLimit : undefined,
    rateDelta: Number.isFinite(rateDelta) ? rateDelta : undefined,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function mapLimit(items, limit, fn) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 1, 25));
  const results = new Array(items.length);

  let i = 0;
  const workers = Array.from({ length: Math.min(safeLimit, items.length) }).map(async () => {
    while (true) {
      const idx = i;
      i += 1;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

async function dispatchAnnouncement({ announcementId }) {
  if (inFlightDispatch.has(announcementId)) {
    return { ok: true, reason: "in_progress" };
  }

  inFlightDispatch.add(announcementId);

  try {
    const [aRows] = await db.query(
      `SELECT
        id,
        title,
        body_text AS bodyText,
        from_address AS fromAddress,
        created_at AS createdAt,
        email_dispatched_at AS emailDispatchedAt
      FROM scholarship_announcements
      WHERE id = ?
      LIMIT 1`,
      [announcementId]
    );

    if (!aRows || aRows.length === 0)
      return { ok: false, reason: "not_found" };

    const a = aRows[0];
    if (a.emailDispatchedAt) {
      return { ok: true, reason: "already_dispatched" };
    }

  // Portal notifications must reference students.student_id (FK on notifications.student_id).
  // Email recipients may come from either:
  // - users table (login accounts)
  // - students table (student master list)
  const [portalStudents] = await db.query(
    `SELECT
      s.student_id,
      s.email AS email
    FROM students s
    WHERE s.student_id IS NOT NULL
      AND s.student_id <> ''`
  );

  const [userStudents] = await db.query(
    `SELECT
      u.student_id,
      u.email AS email
    FROM users u
    WHERE u.role = 'student'
      AND u.email IS NOT NULL
      AND u.email <> ''
      AND u.is_active = TRUE`
  );

  const emailSet = new Set();
  for (const r of [...portalStudents, ...userStudents]) {
    const e = normalizeEmail(r.email);
    if (e) emailSet.add(e);
  }
  const recipientEmails = Array.from(emailSet);

  const portalNotifications = portalStudents.map((s) => [
    s.student_id,
    a.title,
    a.bodyText ? String(a.bodyText).slice(0, 2000) : "",
    "INFO",
    false,
    "scholarship_announcement",
  ]);

  if (portalNotifications.length) {
    await db.query(
      `INSERT IGNORE INTO notifications
        (student_id, title, message, risk_level, is_read, category)
        VALUES ?`,
      [portalNotifications]
    );
  }

    if (!isEmailConfigured()) {
      await db.query(
        `UPDATE scholarship_announcements
         SET dispatch_error = ?
         WHERE id = ?`,
        ["SMTP not configured", announcementId]
      );

      return { ok: true, dispatchedEmail: false, reason: "smtp_not_configured" };
    }

    if (!recipientEmails.length) {
      await db.query(
        `UPDATE scholarship_announcements
         SET dispatch_error = ?
         WHERE id = ?`,
        ["No student email recipients found", announcementId]
      );

      return { ok: true, dispatchedEmail: false, reason: "no_recipients" };
    }

    const transport = buildTransport();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    const subject = a.title;
    const bodyPreview = (a.bodyText || "").slice(0, 8000);

    let sentCount = 0;
    let lastError = null;

    const bccMode =
      String(process.env.SMTP_BCC_MODE || "false").toLowerCase() === "true";

    if (bccMode) {
      try {
        await transport.sendMail({
          from,
          to: from,
          bcc: recipientEmails,
          subject,
          text: `${subject}\n\n${bodyPreview}`,
        });
        sentCount = recipientEmails.length;
      } catch (e) {
        lastError = e?.message || String(e);
      }
    } else {
      const concurrency = Number(process.env.SMTP_SEND_CONCURRENCY || 5);
      const results = await mapLimit(recipientEmails, concurrency, async (to) => {
        try {
          await transport.sendMail({
            from,
            to,
            subject,
            text: `${subject}\n\n${bodyPreview}`,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e?.message || String(e) };
        }
      });

      for (const r of results) {
        if (r?.ok) sentCount += 1;
        else lastError = r?.error || lastError;
      }
    }

    if (sentCount > 0) {
      await db.query(
        `UPDATE scholarship_announcements
         SET email_dispatched_at = NOW(),
             dispatch_error = NULL
         WHERE id = ?`,
        [announcementId]
      );

      announcementEvents.emit("dispatched", {
        announcementId,
        ok: true,
        dispatchedEmail: true,
        sentCount,
      });
    } else {
      await db.query(
        `UPDATE scholarship_announcements
         SET dispatch_error = ?
         WHERE id = ?`,
        [lastError || "email_failed", announcementId]
      );

      announcementEvents.emit("dispatched", {
        announcementId,
        ok: true,
        dispatchedEmail: false,
        sentCount,
        lastError: lastError || "email_failed",
      });
    }

    return {
      ok: true,
      dispatchedEmail: sentCount > 0,
      sentCount,
      lastError,
      recipientCount: recipientEmails.length,
    };
  } finally {
    inFlightDispatch.delete(announcementId);
  }
}

async function dispatchPendingAnnouncements({ limit = 10 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

  const [rows] = await db.query(
    `SELECT id
     FROM scholarship_announcements
     WHERE email_dispatched_at IS NULL
       AND (dispatch_error IS NULL OR dispatch_error = '')
     ORDER BY id ASC
     LIMIT ?`,
    [safeLimit]
  );

  let dispatched = 0;
  let attempted = 0;
  for (const r of rows || []) {
    if (!r?.id) continue;
    attempted += 1;
    const res = await dispatchAnnouncement({ announcementId: Number(r.id) });
    if (res?.dispatchedEmail) dispatched += 1;
  }

  return { ok: true, attempted, dispatched };
}

module.exports = { dispatchAnnouncement, dispatchPendingAnnouncements };

