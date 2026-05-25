const db = require("../services/db.js");

function monthLabel(i) {
  // i: 0..11
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i] || String(i);
}

async function dashboardStats(req, res) {
  try {
    const [students] = await db.query(`SELECT COUNT(*) AS total FROM students`);
    const [users] = await db.query(`SELECT COUNT(*) AS total FROM users`);
    return res.json({
      students: students[0].total,
      users: users[0].total,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

// Monthly Distribution: count forecasts/risk predictions by month (last 12 months)
async function monthlyDistribution(req, res) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        MONTH(prediction_date) AS month_num,
        YEAR(prediction_date) AS year_num,
        risk_level
      FROM forecasts
      WHERE prediction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `
    );

    // Build combined month keys sorted chronologically by year+month
    const bucket = new Map();
    for (const r of rows) {
      const key = `${r.year_num}-${String(r.month_num).padStart(2, "0")}`;
      if (!bucket.has(key)) bucket.set(key, { key, year: r.year_num, month: r.month_num, awards: 0, applications: 0 });
      const b = bucket.get(key);

      // Treat forecasts as "awards" proxy and application count as total forecasts as well.
      // (If you later add an applications table, switch application computation here.)
      b.awards += 1;
      b.applications += 1;
    }

    // Ensure we output 12 months labels even if no data.
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: monthLabel(d.getMonth()),
      });
    }

    const awards = [];
    const applications = [];
    for (const m of months) {
      const b = bucket.get(m.key);
      awards.push(b ? b.awards : 0);
      applications.push(b ? b.applications : 0);
    }

    return res.json({
      labels: months.map((m) => m.label),
      awards,
      applications,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

// Status Distribution: count students by latest forecast risk_level (last forecast per student)
async function statusDistribution(req, res) {
  try {
    const [rows] = await db.query(
      `
      SELECT f.risk_level, COUNT(*) AS cnt
      FROM forecasts f
      INNER JOIN (
        SELECT student_id, MAX(prediction_date) AS max_date
        FROM forecasts
        WHERE student_id IS NOT NULL
        GROUP BY student_id
      ) latest
        ON latest.student_id = f.student_id AND latest.max_date = f.prediction_date
      GROUP BY f.risk_level
      `
    );

    const safe = rows.find((r) => r.risk_level === "SAFE")?.cnt || 0;
    const warning = rows.find((r) => r.risk_level === "WARNING")?.cnt || 0;
    const atRisk = rows.find((r) => r.risk_level === "AT RISK")?.cnt || 0;
    const total = safe + warning + atRisk;

    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return res.json({
      total,
      statuses: [
        { key: "SAFE", label: "Active", value: safe, percent: pct(safe) },
        { key: "WARNING", label: "Compliant", value: warning, percent: pct(warning) },
        { key: "AT RISK", label: "Pending", value: atRisk, percent: pct(atRisk) },
        // Probation not represented in schema; keep 0 so UI remains consistent.
        { key: "PROBATION", label: "Probation", value: 0, percent: 0 },
      ],
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

// ---------------------------
// Real-time Monitoring
// ---------------------------
// Presence is in-memory (best-effort). Online users are students who sent a heartbeat
// from the Student Portal within the last PRESENCE_TTL_MS.
const presence = new Map(); // student_id -> lastSeenEpochMs
const PRESENCE_TTL_MS = Number(process.env.PRESENCE_TTL_MS || 30_000);

function touchPresence(studentId) {
  if (!studentId) return;
  presence.set(String(studentId), Date.now());
}

function getOnlineNow() {
  const now = Date.now();
  for (const [studentId, lastSeen] of presence.entries()) {
    if (now - lastSeen > PRESENCE_TTL_MS) presence.delete(studentId);
  }
  return presence.size;
}

async function presenceHeartbeat(req, res) {
  try {
    // req.user comes from verifyToken => decoded user payload includes student_id for student role.
    const studentId = req.user?.student_id || req.body?.student_id;
    touchPresence(studentId);
    return res.json({ status: "success", onlineNow: getOnlineNow() });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function onlineNow(req, res) {
  return res.json({ onlineNow: getOnlineNow() });
}

async function monitoringStats(req, res) {
  try {
    // Verifying/Pending are still computed as proxies.
    const [todayAttendance] = await db.query(
      `
      SELECT
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present_today,
        SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) AS late_today,
        SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) AS absent_today,
        COUNT(*) AS total_scanned_today
      FROM attendance_logs
      WHERE attendance_date = CURDATE()
      `
    );

    const [ann] = await db.query(
      `
      SELECT
        SUM(CASE WHEN email_dispatched_at IS NOT NULL THEN 1 ELSE 0 END) AS dispatched,
        SUM(CASE WHEN email_dispatched_at IS NULL AND dispatch_error IS NULL THEN 1 ELSE 0 END) AS pending_dispatch,
        SUM(CASE WHEN dispatch_error IS NOT NULL THEN 1 ELSE 0 END) AS dispatch_errors
      FROM scholarship_announcements
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      `
    );

    const onlineNowVal = getOnlineNow();
    const verifyingDocs = todayAttendance[0]?.late_today || 0;
    const pendingApproval = ann[0]?.pending_dispatch || 0;

    return res.json({
      onlineNow: onlineNowVal,
      verifyingDocs,
      pendingApproval,
      totalScannedToday: todayAttendance[0]?.total_scanned_today || 0,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = {
  dashboardStats,
  monthlyDistribution,
  statusDistribution,
  monitoringStats,
  presenceHeartbeat,
  onlineNow,
};










