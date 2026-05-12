require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const db = require("./db.js");

const app = express();

/* =========================
   LOGGER
========================= */
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());

app.use(express.json());

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 5000,

  message: {
    status: "error",
    message: "Too many requests",
  },

  standardHeaders: true,

  legacyHeaders: false,

  skip: (req) => {
    return (
      req.ip === "::1" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::ffff:127.0.0.1"
    );
  },
});

app.use(limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

/* =========================
   MYSQL CONNECTION
========================= */
// Using the shared pool from backend/db.js.

/* =========================
   JWT VERIFY
========================= */
function verifyToken(req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"];

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "SECRET123"
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      message: "Invalid token",
    });
  }
}

/* =========================
   REGISTER
========================= */
app.post("/register", async (req, res) => {
  try {

    const schema = Joi.object({
      name: Joi.string()
        .min(3)
        .required(),

      email: Joi.string()
        .email()
        .required(),

      password: Joi.string()
        .min(6)
        .required(),

      role: Joi.string()
        .valid("admin", "student")
        .required(),
    });

    const { error } =
      schema.validate(req.body);

    if (error) {
      return res.json({
        status: "error",
        message:
          error.details[0].message,
      });
    }

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await db.query(
      `
      INSERT INTO users
      (
        name,
        email,
        password,
        role
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        name,
        email,
        hashedPassword,
        role,
      ]
    );

    res.json({
      status: "success",
      message: "User registered",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {

    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.json({
        status: "failed",
        message: "Missing fields",
      });
    }

    const [rows] =
      await db.query(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [email]
      );

    if (rows.length === 0) {
      return res.json({
        status: "failed",
        message: "User not found",
      });
    }

    const user = rows[0];

    let isMatch = false;

    if (
      user.password &&
      user.password.startsWith("$2")
    ) {
      isMatch =
        await bcrypt.compare(
          password,
          user.password
        );
    } else {
      isMatch =
        password === user.password;
    }

    if (!isMatch) {
      return res.json({
        status: "failed",
        message: "Wrong password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET ||
        "SECRET123",
      {
        expiresIn: "1h",
      }
    );

    res.json({
      status: "success",
      token,

      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

/* =========================
   STUDENTS
========================= */

// CREATE STUDENT
app.post(
  "/add-student",
  verifyToken,
  async (req, res) => {
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

      res.json({
        status: "success",
        message: "Student added",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

// GET STUDENTS
app.get(
  "/students",
  verifyToken,
  async (req, res) => {
    try {

      const [rows] =
        await db.query(
          `
          SELECT *
          FROM students
          ORDER BY id DESC
          `
        );

      res.json(rows);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

// UPDATE STUDENT
app.put(
  "/students/:id",
  verifyToken,
  async (req, res) => {
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

      res.json({
        status: "success",
        message: "Student updated",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

// DELETE STUDENT
app.delete(
  "/students/:id",
  verifyToken,
  async (req, res) => {
    try {

      const { id } = req.params;

      await db.query(
        `
        DELETE FROM students
        WHERE id = ?
        `,
        [id]
      );

      res.json({
        status: "success",
        message: "Student deleted",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

/* =========================
   ATTENDANCE
========================= */
app.post(
  "/attendance",
  verifyToken,
  async (req, res) => {
    try {

      const { student_id } =
        req.body;

      if (!student_id) {
        return res.status(400).json({
          message:
            "student_id is required",
        });
      }

      console.log(
        "SCANNED QR:",
        student_id
      );
      console.log("SCANNED VALUE:", student_id);

      // FIND STUDENT
      // Backend should tolerate formatting differences between QR text and DB.
      const scanned = String(student_id);
      const trimmed = scanned.trim();

      // Keep raw variations
      const compactNoSpaces = trimmed.replace(/[\s]+/g, "");
      const compactNoSpacesOrHyphens = trimmed.replace(/[\s-]+/g, "");

      // Digit-only variations (useful if QR contains prefixes like AW-, TES-, etc.)
      const digitsOnly = trimmed.replace(/\D+/g, "");
      const digitsFromCompact = compactNoSpacesOrHyphens.replace(/\D+/g, "");

      // Strip leading non-digit characters (e.g., "ID: 2300..." -> "2300...")
      const strippedLeadingNonDigits = trimmed.replace(/^\D+/, "");
      const strippedLeadingDigitsOnly = strippedLeadingNonDigits.replace(/\D+/g, "");

      // If QR encodes something like "QR:2300092700" try after separators
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

      // Extra: quick lookup to report which column matches for each candidate
      const debugCandidateChecks = [];

      let found = null;


      for (const c of candidates) {
        // 1) Exact match
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

        if (rowsExact.length > 0) {
          found = rowsExact[0];
          break;
        }

        // 2) LIKE match (handles cases like AW- prefixes / embedded codes)
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

        if (rowsLike.length > 0) {
          found = rowsLike[0];
          break;
        }
      }

      if (!found) {
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
          // candidates we tried against (qr_code/student_id/award_number)
          candidates,
          // Additional hints (help you compare against what exists in DB)
          db_match_columns: [
            "students.student_id",
            "students.qr_code",
            "students.award_number",
          ],
        });
      }


      console.log("FOUND STUDENT:", found);

      const actualStudentId =
        found.student_id;

      // CHECK DUPLICATE
      const [existing] =
        await db.query(
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
          message:
            "Attendance already recorded today",
        });
      }

      // INSERT ATTENDANCE
      const [result] =
        await db.query(
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

      // GET STUDENT INFO
      const [rows] =
        await db.query(
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
          ON s.student_id =
          al.student_id

          WHERE al.id = ?
          `,
          [result.insertId]
        );

      const row = rows[0];

      res.json({
        status: "success",

        message:
          "Attendance recorded successfully",

        data: {
          id: result.insertId,

          student_id:
            row.student_id,

          award_number:
            row.award_number,

          qr_code:
            row.qr_code,

          student_name:
            row.name,

          course:
            row.course,

          year_level:
            row.year_level,

          scholarship_type:
            row.scholarship_type,

          time_in:
            row.time_in,

          attendance_status:
            row.status,

          scan_type:
            row.scan_type,
        },
      });

    } catch (err) {

      console.log(
        "ATTENDANCE ERROR:",
        err
      );

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

/* =========================
   ATTENDANCE STATS
========================= */
app.get(
  "/attendance/stats/today",
  verifyToken,
  async (req, res) => {
    try {

      const [rows] =
        await db.query(
          `
          SELECT

          SUM(
            CASE
            WHEN status = 'Present'
            THEN 1
            ELSE 0
            END
          ) AS present_today,

          SUM(
            CASE
            WHEN status = 'Late'
            THEN 1
            ELSE 0
            END
          ) AS late_students,

          SUM(
            CASE
            WHEN status = 'Absent'
            THEN 1
            ELSE 0
            END
          ) AS absent_students,

          COUNT(*) AS total_scanned_today

          FROM attendance_logs

          WHERE attendance_date =
          CURDATE()
          `
        );

      res.json({
        present_today:
          rows[0].present_today || 0,

        late_students:
          rows[0].late_students || 0,

        absent_students:
          rows[0].absent_students || 0,

        total_scanned_today:
          rows[0]
            .total_scanned_today || 0,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

/* =========================
   ATTENDANCE LOGS
========================= */
app.get(
  "/attendance/logs",
  verifyToken,
  async (req, res) => {
    try {

      const [rows] =
        await db.query(
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
          ON s.student_id =
          al.student_id

          WHERE al.attendance_date =
          CURDATE()

          ORDER BY al.time_in DESC

          LIMIT 100
          `
        );

      res.json(rows);

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

/* =========================
   DASHBOARD
========================= */
app.get(
  "/dashboard/stats",
  verifyToken,
  async (req, res) => {
    try {

      const [students] =
        await db.query(
          `
          SELECT COUNT(*) AS total
          FROM students
          `
        );

      const [users] =
        await db.query(
          `
          SELECT COUNT(*) AS total
          FROM users
          `
        );

      const [attendance] =
        await db.query(
          `
          SELECT COUNT(*) AS total
          FROM attendance_logs

          WHERE attendance_date =
          CURDATE()
          `
        );

      res.json({
        students:
          students[0].total,

        users:
          users[0].total,

        attendance:
          attendance[0].total,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        status: "error",
        message: err.message,
      });
    }
  }
);

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(
  (err, req, res, next) => {

    console.log(err);

    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
);

/* =========================
   START SERVER
========================= */
const PORT =
  process.env.PORT || 5000;

async function startServer() {
  try {
    await db.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to MySQL:", err.message || err);
    process.exit(1);
  }
}

startServer();