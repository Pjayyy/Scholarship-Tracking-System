const { analyzeDocumentBuffer, isDocumentIntelligenceConfigured } = require("../services/documentIntelligence.js");
const db = require("../services/db.js");

async function analyze(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file uploaded." });
    }

    const { buffer, originalname, mimetype } = req.file;
    const ext = originalname.split(".").pop()?.toLowerCase() || "";

    // Excel/CSV files - parse directly without Document Intelligence
    if (["xlsx", "xls", "csv"].includes(ext)) {
      const xlsx = require("xlsx");
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

      const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

      // Find student_id column (common variations)
      const sidCol = headers.find(
        (h) =>
          h.replace(/[_\s-]/g, "").toLowerCase().startsWith("studentid") ||
          h.replace(/[_\s-]/g, "").toLowerCase().startsWith("student_id") ||
          h.replace(/[_\s-]/g, "").toLowerCase() === "sid" ||
          h.replace(/[_\s-]/g, "").toLowerCase() === "id"
      );

      const students = rawRows
        .map((row) => {
          const vals = Object.values(row).map((v) => String(v ?? "").trim());
          const student_id = sidCol ? String(row[sidCol] ?? "").trim() : vals[0] || "";
          return {
            student_id,
            raw: row,
            rowData: vals,
          };
        })
        .filter((r) => r.student_id.length >= 4);

      // Match against database
      const ids = students.map((s) => s.student_id);
      const [existing] = await db.query(
        `SELECT student_id, name, course, scholarship_type, scholarship_status FROM students WHERE student_id IN (${ids.map(() => "?").join(",")})`,
        ids
      );
      const existMap = new Map(existing.map((e) => [String(e.student_id), e]));

      const matched = students
        .map((s) => ({
          ...s,
          found: existMap.has(s.student_id),
          existing: existMap.get(s.student_id) || null,
        }))
        .filter((s) => s.found);

      const unmatched = students.filter((s) => !s.found);

      return res.json({
        status: "success",
        data: {
          fileName: originalname,
          fileType: "excel",
          totalRows: students.length,
          matchedCount: matched.length,
          unmatchedCount: unmatched.length,
          matched,
          unmatched,
          headers,
        },
      });
    }

    // PDF/Images - use Document Intelligence
    if (!isDocumentIntelligenceConfigured()) {
      return res.status(503).json({
        status: "error",
        message: "Document Intelligence is not configured. Please set DOCUMENT_INTELLIGENCE_ENDPOINT and DOCUMENT_INTELLIGENCE_API_KEY in backend/.env to scan PDF/image files.",
      });
    }
    const result = await analyzeDocumentBuffer(buffer);

    // Try to extract student IDs from the document text
    const text = result.fullText || "";
    const possibleIds = extractStudentIds(text);

    // Match against database
    let matched = [];
    let unmatched = [];

    if (possibleIds.length > 0) {
      const [existing] = await db.query(
        `SELECT student_id, name, course, scholarship_type, scholarship_status FROM students WHERE student_id IN (${possibleIds.map(() => "?").join(",")})`,
        possibleIds
      );
      const existMap = new Map(existing.map((e) => [String(e.student_id), e]));

      matched = possibleIds
        .filter((id) => existMap.has(id))
        .map((id) => ({
          student_id: id,
          found: true,
          existing: existMap.get(id),
          raw: {},
        }));

      unmatched = possibleIds
        .filter((id) => !existMap.has(id))
        .map((id) => ({
          student_id: id,
          found: false,
          existing: null,
          raw: {},
        }));
    }

    return res.json({
      status: "success",
      data: {
        fileName: originalname,
        fileType: mimetype.startsWith("image/") ? "image" : "pdf",
        modelId: result.modelId,
        pageCount: result.pageCount,
        paragraphCount: result.paragraphCount,
        tableCount: result.tableCount,
        fullText: result.fullText,
        tablesPreview: result.tablesPreview,
        totalExtracted: possibleIds.length,
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        matched,
        unmatched,
      },
    });
  } catch (err) {
    console.error("documents.analyze error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

// Extract possible student IDs from text using regex patterns
function extractStudentIds(text) {
  const ids = new Set();

  // Pattern 1: Generic 10+ digit IDs (student numbers)
  const numMatches = text.match(/\b\d{8,12}\b/g);
  if (numMatches) numMatches.forEach((m) => ids.add(m));

  // Pattern 2: IDs with prefixes like "ID: 2300092700"
  const prefixedMatches = text.match(/(?:ID\s*[:#]?\s*|student[_ ]?id\s*[:#]?\s*)([A-Z0-9]{6,15})/gi);
  if (prefixedMatches) {
    prefixedMatches.forEach((m) => {
      const numPart = m.replace(/[^0-9]/g, "");
      if (numPart.length >= 6) ids.add(numPart);
    });
  }

  // Pattern 3: Award numbers (TDP-, TES-, etc.)
  const awardMatches = text.match(/(?:TDP|TES)[-\s#]*([A-Z0-9]{4,15})/gi);
  if (awardMatches) {
    awardMatches.forEach((m) => {
      const clean = m.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (clean.length >= 6) ids.add(clean);
    });
  }

  return Array.from(ids).slice(0, 500); // Cap at 500 extracted IDs
}

async function bulkImportStudents(req, res) {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ status: "error", message: "No students to import." });
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const s of students) {
      try {
        if (!s.student_id) {
          results.skipped++;
          continue;
        }

        await db.query(
          `INSERT IGNORE INTO students (student_id, name, course, year_level, scholarship_type, scholarship_status)
           VALUES (?, ?, ?, ?, ?, 'Active')`,
          [
            s.student_id,
            s.name || "",
            s.course || "",
            s.year_level || "",
            s.scholarship_type || "TDP",
          ]
        );

        // Auto-create user account for student login
        // Email: student_id@scholarship.local, Password: student_id
        const studentEmail = `${s.student_id}@scholarship.local`;
        await db.query(
          `INSERT IGNORE INTO users (name, email, password, role, student_id)
           VALUES (?, ?, ?, 'student', ?)`,
          [
            s.name || s.student_id,
            studentEmail,
            String(s.student_id),
            s.student_id,
          ]
        );

        results.imported++;
      } catch (e) {
        results.errors.push({ student_id: s.student_id, error: e.message });
        results.skipped++;
      }
    }

    return res.json({
      status: "success",
      message: `Imported ${results.imported}/${students.length} students.`,
      results,
    });
  } catch (err) {
    console.error("bulkImportStudents error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
}

module.exports = { analyze, bulkImportStudents };