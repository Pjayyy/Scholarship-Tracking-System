import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiDownload, FiSearch } from "react-icons/fi";

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function toCsv(rows) {
  const header = ["Date", "Time In", "Status", "QR Scan", "Semester"];
  const escapeCell = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((r) => [r.date, r.timeIn, r.status, r.qrStatus, r.semester].map(escapeCell).join(","));
  return [header.join(","), ...body].join("\n");
}

function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AttendanceHistory({ studentData }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [attendanceRecords] = useState([
    { id: 1, date: "2026-05-10", timeIn: "08:30 AM", status: "Present", qrStatus: "Scanned", semester: "2nd" },
    { id: 2, date: "2026-05-09", timeIn: "08:45 AM", status: "Present", qrStatus: "Scanned", semester: "2nd" },
    { id: 3, date: "2026-05-08", timeIn: "—", status: "Absent", qrStatus: "Not Scanned", semester: "2nd" },
    { id: 4, date: "2026-05-07", timeIn: "08:50 AM", status: "Present", qrStatus: "Scanned", semester: "2nd" },
    { id: 5, date: "2026-05-06", timeIn: "08:35 AM", status: "Present", qrStatus: "Scanned", semester: "2nd" },
  ]);

  const monthOptions = useMemo(() => {
    const months = new Map();
    for (const r of attendanceRecords) {
      const d = new Date(r.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      months.set(key, label);
    }
    return [...months.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([value, label]) => ({ value, label }));
  }, [attendanceRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return attendanceRecords.filter((record) => {
      const matchesSearch =
        !q ||
        record.date.toLowerCase().includes(q) ||
        record.status.toLowerCase().includes(q) ||
        record.qrStatus.toLowerCase().includes(q);

      const matchesMonth = !filterMonth || String(record.date).startsWith(filterMonth);
      return matchesSearch && matchesMonth;
    });
  }, [attendanceRecords, filterMonth, searchTerm]);

  const stats = useMemo(() => {
    const total = attendanceRecords.length || 0;
    const present = attendanceRecords.filter((r) => r.status === "Present").length;
    const absent = attendanceRecords.filter((r) => r.status === "Absent").length;
    const percentage = total ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, percentage };
  }, [attendanceRecords]);

  return (
    <div className="panel">
      <motion.section
        className="page-hero"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 18 }}
      >
        <div className="page-hero__row">
          <div>
            <div className="kicker">Attendance</div>
            <div className="page-title">Attendance History</div>
            <div className="page-subtitle" style={{ marginTop: 10 }}>
              Track your QR scans and attendance status. {studentData?.studentId ? `Student ID: ${studentData.studentId}.` : ""}
            </div>
          </div>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadCsv("attendance_history.csv", filteredRecords)}
              disabled={!filteredRecords.length}
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
        </div>
      </motion.section>

      <div className="stat-card-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card stat-scanned">
          <div className="stat-top">
            <div className="stat-icon">📅</div>
            <div className="stat-title">Total Sessions</div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-present">
          <div className="stat-top">
            <div className="stat-icon">✓</div>
            <div className="stat-title">Present</div>
          </div>
          <div className="stat-value">{stats.present}</div>
        </div>
        <div className="stat-card stat-absent">
          <div className="stat-top">
            <div className="stat-icon">✕</div>
            <div className="stat-title">Absent</div>
          </div>
          <div className="stat-value">{stats.absent}</div>
        </div>
        <div className="stat-card stat-late">
          <div className="stat-top">
            <div className="stat-icon">%</div>
            <div className="stat-title">Attendance Rate</div>
          </div>
          <div className="stat-value">{stats.percentage}%</div>
        </div>
      </div>

      <div className="card card-glass table-card">
        <div className="table-toolbar">
          <div className="search-wrap">
            <FiSearch className="search-icon" />
            <input
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search date, status, QR..."
              aria-label="Search attendance records"
            />
          </div>

          <div className="toolbar-actions">
            <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} aria-label="Filter by month">
              <option value="">All Months</option>
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-scroll">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Status</th>
                <th>QR Scan</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {!filteredRecords.length ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-empty">No attendance records found.</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isPresent = record.status === "Present";
                  const isScanned = record.qrStatus === "Scanned";
                  return (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 800 }}>{formatDate(record.date)}</td>
                      <td style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{record.timeIn}</td>
                      <td>
                        <span className={`badge ${isPresent ? "badge-success" : "badge-danger"}`}>
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isScanned ? "badge-success" : "badge-neutral"}`}>
                          {isScanned ? "Scanned" : "Not Scanned"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800 }}>{record.semester}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceHistory;

