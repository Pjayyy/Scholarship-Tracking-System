require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const db = require("../services/db.js");

function register(req, res) {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid("admin", "student").required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { name, email, password, role } = req.body;

    Promise.resolve()
      .then(async () => {
        const hashedPassword = await bcrypt.hash(password, 10);

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
          [name, email, hashedPassword, role]
        );

        return res.json({
          status: "success",
          message: "User registered",
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
        res.status(500).json({
          status: "error",
          message: err.message,
        });
      });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    res.status(500).json({ status: "error", message: err.message });
  }
}

async function login(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        status: "failed",
        message: "Missing fields",
      });
    }

    // Allow students to login with just their student_id (convert to full email)
    if (!email.includes("@")) {
      email = `${email}@scholarship.local`;
    }

    const result = await db.query(
      `
        SELECT *
        FROM users
        WHERE email = ?
      `,
      [email]
    );

    // mysql2/promise returns [rows, fields] sometimes; but pool.promise().query can also return rows directly.
    const rows = Array.isArray(result) ? result[0] : result;

    if (!rows || rows.length === 0) {
      return res.json({
        status: "failed",
        message: "User not found",
      });
    }

    const user = rows[0];


    let isMatch = false;
    if (user.password && user.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = password === user.password;
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
        student_id: user.student_id ?? null,
      },
      process.env.JWT_SECRET || "SECRET123",
      { expiresIn: "1h" }
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
    // eslint-disable-next-line no-console
    console.log(err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}

module.exports = { register, login };


