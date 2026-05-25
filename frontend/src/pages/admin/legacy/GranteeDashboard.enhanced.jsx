import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import QRCode from "qrcode";
import {
  FiX,
  FiUser,
  FiCalendar,
  FiRepeat,
  FiLoader,
  FiInfo,
  FiAlertCircle,
  FiCheck,
  FiShield,
  FiArrowUp,
  FiArrowDown,
  FiChevronsRight,
  FiCheck2,
} from "react-icons/fi";
import Swal from "sweetalert2";
import "./GranteeEditModal.css";

function parseNameParts(fullName) {
  const s = (fullName ?? "").trim();
  if (!s) return { last: "", given: "", ext: "" };
  const parts = s.split(/\s+/).filter(Boolean);
  const last = parts[0] ?? "";
  const given = parts[1] ?? "";
  const ext = parts.slice(2).join(" ") || "";
  return { last, given, ext };
}

function QrPreview({ activeRowId, studentId }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    const generate = async () => {
      try {
        const value = String(studentId ?? activeRowId ?? "");
        if (!value || value === "undefined" || value === "null") {
          if (mounted) setQrDataUrl("");
          return;
        }
        const dataUrl = await QRCode.toDataURL(value);
        if (mounted) setQrDataUrl(dataUrl);
      } catch {
        if (mounted) setQrDataUrl("");
      }
    };
    generate();
    return () => {
      mounted = false;
    };
  }, [activeRowId, studentId]);

  if (!qrDataUrl) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontWeight: 800,
          borderRadius: 12,
          border: "1px dashed rgba(148,163,184,0.55)",
        }}
      >
        QR preview
      </div>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="Student QR Code"
      style={{ width: "100%", height: "auto", borderRadius: 12 }}
    />
  );
}

function GranteeDashboard() {
  const [grantees, setGrantees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [semester, setSemester] = useState("2nd");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [activeTab, setActiveTab] = useState("personal");
  const [visibleColumns, setVisibleColumns] = useState({
    studentId: true,
    name: true,
    sex: true,
    birthdate: true,
    course: true,
    scholarshipType: true,
    attendance: true,
    beneficiaryStatus: true,
    lastQrScan: true,
    qrStatus: true,
  });

  const [form, setForm] = useState({
    fullName: "",
    name: "",
    sex: "",
    birthdate: "",
    degreeProgram: "",
    course: "",
    scholarship_type: "",
    contact_number: "",
    email_address: "",
    guardian_name: "",
    attendance_percentage: "",
    semester: "",
    academic_year: "",
    beneficiary_status: "",
    qr_generated: false,
    last_qr_generated_at: "",
  });

  const [formError, setFormError] = useState(null);

  const sexOptions = ["M", "F"];
  const degreeProgramOptions = ["BSCS", "BSIT", "BSHM", "BSBA", "WAD"];

  const fetchGrantees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5000/students");
      setGrantees(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load grantees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrantees();
  }, []);

  const degreeOptions = useMemo(() => {
    const uniq = new Set((grantees || []).map((g) => g.course).filter(Boolean));
    return Array.from(uniq);
  }, [grantees]);

  const filtered = useMemo(() => {
    let result = grantees || [];
    const q = search.trim().toLowerCase();

    result = result.filter((g) => {
      const { last, given, ext } = parseNameParts(g.name);
      const matchesSearch =
        !q ||
        String(g.student_id ?? "").toLowerCase().includes(q) ||
        `${last} ${given} ${ext}`.toLowerCase().includes(q);
      const matchesProgram = !degreeProgram || String(g.course ?? "") === degreeProgram;
      return matchesSearch && matchesProgram;
    });

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortField === "name") {
        aVal = a.name ?? "";
        bVal = b.name ?? "";
      } else if (sortField === "attendance") {
        aVal = Number(a.attendance_percentage ?? 0);
        bVal = Number(b.attendance_percentage ?? 0);
      } else if (sortField === "course") {
        aVal = a.course ?? "";
        bVal = b.course ?? "";
      } else if (sortField === "status") {
        aVal = a.beneficiary_status ?? "";
        bVal = b.beneficiary_status ?? "";
      } else {
        aVal = a[sortField] ?? "";
        bVal = b[sortField] ?? "";
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return result;
  }, [grantees, search, degreeProgram, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const toggleRowSelection = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const exportCsv = () => {
    const header = [
      "TDP Award Number",
      "Student Name (Last, Given, Ext)",
      "Sex",
      "Birthdate",
      "Degree Program",
      "Attendance %",
      "Status",
    ];

    const rows = filtered.map((g) => {
      const np = parseNameParts(g.name);
      return [
        g.student_id,
        `${np.last}, ${np.given}, ${np.ext}`.trim(),
        g.sex || "",
        g.birthdate || "",
        g.course,
        g.attendance_percentage || 0,
        g.beneficiary_status || "At Risk",
      ];
    });

    const csv =
      [header.join(",")]
        .concat(
          rows.map((r) =>
            r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")
          )
        )
        .join("\n") + "\n";

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grantees_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEditDrawer = (g) => {
    setActiveRowId(g.id);
    setForm({
      name: g.name ?? "",
      sex: g.sex ?? "",
      birthdate: g.birthdate ? String(g.birthdate) : "",
      course: g.course ?? "",
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setActiveRowId(null);
    setFormError(null);
  };

  const saveUpdates = async () => {
    if (!form.name || !form.course) {
      setFormError("Name and Degree Program are required.");
      return;
    }
    if (!activeRowId) return;

    try {
      await axios.put(`http://localhost:5000/students/${activeRowId}`, {
        student_id: grantees.find((x) => x.id === activeRowId)?.student_id ?? "",
        name: form.name,
        course: form.course,
        sex: form.sex ?? "",
        birthdate: form.birthdate ?? "",
      });
      await fetchGrantees();
      closeDrawer();
      Swal.fire({
        title: "Saved",
        text: "Updates saved successfully",
        icon: "success",
        confirmButtonText: "OK",
      });
    } catch (e) {
      setFormError(e?.response?.data?.message || e.message || "Save failed");
    }
  };

  const deleteRow = async (id) => {
    const ok = window.confirm("Delete this grantee record?");
    if (!ok) return;
    try {
      await axios.delete(`http://localhost:5000/students/${id}`);
      await fetchGrantees();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  const deleteSelected = async () => {
    if (selectedRows.size === 0) {
      alert("Please select records to delete");
      return;
    }
    const ok = window.confirm(`Delete ${selectedRows.size} grantee records?`);
    if (!ok) return;
    try {
      await Promise.all(Array.from(selectedRows).map((id) => axios.delete(`http://localhost:5000/students/${id}`)));
      await fetchGrantees();
      setSelectedRows(new Set());
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FiRepeat size={14} />;
    return sortOrder === "asc" ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />;
  };

  return (
    <div style={{ padding: "1.5rem", background: "transparent", minHeight: "100vh" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface-border)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.5rem" }}>
              Program Basis: R.A. No. 10931
            </div>
            <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Student Scholarship Roster</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.5rem" }}>
              Current Term
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>2nd Semester, AY 2024-2025</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
              {filtered.length} active records
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--surface-border)",
          borderRadius: "1.25rem",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.5rem" }}>
              Search
            </label>
            <input
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid rgba(148,163,184,0.2)",
                fontSize: "0.95rem",
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or name"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.5rem" }}>
              Degree Program
            </label>
            <select
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid rgba(148,163,184,0.2)",
                fontSize: "0.95rem",
              }}
              value={degreeProgram}
              onChange={(e) => setDegreeProgram(e.target.value)}
            >
              <option value="">All Programs</option>
              {degreeOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.5rem" }}>
              Semester
            </label>
            <select
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.875rem",
                border: "1px solid rgba(148,163,184,0.2)",
                fontSize: "0.95rem",
              }}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <option value="2nd">2nd Semester</option>
              <option value="1st">1st Semester</option>
              <option value="summer">Summer</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={exportCsv}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "0.875rem",
              background: "#2563eb",
              color: "white",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Export CSV
          </button>

          {selectedRows.size > 0 && (
            <button
              onClick={deleteSelected}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "0.875rem",
                background: "#ef4444",
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Delete Selected ({selectedRows.size})
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Columns:</span>
            {Object.keys(visibleColumns).map((col) => (
              <button
                key={col}
                onClick={() => toggleColumnVisibility(col)}
                title={`Toggle ${col}`}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${visibleColumns[col] ? "#2563eb" : "#d1d5db"}`,
                  background: visibleColumns[col] ? "rgba(37,99,235,0.1)" : "transparent",
                  color: visibleColumns[col] ? "#2563eb" : "#6b7280",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {col.replace(/([A-Z])/g, " $1").trim()}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "white",
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
        }}
      >
        {error && (
          <div style={{ padding: "1rem", background: "#fee2e2", color: "#b91c1c", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}>
                <th
                  style={{
                    padding: "1rem",
                    textAlign: "center",
                    background: "#f8fafc",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(filtered.map((g) => g.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                  />
                </th>
                <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }} />

                {visibleColumns.studentId && (
                  <th
                    onClick={() => toggleSort("student_id")}
                    style={{ padding: "1rem", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Award # <SortIcon field="student_id" />
                  </th>
                )}
                {visibleColumns.name && (
                  <th
                    onClick={() => toggleSort("name")}
                    style={{ padding: "1rem", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Name <SortIcon field="name" />
                  </th>
                )}
                {visibleColumns.sex && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    Sex
                  </th>
                )}
                {visibleColumns.birthdate && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    Birthdate
                  </th>
                )}
                {visibleColumns.course && (
                  <th
                    onClick={() => toggleSort("course")}
                    style={{ padding: "1rem", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Program <SortIcon field="course" />
                  </th>
                )}
                {visibleColumns.scholarshipType && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    Scholarship
                  </th>
                )}
                {visibleColumns.attendance && (
                  <th
                    onClick={() => toggleSort("attendance")}
                    style={{ padding: "1rem", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    Attendance <SortIcon field="attendance" />
                  </th>
                )}
                {visibleColumns.beneficiaryStatus && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    Status
                  </th>
                )}
                {visibleColumns.lastQrScan && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    Last QR
                  </th>
                )}
                {visibleColumns.qrStatus && (
                  <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                    QR Status
                  </th>
                )}
                <th style={{ padding: "1rem", textAlign: "center", background: "#f8fafc", fontWeight: 600, fontSize: "0.85rem" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="14" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const np = parseNameParts(g.name);
                  const attendance = Math.max(0, Math.min(100, Number(g.attendance_percentage) || 0));
                  const attendanceColor = attendance >= 80 ? "#22c55e" : attendance >= 60 ? "#f59e0b" : "#ef4444";
                  const scholarshipType = g.scholarship_type === "TES" ? "TES" : "TDP";

                  return (
                    <AnimatePresence key={g.id}>
                      <motion.tbody
                        key={`${g.id}-content`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <tr
                          style={{
                            borderBottom: "1px solid rgba(148,163,184,0.15)",
                            background: selectedRows.has(g.id) ? "rgba(37,99,235,0.08)" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedRows.has(g.id)) {
                              e.currentTarget.style.background = "rgba(248,250,252,0.8)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedRows.has(g.id)) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={selectedRows.has(g.id)}
                              onChange={() => toggleRowSelection(g.id)}
                            />
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <button
                              onClick={() => toggleRowExpansion(g.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: expandedRows.has(g.id) ? "#2563eb" : "#6b7280",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                              }}
                              title="Expand row"
                            >
                              {expandedRows.has(g.id) ? <FiChevronsRight /> : <FiChevronsRight style={{ transform: "rotate(180deg)" }} />}
                            </button>
                          </td>

                          {visibleColumns.studentId && (
                            <td style={{ padding: "1rem", fontWeight: 600, color: "#1d4ed8" }}>
                              {g.student_id}
                            </td>
                          )}
                          {visibleColumns.name && (
                            <td style={{ padding: "1rem", fontWeight: 700 }}>
                              {np.last}
                              {np.given ? `, ${np.given}` : ""}
                              {np.ext ? `, ${np.ext}` : ""}
                            </td>
                          )}
                          {visibleColumns.sex && (
                            <td style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                              {g.sex || "—"}
                            </td>
                          )}
                          {visibleColumns.birthdate && (
                            <td style={{ padding: "1rem", textAlign: "center", color: "#6b7280" }}>
                              {g.birthdate || "—"}
                            </td>
                          )}
                          {visibleColumns.course && (
                            <td style={{ padding: "1rem" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "999px",
                                  background: "rgba(59,130,246,0.1)",
                                  color: "#2563eb",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {g.course || "—"}
                              </span>
                            </td>
                          )}
                          {visibleColumns.scholarshipType && (
                            <td style={{ padding: "1rem", textAlign: "center" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "999px",
                                  background: scholarshipType === "TES" ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.1)",
                                  color: scholarshipType === "TES" ? "#2563eb" : "#1d4ed8",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {scholarshipType}
                              </span>
                            </td>
                          )}
                          {visibleColumns.attendance && (
                            <td style={{ padding: "1rem" }}>
                              <div style={{ minWidth: "180px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                  <span style={{ fontWeight: 700, color: "#111827" }}>{attendance}%</span>
                                  <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 }}>
                                    {attendance >= 80 ? "On Track" : attendance >= 60 ? "Monitor" : "Critical"}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    height: "6px",
                                    borderRadius: "999px",
                                    background: `${attendanceColor}20`,
                                    overflow: "hidden",
                                    border: `1px solid ${attendanceColor}40`,
                                  }}
                                >
                                  <div style={{ width: `${attendance}%`, height: "100%", background: attendanceColor }} />
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.beneficiaryStatus && (
                            <td style={{ padding: "1rem", textAlign: "center" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "999px",
                                  background:
                                    g.beneficiary_status === "Active"
                                      ? "rgba(34,197,94,0.1)"
                                      : g.beneficiary_status === "Warning"
                                      ? "rgba(245,158,11,0.1)"
                                      : "rgba(239,68,68,0.1)",
                                  color:
                                    g.beneficiary_status === "Active"
                                      ? "#16a34a"
                                      : g.beneficiary_status === "Warning"
                                      ? "#d97706"
                                      : "#dc2626",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {g.beneficiary_status || "At Risk"}
                              </span>
                            </td>
                          )}
                          {visibleColumns.lastQrScan && (
                            <td style={{ padding: "1rem", textAlign: "center", color: "#6b7280", fontSize: "0.9rem" }}>
                              {g.last_qr_scan ? String(g.last_qr_scan).slice(0, 10) : "—"}
                            </td>
                          )}
                          {visibleColumns.qrStatus && (
                            <td style={{ padding: "1rem", textAlign: "center" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem",
                                  padding: "0.4rem 0.8rem",
                                  borderRadius: "999px",
                                  background: g.qr_generated ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                                  color: g.qr_generated ? "#16a34a" : "#dc2626",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                              >
                                {g.qr_generated ? (
                                  <>
                                    <FiCheck size={14} /> Generated
                                  </>
                                ) : (
                                  <>
                                    <FiAlertCircle size={14} /> Not Generated
                                  </>
                                )}
                              </span>
                            </td>
                          )}

                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                              <button
                                onClick={() => openEditDrawer(g)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "0.625rem",
                                  border: "1px solid rgba(34,197,94,0.35)",
                                  background: "rgba(34,197,94,0.1)",
                                  color: "#16a34a",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteRow(g.id)}
                                style={{
                                  padding: "0.5rem 0.75rem",
                                  borderRadius: "0.625rem",
                                  border: "1px solid rgba(239,68,68,0.35)",
                                  background: "rgba(239,68,68,0.1)",
                                  color: "#dc2626",
                                  fontWeight: 600,
                                  fontSize: "0.85rem",
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedRows.has(g.id) && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ borderBottom: "1px solid rgba(148,163,184,0.15)", background: "rgba(248,250,252,0.5)" }}
                          >
                            <td colSpan="14" style={{ padding: "1.5rem" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
                                    Contact Number
                                  </div>
                                  <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                                    {g.contact_number || "Not provided"}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
                                    Email Address
                                  </div>
                                  <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                                    {g.email_address || "Not provided"}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
                                    Guardian Name
                                  </div>
                                  <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                                    {g.guardian_name || "Not provided"}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
                                    Academic Year
                                  </div>
                                  <div style={{ fontSize: "0.95rem", color: "#111827" }}>
                                    {g.academic_year || "Not provided"}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </motion.tbody>
                    </AnimatePresence>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Drawer - Keep original as is */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="grantee-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeDrawer();
            }}
          >
            <motion.div
              className="grantee-edit-modal"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="grantee-edit-header">
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div className="avatar" style={{ width: 56, height: 56, borderRadius: 18 }}>
                    <FiUser size={22} />
                  </div>
                  <div>
                    <div className="grantee-edit-title">Edit Grantee Record</div>
                    <div className="grantee-edit-subtitle">Update personal and scholarship information.</div>
                  </div>
                </div>
                <button className="grantee-edit-close" onClick={closeDrawer}>
                  <FiX size={18} />
                </button>
              </div>

              <div className="grantee-edit-body">
                <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Full Name *
                    </label>
                    <input
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.875rem",
                        border: "1px solid rgba(148,163,184,0.3)",
                        fontSize: "0.95rem",
                      }}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Sex
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.875rem",
                        border: "1px solid rgba(148,163,184,0.3)",
                        fontSize: "0.95rem",
                      }}
                      value={form.sex}
                      onChange={(e) => setForm({ ...form, sex: e.target.value })}
                    >
                      <option value="">Select</option>
                      {sexOptions.map((s) => (
                        <option key={s} value={s}>
                          {s === "M" ? "Male" : "Female"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Birthdate
                    </label>
                    <input
                      type="date"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.875rem",
                        border: "1px solid rgba(148,163,184,0.3)",
                        fontSize: "0.95rem",
                      }}
                      value={form.birthdate}
                      onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      Degree Program *
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.875rem",
                        border: "1px solid rgba(148,163,184,0.3)",
                        fontSize: "0.95rem",
                      }}
                      value={form.course}
                      onChange={(e) => setForm({ ...form, course: e.target.value })}
                    >
                      <option value="">Select Program</option>
                      {degreeProgramOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formError && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "0.875rem", background: "#fee2e2", color: "#b91c1c", fontSize: "0.9rem" }}>
                    {formError}
                  </div>
                )}
              </div>

              <div style={{ padding: "1rem", borderTop: "1px solid rgba(148,163,184,0.2)", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  onClick={closeDrawer}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.875rem",
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "white",
                    color: "#111827",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveUpdates}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.875rem",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GranteeDashboard;
