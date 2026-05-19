/**
 * Quick SMTP sanity check (sends one email).
 *
 * Run from backend folder:
 *   node scripts/smtp-test.js you@example.com
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

function must(name) {
  const v = (process.env[name] || "").trim();
  if (!v) {
    console.error(`Missing ${name} in backend/.env`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("Usage: node scripts/smtp-test.js <to-email>");
    process.exit(1);
  }

  const host = must("SMTP_HOST");
  const port = Number(must("SMTP_PORT"));
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = must("SMTP_USER");
  const pass = must("SMTP_PASS");
  const from = must("SMTP_FROM");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from,
    to,
    subject: `SMTP test (${new Date().toISOString()})`,
    text: "SMTP test OK. If you received this, SMTP is configured correctly.",
  });

  console.log("Sent OK:", info.messageId || info);
}

main().catch((e) => {
  console.error("SMTP test failed:", e?.message || e);
  process.exit(1);
});

