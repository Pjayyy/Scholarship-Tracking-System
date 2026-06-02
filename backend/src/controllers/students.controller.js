const db = require("../services/db.js");

async function addStudent(req, res) {
  try {
    const {
      student_id,
      award_number,
      qr_code,
      name,
      email,
      course,
      year_level,
      scholarship_type,
    } = req.body;

    await db.query(
      `
        INSERT INTO students
        (
          student_id,
          award_number,
          qr_code,
          name,
          email,
          course,
          year_level,
          scholarship_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        award_number,
        qr_code,
        name,
        email || null,
        course,
        year_level,
        scholarship_type,
      ]
    );

    return res.json({ status: "success", message: "Student added" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function addGrantee(req, res) {
  try {
    const {
      student_id,
      award_number,
      qr_code,
      name,
      email,
      course,
      year_level,
      scholarship_type,
    } = req.body;

    if (!student_id || !name || !course || !year_level || !scholarship_type) {
      return res.status(400).json({
        status: "error",
        message:
          "Missing required fields: student_id, name, course, year_level, scholarship_type",
      });
    }

    await db.query(
      `
        INSERT INTO students
        (
          student_id,
          award_number,
          qr_code,
          name,
          email,
          course,
          year_level,
          scholarship_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        award_number ?? null,
        qr_code ?? null,
        name,
        email || null,
        course,
        year_level,
        scholarship_type,
      ]
    );

    return res.json({ status: "success", message: "Grantee added" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function listStudents(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT *
        FROM students
        ORDER BY id DESC
      `
    );
    return res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const {
      student_id,
      award_number,
      qr_code,
      name,
      email,
      course,
      year_level,
      scholarship_type,
      sex,
      birthdate,
      qr_generated,
    } = req.body;

    await db.query(
      `
        UPDATE students
        SET
          student_id = COALESCE(?, student_id),
          award_number = COALESCE(?, award_number),
          qr_code = COALESCE(?, qr_code),
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          course = COALESCE(?, course),
          year_level = COALESCE(?, year_level),
          scholarship_type = COALESCE(?, scholarship_type),
          sex = COALESCE(?, sex),
          birthdate = COALESCE(?, birthdate)
        WHERE id = ?
      `,
      [
        student_id || null,
        award_number || null,
        qr_code || null,
        name || null,
        email || null,
        course || null,
        year_level || null,
        scholarship_type || null,
        sex || null,
        birthdate || null,
        id,
      ]
    );

    return res.json({ status: "success", message: "Student updated" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    // First get the student_id to delete related notifications
    const [students] = await db.query(
      `SELECT student_id FROM students WHERE id = ?`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ status: "error", message: "Student not found" });
    }

    const studentId = students[0].student_id;

    // Delete related notifications first
    await db.query(`DELETE FROM notifications WHERE student_id = ?`, [studentId]);

    // Now delete the student
    await db.query(`DELETE FROM students WHERE id = ?`, [id]);

    return res.json({ status: "success", message: "Student deleted" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = {
  addStudent,
  addGrantee,
  listStudents,
  updateStudent,
  deleteStudent,
};


