const db = require("../services/db.js");
const { getRequirementsForScholarshipType } = require("../services/scholarshipRequirements.js");

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

  return [
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
}

async function findStudentByCandidates(candidates) {
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

async function info(req, res) {
  try {
    const { qr_value } = req.body || {};
    if (!qr_value) {
      return res.status(400).json({ status: "error", message: "qr_value is required" });
    }

    const candidates = normalizeCandidates(qr_value);
    const found = await findStudentByCandidates(candidates);

    if (!found) {
      return res.status(404).json({ status: "error", message: "Student not found", candidates });
    }

    const [ann] = await db.query(
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
        ORDER BY COALESCE(received_at, created_at) DESC, id DESC
        LIMIT 10
      `
    );

    return res.json({
      status: "success",
      data: {
        student: {
          student_id: found.student_id,
          award_number: found.award_number,
          name: found.name,
          course: found.course,
          year_level: found.year_level,
          scholarship_type: found.scholarship_type,
        },
        announcements: ann || [],
        requirements: getRequirementsForScholarshipType(found.scholarship_type),
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("QR_INFO_ERROR:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { info };


