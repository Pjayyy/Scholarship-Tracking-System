import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiAlertCircle, FiBarChart2, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
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

  const riskLevel = studentData?.forecastRisk || "Low";
  const riskColor = riskLevel === "Low" ? "#22c55e" : riskLevel === "Moderate" ? "#f59e0b" : "#ef4444";

  const chartTheme = useMemo(() => {
    let isDark = true;
    try {
      isDark = document?.documentElement?.dataset?.theme !== "light";
    } catch {
      isDark = true;
    }

    return {
      axis: isDark ? "rgba(226,232,240,0.65)" : "rgba(71,85,105,0.7)",
      grid: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.06)",
      tooltipBg: isDark ? "rgba(2,6,23,0.88)" : "rgba(255,255,255,0.96)",
      tooltipBorder: isDark ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.10)",
    };
  }, []);

  const statsCards = useMemo(
    () => [
      { title: "Attendance", value: `${studentData?.attendance ?? 87}%`, icon: FiBarChart2, gradient: "stat-scanned" },
      {
        title: "Forecast Risk",
        value: riskLevel,
        icon: FiTrendingUp,
        gradient: riskLevel === "Low" ? "stat-present" : riskLevel === "Moderate" ? "stat-late" : "stat-absent",
      },
      { title: "QR Scans", value: studentData?.totalScans ?? 45, icon: FiCheckCircle, gradient: "stat-present" },
      { title: "Scholarship", value: studentData?.scholarshipStatus ?? "Active", icon: FiCheckCircle, gradient: "stat-scanned" },
    ],
    [riskLevel, studentData?.attendance, studentData?.scholarshipStatus, studentData?.totalScans]
  );

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

      <div className="attendance-two-col" style={{ marginBottom: "1.25rem" }}>
        <motion.div className="card card-glass" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <div className="panel-head">
            <div className="panel-title">
              <FiBarChart2 />
              Attendance Trend
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="month" stroke={chartTheme.axis} />
              <YAxis stroke={chartTheme.axis} />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: 12,
                }}
              />
              <Line type="monotone" dataKey="percentage" stroke="rgba(56,189,248,0.95)" strokeWidth={3} dot={{ fill: "rgba(56,189,248,0.95)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card card-glass" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <div className="panel-head">
            <div className="panel-title">
              <FiCheckCircle />
              Weekly Summary
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="day" stroke={chartTheme.axis} />
              <YAxis stroke={chartTheme.axis} />
              <Tooltip
                contentStyle={{
                  background: chartTheme.tooltipBg,
                  border: `1px solid ${chartTheme.tooltipBorder}`,
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="present" stackId="a" fill="rgba(34,197,94,0.75)" />
              <Bar dataKey="absent" stackId="a" fill="rgba(239,68,68,0.75)" />
            </BarChart>
          </ResponsiveContainer>
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
                background: `${riskColor}1A`,
                border: `1px solid ${riskColor}55`,
                borderRadius: 18,
                padding: "1rem",
                marginBottom: "1rem",
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
                Performance Analysis
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Attendance Rate</span>
                  <strong style={{ color: "rgba(34,197,94,0.95)" }}>{studentData?.attendance ?? 87}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Scholarship Retention</span>
                  <strong style={{ color: "rgba(56,189,248,0.95)" }}>95%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className="hint">Requirements Status</span>
                  <strong style={{ color: "rgba(34,197,94,0.95)" }}>On Track</strong>
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

