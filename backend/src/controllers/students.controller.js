const db = require("../services/db.js");

async function addStudent(req, res) {
  try {
    const {
      student_id,
      award_number,
      qr_code,
      name,
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
          course,
          year_level,
          scholarship_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        award_number,
        qr_code,
        name,
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
          course,
          year_level,
          scholarship_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_id,
        award_number ?? null,
        qr_code ?? null,
        name,
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
      course,
      year_level,
      scholarship_type,
    } = req.body;

    await db.query(
      `
        UPDATE students
        SET
          student_id = ?,
          award_number = ?,
          qr_code = ?,
          name = ?,
          course = ?,
          year_level = ?,
          scholarship_type = ?
        WHERE id = ?
      `,
      [
        student_id,
        award_number,
        qr_code,
        name,
        course,
        year_level,
        scholarship_type,
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


