import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiBarChart2, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
import API from "../../../services/api"; // Assuming API service is available
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function StudentDashboard({ studentData }) {
  const [attendanceData] = useState([
    { month: "Jan", percentage: 75 },
    { month: "Feb", percentage: 78 },
    { month: "Mar", percentage: 82 },
    { month: "Apr", percentage: 85 },
    { month: "May", percentage: 87 },
  ]);

  const [weeklyStats] = useState([
    { day: "Mon", present: 1, absent: 0 },
    { day: "Tue", present: 1, absent: 0 },
    { day: "Wed", present: 1, absent: 0 },
    { day: "Thu", present: 0, absent: 1 },
    { day: "Fri", present: 1, absent: 0 },
  ]);

  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.REACT_APP_API_URL ||
        "http://127.0.0.1:5000";

      setAnnLoading(true);
      setAnnError(null);

      try {
        const res = await fetch(
          `${API_URL}/student/announcements`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json.message || "Could not load announcements");
        }

        if (!cancelled) {
          setAnnouncements(json.data || []);
        }
      } catch (e) {
        if (!cancelled) {
          setAnnError(e.message || "Error");
          setAnnouncements([]);
        }
      } finally {
        if (!cancelled) setAnnLoading(false);
      }
    };

    void run();

    const t = setInterval(run, 60000); // Refresh every minute

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const riskLevel = studentData?.forecastRisk || "Low";
  const riskColor = riskLevel === "Low" ? "#10b981" : riskLevel === "Moderate" ? "#f59e0b" : "#f43f5e";

  const chartTheme = useMemo(() => {
    return {
      axis: "#64748b",
      grid: "rgba(15,23,42,0.06)",
      tooltipBg: "rgba(255,255,255,0.96)",
      tooltipBorder: "rgba(15,23,42,0.10)",
    };
  }, []);

  const statsCards = useMemo(
    () => [
      { title: "Documents", value: `3 / 5`, icon: FiCheckCircle, gradient: "stat-scanned" },
      {
        title: "Compliance",
        value: "Good",
        icon: FiTrendingUp,
        gradient: riskLevel === "Low" ? "stat-present" : riskLevel === "Moderate" ? "stat-late" : "stat-absent",
      },
      { title: "Renewal Status", value: "Upcoming", icon: FiTrendingUp, gradient: "stat-present" },
      { title: "Scholarship", value: studentData?.scholarshipStatus ?? "Active", icon: FiCheckCircle, gradient: "stat-scanned" },
    ],
    [riskLevel, studentData?.attendance, studentData?.scholarshipStatus, studentData?.totalScans]
  );

  const recentAnnouncements = announcements.slice(0, 5);

  return (
    <div className="panel" style={{ padding: "1.25rem" }}>
      <motion.section
        className="page-hero"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: "1.25rem" }}
      >
        <div className="page-hero__row">
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="avatar" style={{ width: 72, height: 72, borderRadius: 22 }}>
              {studentData?.avatar ? <img src={studentData.avatar} alt="Student avatar" /> : null}
            </div>
            <div>
              <div className="kicker">Student Portal</div>
              <div className="page-title" style={{ fontSize: "clamp(1.4rem, 2.6vw, 2.1rem)" }}>
                Welcome, {studentData?.name || "Student"}
              </div>
              <div className="page-subtitle" style={{ marginTop: 8 }}>
                {studentData?.program ? `${studentData.program} • ` : ""}
                {studentData?.yearLevel || "Scholar"} dashboard overview and progress.
              </div>
            </div>
          </div>

          <div className="hero-actions">
            <span className="pill">
              <FiCheckCircle />
              Active Scholarship
            </span>
            <span className="pill">
              <FiTrendingUp />
              Risk: {riskLevel}
            </span>
          </div>
        </div>
      </motion.section>

      <div className="stat-card-grid" style={{ marginBottom: "1.25rem" }}>
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} className={`stat-card ${card.gradient}`} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 320 }}>
              <div className="stat-top">
                <div className="stat-icon">
                  <Icon />
                </div>
                <div className="stat-title">{card.title}</div>
              </div>
              <div className="stat-value">{card.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="attendance-two-col attendance-two-col--mobile" style={{ marginBottom: "1.25rem" }}>

        <motion.div
          className="card card-glass"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >

          <div className="panel-head">
            <div className="panel-title">
              <FiCheckCircle />
              Scholarship Status
            </div>
          </div>

          <div
            className="kvp"
            style={{
              borderRadius: 18,
              padding: "1rem",
            }}
          >

            <div className="kvp-label" style={{ marginBottom: 10 }}>
              Current
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background:
                    studentData?.scholarshipStatus === "Active"
                      ? "var(--success)"
                      : studentData?.scholarshipStatus === "Warning"
                        ? "#f59e0b"
                        : "var(--danger)",
                }}
              />
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900 }}>
                  {studentData?.scholarshipStatus ?? "Active"}
                </div>
                <div className="hint" style={{ marginTop: 4 }}>
                  Keep your requirements up to date.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card card-glass"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="panel-head">
            <div className="panel-title">
              <FiBarChart2 />
              Latest Announcements
            </div>
          </div>

          <div className="latest-announcements-wrap">
            <div className="latest-announcements-topbar">
              <div className="latest-announcements-kicker">Latest Announcements</div>
              <button
                type="button"
                className="latest-clear-btn"
                onClick={() => {
                  // UI-only clear action (backend endpoint not implemented)
                  setAnnouncements([]);
                }}

                aria-label="Clear announcements"
              >
                Clear
              </button>
            </div>

            {annLoading ? (
              <div className="latest-announcements-loading">
                Loading announcements...
              </div>
            ) : annError ? (
              <div className="latest-announcements-error">
                Error loading announcements: {annError}
              </div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="latest-announcements-empty">No announcements yet.</div>
            ) : (
              <div className="latest-announcements-feed">
                {recentAnnouncements.map((a, idx) => {
                  const from = a.fromAddress || a.senderEmail || a.sender || a.from || "";
                  const rawTs = a.receivedAt || a.createdAt || a.timestamp || null;
                  const tsLabel = rawTs ? new Date(rawTs).toLocaleString() : "";
                  const body = a.bodyText ?? a.body ?? "";
                  const trimmed = body.slice(0, 160);
                  const hasMore = body.length > 160;

                  return (
                    <motion.article
                      key={a.id ?? idx}
                      className="latest-announcement-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: idx * 0.02 }}
                    >
                      <div className="latest-timeline">
                        <div className="latest-timeline-connector" />
                        <div className="latest-timeline-dot" />
                      </div>

                      <div className="latest-card-main">
                        <div className="latest-card-header">
                          <h4 className="latest-title">{a.title ?? "Announcement"}</h4>
                          <div className="latest-timestamp">
                          <span className="latest-calendar" aria-hidden="true">📅</span>
                            <span className="latest-ts-text" aria-label={tsLabel || "Announcement time"}>{tsLabel}</span>

                          </div>
                        </div>

                        {from ? (
                          <div className="latest-from">
                            <span className="latest-from-label">From</span>
                            <span className="latest-from-email">{from}</span>
                          </div>
                        ) : null}

                        <div className="latest-body">
                          {trimmed}
                          {hasMore ? "..." : ""}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}

            <div className="latest-pagination" aria-label="Announcement pagination">
              <button type="button" className="latest-page-btn" aria-label="Previous page">
                ◀
              </button>
              <button type="button" className="latest-page-btn latest-page-btn--active">1</button>
              <button type="button" className="latest-page-btn" aria-label="Next page">
                ▶
              </button>
            </div>
          </div>

        </motion.div>
      </div>


      <motion.div className="card card-glass" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="panel-head">
          <div className="panel-title">
            <FiTrendingUp />
            Scholarship Forecast
          </div>
          <span className="badge badge-neutral">Live</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
                <div
              style={{
                borderRadius: 18,
                padding: "1rem",
                marginBottom: "1rem",
                border: "1px solid rgba(148,163,184,0.18)",
                background: "var(--surface-highlight)",
              }}
            >

              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                <FiAlertCircle color={riskColor} />
                <div>
                  <div className="hint" style={{ fontWeight: 800 }}>
                    Risk Level
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 900, color: riskColor }}>{riskLevel}</div>
                </div>
              </div>
            </div>

            <div className="kvp" style={{ borderRadius: 18 }}>
              <div className="kvp-label" style={{ marginBottom: 10 }}>
                Requirement Progress
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Submission Completeness</span>
                  <strong style={{ color: "var(--success)" }}>80%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Scholarship Retention</span>
                  <strong style={{ color: "var(--primary)" }}>95%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Requirements Status</span>
                  <strong style={{ color: "var(--success)" }}>On Track</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="kvp" style={{ borderRadius: 18 }}>
            <div className="kvp-label" style={{ marginBottom: 10 }}>
              Recommendations
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="scan-pill">
                <strong style={{ display: "block" }}>Maintain Attendance</strong>
                <span className="hint">Keep your consistent attendance to sustain scholarship eligibility.</span>
              </div>
              <div className="scan-pill">
                <strong style={{ display: "block" }}>Stay Document-Ready</strong>
                <span className="hint">Prepare renewal requirements early to avoid deadline pressure.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentDashboard;
