import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiBarChart2,
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
} from "react-icons/fi";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function StudentDashboard({ studentData }) {
  const [attendanceData] = useState([
    { month: "Jan", percentage: 75 },
    { month: "Feb", percentage: 78 },
    { month: "Mar", percentage: 82 },
    { month: "Apr", percentage: 85 },
    { month: "May", percentage: 87 },
  ]);

  const [monthlyStats] = useState([
    { day: "Mon", present: 1, absent: 0 },
    { day: "Tue", present: 1, absent: 0 },
    { day: "Wed", present: 1, absent: 0 },
    { day: "Thu", present: 0, absent: 1 },
    { day: "Fri", present: 1, absent: 0 },
  ]);

  const riskLevel = studentData?.forecastRisk || "Low";
  const riskColor =
    riskLevel === "Low"
      ? "#22c55e"
      : riskLevel === "Moderate"
      ? "#f59e0b"
      : "#ef4444";

  const statsCards = [
    {
      title: "Attendance",
      value: `${studentData?.attendance || 87}%`,
      icon: FiBarChart2,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      title: "Forecast Risk",
      value: riskLevel,
      icon: FiTrendingUp,
      color: riskColor,
      bgColor: `rgba(${riskLevel === "Low" ? "34, 197, 94" : riskLevel === "Moderate" ? "245, 158, 11" : "239, 68, 68"}, 0.1)`,
    },
    {
      title: "QR Scans",
      value: studentData?.totalScans || 45,
      icon: FiCheckCircle,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
    {
      title: "Scholarship",
      value: "Active",
      icon: FiCheckCircle,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Welcome Section */}
      <motion.div
        className="welcome-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "1.5rem",
          padding: "2rem",
          marginBottom: "2rem",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          boxShadow: "0 20px 50px rgba(102, 126, 234, 0.3)",
        }}
      >
        <img
          src={studentData?.avatar}
          alt="Avatar"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "4px solid white",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          }}
        />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.8rem" }}>
            Welcome back, {studentData?.name}! 🎉
          </h1>
          <p style={{ margin: "0 0 1rem", opacity: 0.95, fontSize: "1.05rem" }}>
            You're on track with your scholarship requirements. Keep up the great work!
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                fontWeight: 600,
                backdropFilter: "blur(10px)",
              }}
            >
              {studentData?.scholarshipType} Scholarship
            </span>
            <span
              style={{
                background: "rgba(34, 197, 94, 0.3)",
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                fontWeight: 600,
              }}
            >
              ✓ Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {statsCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={item}
              className="stat-card"
              style={{
                background: "white",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.05)",
                backdropFilter: "blur(10px)",
              }}
              whileHover={{
                y: -5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    background: card.bgColor,
                    padding: "0.75rem",
                    borderRadius: "0.875rem",
                    color: card.color,
                  }}
                >
                  <Icon size={24} />
                </div>
                <span style={{ color: "#6b7280", fontWeight: 500 }}>
                  {card.title}
                </span>
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111827" }}>
                {card.value}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
            📈 Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "0.75rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: "#667eea", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Attendance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
            📅 Weekly Summary
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  background: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="present" stackId="a" fill="#22c55e" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Forecast Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "2rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
          marginBottom: "2rem",
        }}
      >
        <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
          🎯 Scholarship Forecast
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                background: `${riskColor}15`,
                border: `2px solid ${riskColor}`,
                borderRadius: "1rem",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FiAlertCircle color={riskColor} size={24} />
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    Risk Level
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: riskColor,
                    }}
                  >
                    {riskLevel}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#f3f4f6", borderRadius: "1rem", padding: "1.5rem" }}>
              <h4 style={{ margin: "0 0 0.75rem", fontWeight: 700 }}>
                📊 Performance Analysis
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#6b7280", fontWeight: 500 }}>
                    Attendance Rate
                  </span>
                  <strong style={{ color: "#22c55e" }}>87%</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#6b7280", fontWeight: 500 }}>
                    Scholarship Retention
                  </span>
                  <strong style={{ color: "#3b82f6" }}>95%</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#6b7280", fontWeight: 500 }}>
                    Requirements Status
                  </span>
                  <strong style={{ color: "#10b981" }}>✓ On Track</strong>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              borderRadius: "1rem",
              padding: "1.5rem",
            }}
          >
            <h4 style={{ margin: "0 0 1rem", fontWeight: 700 }}>
              💡 AI Recommendations
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: "white",
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#22c55e", marginTop: "2px" }}>✓</span>
                  <div>
                    <strong style={{ display: "block", marginBottom: "0.25rem" }}>
                      Maintain Attendance
                    </strong>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      Your attendance is excellent. Keep attending classes.
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: "white",
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: "#3b82f6", marginTop: "2px" }}>→</span>
                  <div>
                    <strong style={{ display: "block", marginBottom: "0.25rem" }}>
                      Submit Documents
                    </strong>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                      All required documents are current.
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default StudentDashboard;
