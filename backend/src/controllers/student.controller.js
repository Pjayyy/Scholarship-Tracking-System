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

    // Fetch user's email from users table
    const [userRows] = await db.query(
      "SELECT email FROM users WHERE student_id = ? LIMIT 1",
      [studentId]
    );
    const userEmail = userRows.length > 0 ? userRows[0].email : "";

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
        email: userEmail,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(400).json({
        status: "error",
        message: "No student_id linked to this account",
      });
    }

    const {
      name,
      sex,
      birthdate,
      contact_number,
      course,
      year_level,
      scholarship_type,
      email,
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (sex !== undefined) {
      updates.push("sex = ?");
      values.push(sex);
    }
    if (birthdate !== undefined) {
      updates.push("birthdate = ?");
      values.push(birthdate);
    }
    if (contact_number !== undefined) {
      updates.push("contact_number = ?");
      values.push(contact_number);
    }
    if (course !== undefined) {
      updates.push("course = ?");
      values.push(course);
    }
    if (year_level !== undefined) {
      updates.push("year_level = ?");
      values.push(year_level);
    }
    if (scholarship_type !== undefined) {
      updates.push("scholarship_type = ?");
      values.push(scholarship_type);
    }

    if (updates.length === 0 && !email) {
      return res.status(400).json({
        status: "error",
        message: "No fields to update",
      });
    }

    // Update students table
    if (updates.length > 0) {
      values.push(studentId);
      await db.query(
        `UPDATE students SET ${updates.join(", ")} WHERE student_id = ?`,
        values
      );
    }

    // Update user's email in users table
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid email format",
        });
      }
      await db.query(
        "UPDATE users SET email = ? WHERE student_id = ?",
        [email, studentId]
      );
      await db.query(
        "UPDATE students SET email = ? WHERE student_id = ?",
        [email, studentId]
      );
    }

    return res.json({
      status: "success",
      message: "Profile updated successfully",
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const studentId = req.user?.student_id;
    if (!studentId) {
      return res.status(400).json({
        status: "error",
        message: "No student_id linked to this account",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters",
      });
    }

    // Verify current password
    const [userRows] = await db.query(
      "SELECT password FROM users WHERE student_id = ? AND role = 'student' LIMIT 1",
      [studentId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User account not found",
      });
    }

    const storedPassword = userRows[0].password;

    // For newly imported students, password equals student_id
    // Check if current password matches either stored hash or student_id plain text
    if (currentPassword !== storedPassword && currentPassword !== String(studentId)) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Update to new password
    await db.query(
      "UPDATE users SET password = ? WHERE student_id = ? AND role = 'student'",
      [newPassword, studentId]
    );

    return res.json({
      status: "success",
      message: "Password updated successfully",
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

module.exports = { me, updateMe, changePassword, announcements };


