import React, { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { FiTrendingUp, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

function ForecastPage({ studentData }) {
  const [riskData] = useState([
    { name: "Low Risk", value: 45, color: "#22c55e" },
    { name: "Moderate Risk", value: 30, color: "#f59e0b" },
    { name: "High Risk", value: 25, color: "#ef4444" },
  ]);

  const [performanceData] = useState([
    { month: "Jan", gpa: 3.5, attendance: 75 },
    { month: "Feb", gpa: 3.6, attendance: 78 },
    { month: "Mar", gpa: 3.7, attendance: 82 },
    { month: "Apr", gpa: 3.8, attendance: 85 },
    { month: "May", gpa: 3.9, attendance: 87 },
  ]);

  const recommendations = [
    {
      icon: "✓",
      title: "Excellent Attendance",
      description: "Your attendance is above 85%. Keep up the excellent work!",
      type: "success",
    },
    {
      icon: "→",
      title: "GPA Improvement",
      description: "Your GPA has improved steadily. Focus on maintaining this trend.",
      type: "info",
    },
    {
      icon: "⚠",
      title: "Document Deadline",
      description: "Submit your requirements by end of semester to maintain good standing.",
      type: "warning",
    },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Risk Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          {/* Risk Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
              📊 Risk Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Current Risk Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                borderRadius: "1.25rem",
                padding: "2rem",
                color: "white",
                marginBottom: "1.5rem",
                boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <FiCheckCircle size={32} />
                <div>
                  <div style={{ fontSize: "0.95rem", opacity: 0.9 }}>
                    Current Risk Level
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                    Low Risk
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  backdropFilter: "blur(10px)",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.95rem" }}>
                  You are currently performing well. Maintain your attendance and GPA to retain your scholarship.
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#f0fdf4",
                borderRadius: "1rem",
                padding: "1.5rem",
                borderLeft: "4px solid #22c55e",
              }}
            >
              <h4 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>
                📈 Performance Metrics
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>GPA</span>
                  <strong style={{ color: "#22c55e" }}>3.9/4.0</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Attendance</span>
                  <strong style={{ color: "#22c55e" }}>87%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Compliance</span>
                  <strong style={{ color: "#22c55e" }}>100%</strong>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "white",
            borderRadius: "1.25rem",
            padding: "2rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            border: "1px solid rgba(0,0,0,0.05)",
            marginBottom: "2rem",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
            📉 Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
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
                dataKey="gpa"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: "#8b5cf6" }}
                name="GPA"
              />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
                name="Attendance %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
            💡 AI Recommendations
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                style={{
                  background:
                    rec.type === "success"
                      ? "#f0fdf4"
                      : rec.type === "warning"
                      ? "#fffbeb"
                      : "#f0f9ff",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  borderLeft: `4px solid ${
                    rec.type === "success"
                      ? "#22c55e"
                      : rec.type === "warning"
                      ? "#f59e0b"
                      : "#3b82f6"
                  }`,
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                  {rec.icon}
                </div>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700 }}>
                  {rec.title}
                </h4>
                <p
                  style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {rec.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ForecastPage;
