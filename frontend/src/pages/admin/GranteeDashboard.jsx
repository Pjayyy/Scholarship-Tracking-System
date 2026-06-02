import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import QRCode from "qrcode";
import { FiX, FiUser, FiCalendar, FiRepeat, FiLoader, FiInfo, FiAlertCircle, FiCheck, FiShield, FiFileText } from "react-icons/fi";


import Swal from "sweetalert2";
import "../../styles/GranteeEditModal.css";
import "../../styles/adminButtons.css";

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
        // Prefer the student's real unique ID.
        // GranteeDashboard fetches rows from /students which includes student_id.
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
          color: "var(--text-secondary)",
          fontWeight: 800,
          borderRadius: 12,
          border: "1px dashed rgba(148,163,184,0.35)",
          background: "rgba(2,6,23,0.12)",
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



function DocumentTabEditor({ activeRowId }) {
  return (
    <div>
      <div style={{ fontWeight: 1000, color: "var(--text-secondary)", marginBottom: 10, fontSize: 13 }}>
        Document Compliance
      </div>
      <div style={{ padding: 14, borderRadius: 16, border: "1px solid rgba(148,163,184,0.28)", background: "rgba(255,255,255,0.45)" }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="grantee-field" style={{ gap: 6 }}>
            <div className="grantee-label">Requirements Submitted</div>
            <div style={{ fontWeight: 1000 }}>3 / 5</div>
          </div>
          <div className="grantee-field" style={{ gap: 6 }}>
            <div className="grantee-label">Validation Status</div>
            <div style={{ fontWeight: 1000 }}>Verified</div>
          </div>
          <div className="hint">Documents are reviewed by the scholarship committee. Update status based on physical or digital submissions.</div>
        </div>
      </div>
    </div>
  );
}


function GranteeDashboard() {
  const [grantees, setGrantees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Controls
  const [search, setSearch] = useState("");
  const [degreeProgram, setDegreeProgram] = useState("");
  const [semester, setSemester] = useState("2nd");

  // Modal CRUD
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  const [activeTab, setActiveTab] = useState("personal");

  const [form, setForm] = useState({
    // Personal
    fullName: "",
    name: "",
    email: "",
    // DB values are ENUM('Male','Female'), so default to these strings.
    sex: "",
    birthdate: "",

    // Scholarship / Program (backend-supported)
    student_id: "",
    course: "",
    year_level: "",
    award_number: "",
    scholarship_type: "",

    // QR (backend-supported stored value)
    qr_code: "",



    // Keep legacy fields so UI won't crash if referenced elsewhere
    degreeProgram: "",
    scholarshipType: "",
    contact_number: "",
    contactNumber: "",
    email_address: "",
    emailAddress: "",
    guardian_name: "",
    guardianName: "",
    attendance_percentage: "",
    attendancePercentage: "",
    semester: "",
    academic_year: "",
    academicYear: "",
    beneficiary_status: "",
    beneficiaryStatus: "",

    qr_generated: false,
    qrGenerated: false,
    qrCodeStatus: "",
    last_qr_generated_at: "",
    lastQrGeneratedAt: "",
  });

  const [formError, setFormError] = useState(null);

  const PROGRAM_BASIS = "R.A. No. 10931";
  const HEADER_SEMESTER = "2nd Semester, AY 2024-2025";

  const sexOptions = ["M", "F"];
  const degreeProgramOptions = ["BSCS", "BSIT", "BSHM", "BSBA", "WAD"];

  const fetchGrantees = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rosterRes, statsRes] = await Promise.all([
        axios.get("http://localhost:5000/students"),
        axios.get("http://localhost:5000/grantees/stats"),
      ]);

      const roster = rosterRes.data || [];
      const statsRows = statsRes.data || [];

      const statsByStudentId = new Map(
        statsRows.map((s) => [String(s.student_id ?? ""), s])
      );

      // Merge stats into roster rows by student_id
      const merged = (roster || []).map((g) => {
        const key = String(g.student_id ?? "");
        const st = statsByStudentId.get(key);
        return {
          ...g,
          ...(st || {}),
          // Keep legacy field names as aliases so existing render logic still works
          attendancePercentage: st?.attendance_percentage ?? g.attendancePercentage,
          attendance_percentage: st?.attendance_percentage ?? g.attendance_percentage,
          beneficiaryStatus: st?.beneficiary_status ?? g.beneficiaryStatus,
          beneficiary_status: st?.beneficiary_status ?? g.beneficiary_status,
          lastQrScan: st?.last_qr_scan ?? g.lastQrScan,
          last_qr_scan: st?.last_qr_scan ?? g.last_qr_scan,
          qrGenerated: st?.qr_generated ?? g.qrGenerated,
          qr_generated: st?.qr_generated ?? g.qr_generated,
        };
      });

      setGrantees(merged);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load grantees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrantees();
    // Auto-refresh every 10 seconds so admin sees student updates instantly
    const interval = setInterval(fetchGrantees, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const degreeOptions = useMemo(() => {
    const uniq = new Set((grantees || []).map((g) => g.course).filter(Boolean));
    return Array.from(uniq);
  }, [grantees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (grantees || []).filter((g) => {
      // Search: match against student_id, award_number, or any part of the name
      const matchesSearch =
        !q ||
        String(g.student_id ?? "").toLowerCase().includes(q) ||
        String(g.award_number ?? "").toLowerCase().includes(q) ||
        String(g.name ?? "").toLowerCase().includes(q);

      // Degree program filter
      const matchesProgram = !degreeProgram || String(g.course ?? "") === degreeProgram;

      // Scholarship type filter (TES/TDP mapped to semester-like behavior)
      const scholarshipTypeRaw = String(g.scholarship_type ?? "").toUpperCase();
      const matchesSemester =
        !semester ||
        semester === "all" ||
        (semester === "TES" && scholarshipTypeRaw.includes("TES")) ||
        (semester === "TDP" && scholarshipTypeRaw.includes("TDP"));

      return matchesSearch && matchesProgram && matchesSemester;
    });
  }, [grantees, search, degreeProgram, semester]);

  const exportCsv = () => {
    const header = [
      "TDP Award Number",
      "Student Name (Last, Given, Ext)",
      "Sex",
      "Birthdate",

      "Degree Program",
    ];

    const rows = filtered.map((g) => {
      const np = parseNameParts(g.name);
      return [
        g.student_id,
        `${np.last}, ${np.given}, ${np.ext}`.trim(),
        "",
        "",
        g.course,
      ];
    });

    const csv =
      [header.join(",")]
        .concat(rows.map((r) => r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")))
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
      // Personal
      student_id: g.student_id ?? "",
      name: g.name ?? "",
      email: g.email ?? "",
      sex: g.sex ?? "",
      birthdate: g.birthdate ? String(g.birthdate) : "",

      // Scholarship / Program (backend-supported)
      course: g.course ?? "",
      year_level: g.year_level ? String(g.year_level) : g.yearLevel ? String(g.yearLevel) : "",
      award_number: g.award_number ?? g.awardNumber ?? "",
      scholarship_type: g.scholarship_type ?? g.scholarshipType ?? "",

      // QR (backend-supported stored value)
      qr_code: g.qr_code ?? g.qrCode ?? "",
      qr_generated: g.qr_generated ?? g.qrGenerated ?? false,
      qrGenerated: g.qrGenerated ?? g.qr_generated ?? false,
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
    // Validation: only enforce required fields in create mode
    if (activeRowId == null) {
      if (!form.student_id) {
        setFormError("Student ID is required.");
        return;
      }
      if (!form.name || !form.course) {
        setFormError("Name and Degree Program are required.");
        return;
      }
      if (!form.year_level) {
        setFormError("Year Level is required.");
        return;
      }
      if (!form.scholarship_type) {
        setFormError("Scholarship Type is required.");
        return;
      }
    }

    // CREATE mode
    if (activeRowId == null) {
      try {
        await axios.post("http://localhost:5000/students", {
          student_id: form.student_id,
          award_number: form.award_number ?? "",
          qr_code: form.qr_code ?? "",
          name: form.name,
          email: form.email ?? "",
          course: form.course,
          year_level: form.year_level,
          scholarship_type: form.scholarship_type,
          sex: form.sex ?? "",
          birthdate: form.birthdate ?? "",
        });

        await fetchGrantees();
        closeDrawer();
        Swal.fire({
          title: "Created",
          text: "New grantee added",
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (e) {
        setFormError(e?.response?.data?.message || e.message || "Create failed");
      }

      return;
    }

    // UPDATE mode
    try {
      await axios.put(`http://localhost:5000/students/${activeRowId}`, {
        name: form.name,
        email: form.email ?? "",
        sex: form.sex ?? "",
        birthdate: form.birthdate ?? "",
        award_number: form.award_number ?? "",
        scholarship_type: form.scholarship_type ?? "",
        course: form.course,
        year_level: form.year_level ?? "",
        qr_code: form.qr_code ?? "",
      });
      await fetchGrantees();
      closeDrawer();
      Swal.fire({
        title: "Saved",
        text: "Updates saved",
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

  const ui = {
    page: {
      padding: 20,
      fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif",
      background: "transparent",
      color: "var(--text-primary)",
    },
    headerBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      background: "var(--surface)",
      border: "1px solid var(--surface-border)",
      borderRadius: 16,
      padding: "16px 20px",
      boxShadow: "var(--shadow-md)",
      marginBottom: 16,
    },
    headerLeft: { display: "flex", flexDirection: "column" },
    headerRight: { textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" },
    headerCaption: { fontSize: 13, color: "var(--text-secondary)", marginBottom: 2, fontWeight: 700 },
    headerTitle: { fontSize: 18, fontWeight: 900 },

    controls: {
      background: "var(--surface)",
      border: "1px solid var(--surface-border)",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      boxShadow: "var(--shadow-md)",
    },

    addBtn: {
      padding: "13px 18px",
      borderRadius: 12,
      background: "var(--primary)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 15,
      whiteSpace: "nowrap",
    },
    primaryBtn: {
      padding: "11px 16px",
      borderRadius: 12,
      background: "var(--primary)",
      color: "#fff",
      border: "1px solid rgba(56,189,248,0.35)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 15,
    },
    outlineBtn: {
      padding: "11px 14px",
      borderRadius: 12,
      background: "rgba(2,6,23,0.12)",
      color: "var(--text-primary)",
      border: "1px solid var(--surface-border)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 15,
    },

    label: { display: "block", fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 700 },
    field: {
      width: "100%",
      padding: "11px 12px",
      borderRadius: 12,
      border: "1px solid var(--surface-border)",
      outline: "none",
      background: "rgba(2,6,23,0.12)",
      fontSize: 15,
      color: "var(--text-primary)",
    },

    tableWrap: {
      background: "var(--surface)",
      border: "1px solid var(--surface-border)",
      borderRadius: 16,
      boxShadow: "var(--shadow-md)",
      overflow: "hidden",
    },

    th: {
      padding: "12px 14px",
      fontSize: 12,
      color: "var(--text-secondary)",
      textAlign: "left",
      background: "var(--surface-2)",
      borderBottom: "1px solid var(--surface-border)",
      fontWeight: 900,
    },
    td: { padding: "12px 14px", fontSize: 14, borderBottom: "1px solid var(--surface-border)" },

    iconBtnBase: {
      height: 40,
      borderRadius: 999,
      border: "1px solid transparent",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: "0 12px",
      gap: 8,
      fontWeight: 1000,
      fontSize: 13,
      lineHeight: 1,
      transition: "transform 120ms ease, box-shadow 160ms ease, background 160ms ease",
    },
    iconView: {
      background: "rgba(37, 99, 235, 0.12)",
      borderColor: "rgba(37, 99, 235, 0.35)",
      color: "#1d4ed8",
    },
    iconEdit: {
      background: "rgba(34, 197, 94, 0.12)",
      borderColor: "rgba(34, 197, 94, 0.35)",
      color: "#16a34a",
    },
    iconDel: {
      background: "rgba(239, 68, 68, 0.12)",
      borderColor: "rgba(239, 68, 68, 0.35)",
      color: "#dc2626",
    },
    iconQr: {
      background: "rgba(99, 102, 241, 0.12)",
      borderColor: "rgba(99, 102, 241, 0.35)",
      color: "#4f46e5",
    },

    drawerOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.15)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "flex-end",
    },
    drawer: {
      width: 980,
      maxWidth: "calc(100vw - 24px)",
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      height: "auto",
      maxHeight: "calc(100vh - 24px)",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.25)",
      boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    drawerHeader: {
      padding: "18px 20px",
      borderBottom: "1px solid rgba(148,163,184,0.25)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    drawerTitle: { fontSize: 16, fontWeight: 1000 },
    drawerSub: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 600 },
    drawerBody: { padding: "16px 20px", overflowY: "auto" },
    drawerFooter: {
      padding: "14px 20px",
      borderTop: "1px solid rgba(148,163,184,0.25)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
    },
  };

  return (
    <div style={ui.page}>
      {/* Header */}
      <div style={ui.headerBar}>
        <div style={ui.headerLeft}>
          <div style={ui.headerCaption}>Program Basis: R.A. No. 10931</div>
          <div style={{ display: "none" }} />
        </div>
        <div style={ui.headerRight}>
          <div style={ui.headerCaption}>2nd Semester, AY 2024-2025</div>
        </div>
      </div>

      {/* Control Row */}
      <div style={ui.controls}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <button
            type="button"
            className="grantee-admin-cta-btn"
            style={ui.addBtn}
            onClick={() => {

              // Create mode
              setActiveRowId(null);
              setActiveTab("personal");
              setForm({
                // Personal
                name: "",
                email: "",
                sex: "",
                birthdate: "",

                // Scholarship / Program
                student_id: "",
                course: "",
                year_level: "",
                award_number: "",
                scholarship_type: "",

                // QR (stored value)
                qr_code: "",
              
                // Legacy fields so UI doesn't crash if referenced
                degreeProgram: "",
                scholarshipType: "",
                contact_number: "",
                contactNumber: "",
                email_address: "",
                emailAddress: "",
                guardian_name: "",
                guardianName: "",
                attendance_percentage: "",
                attendancePercentage: "",
                semester: "",
                academic_year: "",
                academicYear: "",
                beneficiary_status: "",
                beneficiaryStatus: "",

                qr_generated: false,
                qrGenerated: false,
                qrCodeStatus: "",
                last_qr_generated_at: "",
                lastQrGeneratedAt: "",
              });
              setFormError(null);
              setDrawerOpen(true);
            }}
          >
            + Add New Grantee
          </button>


          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <label style={ui.label}>Search</label>
            <input
              style={ui.field}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by TDP Award Number or Student Name"
            />
          </div>

          <div style={{ minWidth: 220, flex: "0 0 220px" }}>
            <label style={ui.label}>Degree Program</label>
            <select
              style={ui.field}
              value={degreeProgram}
              onChange={(e) => setDegreeProgram(e.target.value)}
            >
              <option value="">All</option>
              {degreeOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 180, flex: "0 0 180px" }}>
            <label style={ui.label}>Scholarship Type</label>
            <select style={ui.field} value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Types</option>
              <option value="TES">TES</option>
              <option value="TDP">TDP</option>
            </select>
          </div>

          <button type="button" className="grantee-admin-cta-btn" style={ui.outlineBtn} onClick={() => { /* client-side filters auto-apply */ }}>
            Filter
          </button>

          <button type="button" className="grantee-admin-cta-btn" style={ui.addBtn} onClick={exportCsv}>
            Export
          </button>

        </div>
      </div>

      {/* Data Table */}
      <div style={ui.tableWrap}>
        {error && <div style={{ padding: 14, color: "#b91c1c", fontWeight: 800 }}>{error}</div>}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={ui.th}>TDP Award Number</th>
                <th style={ui.th}>Student Name</th>
                <th style={ui.th}>Sex</th>
                <th style={ui.th}>Birthdate</th>
                <th style={ui.th}>Degree Program</th>
                <th style={ui.th}>Scholarship Type</th>
                <th style={{ ...ui.th, textAlign: "left" }}>Submission Progress</th>
                <th style={ui.th}>Beneficiary Status</th>
                <th style={ui.th}>Renewal Date</th>
                <th style={{ ...ui.th, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={{ ...ui.td, padding: 14 }} colSpan={11}>
                    Loading…
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const np = parseNameParts(g.name);

                  // Safe fallbacks for fields that may not exist yet on the backend.
                  const sex = g.sex ?? "";
                  const birthdate = g.birthdate ?? "";

                  const scholarshipTypeRaw = g.scholarship_type ?? g.scholarshipType ?? "";
                  const scholarshipType =
                    String(scholarshipTypeRaw).toUpperCase().includes("TES")
                      ? "TES"
                      : String(scholarshipTypeRaw).toUpperCase().includes("TDP")
                        ? "TDP"
                        : "TDP";

                  const attendanceRaw = g.attendance_percentage ?? g.attendancePercentage ?? g.attendance ?? 0;
                  const attendance = Math.max(0, Math.min(100, Number(attendanceRaw) || 0));

                  const statusRaw = g.beneficiary_status ?? g.beneficiaryStatus ?? "";
                  const statusNormalized = String(statusRaw).toLowerCase();
                  const beneficiaryStatus =
                    statusNormalized.includes("active")
                      ? "Active"
                      : statusNormalized.includes("warning")
                        ? "Warning"
                        : statusNormalized.includes("at risk") || statusNormalized.includes("atrisk")
                          ? "At Risk"
                          : "At Risk";

                  const lastQrScan = g.last_qr_scan ?? g.lastQrScan ?? "";
                  const lastQrScanDisplay = lastQrScan ? String(lastQrScan) : "—";

                  const attendanceValue = attendance;


                  // QR generated flag.
                  const qrGeneratedRaw = g.qr_generated ?? g.qrGenerated ?? g.qr_status_generated ?? "";
                  const qrGenerated =
                    typeof qrGeneratedRaw === "boolean"
                      ? qrGeneratedRaw
                      : String(qrGeneratedRaw).toLowerCase() === "true" || String(qrGeneratedRaw) === "1";
                  const qrStatus = qrGenerated ? "Generated" : "Not Generated";


                  const attendanceColor = attendance >= 80 ? "#22c55e" : attendance >= 60 ? "#f59e0b" : "#ef4444";
                  const attendanceBg = attendance >= 80 ? "rgba(34,197,94,0.12)" : attendance >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
                  const statusStyles = {
                    Active: { bg: "rgba(34,197,94,0.14)", color: "#16a34a", border: "rgba(34,197,94,0.35)" },
                    Warning: { bg: "rgba(245,158,11,0.14)", color: "#d97706", border: "rgba(245,158,11,0.35)" },
                    "At Risk": { bg: "rgba(239,68,68,0.14)", color: "#dc2626", border: "rgba(239,68,68,0.35)" },
                  };
                  const badge = statusStyles[beneficiaryStatus] || statusStyles["At Risk"];
                  const qrBadge = qrGenerated
                    ? { bg: "rgba(34,197,94,0.14)", color: "#16a34a", border: "rgba(34,197,94,0.35)" }
                    : { bg: "rgba(239,68,68,0.14)", color: "#dc2626", border: "rgba(239,68,68,0.35)" };

                  const rowBase = {
                    transition: "all 0.2s",
                  };

                  const onView = () => {
                    Swal.fire({
                      title: "Student Details",
                      html: `<b>${np.last}</b>${np.given ? `, ${np.given}` : ""}${np.ext ? `, ${np.ext}` : ""}`,
                      icon: "info",
                      confirmButtonText: "OK",
                    });
                  };
                  const onViewQR = () => alert(`View QR: ${g.student_id ?? ""}`.trim());

                  return (
                    <tr
                      key={g.id}
                      style={rowBase}
                    >
                      <td style={{ ...ui.td, whiteSpace: "nowrap" }}>{g.student_id}</td>
                      <td style={ui.td}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {np.last}
                          {np.given ? `, ${np.given}` : ""}
                          {np.ext ? `, ${np.ext}` : ""}
                        </div>
                      </td>

                      <td style={ui.td}>{sex || "—"}</td>
                      <td style={ui.td}>{birthdate || "—"}</td>
                      <td style={ui.td}>{g.course || "—"}</td>

                      <td style={ui.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: scholarshipType === "TES" ? "rgba(79, 70, 229, 0.1)" : "rgba(99, 102, 241, 0.1)",
                            color: scholarshipType === "TES" ? "var(--primary)" : "var(--secondary)",
                            border: `1px solid ${scholarshipType === "TES" ? "rgba(79, 70, 229, 0.2)" : "rgba(99, 102, 241, 0.2)"}`,
                            fontWeight: 700,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {scholarshipType}
                        </span>
                      </td>

                      <td style={ui.td}>
                        <div style={{ minWidth: 220 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{attendance > 50 ? "Complete" : "Pending"}</span>
                            <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{attendance >= 80 ? "Validated" : "Under Review"}</span>

                          </div>
                          <div style={{ height: 8, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
                            <div style={{ width: `75%`, height: "100%", background: "var(--primary)", borderRadius: 999 }} />
                          </div>
                        </div>
                      </td>

                      <td style={ui.td}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontWeight: 700,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {beneficiaryStatus}
                        </span>
                      </td>

                      <td style={ui.td}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                          }}
                          data-cell="last-qr"
                        >
                          May 15, 2026
                        </div>
                      </td>

                      <td style={{ ...ui.td, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "nowrap" }}>

                          {/* View */}
                          <button
                            type="button"
                            aria-label="View"
                            title="View"
                            className="grantee-admin-icon-btn"
                            style={{
                              ...ui.iconBtnBase,
                              borderColor: "rgba(37, 99, 235, 0.45)",
                              background: "rgba(37, 99, 235, 0.14)",
                              color: "#1d4ed8",
                              boxShadow: "0 6px 16px rgba(29,78,216,0.10)",
                            }}
                            onClick={onView}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>View</span>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            aria-label="Edit"
                            title="Edit"
                            className="grantee-admin-icon-btn"
                            style={{
                              ...ui.iconBtnBase,
                              borderColor: "rgba(34, 197, 94, 0.45)",

                              background: "rgba(34, 197, 94, 0.14)",
                              color: "#16a34a",
                              boxShadow: "0 6px 16px rgba(22,163,74,0.10)",
                            }}
                            onClick={() => openEditDrawer(g)}
          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            aria-label="Delete"
                            title="Delete"
                            className="grantee-admin-icon-btn"
                            style={{
                              ...ui.iconBtnBase,
                              borderColor: "rgba(239, 68, 68, 0.45)",

                              background: "rgba(239, 68, 68, 0.14)",
                              color: "#dc2626",
                              boxShadow: "0 6px 16px rgba(220,38,38,0.10)",
                            }}
                            onClick={() => deleteRow(g.id)}
          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                            <span>Delete</span>
                          </button>

                          {/* View QR */}
                          <button
                            type="button"
                            aria-label="View QR"
                            title="View QR"
                            className="grantee-admin-icon-btn"
                            style={{
                              ...ui.iconBtnBase,
                              borderColor: "rgba(99, 102, 241, 0.45)",

                              background: "rgba(99, 102, 241, 0.14)",
                              color: "#4f46e5",
                              boxShadow: "0 6px 16px rgba(79,70,229,0.10)",
                            }}
                            onClick={onViewQR}
          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <path d="M14 14h7v7h-7z" />
                            </svg>
                            <span>QR</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Edit Grantee Panel */}
      {/* Modern Edit Grantee Panel (Side Drawer) */}
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
              role="dialog"
              aria-modal="true"
              aria-label={activeRowId ? "Edit Grantee Record" : "Add New Grantee"}
            >
              <div className="grantee-edit-header">
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div className="avatar" aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 18 }}>
                    <FiUser size={22} />
                  </div>
                  <div>
                    <div className="grantee-edit-title">{activeRowId ? "Edit Grantee Record" : "Add New Grantee"}</div>
                    <div className="grantee-edit-subtitle">Fill in the details below</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="grantee-edit-close"
                  aria-label="Close"
                  onClick={closeDrawer}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="grantee-edit-body">
                <div className="grantee-form-grid">
                  {/* Row 1 */}
                  <div className="grantee-field">
                    <div className="grantee-label">Student ID <span style={{ color: "#ef4444" }}>*</span></div>
                    <input
                      className="grantee-input"
                      value={form.student_id ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value }))}
                      placeholder="e.g. 2300092700"
                    />
                  </div>

                  <div className="grantee-field">
                    <div className="grantee-label">Full Name <span style={{ color: "#ef4444" }}>*</span></div>
                    <input
                      className="grantee-input"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="grantee-field">
                    <div className="grantee-label">Email Address</div>
                    <input
                      type="email"
                      className="grantee-input"
                      value={form.email ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="student@email.com"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="grantee-field">
                    <div className="grantee-label">Sex</div>
                    <select
                      className="grantee-input"
                      value={form.sex}
                      onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {sexOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grantee-field">
                    <div className="grantee-label">Birthdate</div>
                    <input
                      type="date"
                      className="grantee-input"
                      value={form.birthdate}
                      onChange={(e) => setForm((p) => ({ ...p, birthdate: e.target.value }))}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="grantee-field">
                    <div className="grantee-label">Degree Program <span style={{ color: "#ef4444" }}>*</span></div>
                    <select
                      className="grantee-input"
                      value={form.course}
                      onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {degreeProgramOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grantee-field">
                    <div className="grantee-label">Year Level <span style={{ color: "#ef4444" }}>*</span></div>
                    <input
                      className="grantee-input"
                      value={form.year_level ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, year_level: e.target.value }))}
                      placeholder="e.g. 2"
                    />
                  </div>

                  {/* Row 4 */}
                  <div className="grantee-field">
                    <div className="grantee-label">Scholarship Type <span style={{ color: "#ef4444" }}>*</span></div>
                    <select
                      className="grantee-input"
                      value={form.scholarship_type ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, scholarship_type: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      <option value="TES">TES</option>
                      <option value="TDP">TDP</option>
                    </select>
                  </div>

                  <div className="grantee-field">
                    <div className="grantee-label">Award Number</div>
                    <input
                      className="grantee-input"
                      value={form.award_number ?? ""}
                      onChange={(e) => setForm((p) => ({ ...p, award_number: e.target.value }))}
                      placeholder="Award Number"
                    />
                  </div>
                </div>

                {formError && (
                  <div style={{ marginTop: 16, color: "#ef4444", fontWeight: 700, fontSize: 13 }}>
                    {formError}
                  </div>
                )}
              </div>

              <div className="grantee-edit-footer">
                <button type="button" className="grantee-secondary" onClick={closeDrawer}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="grantee-primary"
                  onClick={() => {
                    if (activeRowId == null) {
                      Swal.fire({
                        title: "Add Grantee?",
                        text: "This will add a new grantee record.",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonText: "Yes, add",
                        cancelButtonText: "Cancel",
                        reverseButtons: true,
                      }).then((result) => {
                        if (result.isConfirmed) saveUpdates();
                      });
                    } else {
                      Swal.fire({
                        title: "Save Changes?",
                        text: "This will update the grantee record.",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonText: "Yes, save",
                        cancelButtonText: "Cancel",
                        reverseButtons: true,
                      }).then((result) => {
                        if (result.isConfirmed) saveUpdates();
                      });
                    }
                  }}
                >
                  {activeRowId ? "Save Changes" : "Add Grantee"}
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
