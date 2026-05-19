const db = require("../services/db.js");

function normalizeCandidates(input) {
  const scanned = String(input);
  const trimmed = scanned.trim();

  const compactNoSpaces = trimmed.replace(/[\s]+/g, "");
  const compactNoSpacesOrHyphens = trimmed.replace(/[\s-]+/g, "");
  const digitsOnly = trimmed.replace(/\D+/g, "");
  const digitsFromCompact = compactNoSpacesOrHyphens.replace(/\D+/g, "");
  const strippedLeadingNonDigits = trimmed.replace(/^\D+/, "");
  const strippedLeadingDigitsOnly = strippedLeadingNonDigits.replace(/\D+/g, "");

  const afterCommonPrefixes = trimmed
    .replace(/^qr\s*[:#-]?/i, "")
    .replace(/^id\s*[:#-]?/i, "")
    .replace(/^student\s*[:#-]?/i, "")
    .trim();
  const afterCommonPrefixesDigitsOnly = afterCommonPrefixes.replace(/\D+/g, "");

  const candidates = [
    scanned,
    trimmed,
    compactNoSpaces,
    compactNoSpacesOrHyphens,
    digitsOnly,
    digitsFromCompact,
    strippedLeadingNonDigits,
    strippedLeadingDigitsOnly,
    afterCommonPrefixes,
    afterCommonPrefixesDigitsOnly,
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  return { candidates, trimmed, compactNoSpaces, compactNoSpacesOrHyphens, digitsOnly, digitsFromCompact };
}

async function findStudentByQrValue(qr) {
  const { candidates } = normalizeCandidates(qr);

  for (const c of candidates) {
    const [rowsExact] = await db.query(
      `
        SELECT *
        FROM students
        WHERE
          qr_code = ?
          OR student_id = ?
          OR award_number = ?
        LIMIT 1
      `,
      [c, c, c]
    );

    if (rowsExact.length > 0) return rowsExact[0];

    const like = `%${c}%`;
    const [rowsLike] = await db.query(
      `
        SELECT *
        FROM students
        WHERE
          qr_code LIKE ?
          OR student_id LIKE ?
          OR award_number LIKE ?
        LIMIT 1
      `,
      [like, like, like]
    );

    if (rowsLike.length > 0) return rowsLike[0];
  }

  return null;
}

async function attendance(req, res) {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return res.status(400).json({ message: "student_id is required" });
    }

    const scanned = String(student_id);
    const trimmed = scanned.trim();
    const compactNoSpaces = trimmed.replace(/[\s]+/g, "");
    const compactNoSpacesOrHyphens = trimmed.replace(/[\s-]+/g, "");
    const digitsOnly = trimmed.replace(/\D+/g, "");
    const digitsFromCompact = compactNoSpacesOrHyphens.replace(/\D+/g, "");

    const found = await findStudentByQrValue(student_id);
    if (!found) {
      const { candidates } = normalizeCandidates(student_id);
      return res.status(404).json({
        message: "Student not found",
        scanned_value: student_id,
        normalized: {
          trimmed,
          compactNoSpaces,
          compactNoSpacesOrHyphens,
          digitsOnly,
          digitsFromCompact,
        },
        candidates,
        db_match_columns: ["students.student_id", "students.qr_code", "students.award_number"],
      });
    }

    const actualStudentId = found.student_id;

    const [existing] = await db.query(
      `
        SELECT *
        FROM attendance_logs
        WHERE student_id = ?
        AND attendance_date = CURDATE()
      `,
      [actualStudentId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Attendance already recorded today",
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO attendance_logs
        (
          student_id,
          attendance_date,
          time_in,
          semester,
          academic_year,
          status,
          remarks,
          scan_type
        )
        VALUES
        (
          ?,
          CURDATE(),
          NOW(),
          '2nd Semester',
          '2024-2025',
          'Present',
          NULL,
          'QR'
        )
      `,
      [actualStudentId]
    );

    const [rows] = await db.query(
      `
        SELECT
          s.student_id,
          s.award_number,
          s.qr_code,
          s.name,
          s.course,
          s.year_level,
          s.scholarship_type,
          al.time_in,
          al.status,
          al.scan_type
        FROM attendance_logs al
        JOIN students s
          ON s.student_id = al.student_id
        WHERE al.id = ?
      `,
      [result.insertId]
    );

    const row = rows[0];

    return res.json({
      status: "success",
      message: "Attendance recorded successfully",
      data: {
        id: result.insertId,
        student_id: row.student_id,
        award_number: row.award_number,
        qr_code: row.qr_code,
        student_name: row.name,
        course: row.course,
        year_level: row.year_level,
        scholarship_type: row.scholarship_type,
        time_in: row.time_in,
        attendance_status: row.status,
        scan_type: row.scan_type,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("ATTENDANCE ERROR:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function statsToday(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT
          SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_today,
          SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_students,
          SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_students,
          COUNT(*) AS total_scanned_today
        FROM attendance_logs
        WHERE attendance_date = CURDATE()
      `
    );

    return res.json({
      present_today: rows[0].present_today || 0,
      late_students: rows[0].late_students || 0,
      absent_students: rows[0].absent_students || 0,
      total_scanned_today: rows[0].total_scanned_today || 0,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function logs(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT
          al.id,
          s.student_id,
          s.award_number,
          s.qr_code,
          s.name,
          s.course,
          s.year_level,
          s.scholarship_type,
          al.attendance_date,
          al.time_in,
          al.status,
          al.scan_type
        FROM attendance_logs al
        JOIN students s
          ON s.student_id = al.student_id
        WHERE al.attendance_date = CURDATE()
        ORDER BY al.time_in DESC
        LIMIT 100
      `
    );

    return res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

async function granteesStats(req, res) {
  try {
    const [rows] = await db.query(
      `
        SELECT
          s.id,
          s.student_id,
          COALESCE(
            ROUND(
              (
                SUM(CASE WHEN al.status = 'Present' THEN 1 ELSE 0 END)
                / NULLIF(COUNT(al.id), 0)
              ) * 100
            ),
          0) AS attendance_percentage,
          CASE
            WHEN (
              ROUND(
                (
                  SUM(CASE WHEN al.status = 'Present' THEN 1 ELSE 0 END)
                  / NULLIF(COUNT(al.id), 0)
                ) * 100,
              0)
            ) >= 80 THEN 'Active'
            WHEN (
              ROUND(
                (
                  SUM(CASE WHEN al.status = 'Present' THEN 1 ELSE 0 END)
                  / NULLIF(COUNT(al.id), 0)
                ) * 100,
              0)
            ) >= 60 THEN 'Warning'
            ELSE 'At Risk'
          END AS beneficiary_status,
          MAX(al.time_in) AS last_qr_scan,
          CASE
            WHEN s.qr_code IS NOT NULL AND s.qr_code <> '' THEN 1
            ELSE 0
          END AS qr_generated
        FROM students s
        LEFT JOIN attendance_logs al
          ON al.student_id = s.student_id
        GROUP BY s.id, s.student_id, s.qr_code
        ORDER BY s.id DESC
      `
    );

    return res.json(
      (rows || []).map((r) => ({
        id: r.id,
        student_id: r.student_id,
        attendance_percentage: Number(r.attendance_percentage) || 0,
        beneficiary_status: r.beneficiary_status || "At Risk",
        last_qr_scan: r.last_qr_scan || "",
        qr_generated: !!r.qr_generated,
      }))
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { attendance, statsToday, logs, granteesStats };


