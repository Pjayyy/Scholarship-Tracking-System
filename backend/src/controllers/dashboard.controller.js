const db = require("../services/db.js");

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

module.exports = { dashboardStats };


