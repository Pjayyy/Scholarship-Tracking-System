const db = require("../services/db.js");
const { getRequirementsForScholarshipType } = require("../services/scholarshipRequirements.js");

async function me(req, res) {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(400).json({
        status: "error",
        message: "No student_id linked to this account",
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          student_id,
          award_number,
          qr_code,
          name,
          course,
          year_level,
          scholarship_type,
          scholarship_status,
          birthdate,
          contact_number,
          semester,
          academic_year,
          sex
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `,
      [studentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    const s = rows[0];

    return res.json({
      status: "success",
      data: {
        student_id: s.student_id,
        name: s.name,
        awardNumber: s.award_number,
        qrCode: s.qr_code,
        program: s.course,
        yearLevel: s.year_level,
        scholarshipType: s.scholarship_type,
        scholarshipStatus: s.scholarship_status,
        birthdate: s.birthdate,
        contactNumber: s.contact_number,
        semester: s.semester,
        academicYear: s.academic_year,
        sex: s.sex,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function announcements(req, res) {
  try {
    if (req.user?.role !== "student") {
      return res.status(403).json({
        status: "error",
        message: "Students only",
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          source,
          title,
          body_text AS bodyText,
          from_address AS fromAddress,
          received_at AS receivedAt,
          created_at AS createdAt
        FROM scholarship_announcements
        ORDER BY COALESCE(received_at, created_at) DESC,
          id DESC
        LIMIT 100
      `
    );

    return res.json({ status: "success", data: rows });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);

    if (
      String(err?.code || "").includes("ER_NO_SUCH_TABLE") ||
      String(err?.message || "").includes("scholarship_announcements")
    ) {
      return res.status(503).json({
        status: "error",
        message:
          "Announcements table missing. Run database/migrations/001_scholarship_announcements.sql (or full scheme.sql).",
      });
    }

    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { me, announcements };


