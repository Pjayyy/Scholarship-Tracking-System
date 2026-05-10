import { useEffect, useMemo, useRef, useState } from "react";
import API from "./api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Html5QrcodeScanner } from "html5-qrcode";

import {
  FaBell,
  FaCamera,
  FaClock,
  FaExclamationTriangle,
  FaFileExport,
  FaPause,
  FaPlay,
  FaQrcode,
  FaRedo,
  FaSearch,
  FaStopCircle,
  FaTimesCircle,
  FaCheckCircle,
  FaInfoCircle,
  FaUsers,
} from "react-icons/fa";

const PAGE_SIZES = [10, 20, 50];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(isoLike) {
  if (!isoLike) return "N/A";
  try {
    return new Date(isoLike).toLocaleString();
  } catch {
    return "N/A";
  }
}

function initialsFromName(name) {
  if (!name) return "?";
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2);
  if (parts.length === 0) return "?";
  return parts
    .map((p) => p?.[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }) {
  const normalized = String(status ?? "").toLowerCase();
  const className =
    normalized === "present"
      ? "badge badge-success"
      : normalized === "late"
        ? "badge badge-warning"
        : normalized === "absent"
          ? "badge badge-danger"
          : "badge badge-neutral";
  return <span className={className}>{status || "Unknown"}</span>;
}

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="table-skeleton" style={{ height: 14 }} />
        </td>
      ))}
    </tr>
  );
}

function StatCard({
  icon,
  title,
  value,
  gradientClass,
  subtitle,
}) {
  return (
    <motion.div
      className={`stat-card ${gradientClass}`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
    >
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <div>
          <div className="stat-title">{title}</div>
          {subtitle ? <div className="hint" style={{ marginTop: 4 }}>{subtitle}</div> : null}
        </div>
      </div>

      <motion.div
        className="stat-value"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

export default function AttendanceMonitor() {
  const scannerRef = useRef(null);
  const [scannerState, setScannerState] = useState("initial");
  const [scannerPaused, setScannerPaused] = useState(false);

  const cooldownUntilRef = useRef(0);
  const lastDecodeAtRef = useRef(0);

  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [lastSuccessAt, setLastSuccessAt] = useState(null);

  const [stats, setStats] = useState({
    presentToday: 0,
    lateStudents: 0,
    absentStudents: 0,
    scannedToday: 0,
  });

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Table
  const [search, setSearch] = useState("");
  const [filterScholarship, setFilterScholarship] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoRefreshSec, setAutoRefreshSec] = useState(5);

  const filteredLogs = useMemo(() => {

    const keyword = search.trim().toLowerCase();
    return (logs || [])
      .filter((item) => {
        const matchKeyword =
          !keyword ||
          String(item.student_id ?? "").toLowerCase().includes(keyword) ||
          String(item.name ?? "").toLowerCase().includes(keyword) ||
          String(item.award_number ?? "").toLowerCase().includes(keyword) ||
          String(item.course ?? "").toLowerCase().includes(keyword);

        if (!matchKeyword) return false;

        const scholarship = String(item.scholarship_type ?? "").toUpperCase();
        if (filterScholarship !== "ALL" && scholarship !== filterScholarship) return false;

        const st = String(item.status ?? item.attendance_status ?? "").toUpperCase();
        if (filterStatus !== "ALL") {
          const normalized = st === "PRESENT" ? "PRESENT" : st;
          if (normalized !== filterStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const ta = new Date(a.time_in ?? a.time ?? 0).getTime();
        const tb = new Date(b.time_in ?? b.time ?? 0).getTime();
        return tb - ta;
      });
  }, [logs, search, filterScholarship, filterStatus]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  }, [filteredLogs, pageSize]);

  const pagedLogs = useMemo(() => {
    const safePage = clamp(page, 1, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize, totalPages]);


  const attendancePercentage = useMemo(() => {
    const total = stats.scannedToday;
    if (!total) return 0;
    return Math.round((stats.presentToday / total) * 100);
  }, [stats]);

  const scannerStatusBadge = useMemo(() => {
    if (scannerState === "permission-denied") return { label: "Camera denied", cls: "badge badge-danger" };
    if (scannerPaused) return { label: "Paused", cls: "badge badge-warning" };
    if (scanLoading) return { label: "Recording...", cls: "badge badge-success" };
    if (scannerState === "scanning") return { label: "Scanning", cls: "badge badge-success" };
    if (scannerState === "error") return { label: "Scanner error", cls: "badge badge-danger" };
    if (scannerState === "loading") return { label: "Starting camera...", cls: "badge badge-neutral" };
    return { label: "Ready", cls: "badge badge-neutral" };
  }, [scannerState, scannerPaused, scanLoading]);

  const fetchStats = async () => {
    try {
      const res = await API.get("/attendance/stats/today");
      setStats({
        presentToday: res.data.present_today || 0,
        lateStudents: res.data.late_students || 0,
        absentStudents: res.data.absent_students || 0,
        scannedToday: res.data.total_scanned_today || 0,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await API.get("/attendance/logs");
      setLogs(res.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch attendance logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchLogs()]);
  };

  // Initial load
  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto refresh polling
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      // Avoid hammering while recording a scan
      if (scanLoading) return;
      fetchStats();
      fetchLogs();
    }, Math.max(2, Number(autoRefreshSec) || 5) * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, autoRefreshSec, scanLoading]);

  // QR Scanner
  useEffect(() => {
    let isMounted = true;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 260 },
      false
    );

    scannerRef.current = scanner;

    const tryStart = async () => {
      if (!isMounted) return;
      try {
        setScannerState("loading");

        scanner.render(async (decodedText) => {
          //console.log("SCANNED QR:", decodedText);
          if (!isMounted) return;

          const now = Date.now();

          // Pause/cooldown gates
          if (scannerPaused) return;
          if (now < cooldownUntilRef.current) return;

          // Extra debounce for decoder spam
          if (now - lastDecodeAtRef.current < 800) return;
          lastDecodeAtRef.current = now;

          const qrValue = decodedText;

          setScanError("");
          setScanLoading(true);
          setScannerState("scanning");

          cooldownUntilRef.current = now + 3000;

          try {
            const res = await API.post("/attendance", { student_id: qrValue });

            if (res.data?.status === "success") {
              const data = res.data.data;
              setScanResult(data);
              setLastSuccessAt(Date.now());
              toast.success("Attendance Recorded");
              await refreshAll();
            } else {
              toast.error(res.data?.message || "Attendance failed");
            }
          } catch (err) {
            const msg = err.response?.data?.message || "Attendance failed";
            setScanError(msg);
            toast.error(msg);
            setScannerState("error");
          } finally {
            setScanLoading(false);
          }
        });

        if (!isMounted) return;
        setScannerState("scanning");
      } catch (e) {
        if (!isMounted) return;
        setScannerState("permission-denied");
      }
    };

    tryStart();

    return () => {
      isMounted = false;
      scannerRef.current?.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePause = async () => {
    const next = !scannerPaused;
    setScannerPaused(next);

    // html5-qrcode supports pause/resume in many builds
    try {
      if (!scannerRef.current) return;
      if (next && scannerRef.current.pause) scannerRef.current.pause();
      if (!next && scannerRef.current.resume) scannerRef.current.resume();
    } catch {
      // ignore
    }
  };

  const handleExportCSV = () => {
    if (!logs?.length) {
      toast.info("No data to export");
      return;
    }

    const headers = [
      "Student ID",
      "Award Number",
      "Student Name",
      "Degree Program",
      "Scholarship Type",
      "Time In",
      "Attendance Status",
      "Scan Type",
      "Remarks",
    ];

    const rows = (logs || []).map((l) => [
      l.student_id,
      l.award_number,
      l.name,
      l.course,
      l.scholarship_type,
      l.time_in,
      l.status,
      l.scan_type,
      l.remarks ?? "",
    ]);

    const csv = [headers.map(csvEscape).join(",")]
      .concat(rows.map((r) => r.map(csvEscape).join(",")))
      .join("\n");

    downloadTextFile(
      `attendance-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      csv
    );
    toast.success("CSV exported");
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterScholarship, filterStatus, pageSize]);

  const successOverlay =
    lastSuccessAt && Date.now() - lastSuccessAt < 3000;

  return (
    <motion.div
      className="attendance-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HEADER */}
      <div className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 22, fontWeight: 900 }}>
            Scholarship Attendance Dashboard
          </h1>
          <p className="page-subtitle" style={{ opacity: 0.72 }}>
            Real-time QR monitoring • Today’s analytics & logs
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className={scannerStatusBadge.cls}>
            <FaCamera style={{ marginRight: 6 }} />
            {scannerStatusBadge.label}
          </span>

          <button
            className="btn"
            aria-label="Refresh dashboard"
            onClick={refreshAll}
            disabled={scanLoading}
            style={{ opacity: scanLoading ? 0.7 : 1 }}
          >
            <FaRedo />
            Refresh
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stat-card-grid" style={{ marginBottom: 18 }}>
        <StatCard
          icon={<FaCheckCircle />}
          title="Total Present Today"
          value={stats.presentToday}
          gradientClass="stat-present"
          subtitle="On-time & present"
        />
        <StatCard
          icon={<FaClock />}
          title="Late Students"
          value={stats.lateStudents}
          gradientClass="stat-late"
          subtitle="Marked late"
        />
        <StatCard
          icon={<FaTimesCircle />}
          title="Absent Students"
          value={stats.absentStudents}
          gradientClass="stat-absent"
          subtitle="Marked absent"
        />
        <StatCard
          icon={<FaUsers />}
          title="Total Scanned Today"
          value={stats.scannedToday}
          gradientClass="stat-scanned"
          subtitle="QR scans captured"
        />
        <StatCard
          icon={<FaInfoCircle />}
          title="Attendance Percentage"
          value={`${attendancePercentage}%`}
          gradientClass="card-glass"
          subtitle={stats.scannedToday ? "Present / Scanned" : "No scans yet"}
        />
        <StatCard
          icon={<FaBell />}
          title="Scanner Mode"
          value={scannerPaused ? "Paused" : "Live"}
          gradientClass="card-glass"
          subtitle={autoRefresh ? `Auto-refresh: ${autoRefreshSec}s` : "Manual refresh"}
        />
      </div>

      {/* MAIN GRID */}
      <div className="attendance-two-col">
        {/* LEFT: Scanner + Logs */}
        <div className="panel">
          {/* SCANNER CARD */}
          <motion.div
            className="card card-glass scanner-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="panel-head">
              <div className="panel-title">
                <FaQrcode />
                Live QR Scanner
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="btn btn-secondary"
                  aria-label={scannerPaused ? "Resume scanner" : "Pause scanner"}
                  onClick={handleTogglePause}
                >
                  {scannerPaused ? <FaPlay /> : <FaPause />}
                  {scannerPaused ? "Resume" : "Pause"}
                </button>
              </div>
            </div>

            <div className="scanner-frame" style={{ minHeight: 350 }}>
              <div
                className="scanner-border-overlay"
                style={{
                  opacity: scannerState === "error" ? 0.35 : 0.95,
                  borderColor:
                    scannerState === "permission-denied"
                      ? "rgba(239,68,68,0.7)"
                      : successOverlay
                        ? "rgba(16,185,129,0.75)"
                        : undefined,
                }}
              />

              <div
                className="scanner-line"
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  top: 18,
                  height: 2,
                  background:
                    successOverlay
                      ? "rgba(16,185,129,0.9)"
                      : "rgba(59,130,246,0.95)",
                  boxShadow: "0 0 18px rgba(59,130,246,0.65)",
                  opacity: scannerPaused ? 0.25 : 0.95,
                  animation: scannerPaused || scanLoading ? "none" : "scanLine 1.25s ease-in-out infinite",
                }}
              />

              <div id="reader" className="scanner-reader" />

              {/* Overlay UI */}
              <AnimatePresence>
                {scannerState === "permission-denied" ? (
                  <motion.div
                    key="perm"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 18,
                      background: "rgba(239,68,68,0.08)",
                      borderRadius: 18,
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <FaExclamationTriangle size={34} />
                      <h3 style={{ marginTop: 10 }}>Camera permission denied</h3>
                      <p className="hint" style={{ marginTop: 6 }}>
                        Allow camera access in your browser settings, then reload.
                      </p>
                    </div>
                  </motion.div>
                ) : null}

                {scanLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(2,6,23,0.26)",
                      borderRadius: 18,
                      padding: 18,
                      textAlign: "center",
                    }}
                  >
                    <div>
                      <div className="table-skeleton" style={{ width: 180, height: 12, margin: "0 auto 10px" }} />
                      <h3 style={{ marginTop: 8 }}>Recording attendance…</h3>
                      <p className="hint" style={{ marginTop: 6 }}>
                        Please keep the QR steady.
                      </p>
                    </div>
                  </motion.div>
                ) : null}

                {scanError ? (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{
                      position: "absolute",
                      left: 16,
                      right: 16,
                      bottom: 16,
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "rgba(239,68,68,0.14)",
                      border: "1px solid rgba(239,68,68,0.35)",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                    }}
                    role="status"
                  >
                    {scanError}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="scanner-controls">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div className="hint">
                  Hold the QR within the frame until it scans. Duplicate scans are automatically prevented.
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <label className="hint" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      style={{ transform: "translateY(1px)" }}
                    />
                    Auto refresh
                  </label>

                  <select
                    className="input"
                    value={autoRefreshSec}
                    onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                    disabled={!autoRefresh}
                    aria-label="Auto refresh interval"
                    style={{ width: 120, padding: "0.55rem 0.75rem" }}
                  >
                    {[3, 5, 7, 10].map((s) => (
                      <option key={s} value={s}>
                        {s}s
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* LOGS TABLE CARD */}
          <motion.div
            className="card card-glass table-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            <div className="table-toolbar">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="panel-title" style={{ marginBottom: 0 }}>
                  <FaFileExport />
                  Attendance Logs
                </div>
              </div>

              <div className="toolbar-actions">
                <div className="search-wrap">
                  <FaSearch className="search-icon" />
                  <input
                    className="input"
                    style={{ padding: "0.55rem 0.75rem" }}
                    type="text"
                    placeholder="Search student / award / course…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search logs"
                  />
                </div>

                <button
                  className="btn"
                  aria-label="Export logs as CSV"
                  onClick={handleExportCSV}
                >
                  <FaFileExport />
                  CSV
                </button>
              </div>
            </div>

            <div className="toolbar-filters" style={{ marginBottom: 10 }}>
              <select
                className="input"
                style={{ width: 200, padding: "0.55rem 0.75rem" }}
                value={filterScholarship}
                onChange={(e) => setFilterScholarship(e.target.value)}
                aria-label="Filter scholarship type"
              >
                <option value="ALL">All Scholarships</option>
                <option value="TES">TES</option>
                <option value="TDP">TDP</option>
              </select>

              <select
                className="input"
                style={{ width: 170, padding: "0.55rem 0.75rem" }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter attendance status"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
              </select>

              <div style={{ flex: 1 }} />

              <select
                className="input"
                style={{ width: 150, padding: "0.55rem 0.75rem" }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Rows per page"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}/page
                  </option>
                ))}
              </select>
            </div>

            <div className="table-scroll">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Award #</th>
                    <th>Student Name</th>
                    <th>Degree Program</th>
                    <th>Scholarship</th>
                    <th>Time In</th>
                    <th>Status</th>
                    <th>Scan Type</th>
                  </tr>
                </thead>

                <tbody>
                  {logsLoading ? (
                    Array.from({ length: Math.min(pageSize, 10) }).map((_, idx) => (
                      <SkeletonRow key={idx} cols={8} />
                    ))
                  ) : pagedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="table-empty">
                          {logs?.length === 0 ? (
                            <>
                              <FaStopCircle size={18} style={{ marginRight: 10, opacity: 0.8 }} />
                              No attendance logs yet.
                            </>
                          ) : (
                            "No results match your filters."
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {pagedLogs.map((item) => {
                        const timeVal = item.time_in;
                        const st = String(item.status ?? item.attendance_status ?? "");
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            whileHover={{ backgroundColor: "rgba(148,163,184,0.12)" }}
                          >
                            <td>{item.student_id}</td>
                            <td>{item.award_number}</td>
                            <td style={{ fontWeight: 800 }}>{item.name}</td>
                            <td>{item.course}</td>
                            <td>
                              <span className="scan-pill">{String(item.scholarship_type ?? "").toUpperCase()}</span>
                            </td>
                            <td>{formatTime(timeVal)}</td>
                            <td>
                              <StatusBadge status={st} />
                            </td>
                            <td>{item.scan_type || "QR"}</td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                style={{ opacity: page <= 1 ? 0.5 : 1 }}
              >
                Prev
              </button>

              <div className="hint">
                Page <b>{clamp(page, 1, totalPages)}</b> of <b>{totalPages}</b>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                style={{ opacity: page >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: Preview */}
        <div className="panel">
          <motion.div
            className="card card-glass preview-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="panel-head">
              <div className="panel-title">
                <FaQrcode />
                Attendance Preview
              </div>
              <div>
                {scanResult ? (
                  <span className="badge badge-success" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <FaCheckCircle /> Verified
                  </span>
                ) : (
                  <span className="badge badge-neutral" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                    <FaInfoCircle /> Awaiting scan
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!scanResult ? (
                <motion.div
                  className="preview-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div className="avatar" style={{ width: 92, height: 92, borderRadius: 26 }}>
                      <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-secondary)" }}>👤</div>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 900 }}>No attendance scanned yet</h3>
                    <p className="hint">Scan a student QR to see their attendance details here.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="preview-body"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="profile-top">
                    <div className="avatar" style={{ width: 76, height: 76, borderRadius: 22 }}>
                      <div style={{ fontWeight: 950, fontSize: 22, color: "var(--text-secondary)" }}>
                        {initialsFromName(scanResult.student_name)}
                      </div>
                    </div>
                    <div className="profile-meta">
                      <div className="profile-name">{scanResult.student_name}</div>
                      <div className="profile-id">Student ID: {scanResult.student_id}</div>
                    </div>
                  </div>

                  <div className="profile-grid">
                    <div className="kvp">
                      <div className="kvp-label">Award Number</div>
                      <div className="kvp-value">{scanResult.award_number || "N/A"}</div>
                    </div>
                    <div className="kvp">
                      <div className="kvp-label">Scholarship Type</div>
                      <div className="kvp-value">{String(scanResult.scholarship_type ?? "").toUpperCase() || "N/A"}</div>
                    </div>
                    <div className="kvp">
                      <div className="kvp-label">Degree Program</div>
                      <div className="kvp-value">{scanResult.course || "N/A"}</div>
                    </div>
                    <div className="kvp">
                      <div className="kvp-label">Year Level</div>
                      <div className="kvp-value">{scanResult.year_level || "N/A"}</div>
                    </div>
                    <div className="kvp">
                      <div className="kvp-label">Attendance Status</div>
                      <div className="kvp-value">
                        <StatusBadge status={scanResult.attendance_status || scanResult.attendance_status || scanResult.status} />
                      </div>
                    </div>
                    <div className="kvp">
                      <div className="kvp-label">Scan Timestamp</div>
                      <div className="kvp-value">{formatTime(scanResult.time_in)}</div>
                    </div>
                  </div>

                  <div className="preview-foot">
                    <span className="scan-pill">QR Verified</span>
                    <span className="scan-pill">
                      <FaClock style={{ marginRight: 6 }} />
                      {scanResult.scan_type ? `Type: ${scanResult.scan_type}` : "Type: QR"}
                    </span>
                  </div>

                  <div className="hint">
                    Late/On-time indicator is based on the recorded status.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Micro notifications / guidance */}
          <motion.div
            className="card card-glass"
            style={{ padding: 16, marginTop: 14 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <FaBell />
              <div style={{ fontWeight: 950 }}>Attendance Alerts</div>
            </div>
            <div className="hint">
              Successful scans update stats and logs instantly via polling + post-scan refresh.
              Duplicates are blocked by backend (once per day per student).
            </div>
          </motion.div>

          {/* FUTURE: Manual input / Upload scanner placeholders */}
        </div>
      </div>

      {/* Inline keyframes (scanning line) */}
      <style>{`
        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0.65; }
          50% { transform: translateY(240px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.65; }
        }
      `}</style>
    </motion.div>
  );
}

