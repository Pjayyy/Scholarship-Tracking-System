import { useRef, useState } from "react";
import {
  FiCpu, FiUpload, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiFileText, FiDownload, FiRefreshCw, FiSearch, FiHash, FiEdit
} from "react-icons/fi";
import axios from "axios";
import Swal from "sweetalert2";
import "./AdminDocumentScanner.css";

function AdminDocumentScan() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState("matched"); // "matched" | "unmatched" | "raw"
  const [editMode, setEditMode] = useState(false);
  const [editList, setEditList] = useState([]);

  const runAnalyze = async (file) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ title: "Sign in required", text: "Please sign in as admin.", icon: "warning" });
      return;
    }

    setBusy(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 240000);

      const res = await axios.post("http://localhost:5000/documents/analyze", fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.data?.status === "error") {
        throw new Error(res.data.message || "Analysis failed.");
      }

      setResult(res.data.data || res.data);
      Swal.fire({
        title: "Scan Complete",
        text: `Found ${res.data.data?.matchedCount || 0} matched, ${res.data.data?.unmatchedCount || 0} unmatched.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (err) {
      if (err.name === "AbortError" || err.code === "ECONNABORTED") {
        Swal.fire({ title: "Timed out", text: "Analysis timed out. Try a smaller file.", icon: "error" });
      } else {
        Swal.fire({ title: "Error", text: err?.response?.data?.message || err.message, icon: "error" });
      }
    } finally {
      setBusy(false);
    }
  };

  // Helper to find column value case-insensitively
  const findField = (raw, ...names) => {
    if (!raw) return "";
    const keys = Object.keys(raw);
    for (const name of names) {
      const key = keys.find(k => k.replace(/[_\s-]/g, "").toLowerCase() === name.toLowerCase());
      if (key && raw[key] != null) return String(raw[key]).trim();
    }
    return "";
  };

  const bulkImport = async () => {
    if (!result?.unmatched?.length) return;

    const toImport = (editMode ? editList : result.unmatched.map((u) => ({
      student_id: u.student_id,
      name: findField(u.raw, "name", "full_name", "fullname", "student_name", "studentname"),
      course: findField(u.raw, "course", "courses", "program", "degreeprogram", "degree_program", "strand"),
      year_level: findField(u.raw, "year_level", "yearlevel", "year", "yr_level", "yearlevel"),
      scholarship_type: findField(u.raw, "scholarship_type", "ScholarshipType", "type", "scholarship") || "TDP",
    }))).filter((s) => s.student_id);

    if (toImport.length === 0) {
      Swal.fire({ title: "Nothing to import", text: "No students with IDs to import.", icon: "warning" });
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://localhost:5000/documents/bulk-import",
        { students: toImport },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        title: "Import complete",
        text: res.data?.message || `Done.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (e) {
      Swal.fire({ title: "Import failed", text: e?.response?.data?.message || e.message, icon: "error" });
    }
  };

  const exportToCsv = (rows, filename) => {
    if (!rows?.length) return;
    const header = Object.keys(rows[0].raw || rows[0]).join(",");
    const data = rows.map((r) =>
      Object.values(r.raw || r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [header, ...data].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter helpers
  const allMatched = result?.matched || [];
  const allUnmatched = result?.unmatched || [];
  const filteredMatched = allMatched.filter((r) =>
    !searchTerm || String(r.student_id).includes(searchTerm) || String(r.existing?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUnmatched = allUnmatched.filter((r) =>
    !searchTerm || String(r.student_id).includes(searchTerm)
  );

  return (
    <div className="panel">
      {/* Page Hero */}
      <div className="page-hero" style={{ marginBottom: "1.5rem" }}>
        <div className="page-hero__row">
          <div>
            <div className="kicker">Admin tools</div>
            <h2 className="page-title">Document Scanner</h2>
            <p className="page-subtitle">
              Upload a PDF, image, or Excel/CSV file containing student applicant or scholar data.
              The system will match IDs against the database.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Card */}
      <div className="card card-glass document-scan-upload" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
        <div className="document-scan-upload__title" style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800, marginBottom: "1rem" }}>
          <FiCpu aria-hidden />
          Upload &amp; Scan
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.heic,.heif,.xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void runAnalyze(f);
            }}
          />

          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            style={{
              // Force high contrast regardless of global .btn styles
              background: "linear-gradient(135deg, #6C63FF 0%, #4F46E5 55%, #0ea5e9 100%)",
              color: "#ffffff",
              border: busy ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(108, 99, 255, 0.35)",
              opacity: busy ? 0.75 : 1,
              cursor: busy ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(108, 99, 255, 0.35)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <FiUpload aria-hidden />
            </span>
            <span style={{ marginLeft: 6, color: "#ffffff" }}>
              {busy ? "Scanning..." : "Choose file (PDF, Image, Excel, CSV)"}
            </span>
          </button>

          {result && (
            <button
              type="button"
              className="btn"
              onClick={() => { setResult(null); setSearchTerm(""); }}
            >
              <FiRefreshCw aria-hidden />
              Reset
            </button>
          )}
        </div>

        <p className="document-scan-upload__help" style={{ marginTop: "1rem", fontSize: "0.88rem" }}>
          Supports PDF, JPEG, PNG, TIFF, BMP images — plus Excel (.xlsx, .xls) and CSV files.
          Configure <code>DOCUMENT_INTELLIGENCE_ENDPOINT</code> in <code>backend/.env</code> for PDF/image scanning.
        </p>
      </div>

      {/* Results */}
      {result && (
        <div className="document-scan-results">
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: "1.25rem" }}>
            {[
              {
                label: "File",
                value: result.fileName || "—",
                icon: <FiFileText size={18} />,
                color: "#6366f1",
              },
              {
                label: "File Type",
                value: result.fileType?.toUpperCase() || "—",
                icon: <FiFileText size={18} />,
                color: "#8b5cf6",
              },
              {
                label: "Total Rows",
                value: result.totalRows ?? result.totalExtracted ?? "—",
                icon: <FiHash size={18} />,
                color: "#0ea5e9",
              },
              {
                label: "Matched",
                value: result.matchedCount ?? 0,
                icon: <FiCheckCircle size={18} />,
                color: "#22c55e",
              },
              {
                label: "Unmatched",
                value: result.unmatchedCount ?? 0,
                icon: <FiXCircle size={18} />,
                color: "#ef4444",
              },
              {
                label: result.fileType === "excel" ? "Excel Sheets" : "Pages Scanned",
                value: result.pageCount ?? "—",
                icon: <FiFileText size={18} />,
                color: "#f59e0b",
              },
            ].map((stat, i) => (
              <div key={i} className="card card-glass" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          {allUnmatched.length > 0 && (
            <div className="card card-glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <FiAlertTriangle size={16} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.88rem", flex: 1 }}>
                {allUnmatched.length} student{allUnmatched.length !== 1 ? "s" : ""} not found in the database.
              </span>
              <button
                type="button"
                className="btn"
                style={{ background: "#22c55e", borderColor: "#22c55e", fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={bulkImport}
              >
                <FiUpload size={14} /> Bulk Import All Unmatched
              </button>
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={() => exportToCsv(allUnmatched, "unmatched_students.csv")}
              >
                <FiDownload size={14} /> Export Unmatched
              </button>
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={() => exportToCsv(allMatched, "matched_students.csv")}
              >
                <FiDownload size={14} /> Export Matched
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: "#8b5cf6", borderColor: "#8b5cf6", fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={() => {
                  const list = result.unmatched.map((u) => ({
                    student_id: u.student_id,
                    name: findField(u.raw, "name", "full_name", "fullname", "student_name", "studentname"),
                    course: findField(u.raw, "course", "courses", "program", "degreeprogram", "degree_program", "strand") || "",
                    year_level: findField(u.raw, "year_level", "yearlevel", "year", "yr_level", "yearlevel") || "",
                    scholarship_type: findField(u.raw, "scholarship_type", "ScholarshipType", "type", "scholarship") || "TDP",
                  }));
                  setEditList(list);
                  setEditMode(true);
                  setViewTab("unmatched");
                }}
              >
                <FiEdit size={14} /> Edit Before Import
              </button>
            </div>
          )}

          {/* Quick Edit Panel */}
          {editMode && (
            <div className="card card-glass" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem", border: "2px solid #8b5cf6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiEdit size={16} style={{ color: "#8b5cf6" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Quick Edit ({editList.length} students)</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Set Course for all..."
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--surface-border)",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      background: "rgba(2,6,23,0.12)",
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setEditList(editList.map(s => ({ ...s, course: val })));
                    }}
                  />
                  <input
                    placeholder="Set Year Level..."
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--surface-border)",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      background: "rgba(2,6,23,0.12)",
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setEditList(editList.map(s => ({ ...s, year_level: val })));
                    }}
                  />
                  <select
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--surface-border)",
                      fontSize: 12,
                      color: "var(--text-primary)",
                      background: "rgba(2,6,23,0.12)",
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) setEditList(editList.map(s => ({ ...s, scholarship_type: val })));
                    }}
                  >
                    <option value="">Set Type...</option>
                    <option value="TDP">TDP</option>
                    <option value="TES">TES</option>
                  </select>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: "#22c55e", borderColor: "#22c55e", fontSize: "0.78rem", padding: "6px 10px" }}
                    onClick={() => setEditMode(false)}
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search & Tabs */}
          <div className="card card-glass" style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <FiSearch
                  size={15}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}
                />
                  <input
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      borderRadius: 10,
                      border: "1px solid var(--surface-border)",
                      background: "rgba(15,23,42,0.06)",
                      fontSize: "0.88rem",
                      outline: "none",
                      color: "var(--text-primary)",
                      WebkitTextFillColor: "var(--text-primary)",
                    }}
                  placeholder="Search by student ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { key: "matched", label: `Matched (${filteredMatched.length})` },
                  { key: "unmatched", label: `Unmatched (${filteredUnmatched.length})` },
                  { key: "raw", label: "Raw Text" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className="btn"
                    style={{
                      fontSize: "0.8rem",
                      padding: "6px 12px",
                      background: viewTab === t.key ? "var(--primary)" : "transparent",
                      color: viewTab === t.key ? "#fff" : "var(--text-primary)",
                      border: "1px solid var(--surface-border)",
                    }}
                    onClick={() => setViewTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tables */}
          {(viewTab === "matched" || viewTab === "unmatched") && (
            <div className="card card-glass" style={{ overflow: "hidden", marginBottom: "1.5rem" }}>
              <div style={{ width: "100%", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {(viewTab === "matched"
                        ? ["Student ID", "Name", "Course", "Scholarship Type", "Status"]
                        : ["Student ID", "Name / Raw Data"]
                      ).map((h) => (
                        <th key={h} style={{ padding: "10px 14px", fontSize: "0.75rem", fontWeight: 900, color: "var(--text-secondary)", background: "var(--surface-2)", borderBottom: "1px solid var(--surface-border)", textAlign: "left", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(viewTab === "matched" ? filteredMatched : filteredUnmatched).length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", fontStyle: "italic" }}>
                          {searchTerm ? "No matching records found." : "No records in this category."}
                        </td>
                      </tr>
                    ) : (
                      (viewTab === "matched" ? filteredMatched : filteredUnmatched).map((row, i) =>
                        viewTab === "matched" ? (
                          <tr key={i} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                            <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "nowrap" }}>{row.student_id}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.88rem" }}>{row.existing?.name || "—"}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.85rem" }}>{row.existing?.course || "—"}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.85rem" }}>{row.existing?.scholarship_type || "—"}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", padding: "4px 10px",
                                borderRadius: 999, fontSize: "0.72rem", fontWeight: 700,
                                background: "rgba(34,197,94,0.14)", color: "#16a34a",
                                border: "1px solid rgba(34,197,94,0.35)"
                              }}>
                                <FiCheckCircle size={12} style={{ marginRight: 4 }} />
                                Found
                              </span>
                            </td>
                          </tr>
                        ) : (
                          <tr key={i} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                            <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.85rem", whiteSpace: "nowrap" }}>{row.student_id}</td>
                            <td style={{ padding: "10px 14px", fontSize: "0.85rem" }}>
                              {Object.entries(row.raw || {})
                                .filter(([, v]) => v && String(v).trim())
                                .slice(0, 6)
                                .map(([k, v]) => (
                                  <span key={k} style={{ marginRight: 8 }}>
                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{k}:</span>{" "}
                                    <span>{String(v).slice(0, 40)}</span>
                                  </span>
                                ))}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Text View */}
          {viewTab === "raw" && result.fullText && (
            <div className="card card-glass" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>EXTTRACTED TEXT</span>
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: "0.78rem", padding: "5px 10px" }}
                  onClick={() => navigator.clipboard.writeText(result.fullText)}
                >
                  Copy Text
                </button>
              </div>
              <pre style={{
                margin: 0,
                maxHeight: 400,
                overflow: "auto",
                fontSize: "0.82rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: "1rem",
                borderRadius: 12,
                border: "1px solid var(--surface-border)",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
              }}>
                {result.fullText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDocumentScan;
